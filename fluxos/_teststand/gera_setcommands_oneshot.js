// Gera o workflow one-shot que registra o menu de comandos no Telegram.
// Saida: fluxos/IAChat_SetCommands_oneshot.json
//
// POR QUE UM GERADOR, E NAO O JSON NA MAO
// O JSON tem dois nos de codigo. Editar codigo dentro de string JSON na mao e
// exatamente como quebra de linha literal derrubou o "Mensagem Sistema" (X4) e
// o "Montar Nudge": o no fica no fluxo, parece certo e simplesmente nao executa.
// Aqui o codigo e montado como array + join("\n"), passa por checagem de
// sintaxe antes de gravar, e o JSON sai de JSON.stringify -- escape garantido.
//
// POR QUE O TOKEN VEM DE $env
// A credencial telegramApi do n8n nao tem bloco `authenticate` (so `test`), e o
// Telegram exige o token no CAMINHO da URL -- que nenhum injetor de auth do n8n
// reescreve. O no Telegram tambem nao expoe setMyCommands (0 de 66 propriedades).
// Entao a credencial existente nao da para reaproveitar. O token vem de
// $env.TELEGRAM_BOT_TOKEN no momento da execucao: nao entra neste arquivo, nao
// entra no JSON gerado e nao fica nos dados de execucao.
//
// Suba o n8n com a variavel na MESMA janela, junto com WEBHOOK_URL:
//   $env:TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
//
// USO
//   node fluxos/_teststand/gera_setcommands_oneshot.js
//
// Depois: importar o JSON pela UI do n8n. O workflow nasce em DRY-RUN (no
// "Modo", aplicar=false) -- so grava quando voce virar para true.
//
// Alternativa mais curta, mesmo resultado: set_telegram_commands.js, que faz a
// chamada direto por linha de comando. Se mexer nos comandos, mexa nos dois.

const fs = require('fs');
const path = require('path');

const SAIDA = path.join(__dirname, '..', 'IAChat_SetCommands_oneshot.json');

// Apenas os CANONICOS. O roteador aceita alias (/modo, /persona, /perfil,
// /ajuda, /pausarlembretes, /lembretes), mas registrar alias no menu so polui.
// Os comandos de dev (/reset, /resetfull) estao atras de DEV_COMMANDS=false e
// nao entram aqui.
//
// Os NOMES ficam sem acento porque a API so aceita [a-z0-9_] em command; a
// descricao, que e o que o usuario le no menu, vai acentuada.
const COMANDOS = [
  { command: 'start',      description: 'Começar ou reabrir o menu' },
  { command: 'menu',       description: 'Trocar entre Conversa e Professor' },
  { command: 'nivel',      description: 'Refazer o teste de nível' },
  { command: 'config',     description: 'Mudar a personalidade do tutor' },
  { command: 'interesses', description: 'Escolher seus temas de conversa' },
  { command: 'progresso',  description: 'Ver nível, XP e sequência' },
  { command: 'pausa',      description: 'Pausar o teste de nível' },
  { command: 'continuar',  description: 'Retomar o teste de nível' },
  { command: 'parar',      description: 'Desligar os lembretes' },
  { command: 'voltar',     description: 'Religar os lembretes' },
  { command: 'help',       description: 'Ver todos os comandos' },
];

const BASE = '=https://api.telegram.org/bot{{ $env.TELEGRAM_BOT_TOKEN }}';

const codeComparar = [
  '// Monta a lista canonica, valida contra as regras da API do Telegram e',
  '// compara com o que o bot tem hoje. Nao grava nada -- so decide.',
  'const COMANDOS = ' + JSON.stringify(COMANDOS, null, 2) + ';',
  '',
  'const RE_NOME = /^[a-z0-9_]{1,32}$/;',
  'const invalidos = COMANDOS.filter(',
  '  (c) => !RE_NOME.test(c.command) || !c.description || c.description.length > 256',
  ');',
  'if (invalidos.length) {',
  '  throw new Error("Comandos invalidos para a API: " + JSON.stringify(invalidos));',
  '}',
  'if (COMANDOS.length > 100) {',
  '  throw new Error("Mais de 100 comandos -- a API rejeita.");',
  '}',
  '',
  'const eu = $("Telegram getMe").first().json.result || {};',
  'const atuais = $("Telegram getMyCommands (antes)").first().json.result || [];',
  'const aplicar = $("Modo").first().json.aplicar === true;',
  '',
  'const fmt = (cs) => (cs.length ? cs.map((c) => "/" + c.command + " -- " + c.description) : ["(vazio)"]);',
  '',
  'return [{',
  '  json: {',
  '    bot: "@" + (eu.username || "?") + " (id " + (eu.id || "?") + ")",',
  '    aplicar: aplicar,',
  '    menu_atual: fmt(atuais),',
  '    menu_proposto: fmt(COMANDOS),',
  '    commands: COMANDOS,',
  '    aviso: aplicar',
  '      ? "APLICAR=true -- o proximo no grava de verdade."',
  '      : "DRY-RUN -- nada sera alterado. Vire aplicar=true no no Modo para gravar.",',
  '  },',
  '}];',
].join('\n');

