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

// UNIAO DE INTERVALOS, nao soma de duracoes. Nos aninhados existem: o
// `Modelo Vertex Professor` roda DENTRO da janela do `Agente Professor` (o agente
// abre, chama o sub-no, fecha). Somar `executionTime` conta o mesmo tempo duas
// vezes e infla exatamente o balde de LLM — na exec 3538, 4,89 s de trabalho real
// viraram 9,60 s, numero MAIOR que o relogio de parede da execucao inteira, que e
// fisicamente impossivel. O viés atinge so quem tem no de modelo: a condicao sem
// LLM sempre esteve certa, e por isso o erro passou despercebido desde o L1.
function uniao(intervalos) {
  if (!intervalos.length) return 0;
  const s = [...intervalos].sort((a, b) => a[0] - b[0]);
  let total = 0, ini = s[0][0], fim = s[0][1];
  for (let k = 1; k < s.length; k++) {
    if (s[k][0] > fim) { total += fim - ini; ini = s[k][0]; fim = s[k][1]; }
    else if (s[k][1] > fim) { fim = s[k][1]; }
  }
  return total + (fim - ini);
}

// A CONFERENCIA DE SANIDADE, e ela conferindo o que e PUBLICADO.
//
// Recebe os escalares que vao para o relatorio, nao os intervalos: um instrumento que
// se confere recalculando a si mesmo nunca acusa nada. A soma dos tres baldes tem de
// caber no relogio de parede da execucao — se passa, alguem contou o mesmo tempo duas
// vezes. Foi exatamente o que a soma de `executionTime` fazia: na exec 3538 dava
// 9,60 + 0,14 + 7,84 = 17,58 s numa execucao de 12,95 s.
// Tolerancia de 50 ms para o arredondamento do proprio n8n.
function estouroDe(baldes, wall) {
  if (wall == null) return null;
  const soma = Number(baldes.llm || 0) + Number(baldes.infra || 0) + Number(baldes.envio || 0);
  if (soma <= wall + 0.05) return null;
  return 'os baldes publicados somam ' + soma.toFixed(2) + 's numa execucao de ' + wall.toFixed(2)
    + 's de relogio de parede (LLM ' + Number(baldes.llm || 0).toFixed(2) + ' + infra '
    + Number(baldes.infra || 0).toFixed(2) + ' + envio ' + Number(baldes.envio || 0).toFixed(2)
    + ') — o mesmo tempo esta sendo contado duas vezes';
}

