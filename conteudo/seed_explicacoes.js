// Leva as 60 explicacoes de `conteudo/explicacoes/<NIVEL>/<NN>-<slug>.md` para a tabela
// `topic_explanations` (migration 013). O T008 le dessa tabela em vez de gerar no ar.
//
// Uso:
//   node conteudo/seed_explicacoes.js             # aplica (upsert idempotente)
//   node conteudo/seed_explicacoes.js --dry-run   # so diz o que faria; nao escreve nada
//   node conteudo/seed_explicacoes.js --conferir  # delega para confere_explicacoes_db.js
//
// A CHAVE E (cefr_level, topic_order), e o motivo importa:
//
//   - E o que o fluxo TEM na mao. No no `Professor Engine` o estado do aluno da `lvl` e
//     `ts.idx` (indice 0-based do topico na trilha); a explicacao do turno e `track[ts.idx]`.
//     `topic_order = ts.idx + 1` e uma consulta direta, sem casar string nenhuma.
//   - O TITULO nao serve de chave. As questoes se ligam ao topico por
//     `practice_questions.track_topic` (o titulo), e ha 10 pares (cefr_level, track_topic) em
//     que o nivel da questao contradiz o nivel que o TRACK da ao topico — "Presente simples"
//     aparece marcado A1, A2 e B1, quando o TRACK o poe em A2/1. Chavear por titulo, ou por
//     (nivel-da-questao, titulo), criaria duas ou tres linhas para o mesmo topico e o T008
//     serviria a explicacao errada, ou nenhuma. Aqui o TRACK e a UNICA autoridade sobre
//     (nivel, ordem): sao 60 topicos, 60 linhas, e a inconsistencia das questoes nao entra.
//     `title` e `slug` ficam como carga, para diagnostico e para o abre-alas — nunca como chave.
//   - Republicacao de texto revisado por humano: o .md continua sendo a fonte versionada (o
//     equivalente do `questoes.json` aqui e a propria arvore de .md, que ja esta em git). Editar
//     o .md e rodar de novo ATUALIZA a linha — o upsert casa por (nivel, ordem), nao por corpo.
//
// IDEMPOTENCIA: o UPDATE so acontece quando algum campo mudou de verdade
// (`WHERE ... IS DISTINCT FROM ...`), entao rodar duas vezes seguidas nao mexe nem no
// `updated_at`. Rodar de novo com um .md alterado atualiza a linha existente, sem criar outra.
//
// Nao escreve em NENHUMA outra tabela. DATABASE_URL vem do ambiente ou do `.env` da raiz, e
// nao e impressa em lugar nenhum.

const fs = require('fs');
const path = require('path');
const { listaMd, separaFrontmatter, DIR_CONTEUDO } = require('./valida_explicacoes.js');

const RAIZ = path.join(__dirname, '..');
const TABELA = 'topic_explanations';
const TRACK_JSON = path.join(__dirname, 'track.json');

// ------------------------------------------------------------------ leitura dos .md

function trackTopicos() {
  const t = JSON.parse(fs.readFileSync(TRACK_JSON, 'utf8'));
  if (!Array.isArray(t.topicos) || !t.topicos.length) {
    throw new Error('track.json sem topicos — rode `node conteudo/extrai_track.js`');
  }
  return t.topicos;
}

