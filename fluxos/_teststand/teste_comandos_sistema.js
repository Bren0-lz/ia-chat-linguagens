// X4 — comandos de sistema (/help, comando desconhecido, /progresso).
//
// O nó `Mensagem Sistema` monta essas respostas. Em 19/08 a checagem de sintaxe
// da regressão apontou que ele tem QUEBRAS DE LINHA LITERAIS dentro de strings
// de aspas simples, o que é JavaScript inválido:
//
//   else if(sub==='help') text='...Comandos:
//   /help — ver esta ajuda...';        <- newline real dentro da string
//
// O X4 foi APROVADO no relatório de 13/07 (sobre a v7.2), então se este teste
// falhar houve regressão entre aquela versão e a v7.4. Este script confirma pela
// execução real, em vez de deduzir do parse.
//
// Rotas determinísticas — nenhuma chamada ao LLM.
//
//   N8N_API_KEY=... node teste_comandos_sistema.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { Client } = require('pg');
const { msg, digest, jget, API } = require('./harness');

const UID = Number(process.env.UID || 993970001);
const CASOS = [
  { cmd: '/help', desc: 'ajuda', espera: /comandos|menu|modo/i },
  { cmd: '/xyz', desc: 'comando desconhecido', espera: /reconhe|tente|menu/i },
  { cmd: '/progresso', desc: 'progresso', espera: /./ },
];

async function semear() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  await c.query(
    'INSERT INTO students (user_id, name, age, mode, onboarding, level, profile, msg_count, last_update_id, streak_count, last_active)'
    + " VALUES ($1,'Sys',24,'chat','done','B1','{}'::jsonb,3,1,1,CURRENT_DATE)"
    + " ON CONFLICT (user_id) DO UPDATE SET mode='chat', onboarding='done', updated_at=now()", [UID]);
  await c.end();
}

(async () => {
  console.log('X4 — comandos de sistema | user ' + UID + '\n');
  await semear();
  let falhas = 0;

  for (const caso of CASOS) {
    const e = await msg(UID, caso.cmd);
    const d = digest(e);
    // o texto do sistema não aparece no digest padrão; pega do nó direto
    let texto = '';
    let erroNo = null;
    try {
      const full = await jget(API + '/executions/' + d.id + '?includeData=true');
      const rd = full.data.resultData.runData;
      if (rd['Mensagem Sistema']) {
        if (rd['Mensagem Sistema'][0].error) erroNo = String(rd['Mensagem Sistema'][0].error.message || '');
        // o nó devolve a mensagem em `sysText`; `text` é o passthrough da entrada
        // do usuário e ler esse campo dá falso negativo (o teste "via" /help como
        // resposta). Erro pago em 19/08.
        else texto = String(rd['Mensagem Sistema'][0].data.main[0][0].json.sysText || '');
      } else {
        erroNo = '(nó Mensagem Sistema nem executou)';
      }
    } catch (x) { erroNo = 'falha ao ler execução: ' + x.message; }

    const ok = !erroNo && caso.espera.test(texto);
    if (!ok) falhas++;
    console.log((ok ? 'PASSOU  ' : 'FALHOU  ') + caso.cmd + ' (' + caso.desc + ')');
    if (erroNo) console.log('   ERRO NO NÓ: ' + erroNo.slice(0, 160));
    else console.log('   resposta: ' + texto.replace(/\s+/g, ' ').slice(0, 120));
    console.log('');
  }

  console.log('===== RESULTADO =====');
  console.log(falhas === 0
    ? 'PASSOU  X4 — todos os comandos de sistema respondem'
    : 'FALHOU  X4 — ' + falhas + '/' + CASOS.length + ' comandos quebrados');
})().catch(e => { console.error('erro', e.message); process.exit(1); });
