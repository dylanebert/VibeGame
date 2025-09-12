#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { cyan, green, red, yellow } from 'kolorist';

const execAsync = promisify(exec);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const file of fs.readdirSync(src)) {
    const srcFile = path.resolve(src, file);
    const destFile = path.resolve(dest, file);
    const stat = fs.statSync(srcFile);
    if (stat.isDirectory()) {
      copyDir(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  }
}

async function commandExists(cmd) {
  try {
    await execAsync(`which ${cmd}`);
    return true;
  } catch {
    return false;
  }
}

async function init() {
  // Get project name from command line
  let projectName = process.argv[2];
  
  // Validate project name
  if (!projectName) {
    console.error(red('Error: Please specify a project name'));
    console.log('  ' + cyan('npm create vibegame@latest <project-name>'));
    process.exit(1);
  }
  
  const targetDir = path.resolve(process.cwd(), projectName);

  // Check if directory exists
  if (fs.existsSync(targetDir)) {
    console.error(red(`Error: Directory ${projectName} already exists`));
    process.exit(1);
  }

  console.log();
  console.log(`${cyan('Creating VibeGame project in')} ${green(projectName)}`);
  console.log();

  // Copy template
  const templateDir = path.resolve(__dirname, 'template');
  copyDir(templateDir, targetDir);

  // Update package.json with project name
  const pkgPath = path.join(targetDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  pkg.name = projectName;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  console.log(green('✓') + ' Project created');

  // Detect package manager
  const userAgent = process.env.npm_config_user_agent ?? '';
  let pkgManager = /bun/.test(userAgent) ? 'bun' : 
                   /yarn/.test(userAgent) ? 'yarn' : 
                   /pnpm/.test(userAgent) ? 'pnpm' : 'npm';
  
  // Check if bun is available even if not used to run create-vibegame
  if (pkgManager === 'npm' && await commandExists('bun')) {
    pkgManager = 'bun';
  }

  // Install dependencies
  console.log();
  console.log('Installing dependencies...');
  
  try {
    const installCmd = pkgManager === 'yarn' ? 'yarn' : 
                      pkgManager === 'pnpm' ? 'pnpm install' :
                      pkgManager === 'bun' ? 'bun install' : 'npm install';
    
    await execAsync(installCmd, { cwd: targetDir });
    console.log(green('✓') + ' Dependencies installed');
    
    // Copy llms.txt from installed vibegame package
    const targetLlmsPath = path.join(targetDir, 'llms.txt');
    const vibegameLlmsPath = path.join(targetDir, 'node_modules', 'vibegame', 'llms.txt');
    
    if (fs.existsSync(vibegameLlmsPath)) {
      fs.copyFileSync(vibegameLlmsPath, targetLlmsPath);
      console.log(green('✓') + ' LLM documentation included (llms.txt)');
    }
  } catch (_error) {
    console.log(yellow('⚠') + ' Failed to install dependencies automatically');
    console.log('  You can install them manually later');
  }

  // Instructions
  console.log();
  console.log('Done! Now run:');
  console.log();
  console.log(cyan(`  cd ${projectName}`));
  
  if (pkgManager === 'bun') {
    console.log(cyan('  bun dev'));
  } else if (pkgManager === 'yarn') {
    console.log(cyan('  yarn dev'));
  } else if (pkgManager === 'pnpm') {
    console.log(cyan('  pnpm dev'));
  } else {
    console.log(cyan('  npm run dev'));
  }
  
  console.log();
  console.log('LLM documentation available in llms.txt');
  console.log();
}

init().catch((e) => {
  console.error(e);
  process.exit(1);
});
