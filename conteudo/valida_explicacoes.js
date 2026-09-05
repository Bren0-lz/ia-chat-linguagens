// Valida os .md de `conteudo/explicacoes/` — o gate do T006, onde 60 arquivos nascem de uma
// vez e ninguem le os 60 a mao.
//
// Uso:
//   node conteudo/valida_explicacoes.js                 # valida tudo que existe em explicacoes/
//   node conteudo/valida_explicacoes.js --dir <caminho> # valida outra arvore (fixtures)
//   node conteudo/valida_explicacoes.js --arquivo <md>  # valida um arquivo so
//   node conteudo/valida_explicacoes.js --fluxo <json>  # de qual fluxo derivar TRACK e LANG
//
// O que confere, por arquivo:
//   FRONTMATTER  campos completos e bem formados
//   SLUG         nivel/ordem/slug/titulo coerentes com o TRACK e com o nome do arquivo
//   TAMANHO      corpo dentro da faixa
//   COBERTURA    o corpo cobre os termos que a `descricao` do TRACK manda ensinar
//   ERRO_COMUM   existe secao de erros e ela cobre o ERRO COMUM daquele topico
//   HTML_*       so <b>/<i>, balanceadas, sem markdown, sem & cru, sem < > solto
//   IDIOMA       o corpo esta na lingua que o FLUXO manda para aquele nivel
//   GABARITO     nao entrega a resposta de uma QUESTAO especifica daquele topico
//
// IDIOMA NAO E CONSTANTE AQUI. Vem do `const LANG` do no "Professor Engine", extraido do
// fluxo do mesmo jeito que o `valida_track.js` reextrai o TRACK. Desde o T005b o LANG manda a
// EXPLICACAO em portugues nos seis niveis (as PERGUNTAS seguem em ingles de B1 para cima, e nao
// sao julgadas aqui); se o Breno mudar essa politica no fluxo, o
// validador e o gerador seguem juntos, sem uma terceira verdade para envelhecer.
// Quem edita o TRACK precisa rodar `node conteudo/extrai_track.js`; o LANG e lido direto do
// fluxo a cada rodada, entao nao precisa de regeracao.

const fs = require('fs');
const path = require('path');
const { extrai, capturaConst, DESTINO, FLUXO_PADRAO } = require('./extrai_track.js');
const { DESTINO_Q } = require('./extrai_questoes.js');

const RAIZ = path.join(__dirname, '..');
const DIR_CONTEUDO = path.join(__dirname, 'explicacoes');

const MIN_CORPO = 500;    // abaixo disso nao e explicacao, e um toco
const MAX_CORPO = 3000;   // o envio ao Telegram trunca; ~2500 e o alvo
const TAGS_OK = ['b', 'i'];
const CAMPOS_FM = ['nivel', 'ordem', 'slug', 'titulo', 'modelo', 'data'];

const COBERTURA_MIN = 0.70;   // fracao dos termos exigiveis da descricao
const ERRO_COMUM_MIN = 0.60;  // idem, dentro da secao de erros
const MARCADORES_MIN = 8;     // menos que isso e texto curto demais para julgar idioma
const IDIOMA_PT_MIN = 0.55;   // fracao de marcadores PT quando o fluxo pede portugues
const IDIOMA_PT_MAX = 0.25;   // teto de marcadores PT quando o fluxo pede ingles

// ------------------------------------------------------------------ idioma vindo do FLUXO

// Deriva 'pt' | 'en' da diretiva de idioma daquele nivel. So olha o trecho que fala da
// EXPLICACAO: o resto da diretiva fala das PERGUNTAS, que sao outro artefato.
function classificaDiretiva(nivel, texto) {
  const limpo = String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const corte = limpo.search(/perguntas/i);
  const trecho = corte > 0 ? limpo.slice(0, corte) : limpo;
  const ingles = /em ingles/i.test(trecho);
  const portugues = /em portugues/i.test(trecho);
  const semPortugues = /sem\s+portugues/i.test(trecho);
  if (ingles && (semPortugues || !portugues)) return 'en';
  if (portugues) return 'pt';
  throw new Error('nao consegui derivar o idioma de ' + nivel +
    ' a partir do LANG do fluxo: ' + JSON.stringify(String(texto).slice(0, 160)));
}

function idiomaPorNivel(caminhoFluxo) {
  const LANG = capturaConst('LANG', caminhoFluxo);
  const mapa = {};
  for (const nivel of Object.keys(LANG)) mapa[nivel] = classificaDiretiva(nivel, LANG[nivel]);
  return mapa;
}

