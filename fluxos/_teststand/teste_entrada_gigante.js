// R1 — entrada muito grande.
//
// O R1 ("texto de 4000+ caracteres: não quebra; trunca/limita") foi EXCLUÍDO da
// bateria em 13/07 e, diferente do X5, nunca chegou a ser executado. Enquanto
// isso, o relatório afirma robustez a entrada adversária — sem esse teste, a
// afirmação fica sem respaldo.
//
// O que pode quebrar com entrada gigante:
//   1. escape de SQL — o texto vai para dentro de UPDATE ... jsonb
//   2. limite do Telegram — a mensagem de saída não pode passar de 4096
//   3. prompt inflado — o texto entra no contexto do LLM
//   4. memória de conversa — o texto é gravado em chat_memory
//
// Cobre rotas determinísticas (cadastro, nivelamento) e, ao final, a rota de
// Conversa, que é a única que chama o LLM.
//
//   N8N_API_KEY=... node teste_entrada_gigante.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { Client } = require('pg');
const { msg, digest, jget, API } = require('./harness');

const UID = Number(process.env.UID || 993980001);
const LIMITE_TELEGRAM = 4096;

// texto com conteúdo variado: aspas simples (quebram SQL mal escapado), HTML
// (quebra parse_mode), acentos e emoji (multibyte)
function gigante(n) {
  const semente = "Eu adoro jogos d'ação & aventura <b>muito</b> legais 🎮 — ";
  let s = '';
  while (s.length < n) s += semente;
  return s.slice(0, n);
}

async function semear(mode, onboarding) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  await c.query(
    'INSERT INTO students (user_id, name, age, mode, onboarding, level, profile, msg_count, last_update_id, streak_count, last_active)'
    + " VALUES ($1,'Gig',24,$2,$3,'B1','{}'::jsonb,3,1,1,CURRENT_DATE)"
    + ' ON CONFLICT (user_id) DO UPDATE SET mode=$2, onboarding=$3, updated_at=now()',
    [UID, mode, onboarding]);
  await c.query("DELETE FROM chat_memory WHERE split_part(session_id,':',1) = $1", [String(UID)]);
  await c.end();
}

async function analisa(rotulo, execucao, tamanho) {
  const d = digest(execucao);
  let erros = [], enviados = [];
  try {
    const full = await jget(API + '/executions/' + d.id + '?includeData=true');
    const rd = full.data.resultData.runData;
    for (const n of Object.keys(rd)) {
      const run = rd[n][0];
      // erro de envio ao Telegram é esperado (chat_id sintético) e não conta
      if (run.error && !/^(Enviar|Typing|Responder|Editar|Limpar)/.test(n)) {
        erros.push(n + ': ' + String(run.error.message || '').slice(0, 70));
      }
      // mede o tamanho do que o fluxo TENTOU enviar
      if (/^Enviar/.test(n)) {
        try {
          const p = full.data.resultData.runData[n][0].data;
          const t = JSON.stringify(p).length;
          enviados.push(n + '~' + t);
        } catch (x) {}
      }
    }
  } catch (x) { erros.push('leitura da execução: ' + x.message); }

  const respondeu = !!(d.reply && d.reply.trim().length > 3);
  const ok = erros.length === 0;
  console.log((ok ? 'PASSOU  ' : 'FALHOU  ') + rotulo + ' (' + tamanho + ' chars)');
  console.log('   nós: ' + (d.ran || []).length + ' | respondeu: ' + (respondeu ? 'sim' : 'não'));
  if (erros.length) console.log('   ERROS: ' + erros.join(' || '));
  console.log('');
  return ok;
}

(async () => {
  console.log('R1 — entrada gigante | user ' + UID + '\n');
  let falhas = 0;

  // 1) cadastro: nome gigante deve ser rejeitado sem quebrar
  await semear('chat', 'ask_name');
  if (!await analisa('nome gigante no cadastro', await msg(UID, gigante(4000)), 4000)) falhas++;

  // 2) conversa com 4000 chars (passa pelo LLM e pela memória)
  await semear('chat', 'done');
  if (!await analisa('conversa 4000 chars', await msg(UID, gigante(4000)), 4000)) falhas++;

  // 3) no limite exato do Telegram
  await semear('chat', 'done');
  if (!await analisa('conversa no limite (4096)', await msg(UID, gigante(4096)), 4096)) falhas++;

  // 4) o texto gigante corrompeu o estado no banco?
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const r = await c.query('SELECT name, profile, msg_count FROM students WHERE user_id=$1', [UID]);
  const mem = await c.query("SELECT count(*) n, COALESCE(max(length(message::text)),0) maior FROM chat_memory WHERE split_part(session_id,':',1)=$1", [String(UID)]);
  await c.end();
  const linha = r.rows[0] || {};
  console.log('estado após os envios:');
  console.log('   name: ' + JSON.stringify(String(linha.name || '').slice(0, 40)) + (String(linha.name || '').length > 40 ? '… (' + String(linha.name).length + ' chars)' : ''));
  console.log('   profile: ' + JSON.stringify(linha.profile).slice(0, 80));
  console.log('   chat_memory: ' + mem.rows[0].n + ' linha(s), maior com ' + mem.rows[0].maior + ' chars');
  const nomeOk = String(linha.name || '').length <= 60;
  if (!nomeOk) { falhas++; console.log('   FALHA: nome gigante foi GRAVADO no cadastro'); }

  // A spec do R1 tem DUAS partes: "não quebra" E "trunca/limita". Robustez sem
  // truncamento passa na primeira e falha na segunda — e a segunda importa
  // porque a memória de conversa tem janela de 20 turnos: mensagens de 4KB
  // inflam o prompt de todos os turnos seguintes.
  const maior = Number(mem.rows[0].maior);
  const truncou = maior < 2000;
  console.log('\ncritérios do R1:');
  console.log('   não quebra o fluxo : ' + (falhas === 0 ? 'SIM' : 'NAO'));
  console.log('   trunca/limita      : ' + (truncou ? 'SIM' : 'NAO — entrada guardada inteira ('
    + maior + ' chars); com janela de 20 turnos o prompt pode chegar a ~'
    + Math.round(maior * 20 / 1024) + ' KB'));

  console.log('\n===== RESULTADO =====');
  console.log(falhas === 0
    ? (truncou ? 'PASSOU  R1 — não quebra e trunca'
               : 'PASSOU COM RESSALVA  R1 — não quebra, mas NÃO trunca (ver acima)')
    : 'FALHOU  R1 — ' + falhas + ' problema(s)');
  console.log('\nnota: erro nos nós `Enviar *` é esperado (chat_id sintético) e não conta;');
  console.log('o teste olha erro em nós de lógica, banco e LLM.');
})().catch(e => { console.error('erro', e.message); process.exit(1); });
