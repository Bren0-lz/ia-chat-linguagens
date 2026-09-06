// Regressao do INSTRUMENTO de latencia (`decompoe()` do analisa_latencia.js).
//
// Por que este teste existe: ate 06/09/2026 o `decompoe()` SOMAVA `executionTime` de
// todos os nos do balde. Nos aninhados existem — o `Modelo Vertex Professor` roda DENTRO
// da janela do `Agente Professor` — entao o mesmo tempo era contado duas vezes e o balde
// de LLM inflava. Na exec 3538 do T009, 4,89 s de trabalho real viraram 9,60 s, e o
// numero publicado ficou MAIOR que o relogio de parede da execucao, que e fisicamente
// impossivel. O vies atingia so os turnos com no de modelo — ou seja, exatamente o braco
// de comparacao das medicoes de LLM (L1 e T009).
//
// Este arquivo REPROVA a versao antiga: com a soma, `llm` daria 9,60 e o assert 1 falha.
// Roda offline, sem n8n, sem Postgres, sem LLM.
const { decompoe, estouroDe, uniao } = require('./analisa_latencia');

let fails = 0;
function ok(cond, msg, extra) {
  if (cond) { console.log('  ✓ ' + msg); return; }
  fails++;
  console.log('  ✗ ' + msg + (extra !== undefined ? '  [' + extra + ']' : ''));
}
const perto = (a, b) => Math.abs(a - b) < 0.001;

// ---------------------------------------------------------------- uniao de intervalos
console.log('uniao([ini,fim])');
ok(uniao([]) === 0, 'lista vazia = 0');
ok(uniao([[0, 100]]) === 100, 'um intervalo = sua duracao');
ok(uniao([[0, 100], [200, 350]]) === 250, 'disjuntos somam');
ok(uniao([[0, 100], [100, 250]]) === 250, 'encostados somam sem furo');
ok(uniao([[0, 100], [50, 150]]) === 150, 'sobrepostos contam a interseccao UMA vez');
ok(uniao([[0, 500], [100, 200]]) === 500, 'aninhado nao acrescenta nada');
ok(uniao([[100, 200], [0, 500]]) === 500, 'aninhado fora de ordem tambem nao');
ok(uniao([[0, 500], [100, 200], [150, 250], [600, 700]]) === 600, 'mistura de aninhados e disjuntos');

// ------------------------------------------------------------------------- fixtures
// Reproducao da exec 3538 (condicao "modelo" do T009), com os tempos reais medidos:
//   4,71 s  Modelo Vertex Professor, comecando 177 ms depois do agente
//   4,89 s  Agente Professor, que termina junto com o sub-no
// Somados: 9,60 s. Reais: 4,89 s.
const T0 = 1757000000000;
const run = (ini, dur) => ({ startTime: T0 + ini, executionTime: dur });
function execFake(runData, wallMs) {
  return {
    id: 3538,
    startedAt: new Date(T0).toISOString(),
    stoppedAt: new Date(T0 + wallMs).toISOString(),
    data: { resultData: { runData } },
  };
}
const roteador = [{ startTime: T0 + 110, executionTime: 20, data: { main: [[{ json: { route: 'professor', subroute: 'intro' } }]] } }];
const rd3538 = {
  'TEST Ingress': [run(0, 10)],
  'Roteador Mestre': roteador,
  'Professor Engine': [run(150, 30)],
  'Buscar Explicação': [run(190, 10)],
  'Agente Professor': [run(972, 4890)],
  'Modelo Vertex Professor': [run(1149, 4710)],   // aninhado: roda DENTRO do agente
  'Parse Professor': [run(5870, 20)],
  'Enviar Explicacao Prof': [run(5900, 7840)],
};

console.log('\ndecompoe() — no aninhado (exec 3538 do T009)');
const d = decompoe(execFake(rd3538, 13750));
ok(!!d, 'devolve algo');
ok(d.rota === 'professor:intro', 'rotula pela rota que o `Roteador Mestre` registrou', d && d.rota);
// ESTE e o assert que reprova a versao antiga: a soma daria 9,60 s.
ok(perto(d.llm, 4.89), 'LLM = 4,89 s (a janela do agente), NAO 9,60 s (a soma com o sub-no)', d && d.llm);
ok(perto(d.porNo['Agente Professor'], 4.89), 'porNo do agente = sua propria janela', d && d.porNo['Agente Professor']);
ok(perto(d.envio, 7.84), 'envio isolado em 7,84 s (fica fora do numero publicado)', d && d.envio);
ok(d.real < d.wall, 'o trabalho real cabe no relogio de parede (' + d.real.toFixed(2) + 's < ' + d.wall.toFixed(2) + 's)');
ok(d.estouro === null, 'sem estouro numa execucao coerente', d && d.estouro);

