#!/usr/bin/env tsx
/**
 * L1 content auto-fixer
 * - Adds missing frontmatter to FR/MA files based on filename
 * - Ensures variation_id exists and is zero-padded (arch-L1-FR-XXX / arch-L1-MA-XXX)
 * - Moves awareness_range into conditions.awareness and adds % suffix
 * - Repairs common YAML issues:
 *    - Indents conditions subfields
 *    - Ensures list items under themes/conditional_insertions/reusable_patterns have dashes
 */

import { promises as fs } from 'node:fs';
import { join, resolve } from 'node:path';
import YAML from 'yaml';

const ROOT = resolve(process.cwd(), '../..');
const CHAR_DIRS = ['arch', 'algo', 'hum'].map((c) => ({
  fr: join(ROOT, `docs/${c}-L1-production/firstRevisit`),
  ma: join(ROOT, `docs/${c}-L1-production/metaAware`),
}));

async function listMd(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith('.md')) files.push(join(dir, e.name));
    }
    files.sort();
    return files;
  } catch {
    return [];
  }
}

function detectPhase(filePath: string): 'FR' | 'MA' {
  return filePath.includes('firstRevisit') ? 'FR' : 'MA';
}

function extractNumberFromName(name: string): string | null {
  const m = name.match(/-(FR|MA)-(\d{1,3})\.md$/i);
  return m ? m[2]!.padStart(3, '0') : null;
}

function detectCharacter(filePath: string): 'arch' | 'algo' | 'hum' {
  const m = filePath.match(/(arch|algo|hum)-L1/i);
  if (m && m[1]) return m[1].toLowerCase() as any;
  return 'arch';
}

function hasFrontmatterStart(text: string): boolean {
  return text.trimStart().startsWith('---');
}

function splitFrontmatter(text: string): { fm: string; body: string } | null {
  if (!hasFrontmatterStart(text)) return null;
  const norm = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const startIdx = norm.indexOf('---');
  const endIdx = norm.indexOf('\n---', startIdx + 3);
  if (endIdx === -1) return null;
  const fm = norm.slice(0, endIdx + 4);
  const body = norm.slice(endIdx + 4);
  return { fm, body };
}

function addOrReplaceLine(block: string, key: string, value: string): string {
  const EOL = block.includes('\r\n') ? '\r\n' : '\n';
  const re = new RegExp(`^${key}:(.*)$`, 'm');
  if (re.test(block)) {
    return block.replace(re, `${key}: ${value}`);
  }
  // insert before closing delimiter
  const endIdx = block.lastIndexOf(`${EOL}---`);
  const insert = `${EOL}${key}: ${value}${EOL}`;
  return block.slice(0, endIdx) + insert + block.slice(endIdx);
}

function ensureConditionsAwareness(block: string): string {
  const EOL = block.includes('\r\n') ? '\r\n' : '\n';
  // If conditions already has awareness, ensure percent suffix
  const condAware = block.match(/\n\s*conditions:\s*[\s\S]*?\n\s*awareness:\s*([^\n]+)\n/);
  if (condAware && condAware[1]) {
    const val = condAware[1].trim();
    if (!val.endsWith('%')) {
      block = block.replace(condAware[0], condAware[0].replace(val, val + '%'));
    }
    return block;
  }
  // If awareness_range exists, move into conditions.awareness
  const ar = block.match(/^awareness_range:\s*"?([0-9]+-?[0-9]*)"?/m);
  if (ar && ar[1]) {
    const val = ar[1].includes('%') ? ar[1] : `${ar[1]}%`;
    // Ensure conditions block exists
    if (!/^conditions:/m.test(block)) {
      block = addOrReplaceLine(block, 'conditions', '');
    }
    // Insert awareness under conditions indented two spaces
    block = block.replace(/^(conditions:\s*)$/m, `$1${EOL}  awareness: ${val}`);
  }
  return block;
}

