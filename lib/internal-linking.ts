
// lib/internal-linking.ts
export interface LinkCluster {
  topic: string;
  primaryKeyword: string;
  posts: Array<{slug: string, title: string, readTime: number}>;
}

export const LINK_CLUSTERS: LinkCluster[] = [
  {
    topic: 'Biologia',
    primaryKeyword: 'biologia enem',
    posts: []
  },
  {
    topic: 'História',
    primaryKeyword: 'história enem',
    posts: []
  },
  {
    topic: 'Física',
    primaryKeyword: 'física enem',
    posts: []
  },
  {
    topic: 'Química',
    primaryKeyword: 'química enem',
    posts: []
  },
  {
    topic: 'Matemática',
    primaryKeyword: 'matemática enem',
    posts: []
  },
  {
    topic: 'Português e Literatura',
    primaryKeyword: 'português enem',
    posts: []
  },
  {
    topic: 'Redação',
    primaryKeyword: 'redação enem',
    posts: []
  },
  {
    topic: 'Atualidades',
    primaryKeyword: 'atualidades enem',
    posts: []
  }
];

export function generateRelatedPostsLinks(currentSlug: string, cluster: LinkCluster, limit: number = 3): string {
  const related = cluster.posts.filter(p => p.slug !== currentSlug).slice(0, limit);
  if (related.length === 0) return '';
  
  let html = '<div class="related-posts"><h3>Relacionados</h3><ul>';
  for (const post of related) {
    html += `<li><a href="/blog/${post.slug}">${post.title}</a></li>`;
  }
  html += '</ul></div>';
  return html;
}

export function getClusterForTopic(topic: string): LinkCluster | undefined {
  return LINK_CLUSTERS.find(c => c.topic.toLowerCase().includes(topic.toLowerCase()) ||
                                  topic.toLowerCase().includes(c.topic.toLowerCase()));
}
