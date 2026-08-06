const fs = require('fs');
const path = require('path');

// Read the entire file
const filePath = path.join(__dirname, '../lib/blog-data.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

console.log('Starting extraction...');
console.log(`File size: ${(fileContent.length / 1024 / 1024).toFixed(2)} MB`);

// Find the array start
const arrayStart = fileContent.indexOf('export const BLOG_POSTS: BlogPost[] = [');
if (arrayStart === -1) {
  console.error('ERROR: Could not find BLOG_POSTS array');
  process.exit(1);
}

// Find the end by searching backward for ];
const arrayStartContent = fileContent.substring(arrayStart);
let arrayEnd = arrayStartContent.lastIndexOf('];');
if (arrayEnd === -1) {
  console.error('ERROR: Could not find end of BLOG_POSTS array');
  process.exit(1);
}

// Extract the array content
const arrayPrefix = 'export const BLOG_POSTS: BlogPost[] = [';
const contentStart = arrayStart + arrayPrefix.length;
const contentEnd = arrayStart + arrayPrefix.length + arrayEnd;
const arrayContent = fileContent.substring(contentStart, contentEnd);

console.log(`Array content extracted: ${(arrayContent.length / 1024).toFixed(2)} KB`);

// Now parse posts one by one
// We'll use a simple regex-based approach
const posts = [];

// Split by the closing brace followed by comma or whitespace
// This is a regex that matches } followed by comma/newline (end of a post)
const postPattern = /\{[\s\S]*?\},\s*/g;
let match;

while ((match = postPattern.exec(arrayContent)) !== null) {
  const postText = match[0].replace(/,\s*$/, '').trim();

  // Check if this looks like a blog post (has slug:)
  if (postText.includes('slug:')) {
    try {
      const post = Function('"use strict"; return (' + postText + ')')();

      // Verify essential properties
      if (post.slug && post.title && post.content !== undefined) {
        posts.push({
          index: posts.length,
          text: postText.substring(0, Math.min(500, postText.length)), // Store only first 500 chars for preview
          post: post
        });
        console.log(`Post ${posts.length}: "${post.title.substring(0, 50)}..."`);

        if (posts.length % 20 === 0) {
          console.log(`  ... extracted ${posts.length} posts so far`);
        }

        if (posts.length >= 114) {
          console.log('Reached 114 posts, stopping.');
          break;
        }
      }
    } catch (e) {
      // Silently skip posts that don't parse
    }
  }
}

console.log(`\n=== EXTRACTION COMPLETE ===`);
console.log(`Total posts extracted: ${posts.length}`);

if (posts.length > 0) {
  // Remove the full post text from the output and just keep references
  const postsData = posts.map(p => ({
    index: p.index,
    title: p.post.title,
    slug: p.post.slug,
    readTime: p.post.readTime,
    contentLength: p.post.content.length
  }));

  fs.writeFileSync(
    path.join(__dirname, '../posts-list.json'),
    JSON.stringify(postsData, null, 2)
  );

  console.log('Saved posts list to posts-list.json');

  // Show first 5
  console.log('\nFirst 5 posts:');
  posts.slice(0, 5).forEach(p => {
    console.log(`  - ${p.post.title}`);
  });
} else {
  console.error('No posts were extracted!');
  process.exit(1);
}
