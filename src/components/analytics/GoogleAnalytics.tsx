'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// Declaração do tipo para gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

interface GoogleAnalyticsInnerProps {
  measurementId: string;
}

function GoogleAnalyticsInner({ measurementId }: GoogleAnalyticsInnerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!measurementId || !window.gtag) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : '');
    window.gtag('config', measurementId, { page_path: url });
  }, [pathname, searchParams, measurementId]);

  return null;
}

interface GoogleAnalyticsProps {
  measurementId?: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  // Usa prop ou fallback para variável de ambiente
  const gaId = measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsInner measurementId={gaId} />
      </Suspense>
    </>
  );
}
