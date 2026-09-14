// E001/E002/E003 — o arquivo do evento e uma copia fiel do v8, com uma lista FECHADA de diferencas.
//
// O `IAChat_Telegram_evento.json` nasce do v8 para a apresentacao com usuarios reais
// (sem teste de nivelamento). Ele e perigoso por construcao: tem o `Gatilho Telegram`
// HABILITADO e divide o webhookId `telegram-iachat-webhook` com o v7.4 que esta no ar.
// Por isso este teste guarda duas coisas ao mesmo tempo:
//
//   1. o evento nao diverge do v8 por acidente — depois de normalizar os campos DECLARADOS
//      (name do workflow, path do TEST Ingress, disabled do Gatilho Telegram, o jsCode dos
//      cinco nos declarados abaixo e os dois textos da E003/E004) os dois JSON tem de ser
//      IGUAIS byte a byte. Cada divergencia entre evento e v8 e uma decisao explicita
//      registrada AQUI; qualquer outra e deriva silenciosa e reprova;
//   2. ninguem copiou na direcao errada — o v8 tem de continuar com o gatilho
//      DESABILITADO e com o ingress `iachat-test-v8`.
//
// Roda offline: so le os dois arquivos. Nao publica, nao ativa, nao toca em rede.
// Uso:  node fluxos/_teststand/testa_arquivo_evento.js
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..');
const V8 = path.join(DIR, 'IAChat_Telegram_v8.json');
const EV = path.join(DIR, 'IAChat_Telegram_evento.json');

const PATH_V8 = 'iachat-test-v8';
const PATH_EVENTO = 'iachat-test-evento';

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); }
function fim() {
  console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' falha(s)' : 'PASSOU: arquivo do evento e o v8 com as 10 diferencas declaradas'));
  process.exit(fails ? 1 : 0);
}

// ---------- 0. os dois arquivos existem ----------
ok(fs.existsSync(V8), 'fluxos/IAChat_Telegram_v8.json existe');
ok(fs.existsSync(EV), 'fluxos/IAChat_Telegram_evento.json existe');
if (fails) fim();

const v8 = JSON.parse(fs.readFileSync(V8, 'utf8'));
const ev = JSON.parse(fs.readFileSync(EV, 'utf8'));

const no = (f, nome) => f.nodes.find(n => n.name === nome);

// ---------- 1. o v8 continua sendo o v8 (copia na direcao errada) ----------
const gv8 = no(v8, 'Gatilho Telegram');
const iv8 = no(v8, 'TEST Ingress');
ok(!!gv8, 'v8 tem o no "Gatilho Telegram"');
ok(!!iv8, 'v8 tem o no "TEST Ingress"');
if (fails) fim();
ok(gv8.disabled === true, 'v8: "Gatilho Telegram" continua DESABILITADO (nao pode roubar o bot)');
ok(iv8.parameters.path === PATH_V8, 'v8: TEST Ingress continua em "' + PATH_V8 + '"');
ok(v8.name === 'IAChat_Telegram_v8', 'v8: name do workflow intacto ("IAChat_Telegram_v8")');

// ---------- 2. as diferencas declaradas do evento ----------
const gev = no(ev, 'Gatilho Telegram');
const iev = no(ev, 'TEST Ingress');
ok(!!gev, 'evento tem o no "Gatilho Telegram"');
ok(!!iev, 'evento tem o no "TEST Ingress"');
if (fails) fim();
ok(gev.disabled === undefined, 'evento: "Gatilho Telegram" HABILITADO (sem disabled)');
ok(iev.parameters.path === PATH_EVENTO, 'evento: TEST Ingress em "' + PATH_EVENTO + '"');
ok(typeof ev.name === 'string' && /evento/i.test(ev.name), 'evento: name do workflow identifica o evento (tem "evento")');
ok(ev.name !== v8.name, 'evento: name do workflow difere do v8');

// ---------- 3. nenhuma outra diferenca estrutural ----------
// Lista FECHADA das divergencias declaradas. Acrescentar aqui e uma decisao de projeto;
// divergir sem acrescentar aqui reprova.
//   name do workflow            — E001
//   TEST Ingress.path           — E001
//   Gatilho Telegram.disabled   — E001
//   Placement Engine.jsCode     — E002 (o atalho: escolher o nivel leva direto a persona)
//                                 E004 (a troca de nivel de quem ja concluiu o onboarding)
//   Etapa de Cadastro.jsCode    — E003 (o convite de nivel para de prometer teste de 10 questoes)
//                                 E004 (o ramo `relevel`, do /nivel, e o convite em fonte unica)
//   Roteador Mestre.jsCode      — E004 (/nivel reabre a escolha; /pausa, /continuar, pl_pause,
//                                 pl_resume e ans_* respondem "nao ha teste"; pl_start_* vale
//                                 tambem com onboarding='done')
//   Mensagem Sistema.jsCode     — E004 (o texto `no_test`, e a ajuda sem o teste de nivelamento)
//   Após Gabarito.jsCode        — E004 (na troca de nivel a cadeia para antes de reperguntar
//                                 a personalidade)
//   Enviar Pergunta Persona.text        — E003 (sai o "Esse e o seu resultado!")
//                                         E004 (sai o falso "falta so o estilo do seu tutor")
//   Enviar Pergunta Nível.inlineKeyboard — E003 (os seis niveis, em duas colunas)
const CODIGO_PODE_DIFERIR = ['Placement Engine', 'Etapa de Cadastro', 'Roteador Mestre',
                             'Mensagem Sistema', 'Após Gabarito'];