const codeConferir = [
  '// Le de volta em vez de confiar no ok:true -- mesmo principio das outras',
  '// medicoes do projeto: verificar nas duas pontas.',
  'const esperados = $("Comparar").first().json.commands || [];',
  'const depois = $input.first().json.result || [];',
  '',
  'const faltando = esperados.filter((c) => !depois.some((d) => d.command === c.command));',
  'const sobrando = depois.filter((d) => !esperados.some((c) => c.command === d.command));',
  '',
  'if (faltando.length || sobrando.length) {',
  '  throw new Error(',
  '    "Menu divergente apos gravar. Faltando: " +',
  '      (faltando.map((c) => "/" + c.command).join(", ") || "-") +',
  '      " | Sobrando: " +',
  '      (sobrando.map((d) => "/" + d.command).join(", ") || "-")',
  '  );',
  '}',
  '',
  'return [{',
  '  json: {',
  '    status: "OK",',
  '    registrados: depois.length,',
  '    menu: depois.map((c) => "/" + c.command + " -- " + c.description),',
  '  },',
  '}];',
].join('\n');

// Checagem de sintaxe antes de gravar -- a convencao do projeto e nunca
// publicar codigo de no sem validar (ja subiu edicao quebrada por um "}").
for (const [nome, src] of [['Comparar', codeComparar], ['Conferir', codeConferir]]) {
  try {
    new Function(src);
  } catch (e) {
    console.error('SINTAXE INVALIDA no no ' + nome + ': ' + e.message);
    process.exit(1);
  }
}

const http = (name, id, pos, method, rota, extra) => ({
  id: id,
  name: name,
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.2,
  position: pos,
  parameters: Object.assign(
    { method: method, url: BASE + rota, options: { timeout: 15000 } },
    extra || {}
  ),
  notes: 'Token vem de $env.TELEGRAM_BOT_TOKEN -- nunca gravado neste JSON.',
});

const nodes = [
  {
    id: 'trigger',
    name: 'Executar manualmente',
    type: 'n8n-nodes-base.manualTrigger',
    typeVersion: 1,
    position: [-220, 300],
    parameters: {},
  },
  {
    id: 'modo',
    name: 'Modo',
    type: 'n8n-nodes-base.set',
    typeVersion: 3.4,
    position: [0, 300],
    parameters: {
      assignments: {
        assignments: [{ id: 'a1', name: 'aplicar', value: false, type: 'boolean' }],
      },
      options: {},
    },
    notes: 'DRY-RUN por padrao. Vire para true so quando for gravar de verdade.',
  },
  // getMe primeiro para ninguem registrar comandos no bot errado.
  http('Telegram getMe', 'getme', [220, 300], 'GET', '/getMe'),
  http('Telegram getMyCommands (antes)', 'getbefore', [440, 300], 'GET', '/getMyCommands'),
  {
    id: 'comparar',
    name: 'Comparar',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [660, 300],
    parameters: { jsCode: codeComparar },
  },
  {
    id: 'ifaplicar',
    name: 'Aplicar?',
    type: 'n8n-nodes-base.if',
    typeVersion: 2.2,
    position: [880, 300],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [
          {
            id: 'cond1',
            leftValue: '={{ $json.aplicar }}',
            rightValue: '',
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
        combinator: 'and',
      },
      options: {},
    },
  },
  http('Telegram setMyCommands', 'setcmds', [1100, 180], 'POST', '/setMyCommands', {
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={{ JSON.stringify({ commands: $json.commands }) }}',
  }),
  // Le de volta: ok:true nao e prova de que o menu ficou certo.
  http('Telegram getMyCommands (depois)', 'getafter', [1320, 180], 'GET', '/getMyCommands'),
  {
    id: 'conferir',
    name: 'Conferir',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1540, 180],
    parameters: { jsCode: codeConferir },
  },
  {
    id: 'dryrun',
    name: 'Dry-run (nada gravado)',
    type: 'n8n-nodes-base.noOp',
    typeVersion: 1,
    position: [1100, 420],
    parameters: {},
  },
];

const connections = {
  'Executar manualmente': { main: [[{ node: 'Modo', type: 'main', index: 0 }]] },
  Modo: { main: [[{ node: 'Telegram getMe', type: 'main', index: 0 }]] },
  'Telegram getMe': {
    main: [[{ node: 'Telegram getMyCommands (antes)', type: 'main', index: 0 }]],
  },
  'Telegram getMyCommands (antes)': { main: [[{ node: 'Comparar', type: 'main', index: 0 }]] },
  Comparar: { main: [[{ node: 'Aplicar?', type: 'main', index: 0 }]] },
  'Aplicar?': {
    main: [
      [{ node: 'Telegram setMyCommands', type: 'main', index: 0 }],
      [{ node: 'Dry-run (nada gravado)', type: 'main', index: 0 }],
    ],
  },
  'Telegram setMyCommands': {
    main: [[{ node: 'Telegram getMyCommands (depois)', type: 'main', index: 0 }]],
  },
  'Telegram getMyCommands (depois)': { main: [[{ node: 'Conferir', type: 'main', index: 0 }]] },
};

const wf = {
  name: 'IAChat_SetCommands_oneshot',
  nodes: nodes,
  connections: connections,
  settings: { executionOrder: 'v1' },
};

// Rede de seguranca: se um token vazar para dentro do JSON por descuido numa
// edicao futura, o gerador para aqui em vez de gravar.
const txt = JSON.stringify(wf, null, 2) + '\n';
if (/\d{6,}:[A-Za-z0-9_-]{30,}/.test(txt)) {
  console.error('ABORTADO: o JSON gerado parece conter um token de bot.');
  process.exit(1);
}

fs.writeFileSync(SAIDA, txt, 'utf8');
console.log('gravado: ' + SAIDA + ' (' + nodes.length + ' nos, ' + COMANDOS.length + ' comandos)');
