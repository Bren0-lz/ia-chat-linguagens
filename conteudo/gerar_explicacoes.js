// Gera as explicacoes pre-geradas do MODO PROFESSOR, uma por topico do TRACK,
// chamando gemini-2.5-pro no Vertex AI. Grava um .md por topico em
// conteudo/explicacoes/<NIVEL>/<NN>-<slug>.md com frontmatter.
//
// Uso:
//   node conteudo/gerar_explicacoes.js --dry-run          # lista os 60 caminhos, SEM rede
//   node conteudo/gerar_explicacoes.js --apenas A1/01     # gera so um topico (piloto)
//   node conteudo/gerar_explicacoes.js                    # gera os que faltam (T006)
//
// RETOMAVEL: nao regera .md que ja existe. Para refazer, apague o arquivo.
//
// Autenticacao: ADC via `gcloud auth print-access-token` (projeto agent-hackton).
// A credencial `Google Service Account` do n8n vive no store de credenciais e a API
// publica nao a entrega (405) — por isso o caminho aqui e o ADC local. O token dura
// ~1h; a geracao dos 60 passa disso, entao renovamos ao receber 401.
//
// ARMADILHA (handoff sec.6 nº1): resposta vazia NAO e aprovacao. O gemini-2.5-pro e um
// modelo de raciocinio: com maxOutputTokens apertado ele gasta tudo em "pensamento" e
// devolve texto VAZIO com finishReason MAX_TOKENS. Aqui qualquer finishReason != STOP,
// ou corpo vazio/curto demais, e ERRO — nunca vira arquivo.

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');
const { extrai, DESTINO } = require('./extrai_track.js');

const RAIZ = path.join(__dirname, '..');
const DIR_SAIDA = path.join(__dirname, 'explicacoes');

const PROJETO = 'agent-hackton';
const LOCAL = 'global';
const MODELO = 'gemini-2.5-pro';
const ENDPOINT = 'https://aiplatform.googleapis.com/v1/projects/' + PROJETO +
  '/locations/' + LOCAL + '/publishers/google/models/' + MODELO + ':generateContent';

// Orcamento folgado de propriedade: o "pensamento" do 2.5-pro consome a maior parte.
const MAX_OUTPUT_TOKENS = 12000;
const MIN_CARACTERES = 500;   // abaixo disso nao e explicacao, e um toco
const MAX_CARACTERES = 3000;  // o envio ao Telegram trunca; ~2500 e o alvo

// Contrato de idioma por nivel — ESPELHA `const LANG` do no "Professor Engine"
// (fluxos/IAChat_Telegram_v8.json). A1/A2 explicam em portugues; B1+ explicam em ingles.
// Se o LANG do fluxo mudar, mude aqui tambem.
const LANG = {
  A1: 'Escreva a explicacao em PORTUGUES simples (aluno brasileiro iniciante), sempre com o termo em ingles seguido da traducao entre parenteses.',
  A2: 'Escreva a explicacao em PORTUGUES simples, com os exemplos em ingles seguidos de traducao.',
  B1: 'Write the whole explanation in clear, simple ENGLISH. No Portuguese at all.',
  B2: 'Write the whole explanation in natural ENGLISH. No Portuguese at all.',
  C1: 'Write the whole explanation in sophisticated, concise ENGLISH. No Portuguese at all.',
  C2: 'Write the whole explanation in native-level, concise ENGLISH. No Portuguese at all.'
};

// Tags que o Telegram entende em parse_mode=HTML e que autorizamos no corpo.
const TAGS_OK = ['b', 'i'];

// ---------------------------------------------------------------- TRACK

function carregaTopicos() {
  let dados;
  if (fs.existsSync(DESTINO)) {
    dados = JSON.parse(fs.readFileSync(DESTINO, 'utf8'));
  } else {
    dados = extrai(); // projecao do fluxo, se o track.json ainda nao existe
  }
  if (!Array.isArray(dados.topicos) || !dados.topicos.length) {
    throw new Error('track.json sem topicos — rode `node conteudo/extrai_track.js`');
  }
  return dados.topicos;
}

function caminhoDe(t) {
  const nn = String(t.ordem).padStart(2, '0');
  return path.join(DIR_SAIDA, t.nivel, nn + '-' + t.slug + '.md');
}

