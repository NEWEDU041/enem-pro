export type BlogCategory = 
  | 'Gabarito'
  | 'Questões'
  | 'Redação'
  | 'Universidades'
  | 'Por Matéria'
  | 'Estratégias'
  | 'Como Funciona'
  | 'Planejamento'
  | 'Comparativos'
  | 'Geral';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: number;
  content: string;
  cover_url?: string;
  noindex?: boolean;
  category: BlogCategory;
}