#!/usr/bin/env node

import fs from 'fs/promises';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

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

  const allModules = new Set([
    ...modules.keys(),
    ...references.keys(),
    ...examples.keys(),
  ]);
  const embeddedReferences = Array.from(allModules)
    .sort((a, b) => {
      if (a === 'core') return -1;
      if (b === 'core') return 1;
      return a.localeCompare(b);
    })
    .map((key) => {
      const name = formatModuleName(key);
      const moduleOverview = modules.get(key);
      const referenceContent = references.get(key);
      const exampleContent = examples.get(key);

      let content = `### ${name}`;

      if (moduleOverview) {
        content += `\n\n${moduleOverview.overview}`;
      }

      if (referenceContent) {
        content += `\n\n${referenceContent}`;
      }

      if (exampleContent) {
        content += `\n\n#### Examples\n\n${exampleContent}`;
      }

      return content;
    })
    .join('\n\n');

  template = template.replace('{{EMBEDDED_REFERENCES}}', embeddedReferences);

  const outputPath = path.join(ROOT_DIR, 'llms.txt');
  await fs.writeFile(outputPath, template);
  console.log(
    `✓ Generated llms.txt with ${references.size} embedded references`
  );

  console.log(`\n✅ LLM documentation build complete!`);
  console.log(`   Generated ${modules.size} module overviews`);
  console.log(`   Embedded ${references.size} reference sections`);
  console.log(`   Embedded ${examples.size} example sections`);
}

async function prepare() {
  console.log('Preparing release...');
  console.log('');

  await syncVersions();
  console.log('');

  await buildLLMDocs();
}

prepare().catch(console.error);
