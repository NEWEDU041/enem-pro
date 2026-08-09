const fs = require('fs');
const path = require('path');

// Read the blog-data.ts file
const filePath = path.join(__dirname, '../lib/blog-data.ts');
const fileContent = fs.readFileSync(filePath, 'utf8');

// Extract the array content between [ and ];
const arrayStart = fileContent.indexOf('export const BLOG_POSTS: BlogPost[] = [');
if (arrayStart === -1) {
  console.error('Could not find BLOG_POSTS array');
  process.exit(1);
}

const arrayStartPos = fileContent.indexOf('[', arrayStart) + 1;
const arrayEnd = fileContent.lastIndexOf('];');
const arrayContent = fileContent.substring(arrayStartPos, arrayEnd);

// Parse posts manually
const posts = [];
let currentPost = '';
let braceCount = 0;
let inString = false;
let escapeNext = false;

for (let i = 0; i < arrayContent.length; i++) {
  const char = arrayContent[i];

  if (escapeNext) {
    currentPost += char;
    escapeNext = false;
    continue;
  }

  if (char === '\\') {
    currentPost += char;
    escapeNext = true;
    continue;
  }

  if (char === '"' && (i === 0 || arrayContent[i-1] !== '\\')) {
    inString = !inString;
  }

  if (!inString) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
  }

  currentPost += char;

  // When we close a brace at level 0, we have a complete post
  if (!inString && braceCount === 0 && char === '}') {
    const trimmed = currentPost.trim();
    if (trimmed.startsWith('{')) {
      try {
        // Replace TypeScript-specific syntax
        let jsonStr = trimmed;
        // Remove trailing comma if present
        jsonStr = jsonStr.replace(/,\s*$/, '');
        const post = Function('"use strict"; return (' + jsonStr + ')')();
        posts.push(post);
      } catch (e) {
        console.error('Error parsing post:', e.message);
        console.error('Post content:', currentPost.substring(0, 200));
      }
    }
    currentPost = '';
  }
}

console.log('Total posts found:', posts.length);
console.log('\nFirst 5 posts:');
posts.slice(0, 5).forEach((p, i) => {
  console.log(`\n${i + 1}. ${p.title}`);
  console.log(`   Slug: ${p.slug}`);
  console.log(`   ReadTime: ${p.readTime} min`);
  console.log(`   Content length: ${p.content.length} chars`);
});

// Export for use in expansion script
module.exports = { posts, fileContent, arrayStart, arrayStartPos, arrayEnd };
