// O CORTE: tira o v7.4 do Telegram e poe o fluxo do EVENTO no lugar. E a volta.
//
// Os tres fluxos dividem o mesmo `webhookId` (telegram-iachat-webhook): so UM pode ter o
// `Gatilho Telegram` habilitado. Trocar quem atende o bot e uma operacao de dois passos que
// nao pode ficar pela metade — se parar no meio, NINGUEM atende.
//
//   node corta_para_evento.js            -> corta para o EVENTO
//   node corta_para_evento.js --voltar   -> devolve o bot ao v7.4
//
// O que o script garante:
//   1. so age depois de fotografar o estado atual e imprimi-lo;
//   2. em QUALQUER falha, faz rollback automatico para o estado fotografado;
//   3. no fim, exige que exatamente UM workflow esteja com o gatilho habilitado e ativo —
//      senao grita e sai 1;
//   4. nao manda mensagem no Telegram (isso e do Breno): a confirmacao final e humana.
//
// Handoff §7: ativacao via API que FALHA desativa o workflow. Por isso o rollback.
//
// ARMADILHA DESCOBERTA NO PRIMEIRO CORTE (14/09): o n8n RECUSA SALVAR (PUT) um workflow ATIVO
// cujo webhook conflita — "There is a conflict with one of the webhooks", HTTP 400. Como os tres
// fluxos dividem o webhookId, quem vai RECEBER o gatilho precisa estar DESATIVADO na hora do PUT.
// Ordem correta: desativa quem sai -> desativa quem entra -> PUT com o gatilho ligado -> ativa.
const fs = require('fs');
const path = require('path');

const V74 = '9MA0o1XJjD33BnKc';
const EVENTO_NOME = 'IAChat_Telegram_evento';
const ARQ_EVENTO = path.join(__dirname, '..', 'IAChat_Telegram_evento.json');
const VOLTAR = process.argv.includes('--voltar');

const BASE = 'http://localhost:5678';
const API = BASE + '/api/v1';
function fromDotEnv(name) {
  try {
    const txt = fs.readFileSync(path.join(__dirname, '..', '..', '.env'), 'utf8');
    const m = txt.match(new RegExp('^' + name + '=(.+)$', 'm'));
    return m ? m[1].trim() : '';
  } catch (e) { return ''; }
}
const KEY = process.env.N8N_API_KEY || fromDotEnv('N8N_API_KEY');
if (!KEY) { console.error('N8N_API_KEY ausente.'); process.exit(1); }

