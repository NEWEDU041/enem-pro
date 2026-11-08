// File: lib/seo/meta-optimizer.ts

// Post interface definition (if not exists in project)
interface Post {
  slug: string;
  title: string;
  excerpt: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

interface MetaOptimizationResult {
  slug: string;
  oldTitle: string;
  newTitle: string;
  oldDescription: string;
  newDescription: string;
  changes: string[];
}

// Limits as per SEO best practices
const TITLE_LIMITS = { min: 30, optimal: { min: 50, max: 63 } };
const DESC_LIMITS = { min: 1, optimal: { min: 120, max: 158 } };

export class MetaOptimizer {
  static optimizeTitle(title: string, keyword?: string): string {
    if (title.length > TITLE_LIMITS.optimal.max) {
      // Truncate and add suffix if keyword present
      const truncated = title.substring(0, 60 - 5) + "...";
      return truncated;
    }
    if (title.length < TITLE_LIMITS.optimal.min) {
      // Expand with pipe separator + keyword
      return `${title} | ${keyword || "ENEM"}`;
    }
    return title;
  }

  static optimizeDescription(desc: string, keyword?: string): string {
    if (desc.length > DESC_LIMITS.optimal.max) {
      // Remove redundancy, keep keyword
      const trimmed = desc.substring(0, DESC_LIMITS.optimal.max).trim() + ".";
      return trimmed;
    }
    if (desc.length < DESC_LIMITS.optimal.min) {
      // Expand with keyword-rich text
      return `${desc} ${keyword ? `Aprenda sobre ${keyword} e melhore suas chances.` : ""}`;
    }
    return desc;
  }

  static analyzeKeywordPresence(title: string, description: string, keyword: string): {
    inTitle: boolean;
    inDescription: boolean;
  } {
    return {
      inTitle: title.toLowerCase().includes(keyword.toLowerCase()),
      inDescription: description.toLowerCase().includes(keyword.toLowerCase()),
    };
  }

  static optimizePost(post: Post): MetaOptimizationResult {
    const changes: string[] = [];
    let newTitle = post.seo?.title || post.title;
    let newDescription = post.seo?.description || post.excerpt;
    const keyword = post.seo?.keywords?.[0] || post.title.split(" ")[0];

    // Title optimization
    if (newTitle.length > TITLE_LIMITS.optimal.max) {
      const oldTitle = newTitle;
      newTitle = this.optimizeTitle(newTitle, keyword);
      changes.push(`Title: ${oldTitle.length} chars → ${newTitle.length} chars`);
    }

    // Description optimization
    if (newDescription.length > DESC_LIMITS.optimal.max) {
      const oldDesc = newDescription;
      newDescription = this.optimizeDescription(newDescription, keyword);
      changes.push(`Description: ${oldDesc.length} chars → ${newDescription.length} chars`);
    } else if (newDescription.length < DESC_LIMITS.optimal.min) {
      const oldDesc = newDescription;
      newDescription = this.optimizeDescription(newDescription, keyword);
      changes.push(`Description: ${oldDesc.length} chars → ${newDescription.length} chars (expanded)`);
    }

    // Keyword presence check
    const keywordCheck = this.analyzeKeywordPresence(newTitle, newDescription, keyword);
    if (!keywordCheck.inTitle) {
      changes.push(`⚠️ Keyword "${keyword}" missing from title`);
    }
    if (!keywordCheck.inDescription) {
      changes.push(`⚠️ Keyword "${keyword}" missing from description`);
    }

    return {
      slug: post.slug,
      oldTitle: post.seo?.title || post.title,
      newTitle,
      oldDescription: post.seo?.description || post.excerpt,
      newDescription,
      changes,
    };
  }
}

// Usage: Batch optimization
export async function optimizeAllPosts(posts: Post[]): Promise<MetaOptimizationResult[]> {
  return posts.map(post => MetaOptimizer.optimizePost(post));
}
