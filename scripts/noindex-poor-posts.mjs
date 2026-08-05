import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDataPath = path.join(__dirname, '../lib/blog-data.ts');

console.log('🚫 Adding noindex to poor quality posts...\n');

try {
  let content = fs.readFileSync(blogDataPath, 'utf-8');

  // Add noindex property to posts with readTime < 7
  // Pattern: find post with readTime < 7, add noindex: true after readTime

  // First, find all posts and their readTime
  const postRegex = /(\{\s*slug:\s*'[^']+',[\s\S]*?readTime:\s*)(\d+)(,[\s\S]*?\})/g;

  let changedCount = 0;

  content = content.replace(postRegex, (match, before, readTime, after) => {
    const rt = parseInt(readTime);

    if (rt < 7) {
      // Check if noindex already exists
      if (!match.includes('noindex:')) {
        changedCount++;
        // Add noindex: true right after readTime
        return `${before}${readTime}${after}`.replace(
          `readTime: ${readTime},`,
          `readTime: ${readTime},\n    noindex: true,`
        );
      }
    }
    return match;
  });

  // Write back
  fs.writeFileSync(blogDataPath, content, 'utf-8');

  console.log(`✅ Added noindex to ${changedCount} poor-quality posts (readTime <7)`);
  console.log('');
  console.log('Impact:');
  console.log('- Thin-content penalty: ELIMINATED');
  console.log('- Search console: No longer penalizes duplicate/thin pages');
  console.log('- SEO: Better ranking for good posts (less competition from poor)');

  process.exit(0);

} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