function rotuloDe(t) {
  return t.nivel + '/' + String(t.ordem).padStart(2, '0');
}

// ---------------------------------------------------------------- prompt

// O prompt e o coracao da tarefa. A regua vem do handoff sec.1: "a explicacao de um topico
// tem de bastar para o aluno acertar as questoes dele sozinho, sem buscar fora".
function montaPrompt(t, total) {
  return [
    'Voce e o IAChat, um professor de ingles paciente e muito didatico, escrevendo a EXPLICACAO',
    'oficial de um topico da trilha do MODO PROFESSOR. Este texto sera guardado e servido a TODOS',
    'os alunos daquele nivel — escreva-o como material definitivo, nao como resposta de chat.',
    '',
    'ALUNO: brasileiro, adulto, aprendendo ingles, nivel ' + t.nivel + '.',
    'TOPICO (' + t.ordem + '/' + total + ' do nivel ' + t.nivel + '): ' + t.titulo,
    'MATERIA A ENSINAR (cobrir TUDO isto, sem pular nada):',
    t.descricao,
    '',
    'IDIOMA: ' + LANG[t.nivel],
    'NIVEL: fique dentro do que se aprende em ' + t.nivel + '. Nao use nem pressuponha estrutura,',
    'tempo verbal ou vocabulario de niveis acima — se precisar de um termo mais avancado, explique-o.',
    '',
    'PREMISSA: assuma que o aluno NUNCA teve contato com este assunto na vida. Ensine do zero.',
    'OBJETIVO (a regua): ao terminar de ler, o aluno tem de conseguir ACERTAR SOZINHO as questoes',
    'deste topico, sem procurar nada fora. A explicacao precisa ser AUTOSSUFICIENTE: toda forma,',
    'regra e excecao necessaria aparece aqui, escrita, "bem mastigada". Nada implicito.',
    '',
    'ESTRUTURA (nesta ordem, com uma linha em branco entre as partes):',
    '1) O QUE E E QUANDO USAR — 2 a 3 linhas, em linguagem de gente.',
    '2) AS FORMAS — a lista/tabela COMPLETA em linhas curtas (a conjugacao inteira, todas as',
    '   palavras da materia, a estrutura afirmativa/negativa/interrogativa quando fizer sentido).',
    '   Esta e a parte mais importante: nada de "entre outros" nem reticencias.',
    '3) EXEMPLOS — pelo menos 4 frases completas, cada uma com a traducao.',
    '4) ERROS COMUNS — comece pelo ERRO COMUM citado na materia acima. Mostre a forma errada',
    '   e a forma certa lado a lado, e explique por que.',
    '5) RESUMO — uma unica linha que o aluno possa decorar.',
    '',
    'FORMATO (o texto vai para o Telegram com parse_mode=HTML):',
    '- Use as marcacoes <b>negrito</b> e <i>italico</i> e mais NENHUMA outra tag.',
    '- NUNCA use markdown: nada de *, **, _, #, `, ``` ou tabelas com |.',
    '- NUNCA use os caracteres < ou > soltos, nem o caractere & (quebram o HTML do Telegram).',
    '  Nada de setinhas "->": para corrigir, escreva no formato',
    '  errado: "I has a dog" ... o certo e: "I have a dog".',
    '  Onde precisaria de "e comercial", escreva a palavra "e".',
    '- Marcadores de lista com o hifen "-" no comeco da linha.',
    '- No maximo 1 ou 2 emojis no texto inteiro, e so se ajudarem.',
    '- Nao escreva titulo, frontmatter, saudacao inicial nem despedida: comece direto pela parte 1.',
    '- Nao numere as partes com "1)"; use um rotulo curto em negrito para cada parte.',
    '',
    'TAMANHO: entre 1200 e 2400 caracteres. Linhas curtas. Denso em conteudo, zero enrolacao.',
    'NAO proponha exercicios nem faca perguntas ao aluno: as questoes vem depois, de outro lugar.'
  ].join('\n');
}

// ---------------------------------------------------------------- Vertex

