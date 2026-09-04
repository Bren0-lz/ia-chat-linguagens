// JORNADA DE USUARIO REAL — percorre o produto inteiro como um aluno novo faria,
// e imprime a conversa do jeito que ele a veria (nao um placar de PASSOU/FALHOU).
//
// O objetivo NAO e substituir a bateria: e enxergar o que a bateria nao mede --
// a experiencia continua. A bateria semeia estado direto no banco para poupar
// cota; aqui o aluno passa por TUDO na ordem, como na vida real.
//
//   node fluxos/_teststand/jornada_usuario.js
//   node fluxos/_teststand/jornada_usuario.js --uid=991234567   (retomar um aluno)
//
// Cada turno gasta ~30s por causa do retry do envio ao Telegram (chatId sintetico
// falha; ver armadilha 2 do HANDOFF). A jornada inteira leva ~15 min.

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const { msg, cb, digest, nodeOut } = require('./harness');
const { matchQuestion } = require('./seed');

const TR = './tr_jornada.md';
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const UID = Number(arg('uid', 0)) || (990000000 + (Date.now() % 9000000));

const linhas = [];
function log(s) { console.log(s); linhas.push(s); }
function bot(txt) {
  if (!txt || !String(txt).trim()) { log('   BOT: (VAZIO — nada foi enviado ao aluno)'); return; }
  log(String(txt).split('\n').map(l => '   BOT| ' + l).join('\n'));
}
function aluno(txt) { log('\n   EU > ' + txt); }

// Extrai o texto que o aluno realmente veria.
//
// ATENCAO: o digest() do harness NAO cobre `Mensagem Sistema` nem `Interests
// Engine`. Sem os dois, um turno que o bot respondeu aparece aqui como VAZIO --
// e "vazio" e exatamente o que a armadilha 1 do HANDOFF manda nunca confundir
// com ausencia de resposta. Por isso a jornada le esses nos direto da execucao.
function falaDoBot(exec, d) {
  const rd = exec && exec.data && exec.data.resultData && exec.data.resultData.runData;
  const partes = [];
  const base = (d.reply || '').replace(/\[(cadastro|placement|gabarito|CONVERSA|prof\.feedback|prof\.det|PROFESSOR|DUVIDA|config|modo)\]\s*/g, '');
  if (base.trim()) partes.push(base.trim());
  if (rd) {
    const sys = nodeOut(rd, 'Mensagem Sistema');
    if (sys && sys.sysText) partes.push(String(sys.sysText).trim());
    const int = nodeOut(rd, 'Interests Engine');
    if (int) for (const k of ['reply', 'text', 'menuText', 'confirmText']) {
      if (int[k] && String(int[k]).trim()) partes.push(String(int[k]).trim());
    }
  }
  return partes.join('\n');
}

// Rota que o Roteador Mestre REGISTROU — nunca rotular o turno pela ordem de
// envio (armadilha 3 do HANDOFF).
function rotaDe(exec) {
  const rd = exec && exec.data && exec.data.resultData && exec.data.resultData.runData;
  const r = rd && nodeOut(rd, 'Roteador Mestre');
  return r ? (r.route + (r.subroute ? ':' + r.subroute : '')) : '?';
}

// Responde a questao de nivelamento corrente. modo: 'certo' | 'errado'
function respostaPara(exec, modo) {
  const pl = nodeOut(exec.data.resultData.runData, 'Placement Engine');
  const texto = pl && pl.text ? pl.text : '';
  const m = matchQuestion(texto);
  if (!m) return modo === 'certo' ? 'yes' : 'zzz';
  if (modo === 'errado') {
    if (m.qtype === 'mc' && Array.isArray(m.options)) {
      const erradas = m.options.filter(o => o !== m.answer);
      return erradas.length ? erradas[0] : 'no';
    }
    return 'zzz';
  }
  return m.answer;
}

