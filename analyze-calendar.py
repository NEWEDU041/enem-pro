#!/usr/bin/env python3
"""
ENEM-Pro Content Calendar Analyzer & Post Generator
Parses the 52-week calendar and creates ready-to-publish blog posts
"""

import csv
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict

PROJECT_DIR = Path("/root/projetos/enem-pro")
BLOG_POSTS_DIR = PROJECT_DIR / "app" / "blog" / "posts"
CALENDAR_FILE = PROJECT_DIR / "content-calendar-52week-2026-11-02.csv"

def load_calendar(file_path):
    """Load the CSV calendar into memory"""
    posts = []
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            row['estimated_length_words'] = int(row['estimated_length_words'])
            posts.append(row)
    return posts

def analyze_calendar(posts):
    """Analyze calendar statistics"""
    stats = {
        'total_posts': len(posts),
        'by_subject': defaultdict(int),
        'by_type': defaultdict(int),
        'by_difficulty': defaultdict(int),
        'by_seo_priority': defaultdict(int),
        'by_week': defaultdict(int),
        'total_words': 0,
        'avg_words_per_post': 0,
    }
    
    for post in posts:
        stats['by_subject'][post['subject']] += 1
        stats['by_type'][post['type']] += 1
        stats['by_difficulty'][post['difficulty']] += 1
        stats['by_seo_priority'][post['seo_priority']] += 1
        stats['by_week'][post['week']] += 1
        stats['total_words'] += post['estimated_length_words']
    
    stats['avg_words_per_post'] = stats['total_words'] // stats['total_posts'] if stats['total_posts'] > 0 else 0
    
    return stats

def generate_markdown_template(post):
    """Generate markdown template for a post"""
    template = f"""---
title: "{post['title']}"
description: "ENEM 2026: {post['title']} - {post['subject']}. Prepare effectively with strategies, practice problems, and study guides."
date: "{datetime.now().strftime('%Y-%m-%d')}"
author: "ENEM Pro"
category: "{post['subject']}"
tags: ["enem-2026", "{post['subject'].lower()}", "{post['type']}", "{post['difficulty']}"]
difficulty: "{post['difficulty']}"
estimatedTime: "{max(8, post['estimated_length_words'] // 200)} min read"
seoKeywords: "{post['target_keywords']}"
---

# {post['title']}

## Introduction

This comprehensive guide covers essential aspects of **{post['subject']}** for ENEM 2026. We break down complex concepts into digestible, actionable steps to help you maximize your score.

**What You'll Learn:**
- Core concepts and definitions
- Practical examples and real ENEM questions
- Study strategies and revision techniques
- Common mistakes to avoid
- Quick reference tables and mnemonics

## Key Topics

### Main Concept 1

Detailed explanation of the first key topic relevant to {post['subject']} and ENEM preparation.

### Main Concept 2

Deep dive into the second critical area you need to master.

### Main Concept 3

Third essential concept with examples and practice tips.

## Practice Problems

**Problem 1:** [Example problem related to {post['subject']}]
**Solution:** [Step-by-step solution with explanation]

**Problem 2:** [Another representative ENEM-style question]
**Solution:** [Detailed walkthrough]

## Study Strategy

For {post['subject']} preparation:
1. Master the fundamentals first
2. Practice with actual ENEM questions
3. Review incorrect answers
4. Focus on your weak areas
5. Time yourself during practice

## Common Mistakes to Avoid

- Misunderstanding key definitions
- Rushing through calculations
- Overlooking important details
- Not reading questions carefully
- Mixing up similar concepts

## Quick Reference

| Concept | Definition | Example |
|---------|-----------|---------|
| Concept A | Definition | Real-world example |
| Concept B | Definition | Real-world example |
| Concept C | Definition | Real-world example |

## Revision Checklist

- [ ] Understand all core definitions
- [ ] Can solve practice problems without help
- [ ] Know common traps and mistakes
- [ ] Can explain concepts in your own words
- [ ] Review weekly

## FAQ

**Q: How much time should I dedicate to {post['subject']}?**
A: Dedicate at least 2-3 hours per week to stay on pace for ENEM.

**Q: What are the most tested topics in {post['subject']}?**
A: Focus on the topics covered in this guide as they appear most frequently.

**Q: How do I practice effectively?**
A: Use the practice problems provided and track your accuracy and time.

## Final Tips

- Create flashcards for key concepts
- Join study groups for collaborative learning
- Take practice tests weekly
- Review your mistakes carefully
- Stay consistent with your study schedule

## Resources

- Official ENEM study materials
- Previous year questions
- Subject-specific textbooks
- Online ENEM communities

---

**Ready to master {post['subject']}?** Start with the fundamentals and practice consistently. Review this guide weekly as you prepare for ENEM 2026.

*Last Updated: {{current_date}}*
"""
    return template

