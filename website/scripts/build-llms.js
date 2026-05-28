#!/usr/bin/env node
/**
 * Copies every docs/**\/*.md and .mdx into static/md/ as plain .md files,
 * and emits an aggregated `static/md/llms.txt` for LLM-friendly bulk reading.
 *
 * Output paths mirror the doc slug:
 *   docs/intro.md                  → static/md/intro.md
 *   docs/tokens/colors.mdx         → static/md/tokens/colors.md
 *   docs/components/basics.mdx     → static/md/components/basics.md
 *
 * MDX noise (`import ...;`, `export const ... = ...;`, `<LiveDemo>...</LiveDemo>`)
 * is stripped so the output reads as plain Markdown when fed to an LLM.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');
const outDir = path.join(root, 'static', 'md');

function walk(dir) {
  const entries = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) entries.push(...walk(full));
    else if (full.endsWith('.md') || full.endsWith('.mdx')) entries.push(full);
  }
  return entries;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function write(file, content) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, 'utf8');
}

function relSlug(file) {
  const rel = path.relative(docsDir, file);
  return rel.replace(/\.(mdx?|md)$/, '');
}

/** Pull the `slug:` / `title:` values out of a frontmatter block. */
function parseFrontmatter(content) {
  if (!content.startsWith('---')) return { slug: null, title: null, body: content };
  const end = content.indexOf('\n---', 3);
  if (end === -1) return { slug: null, title: null, body: content };
  const block = content.slice(3, end);
  const body = content.slice(end + 4).replace(/^\n/, '');
  const slugM = block.match(/^\s*slug:\s*(.+)\s*$/m);
  const titleM = block.match(/^\s*title:\s*(.+)\s*$/m);
  const unq = s => s && s.trim().replace(/^['"]|['"]$/g, '');
  return { slug: unq(slugM && slugM[1]), title: unq(titleM && titleM[1]), body };
}

/**
 * Strip MDX-specific noise from a doc body so the output is plain Markdown:
 *   - top-level `import ... from '...';` lines (single- or multi-line)
 *   - top-level `export const ... = ...;` blocks (single- or multi-line, brace-matched)
 *   - `<LiveDemo>...</LiveDemo>` blocks, replaced with a short note
 * Code fences are preserved verbatim; we never touch text inside ``` blocks.
 */
function stripMdxNoise(src) {
  const lines = src.split('\n');
  const out = [];
  let i = 0;
  let inFence = false;

  while (i < lines.length) {
    const line = lines[i];

    // Track ``` fences so we never strip from inside them.
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      out.push(line);
      i++;
      continue;
    }

    if (inFence) {
      out.push(line);
      i++;
      continue;
    }

    // Strip `import ... ;` — may span multiple lines until first `;`.
    if (/^import\b/.test(line)) {
      let chunk = line;
      while (!/;\s*$/.test(chunk) && i + 1 < lines.length) {
        i++;
        chunk = lines[i];
      }
      i++;
      continue;
    }

    // Strip `export const X = ...;` / `export const X = { ... };`
    // — brace-match until balanced and ending `;`.
    if (/^export\s+(const|let|var|function|default)\b/.test(line)) {
      let depth = 0;
      let started = false;
      let j = i;
      while (j < lines.length) {
        const l = lines[j];
        for (const ch of l) {
          if (ch === '{' || ch === '[' || ch === '(') {
            depth++;
            started = true;
          } else if (ch === '}' || ch === ']' || ch === ')') {
            depth--;
          }
        }
        if (started && depth === 0 && /[;}]\s*$/.test(l)) {
          j++;
          break;
        }
        if (!started && /;\s*$/.test(l)) {
          j++;
          break;
        }
        j++;
      }
      i = j;
      continue;
    }

    // Replace `<LiveDemo>...</LiveDemo>` with a placeholder note.
    if (/^\s*<LiveDemo[\s>]/.test(line)) {
      // Find matching </LiveDemo>; demos can have nested tags so scan literally.
      let j = i;
      while (j < lines.length && !/<\/LiveDemo>/.test(lines[j])) j++;
      out.push('> 💡 此处有交互式 demo，请在网页版查看。');
      i = j + 1;
      continue;
    }

    out.push(line);
    i++;
  }

  // Collapse 3+ blank lines to 2.
  return out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+/, '');
}

function main() {
  if (!fs.existsSync(docsDir)) {
    console.error('[build-llms] docs/ directory not found at', docsDir);
    process.exit(0);
  }

  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  ensureDir(outDir);

  const files = walk(docsDir).sort();
  const aggregate = [];
  aggregate.push('# Unif Design — Full Documentation Bundle');
  aggregate.push('');
  aggregate.push('> 单文件聚合版。每段都带源路径与标题，方便整体粘贴给 LLM。');
  aggregate.push('');

  for (const file of files) {
    const slug = relSlug(file);
    const raw = read(file);
    const { slug: fmSlug, title, body } = parseFrontmatter(raw);
    const cleanBody = stripMdxNoise(body);
    const finalSlug = fmSlug ? fmSlug.replace(/^\/+/, '') : slug;

    // Single-page file: keep its frontmatter (title/description useful), strip MDX in body.
    const fmEnd = raw.startsWith('---') ? raw.indexOf('\n---', 3) + 4 : 0;
    const fmBlock = fmEnd ? raw.slice(0, fmEnd) + '\n' : '';
    const pageOutput = `${fmBlock}\n${cleanBody}`.replace(/\n{3,}/g, '\n\n');
    write(path.join(outDir, `${slug}.md`), pageOutput);

    if (fmSlug && finalSlug !== slug) {
      write(path.join(outDir, `${finalSlug}.md`), pageOutput);
    }

    // Aggregate block — drop the per-page frontmatter, prefer a section heading
    // (so the bundle reads as one continuous outline rather than a string of YAML).
    aggregate.push(`## ${title || finalSlug}`);
    aggregate.push('');
    aggregate.push(`*Source: \`docs/${slug}${file.endsWith('.mdx') ? '.mdx' : '.md'}\` · Slug: \`/${finalSlug}\`*`);
    aggregate.push('');
    aggregate.push(cleanBody);
    aggregate.push('');
  }

  const llms = aggregate.join('\n').replace(/\n{3,}/g, '\n\n');
  write(path.join(outDir, 'llms.txt'), llms);

  const index = files.map(f => {
    const slug = relSlug(f);
    const raw = read(f);
    const { slug: fmSlug, title } = parseFrontmatter(raw);
    const finalSlug = fmSlug ? fmSlug.replace(/^\/+/, '') : slug;
    return {
      slug: `/${finalSlug}`,
      title: title || finalSlug,
      mdPath: `/md/${finalSlug}.md`,
      filePath: `/md/${slug}.md`,
    };
  });
  write(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2));

  console.log(`[build-llms] wrote ${files.length} pages + llms.txt (${(llms.length / 1024).toFixed(1)} KB) to static/md/`);
}

main();
