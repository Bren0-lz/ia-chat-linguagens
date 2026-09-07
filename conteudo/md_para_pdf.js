// Converte um .md do repositorio em PDF, para o Breno ler fora do terminal.
//
// Nao ha pandoc nem puppeteer nesta maquina, e o plano diz para nao instalar nada:
// entao o caminho e markdown -> HTML (conversor proprio, abaixo) -> Chrome headless
// --print-to-pdf. O subconjunto de markdown suportado e o que os relatorios deste
// repositorio usam: titulos, tabelas, listas, blocos de codigo, citacao, regua,
// negrito/italico/codigo inline e links.
//
//   node conteudo/md_para_pdf.js RELATORIO_DIAGNOSTICO_v8.md
//   node conteudo/md_para_pdf.js entrada.md saida.pdf
//
// Sai 1 se o PDF nao for produzido -- "gerou sem erro" nao e prova de que o arquivo existe.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].find(p => fs.existsSync(p));

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Formatacao inline. O codigo inline e extraido ANTES do resto, senao `**` dentro
// de crase viraria negrito.
function inline(s) {
  const codigos = [];
  let t = esc(s).replace(/`([^`]+)`/g, (_, c) => {
    codigos.push(c);
    return '\u0000' + (codigos.length - 1) + '\u0000';
  });
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  t = t.replace(/\u0000(\d+)\u0000/g, (_, i) => '<code>' + codigos[Number(i)] + '</code>');
  return t;
}

function linhaTabela(l) {
  return l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
}

function converte(md) {
  const linhas = md.split('\n');
  const out = [];
  let i = 0;

  while (i < linhas.length) {
    const l = linhas[i];

    // bloco de codigo cercado
    if (/^```/.test(l)) {
      const corpo = [];
      i++;
      while (i < linhas.length && !/^```/.test(linhas[i])) { corpo.push(linhas[i]); i++; }
      i++;
      out.push('<pre><code>' + esc(corpo.join('\n')) + '</code></pre>');
      continue;
    }

    // tabela: cabecalho + separador |---|
    if (/^\s*\|/.test(l) && i + 1 < linhas.length && /^\s*\|[\s:|-]+\|\s*$/.test(linhas[i + 1])) {
      const cab = linhaTabela(l);
      i += 2;
      const corpo = [];
      while (i < linhas.length && /^\s*\|/.test(linhas[i])) { corpo.push(linhaTabela(linhas[i])); i++; }
      out.push('<table><thead><tr>' + cab.map(c => '<th>' + inline(c) + '</th>').join('') +
        '</tr></thead><tbody>' +
        corpo.map(r => '<tr>' + r.map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') +
        '</tbody></table>');
      continue;
    }

    // citacao (pode ter varias linhas seguidas)
    if (/^>\s?/.test(l)) {
      const corpo = [];
      while (i < linhas.length && /^>\s?/.test(linhas[i])) { corpo.push(linhas[i].replace(/^>\s?/, '')); i++; }
      out.push('<blockquote>' + inline(corpo.join(' ')) + '</blockquote>');
      continue;
    }

    // lista nao ordenada
    if (/^\s*[-*]\s+/.test(l)) {
      const itens = [];
      while (i < linhas.length && /^\s*[-*]\s+/.test(linhas[i])) {
        itens.push(linhas[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      out.push('<ul>' + itens.map(x => '<li>' + inline(x) + '</li>').join('') + '</ul>');
      continue;
    }

    // lista ordenada
    if (/^\s*\d+\.\s+/.test(l)) {
      const itens = [];
      while (i < linhas.length && /^\s*\d+\.\s+/.test(linhas[i])) {
        itens.push(linhas[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      out.push('<ol>' + itens.map(x => '<li>' + inline(x) + '</li>').join('') + '</ol>');
      continue;
    }

    const h = l.match(/^(#{1,6})\s+(.*)$/);
    if (h) { out.push('<h' + h[1].length + '>' + inline(h[2]) + '</h' + h[1].length + '>'); i++; continue; }

    if (/^\s*---+\s*$/.test(l)) { out.push('<hr>'); i++; continue; }

    if (!l.trim()) { i++; continue; }

    // paragrafo: junta ate a proxima linha em branco ou inicio de outro bloco
    const par = [];
    while (i < linhas.length && linhas[i].trim() &&
           !/^(#{1,6}\s|```|>|\s*[-*]\s|\s*\d+\.\s|\s*\|)/.test(linhas[i]) &&
           !/^\s*---+\s*$/.test(linhas[i])) {
      par.push(linhas[i]); i++;
    }
    if (par.length) out.push('<p>' + inline(par.join(' ')) + '</p>');
    else i++;
  }
  return out.join('\n');
}