function fixConditionsIndent(block: string): string {
  const EOL = block.includes('\r\n') ? '\r\n' : '\n';
  const lines = block.split(EOL);
  for (let i = 0; i < lines.length; i++) {
    if (/^conditions:\s*$/.test(lines[i]!)) {
      // indent subsequent key:value lines until next top-level key (no indent) or '---'
      for (let j = i + 1; j < lines.length; j++) {
        const line = lines[j]!;
        if (line === '---' || /^\S/.test(line)) break;
        if (/^\s*[a-zA-Z0-9_]+:/.test(line) && !/^\s{2}/.test(line)) {
          lines[j] = '  ' + line.trimStart();
        }
      }
    }
  }
  return lines.join(EOL);
}

function fixListBlocks(block: string): string {
  const listKeys = ['themes', 'conditional_insertions', 'reusable_patterns', 'specific_echoes', 'metaaware_signatures', 'resist_signatures'];
  const EOL = block.includes('\r\n') ? '\r\n' : '\n';
  const lines = block.split(EOL);
  for (let i = 0; i < lines.length; i++) {
    const key = listKeys.find(k => new RegExp(`^\s*${k}:\s*$`).test(lines[i]!));
    if (key) {
      for (let j = i + 1; j < lines.length; j++) {
        const l = lines[j]!;
        if (l === '---' || /^[A-Za-z_][\w-]*:\s*/.test(l)) break; // next top-level key
        if (l.trim() === '') continue;
        // Ensure list dash and indentation
        let content = l.trim().replace(/^\-\s*/, '');
        const quoted = `'${content.replace(/'/g, "''")}'`;
        lines[j] = '  - ' + quoted;
      }
    }
  }
  return lines.join(EOL);
}

function foldMultilineScalars(block: string): string {
  const EOL = block.includes('\r\n') ? '\r\n' : '\n';
  const lines = block.split(EOL);
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const keyMatch = line.match(/^\s*([a-zA-Z_][\w-]*):\s+(.+)$/);
    if (keyMatch) {
      const key = keyMatch[1]!;
      const first = keyMatch[2]!;
      // Lookahead for continuation lines (indented or starting with a space and not a list or new key)
      const cont: string[] = [first];
      let k = i + 1;
      while (k < lines.length) {
        const nl = lines[k]!;
        if (nl === '---') break;
        if (/^\s*-\s/.test(nl)) break; // list start
        if (/^[a-zA-Z_][\w-]*:\s*/.test(nl)) break; // new key
        if (/^\s/.test(nl) || nl.trim().length > 0) {
          cont.push(nl.trim());
          k++;
          continue;
        }
        break;
      }
      if (cont.length > 1) {
        out.push(`${key}: >`);
        for (const c of cont) {
          out.push('  ' + c);
        }
        i = k - 1;
        continue;
      }
    }
    // Indent stray top-level list items to avoid column errors
    if (/^-\s+/.test(line)) {
      out.push('  ' + line);
      continue;
    }
    out.push(line);
  }
  return out.join(EOL);
}

function quoteAllListItems(block: string): string {
  const EOL = block.includes('\r\n') ? '\r\n' : '\n';
  const lines = block.split(EOL);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i]!.match(/^(\s*)-\s+(.+)$/);
    if (!m) continue;
    const indent = m[1] || '';
    let content = m[2] || '';
    // Skip likely mapping items
    if (/^[A-Za-z_][\w-]*:\s*/.test(content)) continue;
    // Remove raw double quotes and neutralize colon-space to avoid implicit map parsing
    content = content.replace(/\\\"/g, '"').replace(/\"/g, '"').replace(/"/g, '');
    content = content.replace(/:\s/g, ' - ');
    content = content.replace(/\t/g, ' ');
    lines[i] = `${indent}- ${content.trim()}`;
  }
  return lines.join(EOL);
}