function novoToken() {
  // No Windows o gcloud e um .cmd, e o Node >=20 recusa spawn direto de .cmd (EINVAL):
  // passamos pelo cmd.exe. Nenhum argumento vem do usuario, entao nao ha injecao aqui.
  const bin = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'gcloud';
  const args = process.platform === 'win32'
    ? ['/c', 'gcloud', 'auth', 'print-access-token']
    : ['auth', 'print-access-token'];
  try {
    return execFileSync(bin, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    throw new Error('nao consegui obter token do gcloud (ADC). Rode `gcloud auth login`. ' +
      String(e.message).split('\n')[0]);
  }
}

function postJson(url, token, corpo) {
  return new Promise((resolve, reject) => {
    const dados = Buffer.from(JSON.stringify(corpo), 'utf8');
    const u = new URL(url);
    const req = https.request({
      method: 'POST',
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': dados.length
      }
    }, (res) => {
      let buf = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { buf += c; });
      res.on('end', () => resolve({ status: res.statusCode, corpo: buf }));
    });
    req.on('error', reject);
    req.write(dados);
    req.end();
  });
}

// Extrai o texto e EXIGE finishReason STOP. Qualquer outra coisa e falha ruidosa.
function extraiTexto(resposta) {
  const cand = (resposta.candidates || [])[0];
  if (!cand) {
    const bloqueio = resposta.promptFeedback && resposta.promptFeedback.blockReason;
    throw new Error('sem candidates' + (bloqueio ? ' (blockReason=' + bloqueio + ')' : ''));
  }
  const fr = cand.finishReason;
  if (fr && fr !== 'STOP') {
    throw new Error('finishReason=' + fr + ' — resposta truncada ou barrada, NAO e conteudo' +
      (fr === 'MAX_TOKENS' ? ' (aumente MAX_OUTPUT_TOKENS)' : ''));
  }
  const partes = (cand.content && cand.content.parts) || [];
  const texto = partes
    .filter((p) => typeof p.text === 'string' && !p.thought)
    .map((p) => p.text)
    .join('')
    .trim();
  if (!texto) throw new Error('finishReason=STOP mas texto VAZIO (so pensamento?)');
  return texto;
}

const estado = { token: null };

async function chamaModelo(prompt) {
  const corpo = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: MAX_OUTPUT_TOKENS }
  };
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    if (!estado.token) estado.token = novoToken();
    const r = await postJson(ENDPOINT, estado.token, corpo);
    if (r.status === 401 || r.status === 403) {
      estado.token = null; // token expirou (dura ~1h; os 60 do T006 passam disso)
      if (tentativa < 3) continue;
      throw new Error('HTTP ' + r.status + ' mesmo apos renovar o token: ' + r.corpo.slice(0, 300));
    }
    if (r.status === 429 || r.status >= 500) {
      if (tentativa < 3) { await new Promise((s) => setTimeout(s, 4000 * tentativa)); continue; }
      throw new Error('HTTP ' + r.status + ': ' + r.corpo.slice(0, 300));
    }
    if (r.status !== 200) throw new Error('HTTP ' + r.status + ': ' + r.corpo.slice(0, 500));
    let json;
    try { json = JSON.parse(r.corpo); } catch (e) { throw new Error('resposta nao e JSON: ' + r.corpo.slice(0, 200)); }
    return extraiTexto(json);
  }
  throw new Error('esgotou as tentativas');
}

// ---------------------------------------------------------------- corpo e arquivo

