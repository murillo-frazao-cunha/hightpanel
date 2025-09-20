#!/usr/bin/env ts-node
import { getScript, listScripts } from './core/registry';
import { ScriptContext } from './core/Script';
import Console from '../backend/console';
import dotenv from "dotenv";
dotenv.config({
    quiet: true
});
// Importa somente scripts que você quer disponibilizar aqui.
import './impl/GenerateTokenScript';
import './impl/SetupDatabaseScript'

import './impl/SetupScript';
import './impl/CreateUserScript';

import "./impl/MigrationScript"

function parseArgs(argv: string[]) {
  const args: string[] = [];
  const flags: Record<string,string|boolean> = {};
  for (const a of argv) {
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq !== -1) {
        const k = a.slice(2, eq);
        const v = a.slice(eq+1);
        flags[k] = v === 'true' ? true : v === 'false' ? false : v;
      } else {
        flags[a.slice(2)] = true;
      }
    } else {
      args.push(a);
    }
  }
  return { args, flags };
}

function printGlobalHelp() {
  const scripts = listScripts();
  const lines: string[] = ['Available scripts:'];
  if (scripts.length === 0) {
    lines.push('  (nenhum script registrado ainda)');
  } else {
    for (const s of scripts) {
      lines.push(`  ${s.name.padEnd(18)} ${s.description}`);
    }
  }
  lines.push('', 'Usage: npm run script <name> [--flag=value]', 'Help:  npm run script help <name>');
  Console.info(...lines);
}

function getEffectiveArgv(): string[] {
  const direct = process.argv.slice(2);
  if (direct.length > 0) return direct;
  const raw = process.env.npm_config_argv;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const pools: string[][] = [];
    if (Array.isArray(parsed.original)) pools.push(parsed.original);
    if (Array.isArray(parsed.cooked)) pools.push(parsed.cooked);
    let tokens: string[] = [];
    for (const arr of pools) tokens.push(...arr);
    // Remove duplicados preservando ordem
    tokens = tokens.filter((v, i) => tokens.indexOf(v) === i);
    // Remove marcadores do npm
    tokens = tokens.filter(t => !['run', 'script', '--'].includes(t));
    return tokens;
  } catch {
    return [];
  }
}

async function main() {
  const effectiveArgv = getEffectiveArgv();
  const { args, flags } = parseArgs(effectiveArgv);
  if (process.env.SCRIPT_DEBUG) {
    Console.debug('argv(raw)=', process.argv.slice(2));
    Console.debug('effectiveArgv=', effectiveArgv);
    Console.debug('parsed args=', args, 'flags=', flags);
  }
  if (args.length === 0 || (args[0] === 'help' && !args[1])) {
    printGlobalHelp();
    return;
  }
  if (args[0] === 'help' && args[1]) {
    const scr = getScript(args[1]);
    if (!scr) {
      printGlobalHelp();
      process.exit(1);
    }
    if (scr.help) {
      Console.info(`Command ${scr.name} usage: \n`,...scr.help());
    } else {
      const helpLines = [`${scr.name}: ${scr.description}`];
      if (scr.usage) helpLines.push('Usage: ' + scr.usage);
      Console.info(...helpLines);
    }
    return;
  }
  const name = args[0];
  const script = getScript(name);
  if (!script) {
    Console.error('', 'Script not found: ' + name);
    printGlobalHelp();
    process.exit(1);
  }
  const runArgs = args.slice(1);
  const ctx: ScriptContext = {
    cwd: process.cwd(),
    env: process.env,
    stdout: (m: string) => Console.info('', m),
    stderr: (m: string) => Console.error('', m),
  };
  try {
    await script.run(ctx, runArgs, flags);
  } catch (e: any) {
    Console.error('', 'Script failed:', e?.message || e);
    process.exit(1);
  }
}

main();