// Le os .md e devolve as linhas na ordem (nivel do TRACK, ordem). Explode se algum arquivo
// contradisser o TRACK: seed que "corrige" o dado calado e como o banco ganha lixo.
function leExplicacoes() {
  const topicos = trackTopicos();
  const porChave = new Map(topicos.map((t) => [t.nivel + '/' + t.ordem, t]));
  const vistos = new Map();
  const erros = [];

  for (const caminho of listaMd(DIR_CONTEUDO)) {
    const rel = path.relative(RAIZ, caminho).replace(/\\/g, '/');
    const fm = separaFrontmatter(fs.readFileSync(caminho, 'utf8'));
    if (fm.erro) { erros.push(rel + ': ' + fm.erro); continue; }
    const c = fm.campos;
    const ordem = Number(c.ordem);
    if (!c.nivel || !Number.isInteger(ordem)) {
      erros.push(rel + ': frontmatter sem nivel/ordem utilizaveis');
      continue;
    }
    const chave = c.nivel + '/' + ordem;
    const t = porChave.get(chave);
    if (!t) { erros.push(rel + ': (' + chave + ') nao existe no TRACK'); continue; }
    if (vistos.has(chave)) {
      erros.push(rel + ': (' + chave + ') ja veio de ' + vistos.get(chave).arquivo);
      continue;
    }
    if (c.slug !== t.slug || c.titulo !== t.titulo) {
      erros.push(rel + ': slug/titulo divergem do TRACK (.md diz "' + c.slug + '"/"' + c.titulo +
        '", TRACK diz "' + t.slug + '"/"' + t.titulo + '")');
      continue;
    }
    if (!fm.corpo || !fm.corpo.trim()) { erros.push(rel + ': corpo vazio'); continue; }
    vistos.set(chave, {
      nivel: t.nivel, ordem: t.ordem, slug: t.slug, titulo: t.titulo,
      corpo: fm.corpo.trim(), modelo: c.modelo || null, arquivo: rel
    });
  }

  for (const t of topicos) {
    if (!vistos.has(t.nivel + '/' + t.ordem)) {
      erros.push('sem .md para ' + t.nivel + '/' + t.ordem + ' (' + t.titulo + ')');
    }
  }
  if (erros.length) {
    throw new Error('os .md nao batem com o TRACK:\n  - ' + erros.join('\n  - '));
  }

  const ordemNivel = new Map(topicos.map((t, i) => [t.nivel + '/' + t.ordem, i]));
  return [...vistos.values()].sort((a, b) =>
    ordemNivel.get(a.nivel + '/' + a.ordem) - ordemNivel.get(b.nivel + '/' + b.ordem));
}

// ------------------------------------------------------------------ banco

function conecta() {
  if (!process.env.DATABASE_URL) {
    try { require(path.join(RAIZ, 'node_modules', 'dotenv')).config({ path: path.join(RAIZ, '.env') }); }
    catch (e) { /* sem dotenv: resta o ambiente */ }
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL ausente (ambiente ou .env da raiz)');
  }
  const { Client } = require(path.join(RAIZ, 'db', 'node_modules', 'pg'));
  return new Client({ connectionString: process.env.DATABASE_URL, ssl: false });
}

async function leDoBanco(c) {
  const r = await c.query('SELECT cefr_level, topic_order, slug, title, body, model, updated_at' +
    ' FROM ' + TABELA + ' ORDER BY cefr_level, topic_order');
  return r.rows.map((x) => ({
    nivel: x.cefr_level, ordem: x.topic_order, slug: x.slug, titulo: x.title,
    corpo: x.body, modelo: x.model, updated_at: x.updated_at
  }));
}

const SQL_UPSERT =
  'INSERT INTO ' + TABELA + ' (cefr_level, topic_order, slug, title, body, model, updated_at)' +
  ' VALUES ($1, $2, $3, $4, $5, $6, NOW())' +
  ' ON CONFLICT (cefr_level, topic_order) DO UPDATE SET' +
  '   slug = EXCLUDED.slug, title = EXCLUDED.title, body = EXCLUDED.body,' +
  '   model = EXCLUDED.model, updated_at = NOW()' +
  ' WHERE ' + TABELA + '.slug      IS DISTINCT FROM EXCLUDED.slug' +
  '    OR ' + TABELA + '.title     IS DISTINCT FROM EXCLUDED.title' +
  '    OR ' + TABELA + '.body      IS DISTINCT FROM EXCLUDED.body' +
  '    OR ' + TABELA + '.model     IS DISTINCT FROM EXCLUDED.model' +
  ' RETURNING (xmax = 0) AS inserida';

