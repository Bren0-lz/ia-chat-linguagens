// T020 — prova que a regra de civilidade chega aos SEIS niveis do modo Conversa.
//
// O DEFEITO QUE ISTO IMPEDE (R4, medido na bateria de 06/09): o aluno xingou e o bot
// devolveu as palavras dele entre aspas. O cadastro do produto comeca aos 16 anos --
// reproduzir a ofensa e risco de produto, nao questao de estilo. O contrato de
// nao-repreensao nao dizia nada sobre repetir o palavrao.
//
// Este teste e OFFLINE e estrutural: prova que a diretiva existe e chega ao prompt.
// Ele NAO prova que o modelo obedece -- isso e o gate ao vivo do R4, com N=3 e
// detector automatico. Instrucao no prompt nao e comportamento: o C10 e a prova viva
// disso (a diretiva de reciprocidade chega e o modelo a ignora).
//
//   node fluxos/_teststand/testa_civilidade.js [caminho-do-fluxo]

const fs = require('fs');
const path = require('path');

const FLUXO = process.argv[2] || path.join(__dirname, '..', 'IAChat_Telegram_v8.json');
const NIVEIS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

let fails = 0;
function ok(cond, nome, detalhe) {
  if (cond) console.log('  . ' + nome + (detalhe ? '  — ' + detalhe : ''));
  else { console.log('  X ' + nome + (detalhe ? '  — ' + detalhe : '')); fails++; }
}

const f = JSON.parse(fs.readFileSync(FLUXO, 'utf8'));

console.log('\n== civilidade: o bot nao reproduz o palavrao do aluno ==');
console.log('fluxo: ' + path.basename(FLUXO) + '\n');

// 1) a regra e definida UMA vez, no Contexto Conversa
const ctx = f.nodes.find(n => n.name === 'Contexto Conversa');
ok(!!ctx, 'no Contexto Conversa existe');
const ctxJs = ctx ? ctx.parameters.jsCode : '';
ok(/const civilidadeLine=/.test(ctxJs), 'civilidadeLine e definida no Contexto Conversa');
ok(/civilidadeLine[,\s]/.test(ctxJs.slice(ctxJs.lastIndexOf('return'))),
   'civilidadeLine e publicada no item de saida');

// 2) o conteudo da regra cobre o que o R4 expos
const m = ctxJs.match(/const civilidadeLine='([\s\S]*?)';/);
const texto = m ? m[1] : '';
ok(/nunca repita a palavra/i.test(texto), 'a regra proibe repetir a palavra do aluno');
ok(/aspas/i.test(texto), 'a regra fecha a brecha das aspas (foi assim que o R4 falhou)');
ok(/n[aã]o repreenda|sem sermao|n[aã]o d[eê] serm[aã]o/i.test(texto),
   'a regra preserva a nao-repreensao');

// 3) os SEIS niveis consomem a linha -- um nivel esquecido e um nivel desprotegido
const prompts = f.nodes.filter(n => /^Prompt Conversa /.test(n.name));
ok(prompts.length === 6, 'existem 6 nos Prompt Conversa', prompts.length + ' encontrados');
for (const n of NIVEIS) {
  const p = prompts.find(x => x.name === 'Prompt Conversa ' + n);
  ok(!!p && /d\.civilidadeLine/.test(p.parameters.jsCode),
     'Prompt Conversa ' + n + ' consome d.civilidadeLine');
}

// 4) a linha entra no systemMessage montado, nao so no fonte.
//    (o prompt monta um array e filtra vazios: uma linha undefined sumiria em silencio)
const alvo = prompts.find(x => x.name === 'Prompt Conversa B2');
if (alvo) {
  const slot = '__t020_sys';
  const d = {
    name: 'Teste', chatInput: 'oi',
    personaLine: 'P', moodLine: 'M', correctionLine: 'C',
    civilidadeLine: 'CIVILIDADE_MARCADOR', cleanOutputLine: 'L',
    reciprocityLine: 'R', interestsLine: '', notesLine: '',
    tomLine: '', debateLine: '', ptLine: '', spiceLine: '', streakLine: '',
  };
  let saida = null;
  try {
    const fn = new Function('$input', 'globalThis.' + slot + '=(function(){' +
      alvo.parameters.jsCode + '})();');
    fn({ item: { json: d } });
    saida = globalThis[slot];
  } catch (e) { /* montagem depende do formato do item */ }
  const sys = saida && saida.json ? String(saida.json.systemMessage || '') : '';
  ok(sys.includes('CIVILIDADE_MARCADOR'),
     'a linha aparece no systemMessage realmente montado (B2)',
     sys ? 'presente' : 'nao foi possivel montar — verifique manualmente');
}

console.log('');
if (fails) { console.log('REPROVOU: ' + fails + ' assercao(oes)\n'); process.exit(1); }
console.log('PASSOU: a regra de civilidade chega aos 6 niveis\n');
console.log('LEMBRETE: isto prova que a diretiva CHEGA, nao que o modelo obedece.');
console.log('Quem prova obediencia e o R4 ao vivo, com N=3 e detector automatico.\n');
process.exit(0);