console.log('\ndecompoe() — infra aninhada em LLM (caso do `Memória Dúvida`, exec 3565)');
const dDuv = decompoe(execFake({
  'Roteador Mestre': roteador,
  'Agente Dúvida': [run(200, 3740)],
  'Memória Dúvida': [run(250, 120), run(3780, 150)],  // sub-no de infra, dentro do agente
  'Modelo Vertex Dúvida': [run(440, 3340)],
  'Enviar Dúvida': [run(3960, 6930)],
}, 10892), 10892);
ok(perto(dDuv.llm, 3.74), 'LLM = a janela do agente', dDuv.llm);
ok(perto(dDuv.infra, 0.02), 'infra recebe SO o tempo que nao esta dentro do agente', dDuv.infra);
// 3,74 s da janela do agente + 0,02 s do `Roteador Mestre`; as duas passagens do
// `Memória Dúvida` (270 ms somados) sao absorvidas por estarem dentro do agente.
ok(perto(dDuv.real, 3.76), 'real absorve a infra aninhada em vez de soma-la', dDuv.real);
ok(dDuv.estouro === null, 'infra dentro de LLM nao dispara falso positivo do assert', dDuv.estouro);

console.log('\nestouroDe() — a conferencia de sanidade, sobre os numeros PUBLICADOS');
// O caso que importa: os escalares que a versao com SOMA publicava para a exec 3538.
// 9,60 s de LLM + 0,14 de infra + 7,84 de envio = 17,58 s numa execucao de 12,95 s.
// Se o alarme nao acusar AQUI ele nao serve para nada — e foi assim que o defeito passou:
// a conferencia anterior recalculava a uniao a partir dos intervalos, ou seja, conferia o
// instrumento contra ele mesmo e nunca podia acusar erro de somatorio.
const escalaresAntigos = { llm: 9.60, infra: 0.14, envio: 7.84 };
ok(estouroDe(escalaresAntigos, 12.95) !== null,
   'ACUSA os escalares da versao antiga (17,58 s num relogio de 12,95 s)');
ok(/duas vezes/.test(estouroDe(escalaresAntigos, 12.95) || ''),
   'a mensagem nomeia o defeito (o mesmo tempo contado duas vezes)');
ok(estouroDe({ llm: 4.89, infra: 0.14, envio: 7.84 }, 12.95) === null,
   'nao acusa os escalares corretos da MESMA execucao');
ok(estouroDe({ llm: 3.74, infra: 0.21, envio: 6.93 }, 10.89) === null,
   'nao acusa o turno de duvida — infra dentro de LLM pertence a um balde so');
ok(estouroDe({ llm: 12.90, infra: 0.05, envio: 0 }, 12.95) === null, 'a igualdade cabe');
ok(estouroDe({ llm: 1, infra: 1, envio: 1 }, null) === null, 'sem relogio de parede nao ha o que conferir');

console.log('\ndecompoe() — o alarme ligado, e a identidade que o sustenta');
const dEstouro = decompoe(execFake(rd3538, 5000));
ok(dEstouro.estouro !== null, 'acusa quando o publicado nao cabe no relogio de parede');
const semRelogio = decompoe({ id: 1, data: { resultData: { runData: rd3538 } } });
ok(semRelogio.wall === null && semRelogio.estouro === null, 'sem startedAt/stoppedAt: nao inventa estouro');
// Os baldes sao disjuntos, entao somam exatamente a uniao de tudo. E essa identidade que
// transforma o alarme numa conferencia de verdade em vez de um palpite com folga.
const dOk = decompoe(execFake(rd3538, 13750));
ok(Math.abs((dOk.llm + dOk.infra + dOk.envio) - 12.82) < 0.001,
   'llm + infra + envio = uniao de todos os intervalos (baldes disjuntos)',
   dOk.llm + dOk.infra + dOk.envio);
ok(Math.abs(dOk.real - (dOk.llm + dOk.infra)) < 0.001, 'real = llm + infra, sem sobra nem falta');

console.log('\ndecompoe() — casos de borda');
ok(decompoe(null) === null, 'exec nula');
ok(decompoe({ data: { resultData: { runData: {} } } }) === null, 'sem `Roteador Mestre` nao ha o que rotular');

console.log(fails ? '\nREPROVOU: ' + fails + ' assert(s)' : '\nPASSOU: decompoe() soma por uniao de intervalos, com conferencia contra o relogio de parede');
process.exit(fails ? 1 : 0);
