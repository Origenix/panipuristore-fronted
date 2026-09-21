import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'Panipuri Store';
const DEFAULT_SITE_URL = 'https://panipuristore.vercel.app';
const DEFAULT_DESCRIPTION =
  'Panipuri Store brings pani puri, chaats and Indian street food online. Explore the menu, discover restaurants and order fresh street food.';

const PUBLIC_ROUTES = {
  '/': {
    title: 'Panipuri Store | Order Pani Puri & Indian Street Food Online',
    description: DEFAULT_DESCRIPTION,
    type: 'home',
  },
  '/menu': {
    title: 'Pani Puri & Chaat Menu | Panipuri Store',
    description: 'Explore Panipuri Store menu items including pani puri, chaats, snacks and refreshing beverages.',
    type: 'menu',
  },
  '/restaurants': {
    title: 'Restaurants | Panipuri Store',
    description: 'Discover restaurants and street-food options available through Panipuri Store.',
    type: 'restaurants',
  },
  '/subscription-plans': {
    title: 'Subscription Plans | Panipuri Store',
    description: 'Explore Panipuri Store subscription plans and benefits.',
    type: 'subscription',
  },
};

const PRIVATE_PREFIXES = [
  '/admin',
  '/owner',
  '/delivery',
  '/login',
  '/signup',
  '/cart',
  '/checkout',
  '/orders',
  '/favorites',
  '/profile',
  '/support',
];

function upsertMeta(attribute, key, content) {
  if (!content) return;
  let node = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let node = document.head.querySelector(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', rel);
    document.head.appendChild(node);
  }
  node.setAttribute('href', href);
}

function setJsonLd(id, data) {
  let node = document.head.querySelector(`script[data-seo-id="${id}"]`);
  if (!node) {
    node = document.createElement('script');
    node.type = 'application/ld+json';
    node.setAttribute('data-seo-id', id);
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(data);
}

export default function SEO() {
  const { pathname } = useLocation();

  useEffect(() => {
    const configuredSiteUrl = (import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
    const origin = configuredSiteUrl;
    const canonicalUrl = `${origin}${pathname === '/' ? '/' : pathname}`;

    const route = PUBLIC_ROUTES[pathname];
    const isPrivate = PRIVATE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
    );

    let title = route?.title || (
      pathname.startsWith('/restaurant/')
        ? 'Restaurant Menu | Panipuri Store'
        : 'Panipuri Store'
    );
    let description = route?.description || (
      pathname.startsWith('/restaurant/')
        ? 'Explore restaurant menu items and ordering options on Panipuri Store.'
        : DEFAULT_DESCRIPTION
    );

    document.title = title;

    // Remove route-specific structured data from the previous SPA view.
    ['website', 'organization', 'breadcrumb'].forEach((id) => {
      document.head.querySelector(`script[data-seo-id="${id}"]`)?.remove();
    });

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', isPrivate ? 'noindex,nofollow' : 'index,follow');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertLink('canonical', canonicalUrl);

    if (route?.type === 'home') {
      setJsonLd('website', {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        alternateName: 'PanipuriStore',
        url: origin + '/',
      });

      setJsonLd('organization', {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: origin + '/',
      });
    } else {
      const breadcrumb = pathname.startsWith('/restaurant/')
        ? [
            { name: 'Home', url: origin + '/' },
            { name: 'Restaurants', url: origin + '/restaurants' },
            { name: 'Restaurant Menu', url: canonicalUrl },
          ]
        : pathname === '/menu'
          ? [
              { name: 'Home', url: origin + '/' },
              { name: 'Menu', url: canonicalUrl },
            ]
          : pathname === '/restaurants'
            ? [
                { name: 'Home', url: origin + '/' },
                { name: 'Restaurants', url: canonicalUrl },
              ]
            : pathname === '/subscription-plans'
              ? [
                  { name: 'Home', url: origin + '/' },
                  { name: 'Subscription Plans', url: canonicalUrl },
                ]
              : [];

      if (breadcrumb.length) {
        setJsonLd('breadcrumb', {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumb.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
          })),
        });
      }
    }
  }, [pathname]);

  return null;
}