const CSS = `
  @page { size: A4; margin: 18mm 16mm; }
  body { font: 10.5pt/1.55 "Segoe UI", system-ui, sans-serif; color: #1a1a1a; }
  h1 { font-size: 20pt; border-bottom: 2px solid #333; padding-bottom: 6px; margin: 0 0 14px; }
  h2 { font-size: 14pt; margin: 22px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
  h3 { font-size: 11.5pt; margin: 16px 0 6px; }
  p { margin: 7px 0; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 9.5pt; }
  th, td { border: 1px solid #bbb; padding: 5px 8px; text-align: left; vertical-align: top; }
  th { background: #eee; font-weight: 600; }
  code { background: #f2f2f2; padding: 1px 4px; border-radius: 3px;
         font-family: Consolas, monospace; font-size: 9pt; }
  pre { background: #f6f6f6; border-left: 3px solid #999; padding: 8px 10px;
        overflow-wrap: break-word; white-space: pre-wrap; page-break-inside: avoid; }
  pre code { background: none; padding: 0; font-size: 8.5pt; }
  blockquote { border-left: 3px solid #888; margin: 10px 0; padding: 4px 12px;
               color: #444; background: #fafafa; }
  ul, ol { margin: 7px 0; padding-left: 22px; }
  li { margin: 3px 0; }
  hr { border: none; border-top: 1px solid #ddd; margin: 18px 0; }
  h2, h3 { page-break-after: avoid; }
  table, blockquote { page-break-inside: avoid; }
`;

function main() {
  const entrada = process.argv[2];
  if (!entrada) { console.error('uso: node conteudo/md_para_pdf.js <arquivo.md> [saida.pdf]'); process.exit(1); }
  if (!fs.existsSync(entrada)) { console.error('nao encontrei: ' + entrada); process.exit(1); }
  if (!CHROME) { console.error('Chrome nao encontrado — sem ele nao ha como gerar o PDF'); process.exit(1); }

  const saida = path.resolve(process.argv[3] || entrada.replace(/\.md$/i, '') + '.pdf');
  const md = fs.readFileSync(entrada, 'utf8');
  const titulo = (md.match(/^#\s+(.*)$/m) || [, path.basename(entrada)])[1];

  const html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<title>' + esc(titulo) + '</title><style>' + CSS + '</style></head><body>' +
    converte(md) + '</body></html>';

  const tmp = path.join(require('os').tmpdir(), 'iachat_rel_' + Date.now() + '.html');
  fs.writeFileSync(tmp, html, 'utf8');

  if (fs.existsSync(saida)) fs.unlinkSync(saida);
  try {
    execFileSync(CHROME, [
      '--headless', '--disable-gpu', '--no-sandbox', '--no-pdf-header-footer',
      '--print-to-pdf=' + saida, 'file:///' + tmp.replace(/\\/g, '/'),
    ], { stdio: 'pipe', timeout: 120000 });
  } catch (e) {
    // o Chrome headless as vezes devolve codigo != 0 mesmo produzindo o arquivo;
    // quem decide e a existencia do PDF, conferida abaixo.
  }
  fs.unlinkSync(tmp);

  if (!fs.existsSync(saida) || fs.statSync(saida).size < 1000) {
    console.error('FALHOU: o PDF nao foi produzido (ou saiu vazio): ' + saida);
    process.exit(1);
  }
  console.log('PDF: ' + saida + '  (' + Math.round(fs.statSync(saida).size / 1024) + ' KB)');
  process.exit(0);
}

if (require.main === module) main();
module.exports = { converte };
