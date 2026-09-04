// Mostra a rota tomada em cada uma das últimas execuções de um usuário.
// Serve para entender por que um turno não gerou resposta (roteamento, ignore,
// erro de nó) em vez de adivinhar pelo texto vazio.
//   N8N_API_KEY=... node inspeciona_turno.js <userId> [quantas]
const { jget, API } = require('./harness');

(async () => {
  const uid = Number(process.argv[2]);
  const quantas = Number(process.argv[3] || 6);
  if (!uid) { console.error('uso: node inspeciona_turno.js <userId> [quantas]'); process.exit(1); }

  const j = await jget(API + '/executions?limit=40');
  let vistos = 0;
  for (const m of (j.data || [])) {
    if (vistos >= quantas) break;
    const e = await jget(API + '/executions/' + m.id + '?includeData=true');
    const rd = e && e.data && e.data.resultData && e.data.resultData.runData;
    if (!rd) continue;
    let body = null;
    try { body = rd['TEST Ingress'][0].data.main[0][0].json.body; } catch (x) { continue; }
    const u = (body.message && body.message.from.id) || (body.callback_query && body.callback_query.from.id);
    if (u !== uid) continue;
    vistos++;

    const entrada = body.message ? JSON.stringify(String(body.message.text || '').slice(0, 45))
      : 'callback:' + (body.callback_query && body.callback_query.data);
    let rota = null, sub = null;
    try {
      const r = rd['Roteador Mestre'][0].data.main[0][0].json;
      rota = r.route; sub = r.subroute;
    } catch (x) {}
    const nos = Object.keys(rd);
    const erros = nos.filter(n => rd[n][0] && rd[n][0].error)
      .map(n => n + ': ' + String(rd[n][0].error.message || '').slice(0, 60));
    const llm = nos.filter(n => /^(Agente |Modelo (Groq|Vertex))/.test(n));

    console.log('exec ' + m.id + ' | ' + m.status + ' | entrada ' + entrada);
    console.log('   rota=' + rota + ' subrota=' + sub + ' | nós=' + nos.length + ' | LLM: ' + (llm.join(', ') || 'nenhum'));
    if (erros.length) console.log('   ERROS: ' + erros.join(' || '));
    console.log('');
  }
  if (!vistos) console.log('nenhuma execução encontrada para o usuário ' + uid);
})().catch(e => { console.error('erro', e.message); process.exit(1); });