// Decompoe UMA execucao nos tres baldes, com a mesma regra de classificacao usada
// aqui. Exportado para que outros medidores (ex.: mede_professor_v8.js) reusem o
// instrumento em vez de reescrever a separacao LLM/infra/envio — que e justamente
// onde moram as armadilhas nº 2 (envio em retry) e nº 3 (rotulo pelo Roteador).
// Devolve null quando a execucao nao tem `Roteador Mestre` (nada a rotular).
//
// Os tres baldes sao DISJUNTOS: um trecho de tempo pertence a um balde so. Quando um
// no de infra roda dentro da janela de um no de LLM (o `Memória Dúvida` dentro do
// `Agente Dúvida`, exec 3565), aquele tempo ja esta contado em LLM e NAO e contado de
// novo em infra. Sem isso os baldes se somariam a mais que o relogio de parede — e o
// alarme abaixo teria de ser silenciado para conviver com o proprio defeito.
//
// `wall` e o relogio de parede da execucao. `estouro` compara a SOMA DOS ESCALARES
// PUBLICADOS (llm+infra+envio) com ele: e a unica forma de o alarme enxergar um erro
// de somatorio. Conferir recalculando a uniao a partir dos intervalos seria circular —
// nunca acusaria nada, porque a uniao esta certa por construcao.
function decompoe(exec) {
  const rd = exec && exec.data && exec.data.resultData && exec.data.resultData.runData;
  if (!rd || !rd['Roteador Mestre']) return null;
  let rota = '';
  try {
    const r = rd['Roteador Mestre'][0].data.main[0][0].json;
    rota = r.route + (r.subroute ? ':' + r.subroute : '');
  } catch (x) { return null; }
  const balde = { llm: [], infra: [], envio: [] };
  const porNoInt = {};
  for (const nome of Object.keys(rd)) {
    const qual = ehEnvio(nome) ? 'envio' : (ehLLM(nome) ? 'llm' : 'infra');
    for (const run of rd[nome]) {
      const ini = Number(run.startTime || 0);
      const ms = Number(run.executionTime || 0);
      const iv = [ini, ini + ms];
      balde[qual].push(iv);
      (porNoInt[nome] = porNoInt[nome] || []).push(iv);
    }
  }
  const porNo = {};
  for (const nome of Object.keys(porNoInt)) porNo[nome] = uniao(porNoInt[nome]) / 1000;
  // Baldes disjuntos, por precedencia LLM > infra > envio: cada um recebe so o tempo
  // que ainda nao pertence a um balde anterior. As tres parcelas somam exatamente a
  // uniao de tudo, o que torna a conferencia abaixo uma identidade — e nao um palpite.
  const uLLM = uniao(balde.llm);
  const uLLMInfra = uniao(balde.llm.concat(balde.infra));
  const uTudo = uniao(balde.llm.concat(balde.infra, balde.envio));
  const llm = uLLM / 1000;
  const infra = (uLLMInfra - uLLM) / 1000;
  const envio = (uTudo - uLLMInfra) / 1000;
  const real = uLLMInfra / 1000;
  const wall = (exec.startedAt && exec.stoppedAt)
    ? (new Date(exec.stoppedAt) - new Date(exec.startedAt)) / 1000 : null;
  return { id: exec.id, rota, real, llm, infra, envio, wall, estouro: estouroDe({ llm, infra, envio }, wall), porNo };
}

// A API do n8n PAGINA: `/executions?limit=N` devolve no maximo 250 e um `nextCursor`.
// Pedir 400 e receber 250 em silencio ja fez um recalculo declarar perdidas 449 execucoes
// que estavam gravadas — o fim da primeira pagina foi tomado pelo fim do historico.
async function listaExecucoes(limite) {
  const out = [];
  let cursor = null;
  do {
    const pagina = Math.min(250, limite - out.length);
    const j = await jget(API + '/executions?limit=' + pagina + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
    const d = (j && j.data) || [];
    out.push(...d);
    cursor = (j && j.nextCursor) || null;
    if (!d.length) break;
  } while (cursor && out.length < limite);
  return out.slice(0, limite);
}

module.exports = { decompoe, estouroDe, uniao, listaExecucoes, ehEnvio, ehLLM, mean, sd, pct };

if (require.main === module) (async () => {
  const lista = await listaExecucoes(LIMITE);
  if (lista.length < LIMITE) console.log('(so ' + lista.length + ' execucoes gravadas; pedidas ' + LIMITE + ')');
  const porRota = {};
  const porNo = {};
  let total = 0;

  let estouros = 0;
  for (const m of lista) {
    const e = await jget(API + '/executions/' + m.id + '?includeData=true');
    const dec = decompoe(e);
    if (!dec) continue;
    const rd = e.data.resultData.runData;
    // turnos com LLM ficam mais legíveis separados dos puramente determinísticos
    const temLLM = Object.keys(rd).some(ehLLM);
    const chave = dec.rota + (temLLM ? '' : ' (sem LLM)');
    // conferencia de sanidade: nenhum balde pode passar do relogio de parede
    if (dec.estouro) { estouros++; console.log('  AVISO exec ' + dec.id + ': ' + dec.estouro); }
    for (const nome of Object.keys(dec.porNo)) {
      if (ehEnvio(nome)) continue;
      if (ehLLM(nome) || dec.porNo[nome] > 0.3) (porNo[nome] = porNo[nome] || []).push(dec.porNo[nome]);
    }
    (porRota[chave] = porRota[chave] || []).push({ real: dec.real, llm: dec.llm, infra: dec.infra, envio: dec.envio });
    total++;
  }
  if (estouros) console.log('\n' + estouros + ' execucao(oes) com balde acima do relogio de parede — instrumento suspeito.\n');

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
