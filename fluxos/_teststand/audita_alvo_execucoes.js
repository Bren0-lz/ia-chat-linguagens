// AUDITORIA — em que workflow cairam as execucoes de uma janela/faixa de user_id.
//
// Prova exigida pelo T014: nenhuma execucao da bateria pode ter caido no v7.4
// (9MA0o1XJjD33BnKc), que atende usuarios reais. A API do n8n PAGINA (nextCursor):
// ler so a primeira pagina ja levou este projeto a uma conclusao errada (handoff no 16).
//
//   node fluxos/_teststand/audita_alvo_execucoes.js <idMinimo> [uidMin] [uidMax]
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const BASE = process.env.N8N_URL || 'http://localhost:5678';
const API = BASE + '/api/v1';
const KEY = process.env.N8N_API_KEY;

const V74 = '9MA0o1XJjD33BnKc';
const V8 = 'PbwEf7L9xEXhJaCg';

const idMin = Number(process.argv[2] || 0);
const uidMin = Number(process.argv[3] || 990000000);
const uidMax = Number(process.argv[4] || 999999999);

async function jget(url) {
  const r = await fetch(url, { headers: { 'X-N8N-API-KEY': KEY } });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' em ' + url);
  return r.json();
}

(async () => {
  // 1. Percorre TODAS as paginas ate passar do idMin.
  const execs = [];
  let cursor = null, paginas = 0;
  while (true) {
    const u = API + '/executions?limit=250' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : '');
    const j = await jget(u);
    paginas++;
    for (const e of j.data || []) execs.push(e);
    const menor = Math.min(...(j.data || []).map(e => Number(e.id)));
    if (!j.nextCursor || !j.data || !j.data.length || menor < idMin) break;
    cursor = j.nextCursor;
  }
  const janela = execs.filter(e => Number(e.id) >= idMin);
  console.log('paginas lidas: ' + paginas + ' | execucoes vistas: ' + execs.length + ' | na janela (id>=' + idMin + '): ' + janela.length);

  const porWf = {};
  for (const e of janela) porWf[e.workflowId] = (porWf[e.workflowId] || 0) + 1;
  console.log('por workflow na janela:');
  for (const [wf, n] of Object.entries(porWf)) {
    const rot = wf === V74 ? 'v7.4 (BOT REAL)' : wf === V8 ? 'v8' : 'outro';
    console.log('  ' + wf + '  ' + rot + '  ' + n);
  }

  // 2. Para cada execucao da janela, extrai o user_id do corpo do TEST Ingress /
  //    Gatilho Telegram e confere que os IDs de teste sao TODOS do v8.
  let comUid = 0, foraDoV8 = [], noV74 = [];
  for (const e of janela) {
    let d;
    try { d = await jget(API + '/executions/' + e.id + '?includeData=true'); } catch (err) { continue; }
    const rd = (d.data && d.data.resultData && d.data.resultData.runData) || {};
    let uid = null;
    for (const no of ['TEST Ingress', 'TEST Shim', 'Gatilho Telegram']) {
      try {
        const j = rd[no][0].data.main[0][0].json;
        const b = j.body || j;
        uid = (b.message && b.message.from && b.message.from.id)
          || (b.callback_query && b.callback_query.from && b.callback_query.from.id) || null;
        if (uid) break;
      } catch (x) { }
    }
    if (uid === null) continue;
    comUid++;
    const deTeste = uid >= uidMin && uid <= uidMax;
    if (deTeste && e.workflowId !== V8) foraDoV8.push(e.id + ' uid=' + uid + ' wf=' + e.workflowId);
    if (e.workflowId === V74) noV74.push(e.id + ' uid=' + uid + (deTeste ? ' [DE TESTE]' : ' [outro]'));
  }
  console.log('execucoes com user_id identificado: ' + comUid);
  console.log('execucoes de teste (uid ' + uidMin + '-' + uidMax + ') FORA do v8: ' + foraDoV8.length);
  for (const l of foraDoV8) console.log('  ' + l);
  console.log('execucoes no v7.4 na janela: ' + noV74.length);
  for (const l of noV74) console.log('  ' + l);

  const ok = foraDoV8.length === 0;
  console.log(ok ? '\nOK — nenhuma execucao de teste caiu fora do v8' : '\nFALHOU — houve execucao de teste fora do v8');
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
