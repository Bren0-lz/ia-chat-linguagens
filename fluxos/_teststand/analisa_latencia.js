// L1 — análise de latência a partir das execuções JÁ GRAVADAS no n8n.
//
// Por que não medir no momento do envio: o `mede_latencia.js` rotulava cada
// turno pela ordem em que o script mandava as mensagens, e isso se mostrou
// errado — há corrida entre semear o `mode` no banco e o fluxo anterior ainda
// gravando estado, então a rota real diverge do rótulo. Aqui a rota vem do que
// o `Roteador Mestre` REGISTROU na própria execução, que é a fonte da verdade.
//
// Também separa, por nó:
//   LLM   = agentes e modelos (custo real do turno)
//   infra = código, Postgres, roteamento
//   envio = nós de Telegram — inflados pelo retry do chat_id sintético,
//           NÃO representam produção (ver HANDOFF §5)
//
//   N8N_API_KEY=... node analisa_latencia.js [limite]
const fs = require('fs');
const { jget, API } = require('./harness');

const LIMITE = Number(process.argv[2] || 60);
const ehEnvio = n => /^(Enviar|Typing|Responder Callback|Limpar Botões|Editar Menu)/.test(n);
// "Modelo Groq" ficou do tempo pre-Vertex: depois da migracao de 03/09 os nos de
// modelo se chamam "Modelo Vertex ...", e sem isto eles caiam no balde de infra,
// tirando o custo real do turno da conta de LLM. "Validar Nome (IA)" tambem e LLM.
const ehLLM = n => /^(Agente |Modelo (Groq|Vertex)|Transcrever|Validar Nome)/.test(n);
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const sd = a => a.length < 2 ? 0
  : Math.sqrt(a.map(v => Math.pow(v - mean(a), 2)).reduce((x, y) => x + y, 0) / (a.length - 1));
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };

(async () => {
  const j = await jget(API + '/executions?limit=' + LIMITE);
  const porRota = {};
  const porNo = {};
  let total = 0;

  for (const m of (j.data || [])) {
    const e = await jget(API + '/executions/' + m.id + '?includeData=true');
    const rd = e && e.data && e.data.resultData && e.data.resultData.runData;
    if (!rd || !rd['Roteador Mestre']) continue;

    let rota;
    try {
      const r = rd['Roteador Mestre'][0].data.main[0][0].json;
      rota = r.route + (r.subroute ? ':' + r.subroute : '');
    } catch (x) { continue; }
    // turnos com LLM ficam mais legíveis separados dos puramente determinísticos
    const temLLM = Object.keys(rd).some(ehLLM);
    const chave = rota + (temLLM ? '' : ' (sem LLM)');

    let llm = 0, infra = 0, envio = 0;
    for (const nome of Object.keys(rd)) {
      for (const run of rd[nome]) {
        const ms = Number(run.executionTime || 0);
        if (ehEnvio(nome)) envio += ms;
        else if (ehLLM(nome)) { llm += ms; (porNo[nome] = porNo[nome] || []).push(ms / 1000); }
        else { infra += ms; if (ms > 300) (porNo[nome] = porNo[nome] || []).push(ms / 1000); }
      }
    }
    (porRota[chave] = porRota[chave] || []).push({ real: (llm + infra) / 1000, llm: llm / 1000, infra: infra / 1000, envio: envio / 1000 });
    total++;
  }

  console.log('L1 — latência real por rota (' + total + ' execuções analisadas)\n');
  console.log('rota                          n   media  desvio    p90     max    LLM  infra');
  const linhas = [];
  for (const k of Object.keys(porRota).sort((a, b) => mean(porRota[b].map(x => x.real)) - mean(porRota[a].map(x => x.real)))) {
    const a = porRota[k];
    const reais = a.map(x => x.real);
    linhas.push({ rota: k, n: a.length, media: mean(reais), p90: pct(reais, 0.9), max: Math.max(...reais), llm: mean(a.map(x => x.llm)), infra: mean(a.map(x => x.infra)) });
    console.log('  ' + k.padEnd(27) + String(a.length).padStart(2) + '  '
      + mean(reais).toFixed(2).padStart(6) + ' ' + sd(reais).toFixed(2).padStart(6) + ' '
      + pct(reais, 0.9).toFixed(2).padStart(6) + ' ' + Math.max(...reais).toFixed(2).padStart(6) + '  '
      + mean(a.map(x => x.llm)).toFixed(2).padStart(5) + '  ' + mean(a.map(x => x.infra)).toFixed(2).padStart(5));
  }

  const todos = Object.values(porRota).flat();
  const reais = todos.map(x => x.real);
  console.log('\nturnos: ' + reais.length
    + ' | media ' + mean(reais).toFixed(2) + 's'
    + ' | p90 ' + pct(reais, 0.9).toFixed(2) + 's'
    + ' | max ' + Math.max(...reais).toFixed(2) + 's'
    + ' | acima de 8s: ' + reais.filter(v => v > 8).length + '/' + reais.length);

  console.log('\nnós mais caros (media, apenas >0,3s ou LLM):');
  for (const k of Object.keys(porNo).sort((a, b) => mean(porNo[b]) - mean(porNo[a])).slice(0, 10))
    console.log('  ' + mean(porNo[k]).toFixed(2).padStart(6) + 's  n=' + String(porNo[k].length).padStart(2) + '  ' + k);

  console.log('\nARTEFATO (nao existe em producao): media de ' + mean(todos.map(x => x.envio)).toFixed(2)
    + 's por turno em retry de envio ao Telegram, por causa do chat_id sintetico do harness.');
  fs.writeFileSync('./lat_por_rota.json', JSON.stringify({ analisadas: total, linhas }, null, 1));
})().catch(e => { console.error('erro', e.message); process.exit(1); });
