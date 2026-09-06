// Preload que registra TODA URL passada ao fetch do processo, para provar em que
// ingress a bateria bateu de verdade. Nao altera comportamento: so anota e delega.
//
//   IACHAT_URLS_LOG=urls.txt node --require ./fluxos/_teststand/registra_urls.js fluxos/_teststand/bateria_completa_a.js
const fs = require('fs');
const destino = process.env.IACHAT_URLS_LOG || 'urls_fetch.log';
const orig = globalThis.fetch;
globalThis.fetch = function (entrada, init) {
  const url = typeof entrada === 'string' ? entrada : (entrada && entrada.url) || String(entrada);
  try { fs.appendFileSync(destino, new Date().toISOString() + ' ' + ((init && init.method) || 'GET') + ' ' + url + '\n'); } catch (e) {}
  return orig.apply(this, arguments);
};
