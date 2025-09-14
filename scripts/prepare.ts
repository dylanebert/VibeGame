#!/usr/bin/env node

import fs from 'fs/promises';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const GITHUB_PAGES_BASE = 'https://dylanebert.github.io/vibegame';
function extractSection(content, tag) {
  const startTag = `<!-- LLM:${tag} -->`;
  const endTag = `<!-- /LLM:${tag} -->`;

  const startIndex = content.indexOf(startTag);
  const endIndex = content.indexOf(endTag);

  if (startIndex === -1 || endIndex === -1) {
    return null;
  }

  return content.substring(startIndex + startTag.length, endIndex).trim();
}

function getModuleName(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath);
  const parts = relativePath.split(path.sep);

  if (parts[0] === 'src') {
    if (parts[1] === 'core') {
      return 'core';
    } else if (parts[1] === 'plugins' && parts[2]) {
      return parts[2];
    }
  }

  return null;
}

function formatModuleName(name) {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function syncVersions() {
  const mainPackagePath = path.join(ROOT_DIR, 'package.json');
  const mainPackage = JSON.parse(await fs.readFile(mainPackagePath, 'utf-8'));
  const version = mainPackage.version;

  const createPackagePath = path.join(
    ROOT_DIR,
    'create-vibegame',
    'package.json'
  );
  const createPackage = JSON.parse(
    await fs.readFile(createPackagePath, 'utf-8')
  );

  if (createPackage.version !== version) {
    createPackage.version = version;
    await fs.writeFile(
      createPackagePath,
      JSON.stringify(createPackage, null, 2) + '\n'
    );
    console.log(`✓ Synced create-vibegame version to ${version}`);
  } else {
    console.log(`✓ Versions already in sync (${version})`);
  }
}

async function buildLLMDocs() {
  console.log('Building LLM documentation...');

  const contextFiles = await glob('**/context.md', {
    cwd: ROOT_DIR,
    ignore: ['node_modules/**', 'dist/**', 'example/**', 'layers/**'],
  });

  const modules = new Map();
  const references = new Map();
  const examples = new Map();

  for (const file of contextFiles) {
    const filePath = path.join(ROOT_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const moduleName = getModuleName(filePath);

    if (!moduleName) continue;

    const overview = extractSection(content, 'OVERVIEW');
    const reference = extractSection(content, 'REFERENCE');
    const examplesContent = extractSection(content, 'EXAMPLES');

    if (overview) {
      modules.set(moduleName, {
        name: formatModuleName(moduleName),
        overview,
      });
    }

    if (reference) {
      references.set(moduleName, reference);
    }

    if (examplesContent) {
      examples.set(moduleName, examplesContent);
    }
  }

  const templatePath = path.join(ROOT_DIR, 'layers', 'llms-template.txt');
  let template = await fs.readFile(templatePath, 'utf-8');

  const modulesSection = Array.from(modules.entries())
    .sort(([a], [b]) => {
      if (a === 'core') return -1;
      if (b === 'core') return 1;
      return a.localeCompare(b);
    })
    .map(([_key, { name, overview }]) => {
      return `### ${name}\n${overview}`;
    })
    .join('\n\n');

  const referenceLinks = Array.from(references.keys())
    .sort((a, b) => {
      if (a === 'core') return -1;
      if (b === 'core') return 1;
      return a.localeCompare(b);
    })
    .map((key) => {
      const name = formatModuleName(key);
      const url = `${GITHUB_PAGES_BASE}/reference/${key}`;
      return `- [${name}](${url})`;
    })
    .join('\n');

  const examplesLinks = Array.from(examples.keys())
    .sort((a, b) => {
      if (a === 'core') return -1;
      if (b === 'core') return 1;
      return a.localeCompare(b);
    })
    .map((key) => {
      const name = formatModuleName(key);
      const url = `${GITHUB_PAGES_BASE}/examples/${key}`;
      return `- [${name}](${url})`;
    })
    .join('\n');

  const embeddedReferences = Array.from(references.entries())
    .sort(([a], [b]) => {
      if (a === 'core') return -1;
      if (b === 'core') return 1;
      return a.localeCompare(b);
    })
    .map(([key, content]) => {
      const name = formatModuleName(key);
      return `### ${name}\n\n${content}`;
    })
    .join('\n\n');

  template = template.replace('{{MODULES}}', modulesSection);
  template = template.replace(
    '{{REFERENCE_LINKS}}',
    referenceLinks || '- Documentation coming soon'
  );
  template = template.replace(
    '{{EXAMPLES_LINKS}}',
    examplesLinks || '- Examples coming soon'
  );

  if (embeddedReferences) {
    template = template.replace('{{EMBEDDED_REFERENCES}}', embeddedReferences);
  }

  const outputPath = path.join(ROOT_DIR, 'llms.txt');
  await fs.writeFile(outputPath, template);
  console.log(
    `✓ Generated llms.txt with ${references.size} embedded references`
  );

  const createLlmPath = path.join(
    ROOT_DIR,
    'create-vibegame',
    'template',
    'llms.txt'
  );
  await fs.copyFile(outputPath, createLlmPath);
  console.log(`✓ Copied llms.txt to create-vibegame/template`);

  const docsDir = path.join(ROOT_DIR, 'docs');
  const refDir = path.join(docsDir, 'reference');
  const examplesDir = path.join(docsDir, 'examples');

  await fs.mkdir(refDir, { recursive: true });
  await fs.mkdir(examplesDir, { recursive: true });

  for (const [key, content] of references.entries()) {
    const filePath = path.join(refDir, `${key}.md`);
    const fullContent = `# ${formatModuleName(key)} Reference\n\n${content}`;
    await fs.writeFile(filePath, fullContent);
    console.log(`✓ Generated reference/${key}.md`);
  }

  for (const [key, content] of examples.entries()) {
    const filePath = path.join(examplesDir, `${key}.md`);
    const fullContent = `# ${formatModuleName(key)} Examples\n\n${content}`;
    await fs.writeFile(filePath, fullContent);
    console.log(`✓ Generated examples/${key}.md`);
  }

  if (references.size > 0) {
    const refIndex = `# VibeGame API Reference\n\n## Modules\n\n${referenceLinks}`;
    await fs.writeFile(path.join(refDir, 'index.md'), refIndex);
    console.log(`✓ Generated reference/index.md`);
  }

  if (examples.size > 0) {
    const examplesIndex = `# VibeGame Examples\n\n## Modules\n\n${examplesLinks}`;
    await fs.writeFile(path.join(examplesDir, 'index.md'), examplesIndex);
    console.log(`✓ Generated examples/index.md`);
  }

  const docsIndex = template;

  await fs.writeFile(path.join(docsDir, 'index.md'), docsIndex);
  console.log(`✓ Generated docs/index.md (includes full llms.txt content)`);

  console.log(`\n✅ LLM documentation build complete!`);
  console.log(`   Generated ${modules.size} module overviews`);
  console.log(`   Generated ${references.size} reference documents`);
  console.log(`   Generated ${examples.size} example documents`);
}

async function prepare() {
  console.log('Preparing release...');
  console.log('');

  await syncVersions();
  console.log('');

  await buildLLMDocs();
}

prepare().catch(console.error);
