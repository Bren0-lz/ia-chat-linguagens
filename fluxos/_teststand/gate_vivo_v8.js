// Gate ao vivo do v8. Manda UMA mensagem de texto pelo TEST Ingress do workflow
// v8 (path `iachat-test-v8`, workflow separado do v7.4 que esta no ar) e exige
// duas coisas da execucao resultante:
//   1. o `Roteador Mestre` registrou uma rota (handoff §6 nº 3: quem rotula o
//      turno e o roteador, nao a ordem de envio);
//   2. a resposta ao aluno nao esta vazia (handoff §6 nº 1: resposta vazia NAO e
//      aprovacao — um gate que passa com o fluxo mudo e pior que gate nenhum).
// O envio ao Telegram falha (chatId sintetico) e isso e esperado: nao reprova.
// Sai 0 se passou, 1 se nao. Nao publica nem ativa nada.
process.env.IACHAT_TEST_PATH = 'iachat-test-v8';

const { msg, digest, nodeOut, WEBHOOK } = require('./harness');

// Handoff §6 nº 11: ID derivado do relogio, na faixa 990000000-999999999, que e
// a que o cleanup_test_users.js apaga. Base suja faz o teste medir residuo.
const UID = 990000000 + (Date.now() % 9000000);

function falha(msgTxt, detalhe) {
  console.log('REPROVOU: ' + msgTxt);
  if (detalhe) console.log(detalhe);
  process.exit(1);
}

// Sonda barata: POST SEM o header `x-iachat-test`. Se o webhook existe, o
// headerAuth responde 403 antes de o fluxo rodar (nenhuma execucao e criada);
// se o workflow v8 nao existe ou nao esta ativo, vem 404. Assim o 404 vira uma
// mensagem legivel em vez de 84 s de polling atras de uma execucao inexistente.
async function sonda() {
  try {
    const r = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    await r.text().catch(() => {});
    return r.status;
  } catch (e) {
    return 0;
  }
}

(async () => {
  console.log('gate_vivo_v8 | ingress ' + WEBHOOK + ' | user ' + UID);

  const st = await sonda();
  if (st === 0) {
    falha('n8n inalcancavel em ' + WEBHOOK + ' (conexao recusada). Suba o n8n.');
  }
  if (st === 404) {
    falha('webhook 404 em ' + WEBHOOK + ' — o workflow v8 nao existe no n8n, ou existe '
      + 'e nao esta ativo. Publique-o como workflow NOVO (nao toque no 9MA0o1XJjD33BnKc).');
  }
  if (st !== 403) {
    console.log('AVISO: sonda sem header devolveu ' + st + ' (esperado 403). Seguindo.');
  }

  const exec = await msg(UID, 'oi');
  if (!exec) {
    falha('execucao nao encontrada para o user ' + UID + ' apos o POST no ingress. '
      + 'O webhook respondeu, mas nenhuma execucao com esse user_id apareceu na API '
      + '(workflow ativo? Postgres de pe?).');
  }

  const d = digest(exec);
  const rot = nodeOut(exec.data.resultData.runData, 'Roteador Mestre');
  const rota = rot && rot.route ? String(rot.route).trim() : '';
  const reply = (d.reply || '').trim();

  console.log('exec ' + d.id + ' | ' + d.ran.length + ' nos | rota=' + (rota || '(nenhuma)'));
  console.log('REPLY:\n' + (reply || '(vazia)'));
  // Erros de no sao informativos: o envio ao Telegram SEMPRE falha com chatId
  // sintetico (handoff §6 nº 2). Nao reprovam.
  if (d.errs && d.errs.length) console.log('erros de no (esperado o de envio):', d.errs);

  const faltou = [];
  if (!rota) faltou.push('o `Roteador Mestre` nao registrou rota (nao rodou, ou route vazia)');
  if (!reply) faltou.push('a resposta ao aluno veio vazia — nenhum no produtor de texto publicou nada');

  if (faltou.length) falha('faltou ' + faltou.length + ' condicao(oes):\n  - ' + faltou.join('\n  - '));

  console.log('PASSOU: rota "' + rota + '" registrada e resposta nao vazia (' + reply.length + ' chars).');
  process.exit(0);
})().catch(e => {
  console.log('REPROVOU: erro inesperado — ' + (e && e.message ? e.message : e));
  process.exit(1);
});
