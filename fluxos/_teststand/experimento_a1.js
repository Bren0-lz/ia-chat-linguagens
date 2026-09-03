// EXPERIMENTO: o teto do A1 esta suprimindo correcao e interesses?
//
// Contexto. Tres comportamentos existem nos niveis altos e somem no A1:
// persona (PS3/PS4 passam no B1, falham no A1), correcao (C1) e interesses
// (C15). O prompt do A1 injeta as MESMAS linhas de correcao e interesses que
// o B1 -- entao nao e ausencia de instrucao. A hipotese e de competicao: a
// BREVIDADE do A1 e a unica diretiva marcada como "regra dura" ("18 palavras,
// uma resposta = uma ideia central"), e corrigir ou puxar um interesse e
// sempre uma segunda ideia.
//
// Protocolo (secao 7 do handoff): baseline N=3 -> mudar UMA linha -> medir ->
// reverter -> conferir nas duas pontas. Este script mede; a alteracao do no e
// a reversao sao feitas fora dele, para nunca editar o fluxo com rodada em voo.
//
// Os detectores sao os MESMOS do C1 e do C15 da Fase B, de proposito: numeros
// medidos com regua diferente nao se comparam.
//
// USO: N8N_API_KEY=... node fluxos/_teststand/experimento_a1.js --rotulo=baseline [--n=3]
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const { Client } = require('pg');
const { msg, digest } = require('./harness');

const arg = (n, d) => (process.argv.find((a) => a.startsWith('--' + n + '=')) || '=' + d).split('=')[1];
const ROTULO = arg('rotulo', 'sem-rotulo');
const N = Number(arg('n', 3));
const SAIDA = './tr_experimento_a1.md';

let uid = 990000000 + (Date.now() % 9000000);
const novoUid = () => (uid += 3);

async function db(fn) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}

async function semear(u, interests, inferred) {
  const profile = { persona: 'buddy', interests: interests, inferred_interests: inferred || [], level: 'A1' };
  await db((c) => c.query(
    'INSERT INTO students (user_id,name,age,mode,onboarding,level,profile,msg_count,last_update_id,streak_count,last_active)'
    + " VALUES ($1,'Lucas',16,'chat','done','A1',$2::jsonb,3,1,1,now())"
    + ' ON CONFLICT (user_id) DO UPDATE SET profile=$2::jsonb,updated_at=now()',
    [u, JSON.stringify(profile)]
  ));
}

const soConversa = (d) => {
  const m = String(d.reply || '').match(/\[CONVERSA\]\s*([\s\S]*)/);
  return m ? m[1].trim() : String(d.reply || '');
};
// palavras do bloco em ingles (tudo antes da linha 🇧🇷), que e o que o teto limita
const palavrasIngles = (t) => String(t).split('🇧🇷')[0].trim().split(/\s+/).filter(Boolean).length;

(async () => {
  const linhas = [];
  const reg = (s) => { console.log(s); linhas.push(s); };
  reg('\n## ' + ROTULO + ' — ' + new Date().toISOString() + ' (N=' + N + ')\n');

  // --- correcao (mesma entrada e mesmo detector do C1) ---
  const corr = [];
  for (let i = 0; i < N; i++) {
    const u = novoUid(); await semear(u, ['🎮 Games', '🎵 Música']);
    const d = digest(await msg(u, 'i like play games'));
    const t = soConversa(d);
    if (!t.trim()) { corr.push({ vazio: true }); continue; } // vazio nunca vira aprovacao
    corr.push({ ok: /playing/i.test(t), pal: palavrasIngles(t), t });
  }

  // --- interesses (mesma entrada e mesmo detector do C15) ---
  const inte = [];
  for (let i = 0; i < N; i++) {
    const u = novoUid(); await semear(u, ['🎮 Games'], ['basketball']);
    const d = digest(await msg(u, 'hello, how are you today'));
    const t = soConversa(d);
    if (!t.trim()) { inte.push({ vazio: true }); continue; }
    inte.push({ ok: /game|basketball|play/i.test(t), pal: palavrasIngles(t), t });
  }

  // --- controle: erro que ESTA na lista "ERROS QUE CONTAM", no mesmo nivel A1 ---
  // Se o A1 corrigir aqui e nao no probe acima, a variavel nao e o nivel: e a
  // lista. "video games is fun" e concordancia sujeito-verbo, primeiro item.
  const lista = [];
  for (let i = 0; i < N; i++) {
    const u = novoUid(); await semear(u, ['🎮 Games', '🎵 Música']);
    const d = digest(await msg(u, 'video games is fun'));
    const t = soConversa(d);
    if (!t.trim()) { lista.push({ vazio: true }); continue; }
    lista.push({ ok: /games are|are fun|✔️|not\s+.video games is/i.test(t), pal: palavrasIngles(t), t });
  }

  const taxa = (a) => a.filter((x) => x.ok).length + '/' + a.length;
  const mediaPal = (a) => {
    const v = a.filter((x) => !x.vazio).map((x) => x.pal);
    return v.length ? (v.reduce((s, x) => s + x, 0) / v.length).toFixed(1) : '—';
  };
  const vazios = (a) => a.filter((x) => x.vazio).length;

  reg('- **correcao** (C1: "i like play games" -> corrige?): **' + taxa(corr) + '**'
    + ' | palavras em ingles (media): ' + mediaPal(corr) + ' | respostas vazias: ' + vazios(corr));
  reg('- **interesses** (C15: cita games/basketball?): **' + taxa(inte) + '**'
    + ' | palavras em ingles (media): ' + mediaPal(inte) + ' | respostas vazias: ' + vazios(inte));

  reg('- **controle: erro DA lista** ("video games is fun" -> corrige?): **' + taxa(lista) + '**'
    + ' | palavras em ingles (media): ' + mediaPal(lista) + ' | respostas vazias: ' + vazios(lista));

  reg('\n<details><summary>saidas cruas</summary>\n');
  corr.forEach((x, i) => reg('\ncorrecao ' + (i + 1) + ' (ok=' + !!x.ok + ', ' + x.pal + ' palavras):\n```\n' + (x.t || '(vazia)') + '\n```'));
  lista.forEach((x, i) => reg('\ncontrole-lista ' + (i + 1) + ' (ok=' + !!x.ok + ', ' + x.pal + ' palavras):\n```\n' + (x.t || '(vazia)') + '\n```'));
  inte.forEach((x, i) => reg('\ninteresses ' + (i + 1) + ' (ok=' + !!x.ok + ', ' + x.pal + ' palavras):\n```\n' + (x.t || '(vazia)') + '\n```'));
  reg('\n</details>\n');

  fs.appendFileSync(SAIDA, linhas.join('\n') + '\n');
  console.log('\nanexado em ' + SAIDA);
})();
