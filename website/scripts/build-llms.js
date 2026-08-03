#!/usr/bin/env node
/**
 * 生成 LLM 友好的文档产物(遵循 llmstxt.org 约定,放站点根):
 *   static/llms.txt        → /llms.txt:索引(H1 + 摘要 + 按目录分节的链接列表)
 *   static/llms-full.txt   → /llms-full.txt:全站全文聚合(一次性喂大 context window)
 *   static/md/<slug>.md    → 每页纯 Markdown(llms.txt 的链接指向这些)
 *
 * MDX noise 会转换为纯 Markdown：代码示例保持原样，exported Demo 与直接
 * `<LiveDemo>` 生成完整的 ```tsx 源码块，供 LLM 获取可执行组件用法。
 *
 * 【由 package.json 的 build/start 显式调用】(`node scripts/build-llms.js && docusaurus ...`)——
 * 不挂 prebuild/prestart 钩子,因为 yarn 4(berry)不触发 npm-style 生命周期钩子,会被跳过。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const {
  assembleMarkdown,
  convertMdxBody,
  parseFrontmatter,
  rewriteInternalLinks,
} = require('./llms/markdown');
const { buildRouteMap } = require('./llms/routes');

const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');
const staticDir = path.join(root, 'static');
const MD_SUBDIR = 'md';
const outDir = path.join(staticDir, MD_SUBDIR);

// 站点名从 docusaurus.config 的 title 读 —— 本脚本各库共用,自动适配,不硬编码库名。
function readSiteTitle() {
  for (const ext of ['ts', 'js', 'mjs']) {
    const cfg = path.join(root, `docusaurus.config.${ext}`);
    if (fs.existsSync(cfg)) {
      const m = fs.readFileSync(cfg, 'utf8').match(/title:\s*['"]([^'"]+)['"]/);
      if (m) return m[1];
    }
  }
  return 'Documentation';
}

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

function canonicalOutputPath(outputPath) {
  const resolved = path.resolve(staticDir, outputPath);
  const base = path.resolve(outDir) + path.sep;
  if (!resolved.startsWith(base)) {
    throw new Error(`canonical output escapes ${MD_SUBDIR}/: ${outputPath}`);
  }
  return resolved;
}

function pageFrontmatter(raw) {
  if (!raw.startsWith('---')) return '';
  const end = raw.indexOf('\n---', 3);
  return end === -1 ? '' : `${raw.slice(0, end + 4)}\n`;
}

function createIndexEntry(document) {
  const publicRoute = document.frontmatterRoute || document.sourceRoute;
  const publicSlug = publicRoute.slice('/docs'.length);
  const segments = document.relSlug.split('/');
  return {
    title: document.title || publicSlug.slice(1),
    mdPath: document.outputPath,
    slug: publicSlug,
    section: segments.length > 1 ? segments[0] : '概览',
    description: document.description || null,
  };
}

function formatFullMetadata(document) {
  return `*Source: \`docs/${document.sourcePath}\` · Mirror: \`${document.outputPath}\`*`;
}

function buildLlmsIndex(siteName, entries) {
  const bySection = {};
  for (const entry of entries) {
    (bySection[entry.section] = bySection[entry.section] || []).push(entry);
  }

  const lines = [
    `# ${siteName}`,
    '',
    `> ${siteName} 文档索引。每个链接是该页的纯 Markdown 版(供 LLM 抓取);需要完整全文一次性喂入时用 llms-full.txt。`,
    '',
    '- [完整全文](llms-full.txt) — 全站全文聚合，适合一次性加载。',
    '',
  ];
  for (const section of sortSections(Object.keys(bySection))) {
    lines.push(`## ${section}`, '');
    for (const entry of bySection[section]) {
      lines.push(formatIndexLine(entry));
    }
    lines.push('');
  }
  return lines.join('\n');
}

function main() {
  const SITE_NAME = readSiteTitle();
  if (!fs.existsSync(docsDir)) {
    console.error('[build-llms] docs/ directory not found at', docsDir);
    process.exit(0);
  }

  const files = walk(docsDir).sort();
  const sourceDocuments = files.map((file) => {
    const sourcePath = path.relative(docsDir, file).split(path.sep).join('/');
    const sourceName = `docs/${sourcePath}`;
    const raw = read(file);
    const frontmatter = parseFrontmatter(raw);
    return {
      id: sourcePath,
      file,
      sourceName,
      sourcePath,
      raw,
      slug: frontmatter.slug,
      title: frontmatter.title,
      description: frontmatter.description,
      body: frontmatter.body,
    };
  });
  const routeMap = buildRouteMap(sourceDocuments);
  const head = [
    `# ${SITE_NAME} — 全文文档聚合`,
    '',
    '> 单文件聚合版。每段都带源路径与标题，方便整体粘贴给 LLM。',
    '',
  ];
  const bodyBlocks = [];
  const tocTitles = [];
  const pages = routeMap.documents.map((document) => {
    const convertedBody = convertMdxBody(document.body, document.sourceName);
    const cleanBody = rewriteInternalLinks(convertedBody, document, routeMap);
    const fullBody = rewriteInternalLinks(
      convertedBody,
      { ...document, outputPath: 'llms-full.txt' },
      routeMap
    );

    const pageOutput = assembleMarkdown([
      pageFrontmatter(document.raw),
      cleanBody,
    ]);
    const outputFile = canonicalOutputPath(document.outputPath);

    const title =
      document.title ||
      (document.frontmatterRoute || document.sourceRoute).slice(
        '/docs/'.length
      );
    tocTitles.push(title);
    bodyBlocks.push(`## ${title}`);
    bodyBlocks.push('');
    bodyBlocks.push(formatFullMetadata(document));
    bodyBlocks.push('');
    bodyBlocks.push(fullBody);
    bodyBlocks.push('');
    return { outputFile, pageOutput };
  });

  const llmsFull = assembleMarkdown([
    ...head,
    buildToc(tocTitles),
    ...bodyBlocks,
  ]);
  const entries = routeMap.documents.map(createIndexEntry);
  const llmsIndex = buildLlmsIndex(SITE_NAME, entries);

  // 所有 source、Demo、route 与链接都在内存中验证完成后才触碰正式目标。
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  ensureDir(outDir);
  for (const page of pages) {
    write(page.outputFile, page.pageOutput);
  }
  write(path.join(staticDir, 'llms-full.txt'), llmsFull);
  write(path.join(staticDir, 'llms.txt'), llmsIndex);
  write(
    path.join(outDir, 'index.json'),
    `${JSON.stringify(entries, null, 2)}\n`
  );

  console.log(
    `[build-llms] llms.txt(索引 ${entries.length} 页) + llms-full.txt(${(llmsFull.length / 1024).toFixed(1)} KB) + ${pages.length} 页 md/*.md`
  );
}

function buildToc(titles) {
  return ['## 目录', '', ...titles.map((t) => `- ${t}`), ''].join('\n');
}
function formatIndexLine(e) {
  return e.description
    ? `- [${e.title}](${e.mdPath}) — ${e.description}`
    : `- [${e.title}](${e.mdPath})`;
}
function sortSections(keys) {
  return [...keys].sort((a, b) =>
    a === '概览' ? -1 : b === '概览' ? 1 : a.localeCompare(b)
  );
}

module.exports = {
  assembleMarkdown,
  buildLlmsIndex,
  buildToc,
  convertMdxBody,
  createIndexEntry,
  formatIndexLine,
  formatFullMetadata,
  parseFrontmatter,
  sortSections,
};

if (require.main === module) main();
