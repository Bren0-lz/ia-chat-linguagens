// C5 e C6 — revalidação de idioma e coerência entre níveis, com o modelo atual.
//
// O relatório de 13/07 reprovou os dois:
//   C5: "em nível C1 o bot iniciou conversando em português — erro grave"
//   C6: "houve inconsistência na forma de corrigir entre os níveis"
// Aquela medição usou llama-3.3-70b-versatile, removido da conta Groq.
//
// Método: um aluno por nível (A1..C1), tudo idêntico menos o `level`, recebe a
// MESMA mensagem com um erro gramatical plantado ("video games IS"). Mede:
//   - taxa de português na resposta  -> política de idioma por nível (C5)
//   - corrigiu o erro?               -> consistência da correção (C6)
//   - complexidade do texto          -> a resposta acompanha o nível? (C6)
//
// Contrato do fluxo — vem de cada `Prompt Conversa <nível>`, NÃO do `LANG` do
// Professor (que é outro contrato, para a trilha). Confundir os dois faz o teste
// reprovar comportamento correto:
//   A1  bilíngue: inglês + uma linha 🇧🇷 traduzindo a mensagem inteira
//   A2  "inglês simples; traduza entre parênteses NO MÁXIMO uma expressão difícil
//       por mensagem — nunca frases inteiras nem o texto todo"
//   B1  "responda INTEIRAMENTE em inglês... NUNCA comece, comente ou explique em
//       português, mesmo que o aluno escreva em português"
//   C1  "NUNCA escreva uma palavra em português, mesmo que o aluno misture os
//       dois idiomas"
// Ou seja: português é esperado no A1, pontual no A2 e ~zero de B1 para cima.
//
//   N8N_API_KEY=... RUNS=3 node revalida_niveis.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const { Client } = require('pg');
const { msg, digest } = require('./harness');

const NIVEIS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const RUNS = Number(process.env.RUNS || 3);
const BASE_ID = 993940000;
const TR = './tr_niveis.md';

// Estímulo comum: erro de concordância que o próprio roteiro usa (C1/C6).
const ESTIMULO = 'i think video games is good for learning english';
// Estímulo do C5: mistura PT+EN sofisticada, como a persona P7 (Théo, C1).
const ESTIMULO_C5 = 'honestamente eu acho que esports é subestimado, but i cannot articulate why exactly';

// Palavras funcionais exclusivas do português — não existem em inglês, então
// não geram falso positivo com cognatos.
const PT = new Set(('que nao não uma uns umas com por para pelo pela isso este esta esse essa aquele aquela'
  + ' voce você seu sua meu minha muito muita mais menos quando onde porque porém mas também já ainda'
  + ' sempre nunca entao então assim aqui ali entre sobre depois antes cada todos todas alguns algumas'
  + ' ser estar tem ter fazer pode deve vamos vou está são foi era ele ela eles elas nós dele dela'
  + ' bom boa legal certo errado exemplo frase palavra jogo jogos aprender estudar ajuda ajudar').split(/\s+/));

