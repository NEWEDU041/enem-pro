
// app/components/RelatedArticles.tsx
import Link from 'next/link';
import { InternalLink } from '@/lib/internal-links';

interface RelatedArticlesProps {
  links: InternalLink[];
  title?: string;
}

export function RelatedArticles({
  links,
  title = 'Artigos Relacionados'
}: RelatedArticlesProps) {
  if (links.length === 0) return null;

  // Separate by type
  const pillarLinks = links.filter(l => l.type === 'pillar');
  const primaryLinks = links.filter(l => l.type === 'primary');
  const otherLinks = links.filter(l => !['pillar', 'primary'].includes(l.type));

  return (
    <section className="mt-12 pt-8 border-t border-zinc-200">
      <h2 className="text-xl font-bold text-zinc-900 mb-6">{title}</h2>

      <div className="space-y-4">
        {pillarLinks.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-indigo-600 mb-2">Guias Principais</p>
            <ul className="space-y-2">
              {pillarLinks.map(link => (
                <li key={link.slug}>
                  <Link
                    href={`/blog/${link.slug}`}
                    className="text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(primaryLinks.length > 0 || otherLinks.length > 0) && (
          <div>
            <p className="text-sm font-semibold text-zinc-600 mb-2">Leitura Complementar</p>
            <ul className="space-y-2">
              {[...primaryLinks, ...otherLinks].map(link => (
                <li key={link.slug}>
                  <Link
                    href={`/blog/${link.slug}`}
                    className="text-zinc-600 hover:text-zinc-900 hover:underline"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
