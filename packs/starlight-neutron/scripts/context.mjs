import { existsSync, readFileSync, statSync } from 'node:fs';
import { globSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function expandTilde(filepath) {
  if (filepath.startsWith('~/')) {
    return join(homedir(), filepath.slice(2));
  }
  return filepath;
}

function resolveGlob(pattern, baseDir) {
  const expanded = expandTilde(pattern);
  const absolutePattern = isAbsolute(expanded) ? expanded : join(baseDir, expanded);

  // Return early if it's just a file without globs for faster processing
  if (!/[*?{}\[\]]/.test(absolutePattern)) {
    if (existsSync(absolutePattern) && statSync(absolutePattern).isFile()) {
       return [absolutePattern];
    }
    return [];
  }

  // Use Node 22+ built-in globSync
  return globSync(absolutePattern);
}

function analyzeDuplicates(text, globalSeen, currentFile) {
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 50); // Minimum length to consider
  const duplicates = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    if (globalSeen.has(p)) {
      duplicates.push(`Paragraph duplicated (first seen in ${globalSeen.get(p)}): "${p.slice(0, 40)}..."`);
    } else {
      globalSeen.set(p, currentFile);
    }
  }

  return duplicates;
}

function analyzeLongSections(text) {
    const lines = text.split('\n');
    const N = 100; // lines
    if (lines.length > N) {
        return [`File has over ${N} lines (${lines.length} lines total). Consider summarizing or extracting.`];
    }
    return [];
}

export function contextMain(argv) {
  let configPath = null;
  let targetTokens = 8000;
  let propose = false;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--config' && argv[i + 1]) {
      configPath = argv[++i];
    } else if (argv[i] === '--target' && argv[i + 1]) {
      targetTokens = parseInt(argv[++i], 10);
    } else if (argv[i] === '--propose') {
      propose = true;
    }
  }

  if (!configPath) {
      configPath = join(dirname(fileURLToPath(import.meta.url)), '../context.config.json');
  }

  const absoluteConfigPath = isAbsolute(configPath) ? configPath : resolve(process.cwd(), configPath);

  if (!existsSync(absoluteConfigPath)) {
    console.error(`Config file not found: ${absoluteConfigPath}`);
    return 1;
  }

  let config;
  try {
    config = JSON.parse(readFileSync(absoluteConfigPath, 'utf8'));
  } catch (e) {
    console.error(`Failed to parse config: ${e.message}`);
    return 1;
  }

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
      console.error(`Invalid config schema: Expected an object`);
      return 1;
  }

  const configDir = dirname(absoluteConfigPath);

  for (const [harness, patterns] of Object.entries(config)) {
    if (!Array.isArray(patterns)) {
        console.error(`Invalid patterns array for harness '${harness}'`);
        return 1;
    }
    console.log(`\nHarness: ${harness}`);
    console.log(`=========================================`);

    let totalBytes = 0;
    const fileStats = [];
    const seenFiles = new Set();

    for (const pattern of patterns) {
      const files = resolveGlob(pattern, configDir);

      for (const file of files) {
        if (seenFiles.has(file)) continue;
        seenFiles.add(file);

        if (!statSync(file).isFile()) continue;

        const content = readFileSync(file, 'utf8');
        const bytes = Buffer.byteLength(content, 'utf8');

        fileStats.push({ file, bytes, content });
        totalBytes += bytes;
      }
    }

    fileStats.sort((a, b) => b.bytes - a.bytes);

    for (const stat of fileStats) {
      console.log(`${stat.file}: ${stat.bytes} bytes`);
    }
    console.log('');

    const estimatedTokens = Math.ceil(totalBytes / 4);
    const gap = targetTokens - estimatedTokens;

    console.log(`Total bytes: ${totalBytes}`);
    console.log(`Estimated tokens (bytes/4): ${estimatedTokens}`);
    console.log(`Target tokens: ${targetTokens}`);
    console.log(`Gap to target: ${gap > 0 ? '+' : ''}${gap} tokens\n`);

    console.log(`Top 5 largest files:`);
    for (let i = 0; i < Math.min(5, fileStats.length); i++) {
      const stat = fileStats[i];
      const share = totalBytes > 0 ? Math.round((stat.bytes / totalBytes) * 100) : 0;
      console.log(`  - ${stat.file}: ${stat.bytes} bytes (${share}% of total)`);
    }

    if (propose) {
      console.log(`\n--- Proposals (Heuristics only, files are never edited) ---`);
      let foundProposals = false;
      const globalSeen = new Map();
      for (const stat of fileStats) {
        const dupes = analyzeDuplicates(stat.content, globalSeen, stat.file);
        const longs = analyzeLongSections(stat.content);

        if (dupes.length > 0 || longs.length > 0) {
            foundProposals = true;
            console.log(`\nIn ${stat.file}:`);
            for (const d of dupes) console.log(`  - ${d}`);
            for (const l of longs) console.log(`  - ${l}`);
        }
      }
      if (!foundProposals) {
          console.log(`  No clear cut candidates found.`);
      }
    }
  }

  return 0;
}
