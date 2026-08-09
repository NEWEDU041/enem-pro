#!/bin/bash
# Auto-update posts - run on 1st day of month at midnight
# Add to crontab: 0 0 1 * * /path/to/run-update-posts.sh

cd /path/to/enem-pro
node scripts/auto-update-posts.js
git add .blog-memory/drafts/
git commit -m "🔄 Auto: Updated old posts for freshness"
git push origin master
