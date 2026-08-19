// Por que as personas colapsam no A1? Ablação OFFLINE sobre transcrições já
// coletadas — não toca no fluxo nem no banco.
//
// Hipótese: a regra "PERGUNTAS: fechadas ou de escolha" do Prompt Conversa A1
// força a pergunta final para um espaço minúsculo ("Do you play games?"), e numa
// resposta de 18 palavras essa pergunta é quase metade do texto. Se for isso, a
// sobreposição medida vem sobretudo da pergunta, não do corpo da resposta.
//
// Mede o Jaccard entre personas em três recortes: texto inteiro, só o corpo
// (sem a pergunta final) e só a pergunta.
//
//   node analisa_colapso_a1.js tr_personas_A1_teto18.md tr_personas_B1.md
const fs = require('fs');

const STOP = new Set(('a o e de da do que you your i to the is are it in of and for with on my me that this what do does can'
  + ' um uma os as para com por em no na se sim nao').split(/\s+/));
function tok(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
}
function jac(a, b) {
  const A = new Set(tok(a)), B = new Set(tok(b));
  if (!A.size || !B.size) return null;
  let i = 0; for (const w of A) if (B.has(w)) i++;
  return i / (A.size + B.size - i);
}
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

// separa a última pergunta do resto
function partes(txt) {
  // no A1 a linha 🇧🇷 é tradução: descartada, senão conta tudo em dobro
  const semPt = txt.split('\n').filter(l => !l.trim().startsWith('🇧🇷')).join(' ').trim();
  const m = semPt.match(/([^.!?]*\?)\s*$/);
  const pergunta = m ? m[1].trim() : '';
  const corpo = pergunta ? semPt.slice(0, semPt.lastIndexOf(pergunta)).trim() : semPt;
  return { corpo, pergunta, todo: semPt };
}

function carregar(arquivo) {
  const txt = fs.readFileSync(arquivo, 'utf8');
  const blocos = txt.split(/\n### /).slice(1);
  const porRodada = {};
  for (const b of blocos) {
    const cab = b.split('\n')[0];
    const m = cab.match(/rodada (\d+) — (\w+)/);
    if (!m) continue;
    const [, r, persona] = m;
    const corpo = b.split('\n').slice(1).join('\n').trim();
    (porRodada[r] = porRodada[r] || {})[persona] = corpo;
  }
  return porRodada;
}

function analisar(nome, arquivo) {
  if (!fs.existsSync(arquivo)) { console.log('(faltando: ' + arquivo + ')'); return null; }
  const rodadas = carregar(arquivo);
  const res = { todo: [], corpo: [], pergunta: [], temPergunta: 0, total: 0 };
  for (const r of Object.keys(rodadas)) {
    const personas = Object.keys(rodadas[r]).filter(p => p !== 'C5');
    const P = {};
    for (const p of personas) P[p] = partes(rodadas[r][p]);
    for (const p of personas) { res.total++; if (P[p].pergunta) res.temPergunta++; }
    for (let i = 0; i < personas.length; i++)
      for (let j = i + 1; j < personas.length; j++) {
        const a = P[personas[i]], b = P[personas[j]];
        const t = jac(a.todo, b.todo); if (t != null) res.todo.push(t);
        const c = jac(a.corpo, b.corpo); if (c != null) res.corpo.push(c);
        const q = jac(a.pergunta, b.pergunta); if (q != null) res.pergunta.push(q);
      }
  }
  console.log('== ' + nome + ' ==');
  console.log('  texto inteiro (sem a linha 🇧🇷) : ' + mean(res.todo).toFixed(3) + '  (n=' + res.todo.length + ')');
  console.log('  só o CORPO (sem a pergunta)     : ' + mean(res.corpo).toFixed(3) + '  (n=' + res.corpo.length + ')');
  console.log('  só a PERGUNTA final             : ' + mean(res.pergunta).toFixed(3) + '  (n=' + res.pergunta.length + ')');
  console.log('  respostas que terminam em pergunta: ' + res.temPergunta + '/' + res.total);
  console.log('');
  return res;
}

const a1 = analisar('A1 (teto 18, baseline)', process.argv[2] || 'tr_personas_A1_teto18.md');
const b1 = analisar('B1 (onde as personas se separam)', process.argv[3] || 'tr_personas_B1.md');

if (a1 && b1) {
  console.log('== leitura ==');
  const qA = mean(a1.pergunta), qB = mean(b1.pergunta);
  const cA = mean(a1.corpo), cB = mean(b1.corpo);
  console.log('  pergunta: A1 ' + qA.toFixed(3) + ' vs B1 ' + qB.toFixed(3)
    + '  -> a pergunta do A1 é ' + (qA / (qB || 1)).toFixed(1) + 'x mais repetida');
  console.log('  corpo   : A1 ' + cA.toFixed(3) + ' vs B1 ' + cB.toFixed(3)
    + '  -> o corpo do A1 é ' + (cA / (cB || 1)).toFixed(1) + 'x mais repetido');
  const culpaPergunta = (qA - qB) > (cA - cB);
  console.log('\n  A diferença entre A1 e B1 vem sobretudo '
    + (culpaPergunta ? 'da PERGUNTA FINAL (regra "fechadas ou de escolha")' : 'do CORPO da resposta (vocabulário/formato)'));
}