(async () => {
  log('# Jornada de usuario real — v7.4 (fluxo ao vivo)\n');
  log('> aluno sintetico `' + UID + '`, rodada de ' + new Date().toISOString());
  log('> Cada bloco e um turno: o que EU mandei e o que o BOT respondeu.\n');

  // ---------------- 1. Onboarding ----------------
  log('\n## 1. Primeiro contato\n');
  aluno('oi');
  let e = await msg(UID, 'oi');
  let d = digest(e);
  bot(falaDoBot(e, d));

  aluno('Mariana');
  e = await msg(UID, 'Mariana'); d = digest(e); bot(falaDoBot(e, d));

  aluno('17');
  e = await msg(UID, '17'); d = digest(e); bot(falaDoBot(e, d));

  // ---------------- 2. Nivelamento ----------------
  log('\n## 2. Teste de nivel (escolhi "sei o basico")\n');
  aluno('[botao] 📖 Sei o básico, frases simples');
  e = await cb(UID, 'pl_start_A2'); d = digest(e); bot(falaDoBot(e, d));

  // Aluno mediano: acerta e erra alternado, para nao ancorar nas pontas.
  //
  // O laco vai ate o teste ACABAR, nao ate um numero fixo de turnos. Sair antes
  // deixa placement_state='in_progress', e dai o Roteador (corretamente) manda
  // TODO callback seguinte para system_msg:in_test -- persona, interesses e
  // conversa viram "Estamos no meio do teste" e a jornada mede a si mesma.
  let turnosNivel = 0;
  for (let i = 0; i < 16; i++) {
    const modo = (i % 3 === 2) ? 'errado' : 'certo';
    const r = respostaPara(e, modo);
    aluno(r + '   (' + modo + ')');
    e = await msg(UID, r); d = digest(e); turnosNivel++;
    bot(falaDoBot(e, d));
    const st = d.student && d.student.placement_state;
    if (!st || st.status !== 'in_progress') { log('\n   [nivelamento concluido em ' + turnosNivel + ' turnos]'); break; }
    if (i === 15) log('\n   >>> ATENCAO: 16 turnos e o nivelamento NAO terminou (idx=' + (st && st.idx) + ') — o resto da jornada estaria contaminado');
  }
  {
    const st = (await (async () => digest(await msg(UID, '/progresso')))()).student;
    log('\n   [estado apos o nivelamento] nivel=' + (st && st.level) +
        ' onboarding=' + (st && st.onboarding) +
        ' placement=' + (st && st.placement_state ? st.placement_state.status : 'null'));
  }

  // ---------------- 3. Persona ----------------
  log('\n## 3. Escolha de personalidade\n');
  aluno('[botao] Coach');
  e = await cb(UID, 'persona_coach'); d = digest(e); bot(falaDoBot(e, d));

  // ---------------- 4. Interesses ----------------
  log('\n## 4. Interesses\n');
  aluno('[botao] 🎮 Games');
  e = await cb(UID, 'int_games'); d = digest(e); bot(falaDoBot(e, d));
  aluno('[botao] ✍️ Outro');
  e = await cb(UID, 'int_other'); d = digest(e); bot(falaDoBot(e, d));
  aluno('skate');
  e = await msg(UID, 'skate'); d = digest(e); bot(falaDoBot(e, d));
  aluno('[botao] ✅ Pronto');
  e = await cb(UID, 'int_done'); d = digest(e); bot(falaDoBot(e, d));

  // ---------------- 5. Conversa ----------------
  log('\n## 5. Modo Conversa\n');
  aluno('[botao] 💬 Conversa');
  e = await cb(UID, 'mode_chat'); d = digest(e); bot(falaDoBot(e, d));

  const turnos = [
    'hi! my name is Mariana',
    'i like play video games',           // erro classico: deve corrigir (C1)
    'nao entendi',                        // deve repetir mais simples, sem trocar de assunto (C7)
    'eu prefiro falar em portugues',      // deve seguir em ingles e convidar de volta (C2)
    'what do you like to do?',
  ];
  for (const t of turnos) { aluno(t); e = await msg(UID, t); d = digest(e); bot(falaDoBot(e, d)); }

  // ---------------- 6. Professor ----------------
  log('\n## 6. Modo Professor\n');
  aluno('/menu');
  e = await msg(UID, '/menu'); d = digest(e); bot(falaDoBot(e, d));
  aluno('[botao] 📚 Professor');
  e = await cb(UID, 'mode_teacher'); d = digest(e); bot(falaDoBot(e, d));
  aluno('[botao] ▶️ Começar questões');
  e = await cb(UID, 't_start'); d = digest(e); bot(falaDoBot(e, d));

  let gabarito = d.expectedAnswer;
  aluno('qual é a resposta?   (pedido de gabarito — NAO pode entregar)');
  e = await msg(UID, 'qual é a resposta?'); d = digest(e);
  const saidaSpoiler = falaDoBot(e, d);
  bot(saidaSpoiler);
  log('   [rota registrada: ' + rotaDe(e) + ']');
  if (gabarito) {
    const vazou = saidaSpoiler.toLowerCase().includes(String(gabarito).toLowerCase());
    log('\n   >>> gabarito era "' + gabarito + '" — vazou na resposta? ' + (vazou ? 'SIM (FALHA)' : 'nao'));
  }

  aluno('zzz   (resposta errada de proposito)');
  e = await msg(UID, 'zzz'); d = digest(e); bot(falaDoBot(e, d));

  aluno('[botao] 💡 Tirar dúvida');
  e = await cb(UID, 't_doubt'); d = digest(e); bot(falaDoBot(e, d));
  aluno('qual a diferença entre have e has?');
  e = await msg(UID, 'qual a diferença entre have e has?'); d = digest(e); bot(falaDoBot(e, d));

  // ---------------- 7. Comandos ----------------
  log('\n## 7. Comandos do sistema\n');
  for (const c of ['/progresso', '/help', '/xyzabc']) {
    aluno(c); e = await msg(UID, c); d = digest(e);
    const sys = nodeOut(e.data.resultData.runData, 'Mensagem Sistema');
    bot(falaDoBot(e, d));
  }

  log('\n---\n\n_aluno de teste `' + UID + '` — limpar com `node db/cleanup_test_users.js --apply`_');
  fs.writeFileSync(TR, linhas.join('\n'));
  console.log('\n\ntranscricao salva em ' + TR);
})().catch(e => { console.error('FATAL', e); fs.writeFileSync(TR, linhas.join('\n')); process.exit(1); });