// A diretiva de EXPLICACAO daquele nivel, ao pe da letra, como o fluxo a escreveu — e nao so
// o rotulo 'pt'/'en'. E o que o gerador manda ao modelo: o LANG ja diz, por nivel, o REGISTRO
// esperado ("claro e simples, uma ideia por frase" em B1, "denso e economico, de leitor
// experiente" em C2). Ate o T005c o gerador tinha um molde unico por idioma, escrito a mao e
// copiado do A1 ("sempre com o termo em ingles seguido da traducao"), que achatava B1..C2 no
// registro do A1 — uma terceira verdade, que envelhece sozinha. Corta em "As PERGUNTAS", que
// e outro artefato (o enunciado das questoes, gerado pelo fluxo ao vivo).
function diretivaExplicacao(nivel, texto) {
  const bruto = String(texto || '');
  const corte = bruto.search(/\bas\s+perguntas\b/i);
  const trecho = (corte > 0 ? bruto.slice(0, corte) : bruto).trim().replace(/[\s;.]+$/, '');
  if (!trecho) throw new Error('LANG do nivel ' + nivel + ' nao tem diretiva de explicacao');
  return trecho;
}

function diretivaExplicacaoPorNivel(caminhoFluxo) {
  const LANG = capturaConst('LANG', caminhoFluxo);
  const mapa = {};
  for (const nivel of Object.keys(LANG)) mapa[nivel] = diretivaExplicacao(nivel, LANG[nivel]);
  return mapa;
}

// ------------------------------------------------------------------ texto

