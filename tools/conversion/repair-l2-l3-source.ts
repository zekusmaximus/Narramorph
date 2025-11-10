#!/usr/bin/env tsx
/**
 * Bulk source repair for L2 and L3 content.
 * - L2: ensure valid YAML frontmatter, derive minimal fields when malformed.
 * - L3 conv: ensure characterVoices exists.
 */

import { promises as fs } from 'node:fs';
import { join, resolve, basename } from 'node:path';

type PathEntry = { path: string; content: string };

async function readFile(path: string): Promise<string | null> {
  try { return await fs.readFile(path, 'utf-8'); } catch { return null; }
}

async function writeFile(path: string, content: string): Promise<void> {
  await fs.mkdir(resolve(path, '..'), { recursive: true });
  await fs.writeFile(path, content, 'utf-8');
}

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  let entries: any[] = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out); else if (e.isFile() && p.endsWith('.md')) out.push(p);
  }
  return out;
}

function splitFrontmatter(raw: string): { fm: string | null; body: string } {
  if (!raw.startsWith('---')) return { fm: null, body: raw };
  const lines = raw.split(/\r?\n/);
  // find closing fence
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      const fm = lines.slice(1, i).join('\n');
      const body = lines.slice(i + 1).join('\n');
      return { fm, body };
    }
  }
  // no closing, heuristically cut at first non-YAMLish line
  let cut = 1;
  for (let i = 1; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim() === '') { continue; }
    if (/^[A-Za-z0-9_\-]+\s*:/.test(l)) { cut = i + 1; continue; }
    // heading or free text -> treat as body start
    cut = i;
    break;
  }
  const fm = lines.slice(1, cut).join('\n');
  const body = lines.slice(cut).join('\n');
  return { fm, body };
}

function deriveL2FrontmatterFromName(fileName: string): { variation_id: string; variation_type: string; word_count: number; conditions: { awareness: string } } {
  const m = fileName.match(/^(arch|algo|hum)-L2-(accept|resist|invest)-(FR|MA)-(\d+)/);
  if (!m) throw new Error(`Cannot derive L2 id from ${fileName}`);
  const [, ch, path, phase, num] = m;
  const variation_id = `${ch}-L2-${path}-${phase}-${num.padStart(3, '0')}`;
  const variation_type = phase === 'FR' ? 'firstRevisit' : 'metaAware';
  return { variation_id, variation_type, word_count: 0, conditions: { awareness: '0-100%' } };
}

function countWords(text: string): number {
  const t = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#!*_~>\-]/g, ' ')
    .trim();
  return t ? t.split(/\s+/).length : 0;
}

function sanitizeFrontmatterTextBlock(fm: string): string {
  // If "text: >-" present, indent subsequent lines until next key or fence
  const lines = fm.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*text:\s*>-\s*$/.test(lines[i])) {
      for (let j = i + 1; j < lines.length; j++) {
        const l = lines[j];
        if (/^---\s*$/.test(l)) break;
        if (/^[A-Za-z0-9_\-]+\s*:/.test(l)) break;
        lines[j] = l.startsWith('  ') ? l : ('  ' + l);
      }
    }
  }
  return lines.join('\n');
}

async function repairL2(docRoot: string): Promise<{ files: number; modified: number }>{
  const globs = [
    'arch-L2-accept-production', 'arch-L2-resist-production', 'arch-L2-invest-production',
    'algo-L2-accept-production', 'algo-L2-resist-production', 'algo-L2-invest-production',
    'hum-L2-accept-production',  'hum-L2-resist-production',  'hum-L2-invest-production',
  ];
  let files = 0; let modified = 0;
  for (const g of globs) {
    for (const sub of ['firstRevisit', 'metaAware']) {
      const dir = join(docRoot, `${g}/${sub}`);
      const paths = await walk(dir);
      for (const p of paths) {
        files++;
        const raw = await readFile(p); if (!raw) continue;
        const { fm, body } = splitFrontmatter(raw);
        const name = basename(p);
        // Try sanitizing existing fm; if none or unusable, derive minimal
        let header = '';
        // Overwrite L2 header with minimal, valid set (idempotent, canonical)
        const derived = deriveL2FrontmatterFromName(name);
        derived.word_count = countWords(body);
        header = `variation_id: ${derived.variation_id}\nvariation_type: ${derived.variation_type}\nword_count: ${derived.word_count}\nconditions:\n  awareness: '${derived.conditions.awareness}'`;
        const out = `---\n${header}\n---\n${body}`;
        if (out !== raw) { await writeFile(p, out); modified++; }
      }
    }
  }
  return { files, modified };
}

async function repairL3Conv(docRoot: string): Promise<{ files: number; modified: number }>{
  const dir = join(docRoot, 'L3/conv-L3-production');
  const paths = await walk(dir);
  let files = 0; let modified = 0;
  for (const p of paths) {
    if (!/conv-L3-\d+\.md$/.test(p)) continue;
    files++;
    const raw = await readFile(p); if (!raw) continue;
    let { fm, body } = splitFrontmatter(raw);
    if (!fm) continue;
    let changed = false;
    if (!/^characterVoices\s*:/m.test(fm)) {
      fm += `\ncharacterVoices:\n  - archaeologist\n  - algorithm\n  - last-human`;
      changed = true;
    }
    if (changed) {
      const out = `---\n${fm}\n---\n${body}`;
      if (out !== raw) { await writeFile(p, out); modified++; }
    }
  }
  return { files, modified };
}

async function main() {
  const projectRoot = resolve(process.cwd(), '../..');
  const docsRoot = join(projectRoot, 'docs');
  const l2 = await repairL2(docsRoot);
  const l3 = await repairL3Conv(docsRoot);
  console.log(`L2 repaired: ${l2.modified}/${l2.files}`);
  console.log(`L3 conv voices added: ${l3.modified}/${l3.files}`);
}

main().catch(err => { console.error('Repair failed:', err); process.exit(1); });