async function api(metodo, rota, corpo) {
  const r = await fetch(API + rota, {
    method: metodo,
    headers: { 'X-N8N-API-KEY': KEY, 'content-type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const txt = await r.text();
  let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
  return { status: r.status, ok: r.ok, json: j, txt };
}
const gatilhoDe = (w) => (w.nodes || []).find((n) => n.name === 'Gatilho Telegram');

async function foto(id) {
  const r = await api('GET', '/workflows/' + id);
  if (!r.ok) return null;
  const g = gatilhoDe(r.json);
  return { id, nome: r.json.name, active: r.json.active, gatilho: !!(g && g.disabled !== true) };
}
async function publica(id, nodes, connections, settings, nome) {
  return api('PUT', '/workflows/' + id, { name: nome, nodes, connections, settings: settings || {} });
}

(async () => {
  // --- acha o evento -------------------------------------------------------
  const lista = await api('GET', '/workflows?limit=100');
  if (!lista.ok) { console.error('nao consegui listar workflows'); process.exit(1); }
  const achados = (lista.json.data || []).filter((w) => w.name === EVENTO_NOME);
  if (achados.length !== 1) {
    console.error('RECUSADO: esperava 1 workflow "' + EVENTO_NOME + '", achei ' + achados.length);
    process.exit(1);
  }
  const EVENTO = achados[0].id;

  // --- 1. fotografa --------------------------------------------------------
  const antes74 = await foto(V74);
  const antesEv = await foto(EVENTO);
  console.log('ANTES:');
  console.log('  v7.4    active=' + antes74.active + ' gatilho=' + (antes74.gatilho ? 'LIGADO' : 'desligado'));
  console.log('  evento  active=' + antesEv.active + ' gatilho=' + (antesEv.gatilho ? 'LIGADO' : 'desligado'));

  const fluxo = JSON.parse(fs.readFileSync(ARQ_EVENTO, 'utf8'));
  const nodesLigado = JSON.parse(JSON.stringify(fluxo.nodes));
  const gLig = nodesLigado.find((n) => n.name === 'Gatilho Telegram');
  delete gLig.disabled;                       // ligado: e o bot de verdade
  const nodesDesligado = JSON.parse(JSON.stringify(fluxo.nodes));
  nodesDesligado.find((n) => n.name === 'Gatilho Telegram').disabled = true;

  const quemSai = VOLTAR ? EVENTO : V74;
  const quemEntra = VOLTAR ? V74 : EVENTO;
  const rotuloSai = VOLTAR ? 'evento' : 'v7.4';
  const rotuloEntra = VOLTAR ? 'v7.4' : 'evento';
  console.log('\nCORTE: ' + rotuloSai + ' SAI do Telegram, ' + rotuloEntra + ' ENTRA\n');

  async function rollback(motivo) {
    console.error('\n!!! ROLLBACK: ' + motivo);
    if (VOLTAR) {
      await api('POST', '/workflows/' + V74 + '/deactivate');
      await publica(EVENTO, nodesLigado, fluxo.connections, fluxo.settings, fluxo.name);
      await api('POST', '/workflows/' + EVENTO + '/activate');
    } else {
      await publica(EVENTO, nodesDesligado, fluxo.connections, fluxo.settings, fluxo.name);
      await api('POST', '/workflows/' + EVENTO + '/activate');
      await api('POST', '/workflows/' + V74 + '/activate');
    }
    const d74 = await foto(V74); const dEv = await foto(EVENTO);
    console.error('  v7.4   active=' + d74.active + ' gatilho=' + (d74.gatilho ? 'LIGADO' : 'desligado'));
    console.error('  evento active=' + dEv.active + ' gatilho=' + (dEv.gatilho ? 'LIGADO' : 'desligado'));
    console.error('  CONFIRA NO TELEGRAM antes de qualquer outra coisa.');
    process.exit(1);
  }

  // --- 2. quem sai, sai ----------------------------------------------------
  const off = await api('POST', '/workflows/' + quemSai + '/deactivate');
  if (!off.ok) { console.error('falhou desativar ' + rotuloSai + ' (HTTP ' + off.status + ')'); process.exit(1); }
  console.log('  ' + rotuloSai + ' desativado');

  // --- 3. quem entra, entra ------------------------------------------------
  const offEntra = await api('POST', '/workflows/' + quemEntra + '/deactivate');
  if (!offEntra.ok && offEntra.status !== 400) console.log('  (aviso: deactivate de ' + rotuloEntra + ' devolveu ' + offEntra.status + ')');
  console.log('  ' + rotuloEntra + ' desativado para poder ser salvo (webhook em conflito)');

  if (VOLTAR) {
    const put = await publica(EVENTO, nodesDesligado, fluxo.connections, fluxo.settings, fluxo.name);
    if (!put.ok) return rollback('nao consegui desligar o gatilho do evento');
    const act = await api('POST', '/workflows/' + EVENTO + '/activate');
    if (!act.ok) console.error('  AVISO: evento nao reativou em modo ensaio (HTTP ' + act.status + ')');
    const on = await api('POST', '/workflows/' + V74 + '/activate');
    if (!on.ok) return rollback('o v7.4 NAO ativou (HTTP ' + on.status + '): ' + on.txt.slice(0, 200));
  } else {
    const put = await publica(EVENTO, nodesLigado, fluxo.connections, fluxo.settings, fluxo.name);
    if (!put.ok) return rollback('nao consegui publicar o evento com o gatilho ligado');
    const act = await api('POST', '/workflows/' + EVENTO + '/activate');
    if (!act.ok) return rollback('o evento NAO ativou (HTTP ' + act.status + '): ' + act.txt.slice(0, 200));
  }
  console.log('  ' + rotuloEntra + ' publicado e ativado');

  // --- 4. exatamente UM com o gatilho ligado -------------------------------
  const d74 = await foto(V74); const dEv = await foto(EVENTO);
  console.log('\nDEPOIS:');
  console.log('  v7.4    active=' + d74.active + ' gatilho=' + (d74.gatilho ? 'LIGADO' : 'desligado'));
  console.log('  evento  active=' + dEv.active + ' gatilho=' + (dEv.gatilho ? 'LIGADO' : 'desligado'));

  const atendendo = [['v7.4', d74], ['evento', dEv]].filter((p) => p[1].active && p[1].gatilho);
  if (atendendo.length !== 1) return rollback('esperava EXATAMENTE 1 atendendo o Telegram, achei ' + atendendo.length);
  if (atendendo[0][0] !== rotuloEntra) return rollback('quem ficou atendendo foi ' + atendendo[0][0] + ', nao ' + rotuloEntra);

  console.log('\nPASSOU: quem atende o Telegram agora e o ' + rotuloEntra + '.');
  console.log('CONFIRME NO TELEGRAM (isso o script nao faz): mande /start no bot e veja se a tela'
    + (VOLTAR ? ' de nivelamento (10 questoes) voltou.' : ' de escolha de nivel aparece, sem prometer teste.'));
  console.log('Para desfazer:  node fluxos/_teststand/corta_para_evento.js' + (VOLTAR ? '' : ' --voltar'));
  process.exit(0);
})().catch((e) => { console.error('ERRO inesperado: ' + (e && e.message ? e.message : e)); process.exit(1); });
