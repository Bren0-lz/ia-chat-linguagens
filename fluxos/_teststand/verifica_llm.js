// Verificação rápida pós-troca de modelo: o LLM volta a responder?
//   N8N_API_KEY=... node verifica_llm.js [userId]
const { msg, digest } = require('./harness');

(async () => {
  const u = Number(process.argv[2] || 995897831);
  const d = digest(await msg(u, 'hi! i like video games a lot'));
  console.log('nós:', d.ran.length);
  console.log('ERROS:', JSON.stringify(d.errs));
  console.log('RESPOSTA:', (d.reply || '(vazia)').slice(0, 500));
})().catch(e => { console.error('erro', e.message); process.exit(1); });