function tokens(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}
function taxaPt(texto) {
  const t = tokens(texto);
  if (!t.length) return 0;
  return t.filter(w => PT.has(w)).length / t.length;
}
// complexidade: comprimento médio de palavra + palavras por frase + riqueza lexical
function complexidade(texto) {
  const t = tokens(texto);
  if (!t.length) return { palavra: 0, frase: 0, riqueza: 0 };
  const frases = String(texto).split(/[.!?]+/).filter(f => f.trim().length > 3);
  return {
    palavra: t.reduce((a, w) => a + w.length, 0) / t.length,
    frase: frases.length ? t.length / frases.length : t.length,
    riqueza: new Set(t).size / t.length,
  };
}
// Detecta se o bot sinalizou o erro plantado ("video games IS" -> "are").
// CUIDADO: a primeira versão só casava a forma longa ("video games are") e dava
// falso negativo no A1, onde o teto de 18 palavras força a forma curta
// ("We say 'are', not 'is'"). Isso fez a taxa de correção do A1 parecer 67%
// quando era 100%. Cobrir as duas formas é essencial.
function corrigiu(texto) {
  const t = String(texto).toLowerCase();
  return /games are/.test(t)                       // forma longa
    || /['"’]?are['"’]?\s*,?\s*not\s*['"’]?is/.test(t)  // forma curta: "are", not "is"
    || /\bnot\s+['"’]?is['"’]?/.test(t)
    || /concord|plural|agreement/.test(t);
}
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const sd = a => a.length < 2 ? 0
  : Math.sqrt(a.map(v => Math.pow(v - mean(a), 2)).reduce((x, y) => x + y, 0) / (a.length - 1));

async function semear() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  for (let i = 0; i < NIVEIS.length; i++) {
    const uid = BASE_ID + i;
    const profile = JSON.stringify({ persona: 'buddy', interests: ['games'], inferred_interests: [] });
    await c.query(
      'INSERT INTO students (user_id, name, age, mode, onboarding, level, profile, msg_count, last_update_id, streak_count, last_active)'
      + " VALUES ($1,'Theo',19,'chat','done',$2,$3::jsonb,5,1,1,CURRENT_DATE)"
      + " ON CONFLICT (user_id) DO UPDATE SET mode='chat', onboarding='done', level=$2,"
      + ' profile=$3::jsonb, teacher_state=NULL, updated_at=now()',
      [uid, NIVEIS[i], profile]);
    await c.query("DELETE FROM chat_memory WHERE split_part(session_id,':',1) = $1", [String(uid)]);
  }
  await c.end();
}

