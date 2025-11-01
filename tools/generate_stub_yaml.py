#!/usr/bin/env python3
"""
Generate stub YAML headers for Narramorph variation files.

By default, writes sidecar YAML files mirroring the docs/ tree,
populating only identity and content basics (word_count), leaving
all other fields for future AI-assisted passes.

Optionally, can prepend a stub header in-place only when a file has
no existing front matter.
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from typing import Optional, Tuple


VARIATION_FILE_RE = re.compile(r"^(algo|arch|hum)-L[12]-.+\.md$")
NODE_DIR_RE = re.compile(r"^(?P<char>algo|arch|hum)-L(?P<layer>[12])(?:-(?P<path>invest|accept|resist))?-production$")


def has_front_matter(lines: list[str]) -> bool:
    if not lines:
        return False
    if lines[0].strip() != "---":
        return False
    # Find closing '---'
    for i in range(1, min(len(lines), 500)):
        if lines[i].strip() == "---":
            return True
    return False


def strip_front_matter(text: str) -> str:
    lines = text.splitlines()
    if not has_front_matter(lines):
        return text
    # Remove from first '---' to the next '---' (inclusive)
    end_idx = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end_idx = i
            break
    if end_idx is None:
        return text
    return "\n".join(lines[end_idx + 1 :])


def count_words_without_front_matter(text: str) -> int:
    body = strip_front_matter(text)
    # Naive token split is sufficient and consistent for our needs
    return len([tok for tok in re.split(r"\s+", body.strip()) if tok])


def derive_identity(rel_path: str) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str], Optional[str]]:
    """
    Returns: (variation_id, character, layer, path, variation_type)
    - variation_type inferred from subdirectory (firstRevisit|metaAware)
    - path is one of invest|accept|resist or None
    - layer is 'L1' or 'L2'
    """
    parts = rel_path.replace("\\", "/").split("/")
    # Expect docs/<node-dir>/<maybe-subdir>/<file>
    # Identify node dir as first segment under docs/
    var_id = os.path.splitext(os.path.basename(rel_path))[0]
    character: Optional[str] = None
    layer: Optional[str] = None
    path_name: Optional[str] = None
    variation_type: Optional[str] = None

    # Find node dir (segment right after 'docs')
    try:
        docs_idx = parts.index("docs")
        node_dir = parts[docs_idx + 1] if docs_idx + 1 < len(parts) else None
    except ValueError:
        node_dir = parts[0] if parts else None

    if node_dir:
        m = NODE_DIR_RE.match(node_dir)
        if m:
            character = m.group("char")
            layer = f"L{m.group('layer')}"
            path_name = m.group("path")  # may be None for L1

    # Infer variation_type from subdirectories, if present
    subdirs = set(parts)
    if "firstRevisit" in subdirs:
        variation_type = "firstRevisit"
    elif "metaAware" in subdirs:
        variation_type = "metaAware"

    return var_id, character, layer, path_name, variation_type


def build_stub_yaml(variation_id: Optional[str], character: Optional[str], layer: Optional[str], path_name: Optional[str], variation_type: Optional[str], word_count: int) -> str:
    # Represent nulls explicitly as 'null'
    def val(v: Optional[str]) -> str:
        return "null" if v is None else str(v)

    lines = [
        "---",
        f"variation_id: {val(variation_id)}",
        f"character: {val(character)}",
        f"layer: {val(layer)}",
        f"path: {val(path_name)}",
        f"variation_type: {val(variation_type)}",
        "",
        "conditions:",
        "  awareness_level: null",
        "  awareness_band: null",
        "  awareness_tier: null",
        "  cross_character: null",
        "  pure_revisit: null",
        "",
        "content:",
        f"  word_count: {word_count}",
        "  primary_focus: null",
        "  secondary_focus: null",
        "  themes: null",
        "  transformation_type: null",
        "---",
    ]
    return "\n".join(lines) + "\n"


def write_text(path: str, text: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def prepend_if_missing_header(file_path: str, header_text: str) -> bool:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    if has_front_matter(content.splitlines()):
        return False
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(header_text)
        if content and not content.startswith("\n"):
            f.write("\n")
        f.write(content)
    return True


def main() -> int:
    ap = argparse.ArgumentParser(description="Generate stub YAML headers for variation files.")
    ap.add_argument("root", nargs="?", default="docs", help="Root directory to scan (default: docs)")
    ap.add_argument("--sidecar-dir", default=".stubs/variation_headers", help="Directory to write sidecar YAML files (default: .stubs/variation_headers)")
    ap.add_argument("--inplace", action="store_true", help="Write in-place (modify source files instead of sidecars)")
    ap.add_argument("--replace", action="store_true", help="When used with --inplace: replace existing front matter with stub header (otherwise only add if missing)")
    ap.add_argument("--dry-run", action="store_true", help="Do not write; print planned actions")
    args = ap.parse_args()

    root = args.root
    sidecar_root = args.sidecar_dir

    processed = 0
    skipped = 0
    created = 0

    for dirpath, _dirnames, filenames in os.walk(root):
        for fn in filenames:
            if not fn.lower().endswith(".md"):
                continue
            if not VARIATION_FILE_RE.match(fn):
                # Not a variation file; skip
                continue
            file_path = os.path.join(dirpath, fn)
            rel_path = os.path.relpath(file_path, start=root)

            # Read content
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    text = f.read()
            except Exception as e:
                print(f"WARN: Failed to read {file_path}: {e}", file=sys.stderr)
                skipped += 1
                continue

            # Identity + word count
            var_id, character, layer, path_name, variation_type = derive_identity(os.path.join(os.path.basename(root), rel_path))
            wc = count_words_without_front_matter(text)
            stub = build_stub_yaml(var_id, character, layer, path_name, variation_type, wc)

            if args.inplace:
                lines = text.splitlines()
                already = has_front_matter(lines)
                if already and args.replace:
                    # Replace existing header
                    # Find closing '---'
                    end_idx = None
                    for i in range(1, len(lines)):
                        if lines[i].strip() == "---":
                            end_idx = i
                            break
                    body = "\n".join(lines[end_idx + 1 :]) if end_idx is not None else "\n".join(lines)
                    new_content = stub + ("\n" if body and not body.startswith("\n") else "") + body
                    if args.dry_run:
                        print(f"REPLACE (in-place header): {file_path}")
                        print(stub)
                    else:
                        with open(file_path, "w", encoding="utf-8") as f:
                            f.write(new_content)
                        created += 1
                elif already and not args.replace:
                    skipped += 1
                    if args.dry_run:
                        print(f"SKIP (has header): {file_path}")
                else:
                    if args.dry_run:
                        print(f"WRITE (in-place header): {file_path}")
                        print(stub)
                    else:
                        if prepend_if_missing_header(file_path, stub):
                            created += 1
                processed += 1
                continue

            # Sidecar mode
            sidecar_path = os.path.join(sidecar_root, rel_path)
            sidecar_path = os.path.splitext(sidecar_path)[0] + ".yml"
            if args.dry_run:
                print(f"WRITE (sidecar): {sidecar_path}")
                print(stub)
            else:
                write_text(sidecar_path, stub)
                created += 1
            processed += 1

    print(f"Processed: {processed} | Created: {created} | Skipped: {skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
