const fs = require('fs');
const path = require('path');

// Read the entire file
const filePath = path.join(__dirname, '../lib/blog-data.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

console.log('Reading blog-data.ts...');
console.log(`File size: ${fileContent.length} characters`);

// Find the array start
const arrayStart = fileContent.indexOf('export const BLOG_POSTS: BlogPost[] = [');
if (arrayStart === -1) {
  console.error('ERROR: Could not find BLOG_POSTS array');
  process.exit(1);
}

console.log('Found BLOG_POSTS array');

// Find the end - look for ]; at the end
const arrayStartPos = arrayStart + 'export const BLOG_POSTS: BlogPost[] = ['.length;
const rest = fileContent.substring(arrayStartPos);

// Find the ending ]; by tracking braces carefully
let braceDepth = 0;
let inTemplate = false;
let inString = false;
let arrayEndPos = -1;

for (let i = 0; i < rest.length; i++) {
  const char = rest[i];
  const prevChar = i > 0 ? rest[i - 1] : '';

  // Handle template strings
  if (char === '`' && prevChar !== '\\') {
    inTemplate = !inTemplate;
    continue;
  }

  if (inTemplate) continue;

  // Handle regular strings
  if ((char === '"' || char === "'") && prevChar !== '\\') {
    inString = !inString;
    continue;
  }

  if (inString) continue;

  // Count braces
  if (char === '{') {
    braceDepth++;
  } else if (char === '}') {
    braceDepth--;

    // When we hit braceDepth 0 and see ]; next, we're at the end
    if (braceDepth === 0) {
      if (rest[i + 1] === ',' || (rest[i + 1] === '\n' && rest[i + 2] === ' ')) {
        // More items coming or end of previous item
        continue;
      } else if (rest[i + 1] === '\n' && rest.substring(i + 1).match(/^\n\s*\]/)) {
        // This might be the end
        arrayEndPos = i + 1;
        break;
      } else if (rest[i + 1] === ']') {
        arrayEndPos = i + 1;
        break;
      }
    }
  }
}

if (arrayEndPos === -1) {
  console.error('ERROR: Could not find end of BLOG_POSTS array');
  process.exit(1);
}

const arrayContent = rest.substring(0, arrayEndPos);
console.log(`Array content length: ${arrayContent.length} chars`);

// Split by post objects more carefully
const posts = [];
let currentPost = '';
let braceDepth2 = 0;
let inTemplate2 = false;
let inString2 = false;
let postStartIdx2 = -1;

for (let i = 0; i < arrayContent.length; i++) {
  const char = arrayContent[i];
  const prevChar = i > 0 ? arrayContent[i - 1] : '';

  // Handle escape sequences
  if (prevChar === '\\') continue;

  // Handle template strings
  if (char === '`') {
    inTemplate2 = !inTemplate2;
  }

  if (inTemplate2) {
    currentPost += char;
    continue;
  }

  // Handle regular strings
  if (char === '"' || char === "'") {
    inString2 = !inString2;
  }

  if (inString2) {
    currentPost += char;
    continue;
  }

  // Track braces
  if (char === '{') {
    if (braceDepth2 === 0) {
      postStartIdx2 = i;
    }
    braceDepth2++;
    currentPost += char;
  } else if (char === '}') {
    braceDepth2--;
    currentPost += char;

    if (braceDepth2 === 0 && postStartIdx2 >= 0) {
      // We have a complete post
      const postStr = currentPost.trim();

      // Check if it has "slug:" - this indicates it's a blog post, not an interface
      if (postStr.includes('slug:')) {
        try {
          // Try to parse it
          const post = Function('"use strict"; return (' + postStr + ')')();

          // Verify it has the right properties
          if (post.slug && post.title && post.content) {
            posts.push({
              index: posts.length,
              text: postStr,
              parsed: post
            });
            console.log(`Extracted post ${posts.length}: "${post.title.substring(0, 50)}..."`);
          }
        } catch (e) {
          // Skip this one - probably not a real post
          console.log(`Skipped non-post object at position ${postStartIdx2}`);
        }
      }
      currentPost = '';
      postStartIdx2 = -1;
    }
  } else if (char !== ',' && braceDepth2 > 0) {
    currentPost += char;
  } else if (braceDepth2 > 0) {
    currentPost += char;
  }
}

console.log(`\nTotal valid blog posts extracted: ${posts.length}`);

// Save to file
fs.writeFileSync(
  path.join(__dirname, '../posts-extracted-fixed.json'),
  JSON.stringify(posts, (key, value) => {
    // Don't include the full parsed object, just keep the text
    if (key === 'parsed') return undefined;
    return value;
  }, 2)
);

console.log('Saved extracted posts to posts-extracted-fixed.json');

// Show first few
console.log('\nFirst 5 posts:');
posts.slice(0, 5).forEach((p, i) => {
  console.log(`${i + 1}. ${p.parsed.title}`);
});
