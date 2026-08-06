const fs = require('fs');
const path = require('path');

console.log('Reading expanded posts...');
const expandedData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../expanded-posts-output.json'), 'utf8')
);

const expandedPosts = expandedData.expandedPosts;
console.log(`Found ${expandedPosts.length} expanded posts`);

// Read the original blog-data.ts
console.log('Reading original blog-data.ts...');
const originalFile = fs.readFileSync(path.join(__dirname, '../lib/blog-data.ts'), 'utf8');

// We need to reconstruct the file with the expanded posts
// Get the header (everything before the array)
const arrayStart = originalFile.indexOf('export const BLOG_POSTS: BlogPost[] = [');
const headerEnd = arrayStart + 'export const BLOG_POSTS: BlogPost[] = ['.length;
const header = originalFile.substring(0, headerEnd) + '\n';

// Get the footer (everything after the first 114 posts)
// This is tricky - we need to find where post 114 ends
let footerStart = -1;
let braceDepth = 0;
let inTemplate = false;
let postCount = 0;
let i = headerEnd;

while (i < originalFile.length && postCount < 114) {
  const char = originalFile[i];
  const prevChar = i > 0 ? originalFile[i - 1] : '';

  if (prevChar !== '\\' && char === '`') {
    inTemplate = !inTemplate;
  }

  if (!inTemplate) {
    if (char === '{') {
      braceDepth++;
    } else if (char === '}') {
      braceDepth--;
      if (braceDepth === 0) {
        postCount++;
        if (postCount === 114) {
          // Find the comma or newline after this post
          let j = i + 1;
          while (j < originalFile.length && (originalFile[j] === ',' || originalFile[j] === ' ' || originalFile[j] === '\n' || originalFile[j] === '\r')) {
            j++;
          }
          footerStart = j;
          break;
        }
      }
    }
  }

  i++;
}

if (footerStart === -1) {
  console.log('WARNING: Could not find where post 114 ends, using simple approach');
  footerStart = originalFile.lastIndexOf('];');
}

const footer = originalFile.substring(footerStart);

// Create the new file content
let newFileContent = header;

// Add each expanded post
for (let idx = 0; idx < expandedPosts.length; idx++) {
  const post = expandedPosts[idx];

  // Create the post object string
  const postObj = {
    slug: post.slug,
    title: post.title,
    cover_url: post.cover_url,
    description: post.description,
    date: post.date,
    readTime: post.readTime,
    content: post.content
  };

  // Remove undefined properties
  const cleanPost = {};
  for (const [key, value] of Object.entries(postObj)) {
    if (value !== undefined) {
      cleanPost[key] = value;
    }
  }

  // Serialize the post as a JavaScript object
  // We need to use template string for the content to preserve newlines
  let postStr = '  {\n';
  for (const [key, value] of Object.entries(cleanPost)) {
    if (key === 'content') {
      // Use template string for content
      postStr += `    ${key}: \`${value.replace(/`/g, '\\`')}\`,\n`;
    } else if (typeof value === 'string') {
      // Escape and quote string values
      const escaped = value
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");
      postStr += `    ${key}: '${escaped}',\n`;
    } else {
      // For numbers and other types
      postStr += `    ${key}: ${value},\n`;
    }
  }

  // Remove the trailing comma from the last property
  postStr = postStr.replace(/,\n\s*$/, '\n');

  postStr += '  }';

  // Add comma if not the last post
  if (idx < expandedPosts.length - 1) {
    postStr += ',';
  }

  postStr += '\n';
  newFileContent += postStr;
}

// Add the remaining posts from the original file (posts 115 onwards)
// Get posts 115+ from original file
console.log('Preserving posts 115+ from original file...');
if (footerStart > 0 && footerStart < originalFile.length) {
  const remainingPosts = originalFile.substring(footerStart);
  // If the remaining starts with whitespace/comma, add it as is
  if (remainingPosts.trim().startsWith(',')) {
    newFileContent += remainingPosts.substring(remainingPosts.indexOf(',') + 1);
  } else {
    newFileContent += remainingPosts;
  }
} else {
  // Just close the array
  newFileContent += '\n];';
}

// Make sure file ends with ];
if (!newFileContent.trim().endsWith('};')) {
  if (!newFileContent.includes('];')) {
    newFileContent += '\n];';
  }
}

console.log(`New file content size: ${(newFileContent.length / 1024 / 1024).toFixed(2)} MB`);

// Write the new file
const outputPath = path.join(__dirname, '../lib/blog-data.ts');
fs.writeFileSync(outputPath, newFileContent, 'utf8');
console.log(`Written expanded blog-data.ts (${(newFileContent.length / 1024).toFixed(2)} KB)`);

// Verify the file was written
const verifyContent = fs.readFileSync(outputPath, 'utf8');
console.log(`Verification: File written successfully (${(verifyContent.length / 1024).toFixed(2)} KB)`);

console.log('\nDone! Blog post expansion complete.');