// Divergencias fora do jsCode: <no, parametro>. Mesma regra — declarar aqui e decisao de
// projeto, divergir sem declarar reprova, e declarar sem divergir tambem reprova.
const PARAMETRO_PODE_DIFERIR = [
  ['Enviar Pergunta Persona', 'text'],
  ['Enviar Pergunta Nível', 'inlineKeyboard'],
];

// Normaliza so o que PODE mudar e exige igualdade total do resto.
function normaliza(f) {
  const c = JSON.parse(JSON.stringify(f));
  c.name = '<NAME>';
  for (const n of c.nodes) {
    if (n.name === 'TEST Ingress' && n.parameters) n.parameters.path = '<PATH>';
    if (n.name === 'Gatilho Telegram') delete n.disabled;
    if (CODIGO_PODE_DIFERIR.indexOf(n.name) >= 0 && n.parameters && n.parameters.jsCode)
      n.parameters.jsCode = '<JSCODE>';
    for (const par of PARAMETRO_PODE_DIFERIR)
      if (n.name === par[0] && n.parameters && n.parameters[par[1]] !== undefined)
        n.parameters[par[1]] = '<' + par[1].toUpperCase() + '>';
  }
  return c;
}
const nv8 = JSON.stringify(normaliza(v8));
const nev = JSON.stringify(normaliza(ev));
ok(nv8 === nev, 'evento == v8 depois de normalizar as 10 divergencias declaradas');

if (nv8 !== nev) {
  // diagnostico: onde divergiu
  const a = normaliza(v8), b = normaliza(ev);
  ok(Object.keys(a).join(',') === Object.keys(b).join(','), 'mesmas chaves de topo');
  ok(a.nodes.length === b.nodes.length, 'mesmo numero de nos (' + a.nodes.length + ' vs ' + b.nodes.length + ')');
  const ida = a.nodes.map(n => n.id).sort().join('|');
  const idb = b.nodes.map(n => n.id).sort().join('|');
  ok(ida === idb, 'mesmos ids de no');
  ok(JSON.stringify(a.connections) === JSON.stringify(b.connections), 'connections identicas');
  for (const n of a.nodes) {
    const m = b.nodes.find(x => x.id === n.id);
    if (!m) { ok(false, 'no "' + n.name + '" nao existe no evento'); continue; }
    if (JSON.stringify(n) !== JSON.stringify(m)) ok(false, 'no "' + n.name + '" diverge do v8');
  }
}

// ---------- 4. o codigo dos nos e o mesmo, um a um (menos o declarado) ----------
const jsV8 = v8.nodes.filter(n => n.parameters && n.parameters.jsCode);
const jsEV = new Map(ev.nodes.filter(n => n.parameters && n.parameters.jsCode).map(n => [n.name, n.parameters.jsCode]));
ok(jsV8.length === jsEV.size, 'mesmo numero de nos de codigo (' + jsV8.length + ')');

const iguais = jsV8.filter(n => CODIGO_PODE_DIFERIR.indexOf(n.name) < 0);
const divergentes = [];
for (const n of iguais) if (jsEV.get(n.name) !== n.parameters.jsCode) divergentes.push(n.name);
ok(divergentes.length === 0,
   'jsCode identico byte a byte nos ' + iguais.length + ' nos nao declarados' +
   (divergentes.length ? ' (divergiram: ' + divergentes.join(', ') + ')' : ''));

// E a divergencia declarada tem de existir de fato: se o Placement Engine voltar a ser igual
// ao do v8, o atalho da E002 sumiu e esta lista esta mentindo.
for (const nome of CODIGO_PODE_DIFERIR) {
  const orig = jsV8.find(n => n.name === nome);
  ok(!!orig, 'v8 tem o no de codigo "' + nome + '"');
  ok(jsEV.has(nome), 'evento tem o no de codigo "' + nome + '"');
  if (orig && jsEV.has(nome))
    ok(jsEV.get(nome) !== orig.parameters.jsCode,
       'divergencia declarada de "' + nome + '" existe de fato (a mudanca declarada nao sumiu)');
}

// Mesma regra para os parametros declarados: se o texto da persona ou o teclado de nivel
// voltarem a ser iguais aos do v8, os textos da E003 sumiram e esta lista esta mentindo.
for (const par of PARAMETRO_PODE_DIFERIR) {
  const a = no(v8, par[0]), b = no(ev, par[0]);
  ok(!!a && !!b, 'os dois arquivos tem o no "' + par[0] + '"');
  if (!a || !b) continue;
  const pa = JSON.stringify((a.parameters || {})[par[1]]);
  const pb = JSON.stringify((b.parameters || {})[par[1]]);
  ok(pa !== undefined && pb !== undefined, par[0] + '.' + par[1] + ' existe nos dois');
  ok(pa !== pb, 'divergencia declarada de ' + par[0] + '.' + par[1] + ' existe de fato (os textos da E003 nao sumiram)');
}

fim();
