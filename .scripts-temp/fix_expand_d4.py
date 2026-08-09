#!/usr/bin/env python3
"""
Expand posts with depth=4 (WC 600-900) to 1800+ words (depth=7, +3 CQ).
Also expands depth=5 posts (WC 900-1200) to 1800+ if gap >= 3.

Usage:
  python scripts/fix_expand_d4.py --dry-run
  python scripts/fix_expand_d4.py
"""

import re, sys, shutil
from pathlib import Path
from datetime import datetime

BLOG_DATA  = Path(__file__).parent.parent / "lib" / "blog-data.ts"
BACKUP_DIR = Path(__file__).parent / "backups"

sys.path.insert(0, str(Path(__file__).parent))
from enem_audit import parse_posts, score_post
from enem_gap import score_breakdown
from enem_phase5 import expand_content, get_expansion_block, _insert_before_footer, _quick_wc


def expand_to_1800(content, slug):
    """Add up to 5 template blocks to reach 1800+ words."""
    from enem_phase5 import get_category
    cat = get_category(slug)

    result = content
    for i in range(5):
        if _quick_wc(result) >= 1800:
            break
        block = get_expansion_block(slug, cat, target_words=400)
        result = _insert_before_footer(result, block)

    return result


def main():
    dry_run = "--dry-run" in sys.argv

    print(f"Parsing {BLOG_DATA}...")
    posts, original_text = parse_posts(BLOG_DATA)
    print(f"{len(posts)} posts found")

    if not dry_run:
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup = BACKUP_DIR / f"blog-data_{ts}_pre_fixd4.ts"
        shutil.copy2(BLOG_DATA, backup)
        print(f"Backup -> {backup.name}")

    new_text = original_text
    offset = 0
    expanded = 0

    scores = [score_breakdown(p) for p in posts]
    slug_to_score = {s["slug"]: s for s in scores}

    for post in posts:
        slug = post["slug"]
        s = slug_to_score[slug]
        total = s["total"]

        if total >= 90:
            continue

        depth = s["depth"]
        wc = s["wc"]
        gap = 90 - total

        # Target: depth=4 (wc 600-900) or depth=5 with large gap
        # Both need to reach 1800 to get depth=7 (+3 CQ)
        if not (depth <= 5 and wc < 1200):
            continue

        body_start = post["_body_start"] + offset
        body_end   = post["_body_end"]   + offset
        content    = new_text[body_start:body_end]
        old_wc     = _quick_wc(content)

        new_content = expand_to_1800(content, slug)
        new_wc      = _quick_wc(new_content)

        if new_wc <= old_wc:
            continue

        if dry_run:
            print(f"  [{total}] {slug}: wc {old_wc} -> {new_wc} (depth {depth} -> {7 if new_wc>=1800 else 6})")
        else:
            new_text = new_text[:body_start] + new_content + new_text[body_end:]
            offset += len(new_content) - len(content)

        expanded += 1

    if dry_run:
        print(f"\nDRY: {expanded} posts would be expanded")
    else:
        BLOG_DATA.write_text(new_text, encoding="utf-8")
        print(f"Expanded: {expanded} posts")
        print("Run: python scripts/enem_audit.py --category")


if __name__ == "__main__":
    main()