function semAcento(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function tokens(s) {
  return (semAcento(s).toLowerCase().match(/[a-z][a-z']*/g) || []).map((w) => w.replace(/'+$/, ''));
}

// Palavras da META-LINGUAGEM portuguesa das descricoes do TRACK (e as glosas: "hello = oi").
// Nao sao conteudo a ensinar, entao nao entram na cobertura exigida. Errar para o lado de
// EXCLUIR e seguro (afrouxa a exigencia).
const PT_META = new Set(('acao acoes academico adjetivo adjetivos adoentado adverbio adverbios afirm afirmacoes ' +
  'afirmativa afirmativas afirmativo agente ainda alem alfabeto algo alguem amanha ambigua ambiguidade ambos ' +
  'amarelo andamento animais animal anna anos antecedente antes apos apostrofo aprox apropriado arrastar assim ' +
  'ate auxiliar azul baixa base basico basta bem boa bom branco brasileiro britanico bruno cachorro cada caro ' +
  'causa cavalo certa certeza certo chegar chuvoso cima cinza claro clima coelho coesao coisa coisas colocacao ' +
  'coloquialismos com comecou comparacao comparar completa compostos comum comuns concisao concordancia ' +
  'condicao conectores conjugacao conjuncao conotacao conselho consequencia consertou consoante consoantes ' +
  'contaveis contavel conteudo contexto continua contraste contrai contracoes conceituais convencoes cor cores ' +
  'correta cortesia cuidar curta curtas curto curtos datas decidida decisao deducao deduzir definida definido ' +
  'deixa dela dele demais dentro depois despedidas despedir deveria dezenas dia dias dito dizer disso dobra ' +
  'dormir duas duracao efeito ela elas ele eles elemento elementos elipse enfase enfatico enquanto ensolarado ' +
  'ensinar entre erro erros errada errado escolha escolher escreve escrever especificado essencial esta estado ' +
  'estados estar estilo estrutura estruturas estudar eu evento evidencia evitar exato excecao excesso existe ' +
  'experiencia externa extra facil falar fato fatos favor faz fazer fechar feito fez fica fixa foco foi ' +
  'formais formal formalidade formar forma formas forte frase frases frequencia frequentemente frequentes frio ' +
  'futuro ganham gato gelo genitivo geral gera habilidade habito habitos hifen homem horas hipoteses hipotetica ' +
  'hipotetico idade idiomatico igual igualdade implicito incitar incontavel incontaveis indicar inferir ' +
  'informacao informal ingles inicio inseparaveis intencao interpretar interrompida inverter inversao irreal ' +
  'irregular irregulares isso janela john junto lado laranja letra letras levantar leva ligadas ligado ligar ' +
  'lugar longa longos maiusculas maiusculo mandar manter mantendo marcador marcadores marrom mas mensagem menos ' +
  'menino mesmo metafora metaforas meio mim minuscula mista misturar modais modal modo momento morno mover ' +
  'mudam muito mulher nacionalidade nacionalidades nada nao nas necessaria nunca necessario negativa negativas ' +
  'negativo negativos neg neutro noite nome nomes nos numeros nublado objeto objetos obrigacao obrigado ' +
  'ocorrem omitir onde opcional ordem origem otimo outra outras outro outros padroes palavra palavras ' +
  'parafrasear parte partes passada passado passar passaro passiva pedir peixe pela pelo perde perg pergunta ' +
  'perguntar perguntas periodo pesado pessoa pessoas plano plural pode polidez polido pontual pontuacao ponto ' +
  'pontos porco portanto portugues posicao posse positiva positivo possibilidade possessivos possivel pouco ' +
  'poucos pra precisa precisao precisava preposicao preposicoes presente preto principal probabilidade problemao ' +
  'procurar profissao proibicao proibido promessa pronome pronomes provavel qual quando quase quebrar quem ' +
  'quente querer raramente real redundancia referencia referenciacao regra regras registro regulares relativos ' +
  'repetidos resp responder resposta respostas resultado rio rosa rotinas roxo sem sempre sentido separaveis ' +
  'ser servem silaba silabas sim sinalizacao sinalizados sinonimo situacao sobre soletrar som substantivo ' +
  'substantivos substituir substituto suavizar sujeito sujeitos superficie superlativo tarde tchau tem tempo ' +
  'terceira terminado termo termos ter texto tom todos tomar traducao traduzir transformar transitivos ' +
  'transmite uma usa usado usar vaca ventando verbais verbal verbo verbos verde vermelho vez via vida vira ' +
  'virgula virgulas vocabulario voce voces vogais vogal volta voz absolutas acontecendo agora como confundir cumprimentar cumprimentos descobrir desistir desligar esquecer examinar focar literalmente mais meses nominalizacao oferta ortografia para participio participios permissao por previsao que simples singular vem zero').split(' '));

// Rotulos estruturais das descricoes do TRACK ("FORMAS:", "USO:", "ERRO COMUM:").
const ROTULOS = new Set(['formas', 'forma', 'uso', 'usos', 'exemplo', 'exemplos', 'obs', 'nota',
  'atencao', 'regra', 'estrutura', 'nivel', 'topico', 'materia']);

function termosExigiveis(texto) {
  const vistos = new Set();
  for (const t of tokens(texto)) {
    if (t.length < 3) continue;
    if (PT_META.has(t) || ROTULOS.has(t)) continue;
    vistos.add(t);
  }
  return [...vistos];
}

function cobertura(termos, corpo) {
  const presentes = new Set(tokens(corpo));
  const faltando = termos.filter((t) => !presentes.has(t));
  const frac = termos.length ? (termos.length - faltando.length) / termos.length : 1;
  return { frac: frac, faltando: faltando, total: termos.length };
}

// ------------------------------------------------------------------ idioma do corpo

// Marcadores gramaticais frequentes, que aparecem em qualquer texto corrido do idioma —
// e nao nos termos ENSINADOS (uma explicacao em portugues cita muito ingles, e vice-versa).
const MARC_PT = new Set(('que para voce nao uma com quando sao dos das como mais muito sempre porque isso este ' +
  'esta pelo pela ser estar tambem entao usamos usado usar palavra palavras frase ingles portugues exemplo ' +
  'exemplos forma formas lembre pode sua seu ela ele nos aos mas por ate nunca cada onde depois antes sobre ' +
  'aqui ali entre outro outra qualquer todos toda alguns quer dizer significa').split(' '));
const MARC_EN = new Set(('the you are and with when this that for not use used using word words sentence ' +
  'sentences example examples form forms remember can your she they them was were have has but because also ' +
  'then there their about into than what which something someone always never after before here does don ' +
  'doesn means meaning').split(' '));

function medeIdioma(corpo) {
  let pt = 0, en = 0;
  for (const t of tokens(corpo)) {
    if (MARC_PT.has(t)) pt++;
    if (MARC_EN.has(t)) en++;
  }
  const total = pt + en;
  return { pt: pt, en: en, total: total, fracPt: total ? pt / total : 0 };
}

// ------------------------------------------------------------------ gabarito das questoes

// CALIBRACAO DO T005c — por que a regra da "resposta sozinha" saiu.
//
// Ate aqui havia uma segunda regra: a RESPOSTA sozinha, quando ja era frase (>=3 palavras e
// >=12 chars), contava como vazamento. A simulacao do T005c (`simula_vazamento.js`) montou, para
// os 60 topicos, a aula que ENSINA a materia do proprio topico — o corpo cita a forma canonica,
// sem tocar no enunciado — e essa regra reprovava 22 dos 60. Entre os 22:
// "never have i seen such chaos" (C1/2), que e O exemplo de inversao; "had never seen" (B2/2);
// "have been learning" (B2/1); "i am not tired" (A1/7). Nenhum deles entrega item nenhum: a
// questao do C1/2 e "Invert: 'I have never seen such chaos.'" — quem le so a forma invertida
// ainda precisa saber que ela e a resposta daquele pedido.
//
// Subir o numero de palavras nao resolveria: a frase canonica da inversao tem 6 palavras e 28
// caracteres, mais que qualquer limiar que ainda deixasse passar vazamento de verdade. O eixo
// que separa os dois casos nao e tamanho, e sim se o corpo reproduz o ITEM — o pedido do
// enunciado E a resposta dele, juntos. A ordem NAO importa: "a resposta e X, ela corrige Y"
// entrega o item tanto quanto "de Y fica X", e e a ordem natural da prosa didatica.
//
// O QUE CONTA COMO VAZAMENTO — e o que NAO conta.
//
// Nao conta: usar o vocabulario e as formas do topico. A explicacao de "Past continuous" tem
// de conter "was cooking"; a de "Cumprimentos" tem de conter "good morning" — que e,
// literalmente, a resposta de uma das questoes. Reprovar isso reprovaria os 60 no T006 e
// mataria a explicacao como material de ensino.
//
// Conta: entregar de bandeja o ITEM ESPECIFICO, nas duas formas que o banco tem:
//   (a) FRASE RESOLVIDA — enunciado com lacuna, com a lacuna ja preenchida pela resposta
//       (>= 4 palavras e >= 18 chars), aparece no corpo;
//   (b) PAR ENUNCIADO->RESPOSTA — enunciado de transformacao ("Corrija: '...'", "Invert: '...'",
//       "Rewrite: '...'"), onde a frase-fonte (>= 3 palavras e >= 12 chars) aparece no corpo e a
//       resposta (>= 2 palavras e >= 8 chars) aparece a menos de JANELA_PAR chars dela, em
//       QUALQUER ORDEM. So a proximidade distingue "ensinou a transformacao daquele item" de
//       "as duas frases calharam de existir no mesmo texto" — exigir a ordem fonte->resposta
//       deixava escapar toda aula escrita como "o correto e X; a frase Y esta errada".
//
// Excecao, e ela vem dos dados, nao de uma lista escrita a mao: se o trecho JA ESTA na
// `descricao` do TRACK daquele topico, o gerador foi MANDADO ensinar aquilo (o TRACK do B1/2
// manda ensinar "I have seen him yesterday -> I saw him yesterday", que e exatamente uma das
// questoes). Nesse caso o conflito e entre a questao e o TRACK, nao um defeito da explicacao;
// o CLI avisa, e nao reprova. O mesmo teste roda contra a descricao e contra o corpo.
//
// O QUE ESTE DETECTOR NAO VE. Quatro eixos, medidos por `simula_vazamento.js` e relatados no
// gate a cada rodada — nenhum deles vai ser consertado no T005c, e todos ficam abertos para
// quem revisar os 60 .md do T006 a olho:
//
//   1. QUESTAO SEM DETECTOR (estrutural): 36 das 136 de practice e 29 das 60 de exam. Resposta
//      de uma palavra ("went", "have", "ever"), ou enunciado sem lacuna e sem frase-fonte entre
//      aspas ("Qual e a pergunta correta?" -> "Are you ready?"). Nao ha o que casar.
//   2. DISTANCIA: frase-fonte e resposta a mais de JANELA_PAR chars uma da outra escapam
//      (0/18 das questoes de par). A janela e o que impede o falso positivo; sem ela, qualquer
//      aula que cite as duas frases em paragrafos distintos reprovaria.
//   3. REMENDO: uma palavra a mais no meio da frase ("she don't REALMENTE like coffee") escapa
//      (0/100). O casamento e literal, por substring; parear texto parecido exigiria medida de
//      similaridade, que traz falso positivo junto.
//   4. LACUNA COPIADA + RESPOSTA AO LADO: nas 82 questoes de lacuna a `fraseFonte` e nula (o
//      enunciado tem "___"), entao so vale a regra (a). Um corpo que copie o enunciado COM a
//      lacuna e ponha a resposta ao lado ("She ___ (live) here since 2010 -> has lived") escapa
//      em 81 das 82. Achado na verificacao do T005c. Risco baixo na pratica: o gerador nunca ve
//      os enunciados, entao nao tem de onde copiar a lacuna — mas o eixo existe.
//
// A regra anterior ("a resposta sozinha, se for frase, e vazamento") cobria parte dos eixos 2
// e 3 — 17/18 e 18/94 — ao preco de 26 falsos positivos em 101 questoes e 22 dos 60 topicos.
// A troca foi deliberada: falso negativo custa uma questao decorada; falso positivo reprovaria
// as 60 explicacoes do T006 e mataria a explicacao como material de ensino. O que NAO vale e
// relatar isso como aumento de deteccao: o gate imprime os seis numeros, sempre.

const MIN_PALAVRAS_FRASE = 4;
const MIN_CHARS_FRASE = 18;
const MIN_PALAVRAS_FONTE = 3;
const MIN_CHARS_FONTE = 12;
const MIN_PALAVRAS_RESPOSTA = 2;
const MIN_CHARS_RESPOSTA = 8;
const JANELA_PAR = 240;   // chars entre o fim da frase-fonte e o inicio da resposta

function normalizaTrecho(s) {
  return semAcento(String(s).replace(/<[^>]*>/g, ' '))
    .toLowerCase().replace(/[^a-z0-9']+/g, ' ').trim();
}

function distintiva(s, minPal, minChars) {
  return !!s && s.length >= minChars && s.split(' ').filter(Boolean).length >= minPal;
}

// Enunciado sem o comando em portugues ("Complete: ...") e sem as dicas entre parenteses.
// Prefere o que esta entre aspas (a frase-fonte das questoes de transformacao); se o que esta
// entre aspas nao tem a lacuna mas o enunciado inteiro tem, volta para o enunciado inteiro.
function corpoDoEnunciado(prompt, exigeLacuna) {
  const p = String(prompt || '');
  const semComando = (() => { const i = p.indexOf(':'); return (i >= 0 && i < 60) ? p.slice(i + 1) : p; })();
  const aspas = p.match(/"([^"]+)"/g);
  let escolhido = aspas && aspas.length ? aspas.map((x) => x.slice(1, -1)).join(' ') : semComando;
  if (exigeLacuna && !/_/.test(escolhido) && /_/.test(semComando)) escolhido = semComando;
  return escolhido.replace(/\([^)]*\)/g, ' ');
}

function fraseResolvida(prompt, answer) {
  const p = corpoDoEnunciado(prompt, true);
  if (!/_/.test(p)) return null;
  return normalizaTrecho(p.replace(/(_+\s*)+/g, ' ' + String(answer || '') + ' '));
}

// Frase-fonte das questoes de transformacao: o que o aluno recebe para transformar. So existe
// quando o enunciado NAO tem lacuna (com lacuna, quem cobre e a regra (a)) e quando ela nao ja
// contem a resposta.
function fraseFonte(prompt, answer) {
  // So conta o que esta entre aspas: e ali que mora a frase que o aluno recebe para
  // transformar. Sem aspas sobraria o comando ('Qual e a pergunta correta?'), que e
  // meta-linguagem em portugues e nunca apareceria no corpo — detector que nunca dispara.
  if (!/"[^"]+"/.test(String(prompt || ''))) return null;
  // Com lacuna, quem cobre e a regra (a): a frase resolvida ja e o item inteiro. Se o par
  // tambem valesse aqui, o pedaco citado ANTES da lacuna viraria fonte e a resposta sozinha
  // no meio da aula bastaria — a regra que o T005c acabou de tirar, de volta pela janela.
  if (/_/.test(String(prompt || ''))) return null;
  const p = corpoDoEnunciado(prompt, false);
  const fonte = normalizaTrecho(p);
  const resp = normalizaTrecho(answer);
  if (!distintiva(fonte, MIN_PALAVRAS_FONTE, MIN_CHARS_FONTE)) return null;
  if (!distintiva(resp, MIN_PALAVRAS_RESPOSTA, MIN_CHARS_RESPOSTA)) return null;
  if (fonte.includes(resp) || resp.includes(fonte)) return null;
  return { fonte: fonte, resposta: resp };
}

function posicoes(alvo, agulha) {
  const out = [];
  let i = alvo.indexOf(agulha);
  while (i >= 0) { out.push(i); i = alvo.indexOf(agulha, i + 1); }
  return out;
}

// Frase-fonte e resposta a menos de JANELA_PAR chars uma da outra, EM QUALQUER ORDEM.
// A ordem foi simetrica desde a verificacao do T005c: exigir "fonte antes da resposta" deixava
// escapar 100% dos itens escritos na ordem natural da prosa didatica — "A forma correta e X.
// Ela corrige a frase Y." So a PROXIMIDADE distingue "resolveu aquele item" de "as duas frases
// existem no mesmo texto"; a ordem nao distingue nada, e cobra-la e um convite ao vazamento.
function achaPar(alvo, fonte, resposta) {
  for (const f of posicoes(alvo, fonte)) {
    for (const r of posicoes(alvo, resposta)) {
      const vao = r >= f ? r - (f + fonte.length) : f - (r + resposta.length);
      if (vao <= JANELA_PAR) return true;
    }
  }
  return false;
}

// Trechos que, se aparecerem no texto, sao vazamento daquela questao. Cada um sabe se casa com
// um texto — assim a mesma prova roda contra o corpo e contra a `descricao` do TRACK.
function trechosDaQuestao(q) {
  const out = [];
  const frase = fraseResolvida(q.prompt, q.answer);
  if (distintiva(frase, MIN_PALAVRAS_FRASE, MIN_CHARS_FRASE)) {
    out.push({ tipo: 'enunciado resolvido', trecho: frase, casa: (alvo) => alvo.includes(frase) });
  }
  const par = fraseFonte(q.prompt, q.answer);
  if (par) {
    out.push({
      tipo: 'item reproduzido', trecho: par.fonte + ' -> ' + par.resposta,
      casa: (alvo) => achaPar(alvo, par.fonte, par.resposta)
    });
  }
  return out;
}

// Questoes ligadas ao topico: practice pelo `track_topic` (o titulo do topico, mesma chave do
// no "Parse Professor"); exam so pelo nivel, porque `exam_questions` nao tem vinculo com topico.
function questoesDoTopico(banco, topico) {
  const q = [];
  for (const p of (banco.practice || [])) {
    if (p.topico === topico.titulo) q.push({ origem: 'practice #' + p.id, prompt: p.prompt, answer: p.answer });
  }
  for (const e of (banco.exam || [])) {
    if (e.nivel === topico.nivel) q.push({ origem: 'exam #' + e.id, prompt: e.prompt, answer: e.answer });
  }
  return q;
}

function achaVazamentos(corpo, topico, banco) {
  const alvo = normalizaTrecho(corpo);
  const daDescricao = normalizaTrecho(topico.descricao);
  const achados = [];
  for (const q of questoesDoTopico(banco, topico)) {
    for (const t of trechosDaQuestao(q)) {
      if (!t.casa(alvo)) continue;
      achados.push({
        origem: q.origem, tipo: t.tipo, trecho: t.trecho,
        mandadoPeloTrack: t.casa(daDescricao)
      });
    }
  }
  return achados;
}

function carregaQuestoes() {
  if (!fs.existsSync(DESTINO_Q)) {
    throw new Error('conteudo/questoes.json nao existe — rode `node conteudo/extrai_questoes.js` (precisa do Postgres)');
  }
  const d = JSON.parse(fs.readFileSync(DESTINO_Q, 'utf8'));
  if (!Array.isArray(d.practice) || !d.practice.length) {
    throw new Error('conteudo/questoes.json sem questoes de practice');
  }
  return d;
}

// ------------------------------------------------------------------ frontmatter

function separaFrontmatter(bruto) {
  const texto = bruto.replace(/^\uFEFF/, '');
  if (!/^---\r?\n/.test(texto)) return { erro: 'nao comeca com a linha "---" do frontmatter' };
  const fim = texto.indexOf('\n---', 4);
  if (fim < 0) return { erro: 'frontmatter sem a linha "---" de fechamento (arquivo truncado?)' };
  const cabecalho = texto.slice(4, fim);
  const resto = texto.slice(fim + 4).replace(/^\r?\n/, '');
  const campos = {};
  for (const linha of cabecalho.split(/\r?\n/)) {
    if (!linha.trim()) continue;
    const m = linha.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!m) return { erro: 'linha de frontmatter mal formada: ' + JSON.stringify(linha) };
    let valor = m[2].trim();
    if (/^".*"$/.test(valor)) valor = valor.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    campos[m[1]] = valor;
  }
  return { campos: campos, corpo: resto.trim() };
}

// ------------------------------------------------------------------ HTML do Telegram

function problemasHtml(corpo) {
  const p = [];
  const add = (codigo, msg) => p.push({ codigo: codigo, msg: msg });
  if (/(^|\n)\s*#{1,6}\s/.test(corpo) || /\*\*/.test(corpo) || /```/.test(corpo) ||
      /(^|\n)\s*\|.*\|/.test(corpo) || /(^|\s)\*\s/.test(corpo)) {
    add('HTML_MARKDOWN', 'contem markdown (##, **, ```, tabela com | ou bullet com *) — o envio usa parse_mode HTML');
  }
  if (/&/.test(corpo)) add('HTML_AMP', 'contem & cru (o Telegram exige &amp;)');

  const tags = corpo.match(/<\/?[^<>]*>/g) || [];
  for (const tag of tags) {
    const m = tag.match(/^<\/?([a-zA-Z0-9]+)\s*\/?>$/);
    if (!m || TAGS_OK.indexOf(m[1].toLowerCase()) < 0) {
      add('HTML_TAG', 'tag nao permitida (so <b> e <i>): ' + tag);
    }
  }
  for (const t of TAGS_OK) {
    const ab = (corpo.match(new RegExp('<' + t + '>', 'g')) || []).length;
    const fe = (corpo.match(new RegExp('</' + t + '>', 'g')) || []).length;
    if (ab !== fe) add('HTML_TAG', 'tag <' + t + '> desbalanceada (' + ab + ' aberta(s), ' + fe + ' fechada(s))');
  }
  const soltos = corpo.replace(/<\/?(b|i)>/g, '');
  if (/[<>]/.test(soltos)) add('HTML_ANGULO', 'contem < ou > solto fora de <b>/<i>');
  return p;
}

// ------------------------------------------------------------------ validacao de um arquivo

const MARCA_ERROS = /(erros?\s+comuns?|erros?\s+frequentes?|common\s+(mistakes?|errors?|pitfalls?)|typical\s+mistakes?|mistakes?\s+to\s+avoid|watch\s+out)/i;

// ctx: { topicos, idioma }  — as duas verdades derivadas do fluxo
function validaArquivo(caminho, ctx) {
  const problemas = [];
  const add = (codigo, msg) => problemas.push({ codigo: codigo, msg: msg });
  const rel = path.relative(RAIZ, caminho).replace(/\\/g, '/');

  let bruto;
  try { bruto = fs.readFileSync(caminho, 'utf8'); }
  catch (e) { return { arquivo: rel, problemas: [{ codigo: 'LEITURA', msg: e.message }] }; }

  const fm = separaFrontmatter(bruto);
  if (fm.erro) return { arquivo: rel, problemas: [{ codigo: 'FRONTMATTER', msg: fm.erro }] };

  const campos = fm.campos;
  const corpo = fm.corpo;

  for (const c of CAMPOS_FM) {
    if (!campos[c] || !String(campos[c]).trim()) add('FRONTMATTER', 'campo "' + c + '" ausente ou vazio');
  }
  if (campos.data && !/^\d{4}-\d{2}-\d{2}$/.test(campos.data)) {
    add('FRONTMATTER', 'campo "data" nao esta em AAAA-MM-DD: ' + JSON.stringify(campos.data));
  }
  if (campos.ordem !== undefined && !/^\d{1,2}$/.test(String(campos.ordem))) {
    add('FRONTMATTER', 'campo "ordem" nao e inteiro: ' + JSON.stringify(campos.ordem));
  }
  if (problemas.length) return { arquivo: rel, problemas: problemas };

  // --- coerencia com o TRACK e com o nome do arquivo
  const topico = ctx.topicos.find((t) => t.nivel === campos.nivel && t.ordem === Number(campos.ordem));
  if (!topico) {
    add('SLUG', 'nivel/ordem "' + campos.nivel + '/' + campos.ordem + '" nao existe no TRACK');
    return { arquivo: rel, problemas: problemas };
  }
  const nomeEsperado = String(topico.ordem).padStart(2, '0') + '-' + topico.slug + '.md';
  const nomeReal = path.basename(caminho);
  if (nomeReal !== nomeEsperado) add('SLUG', 'nome do arquivo e "' + nomeReal + '", o TRACK pede "' + nomeEsperado + '"');
  if (campos.slug !== topico.slug) add('SLUG', 'slug do frontmatter e "' + campos.slug + '", o TRACK pede "' + topico.slug + '"');
  if (campos.titulo !== topico.titulo) add('SLUG', 'titulo e ' + JSON.stringify(campos.titulo) + ', o TRACK pede ' + JSON.stringify(topico.titulo));
  const dir = path.basename(path.dirname(caminho));
  if (dir !== topico.nivel) add('SLUG', 'arquivo esta na pasta "' + dir + '" e o nivel e "' + topico.nivel + '"');

  // --- tamanho
  if (corpo.length < MIN_CORPO) add('TAMANHO', 'corpo curto demais: ' + corpo.length + ' chars (minimo ' + MIN_CORPO + ')');
  if (corpo.length > MAX_CORPO) add('TAMANHO', 'corpo longo demais: ' + corpo.length + ' chars (maximo ' + MAX_CORPO + ')');

  // --- HTML
  for (const p of problemasHtml(corpo)) problemas.push(p);

  // --- cobertura da materia
  const cobGeral = cobertura(termosExigiveis(topico.descricao), corpo);
  if (cobGeral.frac < COBERTURA_MIN) {
    add('COBERTURA', 'cobre ' + Math.round(cobGeral.frac * 100) + '% dos ' + cobGeral.total +
      ' termos da descricao do TRACK (minimo ' + Math.round(COBERTURA_MIN * 100) + '%). Faltam: ' +
      cobGeral.faltando.slice(0, 12).join(', ') + (cobGeral.faltando.length > 12 ? ' ...' : ''));
  }

  // --- erro comum: precisa de secao propria E de cobertura DENTRO dela
  const mErro = topico.descricao.match(/ERROS?\s+COMU(M|NS):?(.*)$/is);
  if (mErro) {
    const semA = semAcento(corpo);
    const marca = semA.search(MARCA_ERROS);
    if (marca < 0) {
      add('ERRO_COMUM', 'o corpo nao tem secao de erros comuns (o TRACK manda ensinar: "' +
        mErro[2].trim().slice(0, 90) + '")');
    } else {
      const secao = corpo.slice(marca);
      const cobErro = cobertura(termosExigiveis(mErro[2]), secao);
      if (cobErro.frac < ERRO_COMUM_MIN) {
        add('ERRO_COMUM', 'a secao de erros cobre ' + Math.round(cobErro.frac * 100) + '% dos ' +
          cobErro.total + ' termos do ERRO COMUM do TRACK (minimo ' + Math.round(ERRO_COMUM_MIN * 100) +
          '%). Faltam: ' + cobErro.faltando.slice(0, 12).join(', '));
      }
    }
  }

  // --- idioma, derivado do LANG do fluxo
  const esperado = ctx.idioma[topico.nivel];
  if (!esperado) {
    add('IDIOMA', 'o LANG do fluxo nao tem diretiva para o nivel ' + topico.nivel);
  } else {
    const m = medeIdioma(corpo);
    if (m.total < MARCADORES_MIN) {
      add('IDIOMA', 'texto sem marcadores suficientes para julgar o idioma (' + m.total + ')');
    } else if (esperado === 'pt' && m.fracPt < IDIOMA_PT_MIN) {
      add('IDIOMA', 'o fluxo manda ' + topico.nivel + ' em PORTUGUES, e o corpo parece INGLES (' +
        Math.round(m.fracPt * 100) + '% de marcadores PT, minimo ' + Math.round(IDIOMA_PT_MIN * 100) + '%)');
    } else if (esperado === 'en' && m.fracPt > IDIOMA_PT_MAX) {
      add('IDIOMA', 'o fluxo manda ' + topico.nivel + ' INTEIRAMENTE em INGLES, e o corpo tem portugues (' +
        Math.round(m.fracPt * 100) + '% de marcadores PT, maximo ' + Math.round(IDIOMA_PT_MAX * 100) + '%)');
    }
  }

  // --- gabarito das questoes daquele topico
  const vazamentos = achaVazamentos(corpo, topico, ctx.questoes);
  const avisos = [];
  for (const v of vazamentos) {
    const onde = v.origem + ' (' + v.tipo + '): "' + v.trecho + '"';
    if (v.mandadoPeloTrack) avisos.push('a materia do TRACK ja manda ensinar o que a questao ' + onde + ' cobra');
    else add('GABARITO', 'entrega a resposta da questao ' + onde);
  }

  return { arquivo: rel, problemas: problemas, avisos: avisos, topico: topico, chars: corpo.length };
}

// ------------------------------------------------------------------ contexto e varredura

function contexto(caminhoFluxo) {
  const fluxo = caminhoFluxo || FLUXO_PADRAO;
  let topicos;
  if (fs.existsSync(DESTINO)) topicos = JSON.parse(fs.readFileSync(DESTINO, 'utf8')).topicos;
  else topicos = extrai(fluxo).topicos;
  if (!Array.isArray(topicos) || !topicos.length) {
    throw new Error('track.json sem topicos — rode `node conteudo/extrai_track.js`');
  }
  return {
    topicos: topicos, idioma: idiomaPorNivel(fluxo), diretiva: diretivaExplicacaoPorNivel(fluxo),
    questoes: carregaQuestoes(), fluxo: fluxo
  };
}

function listaMd(dir) {
  const achados = [];
  const anda = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) anda(p);
      else if (/\.md$/i.test(e.name)) achados.push(p);
    }
  };
  if (fs.existsSync(dir)) anda(dir);
  return achados.sort();
}

