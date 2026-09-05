// Calibragem e MEDIDA DE CAPACIDADE do detector de GABARITO (T005c).
//
// Uso:
//   node conteudo/simula_vazamento.js              # tudo, caso a caso
//   node conteudo/simula_vazamento.js --resumo     # so os numeros
//   node conteudo/simula_vazamento.js --cobertura  # as questoes que nenhum detector alcanca
//
// POR QUE ELE EXISTE, E O QUE ELE NAO PODE SER. A primeira versao deste script montava a aula
// "que ensina" com um texto que nunca emitia o enunciado, e a aula "que vaza" no formato exato
// que a regra procurava. Os dois numeros eram tautologicos: mediam a redacao escolhida aqui,
// nao a capacidade do detector. Agora cada lado tem VARIANTES DE REDACAO — ordem invertida,
// distancia, remendo — e o numero relatado e o pior caso, nao o mais bonito.
//
// Nao le nenhum .md e nao usa rede.
//
// Bloco 1 — POR TOPICO (60): a aula inteira, quatro redacoes.
//   forma-canonica    ensina a materia citando a forma canonica (que e a resposta). NAO vaza.
//   forma-fonte-longe cita a frase-fonte como exemplo num ponto e a forma canonica bem longe
//                     dali (> janela). NAO vaza — e o caso que a simetria de ordem poderia
//                     transformar em falso positivo; e por isso que ele esta aqui.
//   item-direto       reproduz o item na ordem do enunciado ("de X fica Y"). VAZA.
//   item-invertido    reproduz o item na ordem natural da prosa ("a forma correta e Y; ela
//                     corrige X"). VAZA — e escapava 100% ate a regra virar simetrica.
//
// Bloco 2 — POR QUESTAO: cada ataque aplicado a cada questao que TEM detector, para dizer a
// taxa real de deteccao por eixo. Dois eixos ficam abertos e sao declarados, nao escondidos:
// distancia (fonte e resposta a 400 chars) e remendo (uma palavra a mais no meio da frase).
//
// Sai !=0 se alguma redacao de FORMA reprovar, ou se item-direto/item-invertido nao forem
// pegos em pelo menos 90% das questoes com detector.

const {
  contexto, achaVazamentos, fraseResolvida, fraseFonte, trechosDaQuestao
} = require('./valida_explicacoes.js');

const ENCHIMENTO = ' e isso vale para qualquer frase do mesmo tipo no dia a dia. ';
const MIN_TAXA = 0.90;

function practiceDoTopico(banco, topico) {
  return (banco.practice || []).filter((p) => p.topico === topico.titulo)
    .map((p) => ({ origem: 'practice #' + p.id, prompt: p.prompt, answer: p.answer }));
}

// Frase-fonte "crua" (com as aspas do enunciado tiradas), para escrever os textos sinteticos.
function fonteCrua(q) {
  const m = String(q.prompt).match(/"([^"]+)"/g);
  return m ? m.map((x) => x.slice(1, -1)).join(' ') : null;
}

function encheAte(n) {
  let s = '';
  while (s.length < n) s += ENCHIMENTO;
  return s;
}

// ---------------------------------------------------------------- redacoes, por questao

