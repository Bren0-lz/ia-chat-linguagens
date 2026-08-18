// Lê a última execução de DÚVIDA de um usuário e mostra o que o Professor Engine
// realmente montou: q_answered, a questão em contexto e o trecho do system prompt
// que instrui sobre revelar (ou não) o gabarito.
//   N8N_API_KEY=... node inspeciona_duvida.js [userId]
const fs = require('fs');
const { jget, API } = require('./harness');

(async () => {
  const st = JSON.parse(fs.readFileSync('./state_critica.json', 'utf8'));
  const uid = Number(process.argv[2] || st.userId);
  const j = await jget(API + '/executions?limit=25');
  for (const m of (j.data || [])) {
    const e = await jget(API + '/executions/' + m.id + '?includeData=true');
    const rd = e && e.data && e.data.resultData && e.data.resultData.runData;
    if (!rd || !rd['Professor Engine']) continue;
    let u = null;
    try {
      const b = rd['TEST Ingress'][0].data.main[0][0].json.body;
      u = (b.message && b.message.from.id) || (b.callback_query && b.callback_query.from.id);
    } catch (x) {}
    if (u !== uid) continue;
    let eng;
    try { eng = rd['Professor Engine'][0].data.main[0][0].json; } catch (x) { continue; }
    if (eng.llmTask !== 'doubt') continue;

    console.log('=== execução', m.id, '===');
    console.log('llmTask   :', eng.llmTask);
    console.log('q_answered:', eng.teacher_state_new && eng.teacher_state_new.q_answered);
    console.log('question  :', JSON.stringify(String((eng.teacher_state_new || {}).question || '').slice(0, 80)));
    console.log('answer    :', JSON.stringify((eng.teacher_state_new || {}).answer));
    console.log('chatInput :', JSON.stringify(String(eng.chatInput || '').slice(0, 100)));
    const sm = String(eng.systemMessage || '');
    const i = sm.indexOf('CONTEXTO');
    console.log('\ntrecho do system prompt:\n' + (i >= 0 ? sm.slice(i, i + 700) : sm.slice(-700)));
    return;
  }
  console.log('nenhuma execução de dúvida encontrada para', uid);
})().catch(e => { console.error('erro', e.message); process.exit(1); });
