// CONTRATO DE IDIOMA DA TRILHA (modo Professor), derivado do FLUXO — nunca cravado aqui.
//
// Por que este arquivo existe: o T3 da Fase B asseria "explicacao de B2 sem portugues", que era
// verdade ate o T005b. Desde o T005b o produto e outro:
//
//        | explicacao | enunciado | resposta
//   A1/A2|     PT     |    PT     |   EN
//   B1+  |     PT     |    EN     |   EN
//
// Um teste com a regra cravada da FALSO VERMELHO na proxima mudanca de politica. Entao o
// veredito vem do `const LANG` do no "Professor Engine" do fluxo, do mesmo jeito que o
// `conteudo/valida_explicacoes.js` faz para os .md — a decisao de produto muda num lugar so.
//
// ATENCAO: este e o contrato da TRILHA. O contrato do modo CONVERSA e outro (cada
// `Prompt Conversa <nivel>`: A1 bilingue, B1+ inteiramente em ingles) e o T005b NAO o tocou.
// Confundir os dois faz o teste reprovar comportamento correto — ver o cabecalho do
// `revalida_niveis.js`.

const { capturaConst, FLUXO_PADRAO } = require('../../conteudo/extrai_track.js');
const { classificaDiretiva } = require('../../conteudo/valida_explicacoes.js');

// A diretiva do nivel fala de dois artefatos: a EXPLICACAO e as PERGUNTAS. `classificaDiretiva`
// (reusada do validador de conteudo) le a primeira metade; esta le a segunda.
function classificaDiretivaPergunta(nivel, texto) {
  const limpo = String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const corte = limpo.search(/\bas\s+perguntas\b/i);
  const trecho = corte >= 0 ? limpo.slice(corte) : '';
  if (!trecho) {
    throw new Error('o LANG do nivel ' + nivel + ' nao fala das PERGUNTAS: '
      + JSON.stringify(String(texto).slice(0, 160)));
  }
  // "enunciado em portugues" (A1/A2) x "INTEIRAMENTE em ingles, enunciado e resposta" (B1+)
  const enunciadoPt = /enunciado\s+em\s+portugues/i.test(trecho);
  const tudoEn = /inteiramente\s+em\s+ingles/i.test(trecho)
    || (/em\s+ingles/i.test(trecho) && !/em\s+portugues/i.test(trecho));
  if (enunciadoPt) return 'pt';
  if (tudoEn) return 'en';
  throw new Error('nao consegui derivar o idioma do enunciado de ' + nivel
    + ' a partir do LANG do fluxo: ' + JSON.stringify(String(texto).slice(0, 160)));
}

// { A1: { explicacao: 'pt', pergunta: 'pt' }, ..., B2: { explicacao: 'pt', pergunta: 'en' } }
function contratoIdioma(caminhoFluxo) {
  const LANG = capturaConst('LANG', caminhoFluxo || FLUXO_PADRAO);
  const mapa = {};
  for (const nivel of Object.keys(LANG)) {
    mapa[nivel] = {
      explicacao: classificaDiretiva(nivel, LANG[nivel]),
      pergunta: classificaDiretivaPergunta(nivel, LANG[nivel]),
    };
  }
  return mapa;
}

// Detector de portugues por palavra funcional (mesmo do `bateria_completa_b.js`, que passou a
// importa-lo daqui em vez de manter copia).
function temPortugues(t) {
  const s = ' ' + String(t || '').toLowerCase() + ' ';
  const pt = [' que ', ' nao ', ' não ', ' você ', ' voce ', ' com ', ' para ', ' mais ', ' isso ',
    ' seu ', ' sua ', ' muito ', ' bem ', ' tambem ', ' também '];
  return pt.some((w) => s.includes(w));
}