// Cada redacao devolve null quando nao se aplica aquela questao (denominadores separados).
const REDACOES = {
  'forma-canonica': (q) => 'Esta e a estrutura do topico: ' + q.answer + '.',

  'forma-fonte-longe': (q) => {
    const f = fonteCrua(q);
    if (!f || !fraseFonte(q.prompt, q.answer)) return null;
    return 'Compare com uma frase do dia a dia: ' + f + '.' + encheAte(400) +
      'A forma que este topico ensina e: ' + q.answer + '.';
  },

  'item-direto': (q) => {
    const r = fraseResolvida(q.prompt, q.answer);
    if (r) return 'Veja o exemplo: ' + r + '.';
    const f = fonteCrua(q);
    return f ? 'De "' + f + '" fica: ' + q.answer + '.' : null;
  },

  'item-invertido': (q) => {
    const f = fonteCrua(q);
    if (!f || !fraseFonte(q.prompt, q.answer)) return null;
    return 'A forma correta e ' + q.answer + '. Ela corrige a frase "' + f + '".';
  },

  'item-distante': (q) => {
    const f = fonteCrua(q);
    if (!f || !fraseFonte(q.prompt, q.answer)) return null;
    return 'Parta desta frase: ' + f + '.' + encheAte(400) + 'O resultado e: ' + q.answer + '.';
  },

  'item-remendado': (q) => {
    const r = fraseResolvida(q.prompt, q.answer);
    if (r) {
      const p = r.split(' ');
      p.splice(Math.floor(p.length / 2), 0, 'realmente');
      return 'Veja o exemplo: ' + p.join(' ') + '.';
    }
    const f = fonteCrua(q);
    if (!f || !fraseFonte(q.prompt, q.answer)) return null;
    const p = f.split(' ');
    p.splice(Math.floor(p.length / 2), 0, 'realmente');
    return 'De "' + p.join(' ') + '" fica: ' + q.answer + '.';
  }
};

// Redacoes que descrevem material de ensino legitimo — reprovar qualquer uma e falso positivo.
const SAO_FORMA = ['forma-canonica', 'forma-fonte-longe'];
// Redacoes que reproduzem o item — nao pegar e falso negativo.
const SAO_ITEM = ['item-direto', 'item-invertido', 'item-distante', 'item-remendado'];
// Eixos declarados como ABERTOS: medidos e relatados, mas nao exigidos pelo gate.
const ABERTOS = ['item-distante', 'item-remendado'];

// ---------------------------------------------------------------- bloco 1: por topico

function montaAula(topico, questoes, redacao) {
  const linhas = questoes.map((q) => REDACOES[redacao](q)).filter(Boolean);
  return topico.descricao + '\n' + linhas.join('\n');
}

function porTopico(ctx, redacao) {
  const casos = [];
  for (const t of ctx.topicos) {
    const qs = practiceDoTopico(ctx.questoes, t);
    if (!qs.length) continue;
    const achados = achaVazamentos(montaAula(t, qs, redacao), t, ctx.questoes);
    const reprova = achados.filter((v) => !v.mandadoPeloTrack);
    casos.push({ topico: t, reprova: reprova });
  }
  return casos;
}

// ---------------------------------------------------------------- bloco 2: por questao

function porQuestao(ctx, redacao) {
  const porTitulo = {};
  for (const t of ctx.topicos) porTitulo[t.titulo] = t;
  let aplicaveis = 0, pegas = 0;
  const escaparam = [];
  for (const p of (ctx.questoes.practice || [])) {
    const t = porTitulo[p.topico];
    if (!t) continue;
    const q = { origem: 'practice #' + p.id, prompt: p.prompt, answer: p.answer };
    if (!trechosDaQuestao(q).length) continue;      // sem detector: fora do denominador
    const texto = REDACOES[redacao](q);
    if (texto === null) continue;                   // redacao nao se aplica a esta questao
    aplicaveis++;
    const achados = achaVazamentos(texto, t, ctx.questoes)
      .filter((v) => v.origem === q.origem && !v.mandadoPeloTrack);
    if (achados.length) pegas++; else escaparam.push(q);
  }
  return { aplicaveis: aplicaveis, pegas: pegas, escaparam: escaparam };
}

// ---------------------------------------------------------------- ponto cego estrutural

function cobertura(ctx) {
  const todas = [];
  for (const p of (ctx.questoes.practice || [])) todas.push({ tipo: 'practice', origem: 'practice #' + p.id, prompt: p.prompt, answer: p.answer });
  for (const e of (ctx.questoes.exam || [])) todas.push({ tipo: 'exam', origem: 'exam #' + e.id, prompt: e.prompt, answer: e.answer });
  const cegas = todas.filter((q) => trechosDaQuestao(q).length === 0);
  return {
    total: todas.length, cegas: cegas,
    practice: todas.filter((q) => q.tipo === 'practice').length,
    cegasPractice: cegas.filter((q) => q.tipo === 'practice').length,
    exam: todas.filter((q) => q.tipo === 'exam').length,
    cegasExam: cegas.filter((q) => q.tipo === 'exam').length
  };
}