async function semeia(linhas, opcoes) {
  const dryRun = !!(opcoes && opcoes.dryRun);
  const c = conecta();
  await c.connect();
  try {
    const antes = await leDoBanco(c);
    const porChave = new Map(antes.map((r) => [r.nivel + '/' + r.ordem, r]));
    const resumo = { inseridas: 0, atualizadas: 0, iguais: 0, removidas: 0, detalhes: [] };

    if (dryRun) {
      for (const l of linhas) {
        const a = porChave.get(l.nivel + '/' + l.ordem);
        if (!a) { resumo.inseridas++; resumo.detalhes.push('INSERIRIA ' + l.nivel + '/' + l.ordem); }
        else if (a.slug !== l.slug || a.titulo !== l.titulo || a.corpo !== l.corpo || a.modelo !== l.modelo) {
          resumo.atualizadas++; resumo.detalhes.push('ATUALIZARIA ' + l.nivel + '/' + l.ordem);
        } else resumo.iguais++;
      }
      const doArquivo = new Set(linhas.map((l) => l.nivel + '/' + l.ordem));
      for (const a of antes) {
        if (!doArquivo.has(a.nivel + '/' + a.ordem)) {
          resumo.removidas++; resumo.detalhes.push('REMOVERIA ' + a.nivel + '/' + a.ordem);
        }
      }
      return resumo;
    }

    await c.query('BEGIN');
    for (const l of linhas) {
      const r = await c.query(SQL_UPSERT, [l.nivel, l.ordem, l.slug, l.titulo, l.corpo, l.modelo]);
      if (r.rowCount === 0) resumo.iguais++;
      else if (r.rows[0].inserida) { resumo.inseridas++; resumo.detalhes.push('INSERIU ' + l.nivel + '/' + l.ordem); }
      else { resumo.atualizadas++; resumo.detalhes.push('ATUALIZOU ' + l.nivel + '/' + l.ordem); }
    }
    // Topico que saiu do TRACK deixa linha orfa, que o T008 nunca serviria mas confundiria a
    // conferencia. So apaga na tabela nova, e so o que nao tem .md correspondente.
    const del = await c.query(
      'DELETE FROM ' + TABELA + ' t WHERE NOT EXISTS (' +
      '  SELECT 1 FROM UNNEST($1::text[], $2::int[]) AS l(n, o)' +
      '   WHERE l.n = t.cefr_level AND l.o = t.topic_order)',
      [linhas.map((l) => l.nivel), linhas.map((l) => l.ordem)]);
    resumo.removidas = del.rowCount;
    if (del.rowCount) resumo.detalhes.push('REMOVEU ' + del.rowCount + ' linha(s) sem .md');
    await c.query('COMMIT');
    return resumo;
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (e2) { /* conexao ja caiu */ }
    throw e;
  } finally {
    await c.end();
  }
}

module.exports = { leExplicacoes, leDoBanco, conecta, TABELA };

// ------------------------------------------------------------------ CLI

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.indexOf('--conferir') >= 0) {
    require('./confere_explicacoes_db.js');
  } else {
    const dryRun = args.indexOf('--dry-run') >= 0;
    let linhas;
    try { linhas = leExplicacoes(); }
    catch (e) { console.error('REPROVOU: ' + e.message); process.exit(1); }
    console.log('lidos ' + linhas.length + ' .md de ' + path.relative(RAIZ, DIR_CONTEUDO).replace(/\\/g, '/'));
    semeia(linhas, { dryRun: dryRun }).then((r) => {
      for (const d of r.detalhes) console.log('  ' + d);
      console.log((dryRun ? '[dry-run] ' : '') + 'inseridas=' + r.inseridas +
        ' atualizadas=' + r.atualizadas + ' iguais=' + r.iguais + ' removidas=' + r.removidas);
      console.log('confira com: node conteudo/confere_explicacoes_db.js');
    }).catch((e) => { console.error('ERRO: ' + e.message); process.exit(1); });
  }
}