// True se o arquivo existe e passa em tudo. E o guard de retomada do gerador (T006):
// "existe" nao basta — um .md truncado por Ctrl-C existe e nao presta.
function arquivoValido(caminho, ctx) {
  if (!fs.existsSync(caminho)) return { ok: false, problemas: [{ codigo: 'AUSENTE', msg: 'nao existe' }] };
  const r = validaArquivo(caminho, ctx || contexto());
  return { ok: r.problemas.length === 0, problemas: r.problemas };
}

module.exports = {
  validaArquivo, arquivoValido, contexto, listaMd, idiomaPorNivel, classificaDiretiva,
  diretivaExplicacao, diretivaExplicacaoPorNivel,
  termosExigiveis, medeIdioma, separaFrontmatter, problemasHtml,
  achaVazamentos, fraseResolvida, fraseFonte, trechosDaQuestao, carregaQuestoes,
  DIR_CONTEUDO, MIN_CORPO, MAX_CORPO
};

// ------------------------------------------------------------------ CLI

if (require.main === module) {
  const argv = process.argv.slice(2);
  let dir = DIR_CONTEUDO, arquivo = null, fluxo = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dir') dir = path.resolve(argv[++i]);
    else if (argv[i] === '--arquivo') arquivo = path.resolve(argv[++i]);
    else if (argv[i] === '--fluxo') fluxo = path.resolve(argv[++i]);
    else { console.error('argumento desconhecido: ' + argv[i]); process.exit(2); }
  }

  let ctx;
  try { ctx = contexto(fluxo); }
  catch (e) { console.error('ERRO: ' + e.message); process.exit(2); }

  const idiomas = Object.keys(ctx.idioma).map((n) => n + '=' + ctx.idioma[n]).join(' ');
  console.log('fluxo:  ' + path.basename(ctx.fluxo));
  console.log('idioma (derivado do LANG do "Professor Engine"): ' + idiomas);

  const alvos = arquivo ? [arquivo] : listaMd(dir);
  console.log('arquivos: ' + alvos.length + (arquivo ? '' : ' em ' + path.relative(RAIZ, dir).replace(/\\/g, '/')));
  if (!alvos.length) {
    console.log('\nREPROVOU: nenhum .md para validar');
    process.exit(1);
  }

  let ruins = 0;
  for (const a of alvos) {
    const r = validaArquivo(a, ctx);
    if (!r.problemas.length) {
      console.log('  . ' + r.arquivo + '  (' + r.chars + ' chars, ' + ctx.idioma[r.topico.nivel] + ')');
      for (const a of (r.avisos || [])) console.log('      ~ AVISO: ' + a);
    } else {
      ruins++;
      console.log('  x ' + r.arquivo);
      for (const p of r.problemas) console.log('      [' + p.codigo + '] ' + p.msg);
      for (const a of (r.avisos || [])) console.log('      ~ AVISO: ' + a);
    }
  }
  console.log('\n' + (ruins
    ? 'REPROVOU: ' + ruins + ' de ' + alvos.length + ' arquivo(s) com problema'
    : 'PASSOU: ' + alvos.length + ' arquivo(s) validos'));
  process.exit(ruins ? 1 : 0);
}