(async () => {
  console.log('C5/C6 — ' + RUNS + ' rodadas | niveis ' + NIVEIS.join(', ') + '\n');
  fs.writeFileSync(TR, '# C5/C6 — idioma e coerencia por nivel (' + RUNS + ' rodadas)\n\n'
    + '**Estimulo C6:** "' + ESTIMULO + '"\n\n**Estimulo C5 (C1):** "' + ESTIMULO_C5 + '"\n\n');

  const dados = {};
  for (const n of NIVEIS) dados[n] = { pt: [], corr: [], palavra: [], frase: [], riqueza: [] };
  const c5 = [];

  for (let r = 1; r <= RUNS; r++) {
    console.log('=== rodada ' + r + '/' + RUNS + ' ===');
    await semear();
    for (let i = 0; i < NIVEIS.length; i++) {
      const n = NIVEIS[i];
      const d = digest(await msg(BASE_ID + i, ESTIMULO));
      const m = d.reply.match(/\[CONVERSA\][\s\S]*/);
      const txt = m ? m[0].replace('[CONVERSA] ', '').trim() : '(sem resposta) ' + (d.errs || []).join('; ');
      const pt = taxaPt(txt), cx = complexidade(txt), corr = corrigiu(txt);
      dados[n].pt.push(pt); dados[n].corr.push(corr ? 1 : 0);
      dados[n].palavra.push(cx.palavra); dados[n].frase.push(cx.frase); dados[n].riqueza.push(cx.riqueza);
      console.log('  ' + n + ' | pt ' + (pt * 100).toFixed(0).padStart(3) + '% | corrigiu: ' + (corr ? 'sim' : 'NAO')
        + ' | palavra ' + cx.palavra.toFixed(2) + ' | frase ' + cx.frase.toFixed(1));
      fs.appendFileSync(TR, '### rodada ' + r + ' — ' + n + ' (pt ' + (pt * 100).toFixed(0) + '%, corrigiu: '
        + (corr ? 'sim' : 'NAO') + ')\n' + txt + '\n\n');
    }
    // C5: o C1 recebe o estímulo sofisticado misturado
    const d5 = digest(await msg(BASE_ID + 4, ESTIMULO_C5));
    const m5 = d5.reply.match(/\[CONVERSA\][\s\S]*/);
    const t5 = m5 ? m5[0].replace('[CONVERSA] ', '').trim() : '(sem resposta)';
    const pt5 = taxaPt(t5);
    c5.push(pt5);
    console.log('  C5 (C1 + mistura PT/EN) | pt ' + (pt5 * 100).toFixed(0) + '%\n');
    fs.appendFileSync(TR, '### rodada ' + r + ' — C5 (C1 recebe mistura PT+EN) — pt ' + (pt5 * 100).toFixed(0) + '%\n' + t5 + '\n\n');
  }

  console.log('===== C6 — politica de idioma e correcao por nivel =====');
  console.log('nivel  pt%(media+/-dp)   corrigiu   palavra   frase   riqueza');
  for (const n of NIVEIS) {
    const d = dados[n];
    console.log('  ' + n + '   ' + (mean(d.pt) * 100).toFixed(0).padStart(3) + '% +/-' + (sd(d.pt) * 100).toFixed(0).padStart(3)
      + '      ' + (mean(d.corr) * 100).toFixed(0).padStart(3) + '%    '
      + mean(d.palavra).toFixed(2).padStart(5) + '   ' + mean(d.frase).toFixed(1).padStart(5)
      + '   ' + mean(d.riqueza).toFixed(2).padStart(5));
  }

  // C6 veredito, conforme o contrato REAL de cada Prompt Conversa (não o LANG do
  // Professor, que é outro): A1 é bilíngue e deve ter português; A2 responde em
  // inglês simples com no máximo UMA expressão traduzida entre parênteses, ou
  // seja português baixo mas não obrigatoriamente zero; B1, B2 e C1 dizem
  // "responda INTEIRAMENTE em inglês" e o C1 chega a dizer "NUNCA escreva uma
  // palavra em português".
  const ptAltoA = mean(dados.A1.pt) > 0.05;                    // A1 bilíngue
  const ptA2 = mean(dados.A2.pt) < 0.10;                       // A2 majoritariamente inglês
  const ptBaixoB = ['B1', 'B2', 'C1'].every(n => mean(dados[n].pt) < 0.02);
  const corrTodos = NIVEIS.map(n => mean(dados[n].corr));
  const corrConsistente = Math.min(...corrTodos) >= 0.66;
  const complexSobe = mean(dados.C1.palavra) >= mean(dados.A1.palavra);

  console.log('\nC6 — checagens:');
  console.log('  A1 e bilingue (tem portugues):                     ' + (ptAltoA ? 'OK' : 'FALHOU'));
  console.log('  A2 responde em ingles simples (<10% pt):           ' + (ptA2 ? 'OK' : 'FALHOU'));
  console.log('  B1/B2/C1 respondem so em ingles (<2% pt):          ' + (ptBaixoB ? 'OK' : 'FALHOU'));
  console.log('  correcao aplicada em todos os niveis (>=66%):      ' + (corrConsistente ? 'OK' : 'FALHOU')
    + '  [' + corrTodos.map(v => (v * 100).toFixed(0) + '%').join(' ') + ']');
  console.log('  complexidade nao regride de A1 para C1:            ' + (complexSobe ? 'OK' : 'FALHOU'));
  const c6ok = ptAltoA && ptA2 && ptBaixoB && corrConsistente && complexSobe;
  console.log('\n' + (c6ok ? 'PASSOU  ' : 'FALHOU  ') + 'C6');

  const c5m = mean(c5);
  const c5ok = c5m < 0.05;
  console.log('\n===== C5 — C1 recebe mistura PT+EN sofisticada =====');
  console.log('  portugues na resposta: ' + (c5m * 100).toFixed(1) + '% +/- ' + (sd(c5) * 100).toFixed(1)
    + '  (rodadas: ' + c5.map(v => (v * 100).toFixed(0) + '%').join(', ') + ')');
  console.log('\n' + (c5ok ? 'PASSOU  ' : 'FALHOU  ') + 'C5 — ' + (c5ok ? 'manteve o registro em ingles' : 'usou portugues indevidamente'));

  fs.appendFileSync(TR, '\n## Resumo\n\n| nivel | pt% | corrigiu | palavra | frase |\n|---|---|---|---|---|\n'
    + NIVEIS.map(n => '| ' + n + ' | ' + (mean(dados[n].pt) * 100).toFixed(0) + '% | '
      + (mean(dados[n].corr) * 100).toFixed(0) + '% | ' + mean(dados[n].palavra).toFixed(2) + ' | '
      + mean(dados[n].frase).toFixed(1) + ' |').join('\n')
    + '\n\n**C6: ' + (c6ok ? 'PASSOU' : 'FALHOU') + '** | **C5: ' + (c5ok ? 'PASSOU' : 'FALHOU')
    + '** (portugues no C1: ' + (c5m * 100).toFixed(1) + '%)\n');
  console.log('\ntranscricao: ' + TR);
})().catch(e => { console.error('erro', e.message); process.exit(1); });
