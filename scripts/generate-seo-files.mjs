import fs from 'node:fs';
import path from 'node:path';

const configured = (process.env.VITE_SITE_URL || '').trim().replace(/\/$/, '');
const outDir = path.resolve('public');

if (!configured) {
  console.warn('[SEO] VITE_SITE_URL is not set; skipping sitemap generation.');
  process.exit(0);
}

const urls = [
  '/',
  '/menu',
  '/restaurants',
  '/subscription-plans',
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${configured}${url}</loc></url>`).join('\n')}
</urlset>
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap, 'utf8');

const robots = `User-agent: *
Allow: /

Sitemap: ${configured}/sitemap.xml
`;

fs.writeFileSync(path.join(outDir, 'robots.txt'), robots, 'utf8');
console.log(`[SEO] Generated sitemap.xml and robots.txt for ${configured}`);
