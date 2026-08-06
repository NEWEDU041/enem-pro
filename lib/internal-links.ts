
// app/lib/internal-links.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface InternalLink {
  slug: string;
  title: string;
  type: 'pillar' | 'primary' | 'secondary' | 'contextual';
  position: number;
}

export async function getInternalLinks(postSlug: string): Promise<InternalLink[]> {
  const { data, error } = await supabase
    .from('blog_post_links')
    .select('target_slug, target_title, link_type, position')
    .eq('source_slug', postSlug)
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching internal links:', error);
    return [];
  }

  return (data || []).map(link => ({
    slug: link.target_slug,
    title: link.target_title,
    type: link.link_type as any,
    position: link.position,
  }));
}

export async function addInternalLink(
  sourceSlug: string,
  targetSlug: string,
  type: 'pillar' | 'primary' | 'secondary' | 'contextual' = 'contextual'
): Promise<boolean> {
  const { error } = await supabase
    .from('blog_post_links')
    .upsert({
      source_slug: sourceSlug,
      target_slug: targetSlug,
      link_type: type,
    })
    .select();

  return !error;
}

export async function getBacklinks(postSlug: string): Promise<InternalLink[]> {
  const { data, error } = await supabase
    .from('blog_post_links')
    .select('source_slug, source_title, link_type')
    .eq('target_slug', postSlug)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching backlinks:', error);
    return [];
  }

  return (data || []).map(link => ({
    slug: link.source_slug,
    title: link.source_title,
    type: link.link_type as any,
    position: 0,
  }));
}
