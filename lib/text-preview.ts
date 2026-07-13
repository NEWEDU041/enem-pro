// Strips markdown (images, bold, italic) from question text so list previews
// never leak raw syntax like ![](https://enem.dev/.../foo.png) as plain text.
export function previewText(raw?: string): string {
  if (!raw) return ''
  return raw
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}
