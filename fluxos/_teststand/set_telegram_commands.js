// Registra o menu de comandos do bot no Telegram (setMyCommands).
//
// POR QUE ESTE SCRIPT EXISTE
// Nenhum fluxo chama setMyCommands, entao o menu "/" do Telegram esta vazio: o
// usuario so descobre um comando se digitar /help. O Roteador Mestre trata 19
// comandos, o /help lista 9 e o Telegram mostra 0.
//
// POR QUE NAO E UM NO DO n8n
// O no Telegram do n8n nao expoe a operacao (66 propriedades, nenhuma de
// comandos), e a credencial telegramApi nao tem bloco `authenticate` -- so um
// `test`. Como o Telegram exige o token no CAMINHO da URL, o HTTP Request com
// predefinedCredentialType tambem nao resolve. Por isso: script avulso.
//
// A chamada e UNICA e persiste no lado do Telegram. Nao precisa rodar a cada
// deploy -- so quando a lista de comandos mudar.
//
// USO
//   node set_telegram_commands.js            -> dry-run (mostra atual x proposto)
//   node set_telegram_commands.js --apply    -> grava de verdade
//
// O token vem de TELEGRAM_BOT_TOKEN (variavel de ambiente ou .env da raiz).
// Pegue com o @BotFather. Nunca commite o token: o .env esta no .gitignore.

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN ausente.');
  console.error('Defina no .env da raiz:  TELEGRAM_BOT_TOKEN=123456:ABC-DEF...');
  console.error('ou inline:  TELEGRAM_BOT_TOKEN=... node set_telegram_commands.js');
  process.exit(1);
}

const API = 'https://api.telegram.org/bot' + TOKEN;
const APLICAR = process.argv.includes('--apply');

// Apenas os CANONICOS. O roteador aceita alias (/modo, /persona, /perfil,
// /ajuda, /pausarlembretes, /lembretes), mas registrar alias no menu so polui a
// lista que o usuario ve. Os comandos de dev (/reset, /resetfull) estao atras de
// DEV_COMMANDS=false e nao entram aqui.
//
// Restricoes da API, todas folgadas neste conjunto: nome aceita apenas
// [a-z0-9_], 1-32 chars (por isso /nivel sem acento); descricao ate 256 chars;
// ate 100 comandos.
const COMANDOS = [
  { command: 'start',      description: 'Comecar ou reabrir o menu' },
  { command: 'menu',       description: 'Trocar entre Conversa e Professor' },
  { command: 'nivel',      description: 'Refazer o teste de nivel' },
  { command: 'config',     description: 'Mudar a personalidade do tutor' },
  { command: 'interesses', description: 'Escolher seus temas de conversa' },
  { command: 'progresso',  description: 'Ver nivel, XP e sequencia' },
  { command: 'pausa',      description: 'Pausar o teste de nivel' },
  { command: 'continuar',  description: 'Retomar o teste de nivel' },
  { command: 'parar',      description: 'Desligar os lembretes' },
  { command: 'voltar',     description: 'Religar os lembretes' },
  { command: 'help',       description: 'Ver todos os comandos' },
];

// Validacao local antes de falar com a API: erro daqui e mais legivel que o 400.
const RE_NOME = /^[a-z0-9_]{1,32}$/;
const invalidos = COMANDOS.filter(
  (c) => !RE_NOME.test(c.command) || !c.description || c.description.length > 256
);
if (invalidos.length) {
  console.error('Comandos invalidos para a API do Telegram:');
  invalidos.forEach((c) => console.error('  ' + JSON.stringify(c)));
  process.exit(1);
}
if (COMANDOS.length > 100) {
  console.error('Mais de 100 comandos -- a API rejeita.');
  process.exit(1);
}

async function chamar(metodo, corpo) {
  const r = await fetch(API + '/' + metodo, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(corpo || {}),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) {
    throw new Error(metodo + ' falhou: ' + (j.description || ('HTTP ' + r.status)));
  }
  return j.result;
}

function listar(cmds) {
  if (!cmds || !cmds.length) return '   (vazio)';
  return cmds.map((c) => '   /' + c.command.padEnd(12) + c.description).join('\n');
}

(async () => {
  // Confirma que o token e valido e mostra de qual bot estamos falando, para
  // ninguem registrar comandos no bot errado.
  const eu = await chamar('getMe');
  console.log('Bot: @' + eu.username + ' (' + eu.first_name + ', id ' + eu.id + ')\n');

  const atuais = await chamar('getMyCommands');
  console.log('MENU ATUAL (' + (atuais ? atuais.length : 0) + '):');
  console.log(listar(atuais));

  console.log('\nMENU PROPOSTO (' + COMANDOS.length + '):');
  console.log(listar(COMANDOS));

  if (!APLICAR) {
    console.log('\nDRY-RUN -- nada foi alterado. Para gravar: node set_telegram_commands.js --apply');
    return;
  }

  await chamar('setMyCommands', { commands: COMANDOS });

  // Le de volta em vez de confiar no ok:true -- o mesmo principio das outras
  // medicoes: verificar nas duas pontas.
  const depois = await chamar('getMyCommands');
  console.log('\nAPLICADO. Menu agora (' + depois.length + '):');
  console.log(listar(depois));

  const faltando = COMANDOS.filter((c) => !depois.some((d) => d.command === c.command));
  if (faltando.length) {
    console.error('\nATENCAO: nao voltaram na leitura: ' + faltando.map((c) => '/' + c.command).join(', '));
    process.exit(1);
  }
  console.log('\nConferido: os ' + COMANDOS.length + ' comandos estao registrados.');
})().catch((e) => {
  console.error('ERRO: ' + e.message);
  process.exit(1);
});