// Separa o ENUNCIADO da questao do cabecalho de INTERFACE.
//
// POR QUE ISTO EXISTE (achado em 10/09, e custou uma correcao no fluxo):
// o `Parse Professor` publica em `finalText` o feedback do engine CONCATENADO a questao:
//
//   ▶️ Questões de “Present perfect continuous”. Acerte 5 seguidas para liberar o
//   próximo tópico! (sequência atual: 0/5)
//
//   ❓ Complete the sentence: I have been studying ___ two hours.
//
// O cabecalho e portugues POR DESENHO -- e interface, nao enunciado, e vale em todos os
// niveis. Julgando o texto inteiro, o T3 acusava "enunciado em portugues" em B2 mesmo com
// o enunciado impecavel em ingles: FALSO VERMELHO 3/3, que chegou a ser publicado no
// relatorio do v8 como "regressao do proprio v8".
//
// E a armadilha nº 13 do handoff outra vez: o instrumento julgando a string errada.
function soEnunciado(texto) {
  const linhas = String(texto || '').split('\n');
  const util = linhas.filter(l => {
    const s = l.trim();
    if (!s) return false;
    if (/^\[[a-zA-Z.]+\]/.test(s)) {                    // rotulos do digest
      if (!/❓/.test(s)) return false;
    }
    if (/^▶️\s*Quest[oõ]es de/.test(s)) return false;    // cabecalho do quiz
    if (/^📚\s*Modo Professor/.test(s)) return false;    // abre-alas do topico
    if (/Acerte \d+ seguidas/.test(s)) return false;     // regra do quiz, sempre em PT
    if (/sequ[eê]ncia atual/i.test(s)) return false;
    return true;
  });
  // Se houver linha com o marcador de questao, ela (e o que vem depois) e o enunciado.
  const iq = util.findIndex(l => /❓/.test(l));
  const alvo = iq >= 0 ? util.slice(iq) : util;
  return alvo.join('\n').replace(/^\[[a-zA-Z.]+\]\s*/gm, '').trim();
}

// Veredito do T3: a explicacao e o enunciado da questao estao no idioma que o fluxo manda?
// `pergunta` pode vir null quando a rodada nao chegou a pedir a questao — nesse caso o veredito
// e null (INCONCLUSIVO), nunca aprovacao (armadilha n.1).
function vereditoT3(nivel, explicacao, pergunta, contrato) {
  const c = (contrato || contratoIdioma())[nivel];
  if (!c) throw new Error('o LANG do fluxo nao tem o nivel ' + nivel);

  const ptExp = temPortugues(explicacao);
  const explOk = c.explicacao === 'pt' ? ptExp : !ptExp;

  const partes = ['nivel ' + nivel,
    'explicacao esperada em ' + c.explicacao.toUpperCase() + ': portugues detectado=' + ptExp
    + ' -> ' + (explOk ? 'ok' : 'FORA DO CONTRATO')];

  if (pergunta === null || pergunta === undefined || !String(pergunta).trim()) {
    partes.push('enunciado esperado em ' + c.pergunta.toUpperCase() + ': NAO CAPTURADO');
    return { ok: null, contrato: c, detalhe: partes.join(' | ') };
  }

  const pergLimpa = soEnunciado(pergunta);
  if (!pergLimpa.trim()) {
    partes.push('enunciado esperado em ' + c.pergunta.toUpperCase() + ': NAO CAPTURADO (so cabecalho)');
    return { ok: null, contrato: c, detalhe: partes.join(' | ') };
  }

  const ptPerg = temPortugues(pergLimpa);
  const pergOk = c.pergunta === 'pt' ? ptPerg : !ptPerg;
  partes.push('enunciado esperado em ' + c.pergunta.toUpperCase() + ': portugues detectado=' + ptPerg
    + ' -> ' + (pergOk ? 'ok' : 'FORA DO CONTRATO'));

  return { ok: explOk && pergOk, contrato: c, detalhe: partes.join(' | ') };
}

module.exports = { contratoIdioma, classificaDiretivaPergunta, temPortugues, vereditoT3, soEnunciado };
