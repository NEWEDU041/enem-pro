// Schema.org markup generator for enem-pro
// Generates JSON-LD structured data for SEO

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ENEM Pro",
    "url": "https://enem-pro.com",
    "logo": "https://enem-pro.com/logo.png",
    "description": "Comprehensive ENEM preparation platform with 400+ study materials and expert resources",
    "sameAs": [
      "https://twitter.com/enempro",
      "https://instagram.com/enempro",
      "https://youtube.com/@enempro"
    ]
  };
}

export function generateArticleSchema(article: {
  title: string;
  description: string;
  image?: string;
  datePublished: string;
  author?: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "description": article.description,
    "image": article.image || "/default-article.jpg",
    "datePublished": article.datePublished,
    "author": {
      "@type": "Person",
      "name": article.author || "ENEM Pro"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ENEM Pro",
      "logo": {
        "@type": "ImageObject",
        "url": "https://enem-pro.com/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": article.url
    }
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((bc, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": bc.name,
      "item": bc.url
    }))
  };
}

export function generateCourseSchema(course: {
  name: string;
  description: string;
  provider: string;
  url: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.name,
    "description": course.description,
    "provider": {
      "@type": "Organization",
      "name": course.provider
    },
    "url": course.url,
    "image": course.image || "/course-default.jpg"
  };
}