module.exports = { REDACOES, SAO_FORMA, SAO_ITEM, ABERTOS, porTopico, porQuestao, cobertura, montaAula, practiceDoTopico };

// ---------------------------------------------------------------- CLI

if (require.main === module) {
  const argv = process.argv.slice(2);
  const resumo = argv.indexOf('--resumo') >= 0;
  const ctx = contexto();
  const cob = cobertura(ctx);

  console.log('ponto cego estrutural (questao que nenhuma redacao alcanca): ' +
    cob.cegasPractice + '/' + cob.practice + ' practice e ' + cob.cegasExam + '/' + cob.exam +
    ' exam — resposta de uma palavra, ou enunciado sem lacuna e sem frase-fonte entre aspas');
  if (argv.indexOf('--cobertura') >= 0) {
    for (const q of cob.cegas) console.log('  - ' + q.origem + ' ' + JSON.stringify(q.prompt) + ' -> ' + JSON.stringify(q.answer));
    process.exit(0);
  }

  console.log('\n== por TOPICO (60 topicos, a aula inteira) ==');
  let falsosPositivos = 0;
  for (const r of SAO_FORMA.concat(SAO_ITEM)) {
    const casos = porTopico(ctx, r);
    const maus = casos.filter((c) => c.reprova.length);
    const lado = SAO_FORMA.indexOf(r) >= 0 ? 'NAO pode reprovar' : 'TEM de reprovar';
    if (SAO_FORMA.indexOf(r) >= 0) falsosPositivos += maus.length;
    console.log('  ' + r.padEnd(18) + maus.length + '/' + casos.length + ' topicos reprovados  (' + lado + ')');
    if (!resumo && SAO_FORMA.indexOf(r) >= 0) {
      for (const c of maus) {
        console.log('      x ' + c.topico.nivel + '/' + c.topico.ordem + ' ' + c.topico.titulo);
        for (const v of c.reprova) console.log('          ' + v.origem + ' [' + v.tipo + '] "' + v.trecho + '"');
      }
    }
  }

  console.log('\n== por QUESTAO (so as que tem detector) ==');
  let baixo = [];
  for (const r of SAO_FORMA.concat(SAO_ITEM)) {
    const m = porQuestao(ctx, r);
    const taxa = m.aplicaveis ? m.pegas / m.aplicaveis : 1;
    const nota = SAO_FORMA.indexOf(r) >= 0 ? 'falso positivo' : (ABERTOS.indexOf(r) >= 0 ? 'EIXO ABERTO, declarado' : 'exigido');
    console.log('  ' + r.padEnd(18) + m.pegas + '/' + m.aplicaveis + ' pegas  (' + nota + ')');
    if (SAO_FORMA.indexOf(r) >= 0 && m.pegas > 0) baixo.push(r + ' pegou ' + m.pegas + ' aula(s) legitima(s)');
    if (SAO_ITEM.indexOf(r) >= 0 && ABERTOS.indexOf(r) < 0 && taxa < MIN_TAXA) {
      baixo.push(r + ' so pega ' + Math.round(taxa * 100) + '% (minimo ' + Math.round(MIN_TAXA * 100) + '%)');
    }
  }

  const ok = falsosPositivos === 0 && !baixo.length;
  console.log('\n' + (ok
    ? 'PASSOU: 0 falso positivo nas redacoes de ensino; item-direto e item-invertido pegos acima de ' +
      Math.round(MIN_TAXA * 100) + '%. Eixos abertos (distancia, remendo) medidos acima.'
    : 'REPROVOU: ' + (falsosPositivos ? falsosPositivos + ' topico(s) de FORMA reprovados. ' : '') + baixo.join(' · ')));
  process.exit(ok ? 0 : 1);
}