function cleanOverquoting(block: string): string {
  const EOL = block.includes('\r\n') ? '\r\n' : '\n';
  const lines = block.split(EOL);
  for (let i = 0; i < lines.length; i++) {
    // Remove leading repeated single quotes after list dash
    lines[i] = lines[i]!.replace(/^(\s*-\s+)'+/, '$1');
    // Remove leading backslashes after list dash
    lines[i] = lines[i]!.replace(/^(\s*-\s+)\\+/, '$1');
  }
  return lines.join(EOL);
}

async function fixFile(filePath: string): Promise<boolean> {
  const raw = await fs.readFile(filePath, 'utf-8');
  const phase = detectPhase(filePath);
  const num = extractNumberFromName(filePath.split(/[/\\]/).pop() || '');
  let changed = false;

  if (!hasFrontmatterStart(raw)) {
    if (!num) return false;
    const variation_id = `arch-L1-${phase}-${num}`;
    const variation_type = phase === 'FR' ? 'firstRevisit' : 'metaAware';
    const body = raw.trim();
    const word_count = body.split(/\s+/).filter(Boolean).length;
    const awareness = phase === 'FR' ? '21-40%' : '61-80%';
    const fm = `---\nvariation_id: ${variation_id}\nvariation_type: ${variation_type}\nword_count: ${word_count}\nconditions:\n  awareness: ${awareness}\n---\n`;
    await fs.writeFile(filePath, fm + body, 'utf-8');
    return true;
  }

  const parts = splitFrontmatter(raw);
  if (!parts) return false;
  let { fm, body } = parts;

  // Normalize EOLs to LF for consistency
  fm = fm.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  body = body.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Pre-sanitize list blocks and conditions to help parser
  fm = cleanOverquoting(fm);
  fm = foldMultilineScalars(fm);
  fm = quoteAllListItems(fm);
  fm = fixListBlocks(fm);
  fm = fixConditionsIndent(fm);
  fm = ensureConditionsAwareness(fm);

  // Strip delimiters and parse
  const yamlText = fm.replace(/^---\n/, '').replace(/\n---\n?$/, '\n');
  let data: any;
  try {
    data = YAML.parse(yamlText) || {};
  } catch (e) {
    // Fallback: replace with minimal valid frontmatter preserving only required fields
    if (!num) return false;
    const variation_id = `arch-L1-${phase}-${num}`;
    const variation_type = phase === 'FR' ? 'firstRevisit' : 'metaAware';
    const word_count = body.trim().split(/\s+/).filter(Boolean).length;
    const awareness = phase === 'FR' ? '21-40%' : '61-80%';
    const minimal = `---\nvariation_id: ${variation_id}\nvariation_type: ${variation_type}\nword_count: ${word_count}\nconditions:\n  awareness: ${awareness}\n---\n`;
    await fs.writeFile(filePath, minimal + body, 'utf-8');
    return true;
  }

  // Build minimal, safe frontmatter retaining only required fields
  const wc = body.trim().split(/\s+/).filter(Boolean).length;
  const awarenessFromFm = data?.conditions?.awareness as string | undefined;
  const awareness = awarenessFromFm ? (awarenessFromFm.endsWith('%') ? awarenessFromFm : `${awarenessFromFm}%`) : (phase === 'FR' ? '21-40%' : '61-80%');
  const ch = detectCharacter(filePath);
  const varId = (typeof data.variation_id === 'string')
    ? data.variation_id.replace(/((arch|algo|hum)-L1-(FR|MA)-)(\d{1,3})/i, (_m: string, pre: string, _ch: string, _ph: string, n: string) => `${pre}${n.padStart(3, '0')}`)
    : `${ch}-L1-${phase}-${num}`;

  data = {
    variation_id: varId,
    variation_type: phase === 'FR' ? 'firstRevisit' : 'metaAware',
    word_count: wc,
    conditions: { awareness },
  };
  changed = true;

  // Emit new frontmatter using YAML.stringify
  const newFm = `---\n${YAML.stringify(data, { defaultStringType: 'QUOTE_SINGLE' as any })}---\n`;
  if (newFm !== fm) changed = true;

  if (!changed) return false;
  await fs.writeFile(filePath, newFm + body, 'utf-8');
  return true;
}

async function main() {
  const dirs: string[] = [];
  for (const d of CHAR_DIRS) {
    dirs.push(d.fr, d.ma);
  }
  const filesArrays = await Promise.all(dirs.map((d) => listMd(d)));
  const files = filesArrays.flat();
  let modified = 0;
  for (const f of files) {
    const ok = await fixFile(f).catch(() => false);
    if (ok) modified++;
  }
  console.log(`Fixed ${modified} file(s)`);
}

main().catch((e) => {
  console.error('Fixer failed:', e);
  process.exit(1);
});