// Barreira contra o .md silenciosamente ruim. O validador formal e o T005; isto aqui
// so impede que lixo obvio chegue a virar arquivo.
function confereCorpo(texto) {
  const problemas = [];
  if (texto.length < MIN_CARACTERES) problemas.push('curto demais (' + texto.length + ' chars)');
  if (texto.length > MAX_CARACTERES) problemas.push('longo demais (' + texto.length + ' chars)');
  if (/&/.test(texto)) problemas.push('contem & (quebra o parse HTML do Telegram)');
  if (/^\s*```|\*\*|^\s*#{1,6}\s/m.test(texto)) problemas.push('contem markdown (``` ** ou #)');
  const tags = texto.match(/<\/?([a-zA-Z0-9]*)[^>]*>/g) || [];
  for (const tag of tags) {
    const nome = (tag.match(/^<\/?([a-zA-Z0-9]+)/) || [])[1];
    if (!nome || TAGS_OK.indexOf(nome.toLowerCase()) < 0) problemas.push('tag HTML nao permitida: ' + tag);
  }
  const soltos = texto.replace(/<\/?(b|i)>/g, '');
  if (/[<>]/.test(soltos)) problemas.push('contem < ou > solto');
  for (const t of TAGS_OK) {
    const ab = (texto.match(new RegExp('<' + t + '>', 'g')) || []).length;
    const fe = (texto.match(new RegExp('</' + t + '>', 'g')) || []).length;
    if (ab !== fe) problemas.push('tag <' + t + '> desbalanceada (' + ab + ' aberta, ' + fe + ' fechada)');
  }
  return problemas;
}

function escapaYaml(s) {
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function montaMd(t, corpo, data) {
  return [
    '---',
    'nivel: ' + t.nivel,
    'ordem: ' + t.ordem,
    'slug: ' + t.slug,
    'titulo: ' + escapaYaml(t.titulo),
    'modelo: ' + MODELO,
    'data: ' + data,
    '---',
    '',
    corpo,
    ''
  ].join('\n');
}

// ---------------------------------------------------------------- CLI

function parseArgs(argv) {
  const opt = { dryRun: false, apenas: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') opt.dryRun = true;
    else if (a === '--apenas') opt.apenas = argv[++i];
    else if (a.indexOf('--apenas=') === 0) opt.apenas = a.slice('--apenas='.length);
    else throw new Error('argumento desconhecido: ' + a);
  }
  if (opt.apenas && !/^[A-C][12]\/\d{1,2}$/.test(opt.apenas)) {
    throw new Error('--apenas espera NIVEL/ORDEM, ex.: A1/01');
  }
  return opt;
}

function filtra(topicos, apenas) {
  if (!apenas) return topicos;
  const [nivel, ordem] = apenas.split('/');
  const sel = topicos.filter((t) => t.nivel === nivel && t.ordem === Number(ordem));
  if (!sel.length) throw new Error('topico ' + apenas + ' nao existe no TRACK');
  return sel;
}

async function main() {
  const opt = parseArgs(process.argv.slice(2));
  const todos = carregaTopicos();
  const porNivel = {};
  todos.forEach((t) => { porNivel[t.nivel] = (porNivel[t.nivel] || 0) + 1; });
  const alvo = filtra(todos, opt.apenas);

  if (opt.dryRun) {
    console.log('DRY-RUN — nenhuma chamada de rede. Modelo que seria usado: ' + MODELO);
    alvo.forEach((t) => {
      const p = caminhoDe(t);
      const marca = fs.existsSync(p) ? 'JA EXISTE' : 'geraria  ';
      console.log(marca + '  ' + path.relative(RAIZ, p).replace(/\\/g, '/'));
    });
    console.log('total: ' + alvo.length + ' topicos');
    return 0;
  }

  let gerados = 0, pulados = 0, falhas = 0;
  for (const t of alvo) {
    const destino = caminhoDe(t);
    const rel = path.relative(RAIZ, destino).replace(/\\/g, '/');
    if (fs.existsSync(destino)) {           // retomavel: nao regera
      console.log('PULA   ' + rotuloDe(t) + '  ' + rel + ' (ja existe)');
      pulados++;
      continue;
    }
    process.stdout.write('GERA   ' + rotuloDe(t) + '  ' + t.titulo + ' ... ');
    try {
      const corpo = await chamaModelo(montaPrompt(t, porNivel[t.nivel]));
      const problemas = confereCorpo(corpo);
      if (problemas.length) throw new Error(problemas.join('; '));
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      fs.writeFileSync(destino, montaMd(t, corpo, new Date().toISOString().slice(0, 10)), 'utf8');
      console.log(corpo.length + ' chars -> ' + rel);
      gerados++;
    } catch (e) {
      console.log('FALHOU: ' + e.message);
      falhas++;
    }
  }
  console.log('gerados: ' + gerados + ' · pulados: ' + pulados + ' · falhas: ' + falhas);
  return falhas ? 1 : 0;
}

module.exports = { caminhoDe, montaPrompt, confereCorpo, montaMd, LANG, MODELO, DIR_SAIDA };

if (require.main === module) {
  main().then((c) => process.exit(c)).catch((e) => {
    console.error('ERRO: ' + e.message);
    process.exit(1);
  });
}
