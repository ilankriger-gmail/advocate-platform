/**
 * Componente para injetar JSON-LD (Structured Data) nas paginas
 * Usado para melhorar a indexacao e rich snippets no Google
 */

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Schema para Organization (usado no root layout)
 */
export function OrganizationJsonLd({
  name,
  url,
  logo,
  description,
}: {
  name: string;
  url: string;
  logo: string;
  description?: string;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    sameAs: [],
  };

  return <JsonLd data={data} />;
}

/**
 * Schema para Event (usado em /eventos/[id])
 */
export function EventJsonLd({
  name,
  description,
  startDate,
  endDate,
  location,
  image,
  url,
  organizer,
}: {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  image?: string;
  url: string;
  organizer?: string;
}) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    startDate,
    endDate,
    url,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
  };

  if (location) {
    data.location = {
      '@type': 'Place',
      name: location,
    };
  }

  if (image) {
    data.image = image;
  }

  if (organizer) {
    data.organizer = {
      '@type': 'Organization',
      name: organizer,
    };
  }

  return <JsonLd data={data} />;
}

/**
 * Schema para BreadcrumbList (navegacao)
 */
export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd data={data} />;
}

/**
 * Schema para WebSite (busca do site)
 */
export function WebSiteJsonLd({
  name,
  url,
  description,
}: {
  name: string;
  url: string;
  description?: string;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return <JsonLd data={data} />;
}
