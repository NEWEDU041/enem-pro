export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: number;
  content: string;
  cover_url?: string;
  noindex?: boolean;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "enem-2024-gabarito",
    title: "Gabarito ENEM 2024",
    description: "Gabarito oficial ENEM 2024 com resolução",
    date: "2024-11-10",
    readTime: 11,
    content: "# Gabarito ENEM 2024\n\nConfira o gabarito oficial.",
    cover_url: "/images/blog/gabarito.svg"
  }
];

export function getAllPosts(): BlogPost[] {
  return BLOG_POSTS;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(p => p.slug === slug);
}

export function getPost(slug: string): BlogPost | undefined {
  return getPostBySlug(slug);
}

export function getRelatedPosts(slug: string, limit: number = 3): BlogPost[] {
  const post = getPostBySlug(slug);
  if (!post) return [];
  return [];
}

export function getPostsByDiscipline(discipline: string, limit: number = 3): BlogPost[] {
  return [];
}

export function getCategory(slug: string): string {
  if (slug.includes("gabarito")) return "gabarito";
  if (slug.includes("questao")) return "questoes";
  return "blog";
}