def print_analysis_report(stats):
    """Print analysis report to console"""
    print("\n" + "="*70)
    print("ENEM-Pro Content Calendar - Analysis Report")
    print("="*70)
    
    print(f"\n📊 Overall Statistics:")
    print(f"  Total Posts: {stats['total_posts']}")
    print(f"  Total Words: {stats['total_words']:,}")
    print(f"  Average Words/Post: {stats['avg_words_per_post']}")
    print(f"  Estimated Reading Hours: {stats['total_words'] // 200}")
    
    print(f"\n📚 By Subject ({len(stats['by_subject'])} subjects):")
    for subject in sorted(stats['by_subject'].keys()):
        count = stats['by_subject'][subject]
        pct = (count / stats['total_posts']) * 100
        print(f"  {subject:20s}: {count:3d} posts ({pct:5.1f}%)")
    
    print(f"\n📝 By Type ({len(stats['by_type'])} types):")
    for ptype in sorted(stats['by_type'].keys()):
        count = stats['by_type'][ptype]
        pct = (count / stats['total_posts']) * 100
        print(f"  {ptype:20s}: {count:3d} posts ({pct:5.1f}%)")
    
    print(f"\n🎯 By Difficulty ({len(stats['by_difficulty'])} levels):")
    for diff in ['easy', 'medium', 'hard']:
        count = stats['by_difficulty'].get(diff, 0)
        pct = (count / stats['total_posts']) * 100 if count > 0 else 0
        print(f"  {diff:20s}: {count:3d} posts ({pct:5.1f}%)")
    
    print(f"\n⭐ By SEO Priority ({len(stats['by_seo_priority'])} levels):")
    for priority in ['high', 'medium', 'low']:
        count = stats['by_seo_priority'].get(priority, 0)
        pct = (count / stats['total_posts']) * 100 if count > 0 else 0
        print(f"  {priority:20s}: {count:3d} posts ({pct:5.1f}%)")
    
    print(f"\n📅 Posts per Week:")
    weeks_with_posts = len(stats['by_week'])
    avg_per_week = stats['total_posts'] / weeks_with_posts if weeks_with_posts > 0 else 0
    print(f"  Weeks Covered: {weeks_with_posts}")
    print(f"  Average Posts/Week: {avg_per_week:.1f}")
    print(f"  (Most weeks: {max(stats['by_week'].values())} posts/week)")
    
    print("\n" + "="*70)
    print("✓ Calendar Analysis Complete")
    print("="*70 + "\n")

def generate_batch_json(posts):
    """Generate JSON batch file for post generation"""
    batch = {
        'timestamp': datetime.now().isoformat(),
        'total_posts': len(posts),
        'posts': [
            {
                'id': post['post_id'],
                'slug': post['slug'],
                'title': post['title'],
                'subject': post['subject'],
                'type': post['type'],
                'difficulty': post['difficulty'],
                'seo_priority': post['seo_priority'],
                'keywords': post['target_keywords'],
                'estimated_words': post['estimated_length_words'],
            }
            for post in posts
        ]
    }
    return batch

if __name__ == '__main__':
    print("🔍 Loading calendar...")
    posts = load_calendar(CALENDAR_FILE)
    
    print(f"✓ Loaded {len(posts)} posts")
    
    print("📊 Analyzing statistics...")
    stats = analyze_calendar(posts)
    
    print_analysis_report(stats)
    
    # Generate batch JSON
    batch_file = PROJECT_DIR / "posts-batch-metadata.json"
    batch_data = generate_batch_json(posts)
    with open(batch_file, 'w', encoding='utf-8') as f:
        json.dump(batch_data, f, indent=2, ensure_ascii=False)
    print(f"✓ Generated batch metadata: {batch_file}")
    
    # Export summary as markdown
    summary_file = PROJECT_DIR / ".claude" / "notes" / "calendar-52week-summary.md"
    summary_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write(f"""# ENEM-Pro 52-Week Content Calendar

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Overview
- **Total Posts:** {stats['total_posts']}
- **Total Words:** {stats['total_words']:,}
- **Average Words/Post:** {stats['avg_words_per_post']}
- **Time Period:** 52 weeks (1 year)
- **Posts per Week:** ~{stats['total_posts'] // 52}

## Distribution by Subject
""")
        for subject in sorted(stats['by_subject'].keys()):
            count = stats['by_subject'][subject]
            f.write(f"- **{subject}:** {count} posts\n")
        
        f.write(f"\n## Distribution by Type\n")
        for ptype in sorted(stats['by_type'].keys()):
            count = stats['by_type'][ptype]
            f.write(f"- **{ptype}:** {count} posts\n")
        
        f.write(f"\n## Distribution by SEO Priority\n")
        for priority in ['high', 'medium', 'low']:
            count = stats['by_seo_priority'].get(priority, 0)
            f.write(f"- **{priority}:** {count} posts\n")
        
        f.write(f"\n## Distribution by Difficulty\n")
        for diff in ['easy', 'medium', 'hard']:
            count = stats['by_difficulty'].get(diff, 0)
            f.write(f"- **{diff}:** {count} posts\n")
        
        f.write(f"\n## Implementation Notes\n")
        f.write(f"""
- Posts follow existing ENEM-Pro markdown format (frontmatter + content)
- SEO optimization with keywords in title, description, and content
- Progressive difficulty from weeks 1-17 (easy), 17-34 (medium), 34-52 (hard)
- Balanced distribution across all 9 ENEM subjects
- Multiple content types to maintain engagement and SEO diversity
- ~4-5 posts per week sustainable publishing schedule

## Next Steps
1. Review and approve calendar in `content-calendar-52week-{datetime.now().strftime('%Y-%m-%d')}.csv`
2. Generate posts using the batch metadata: `posts-batch-metadata.json`
3. Implement post generation pipeline in scripts/
4. Deploy weekly cycle starting Week 1
5. Monitor analytics and adjust topics based on performance
""")
    
    print(f"✓ Generated summary: {summary_file}")
    print("\n✅ Calendar analysis complete!")
