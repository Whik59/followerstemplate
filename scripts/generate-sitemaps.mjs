import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';
import matter from 'gray-matter';

const SITE_URL = process.env.NEXT_PUBLIC_CANONICAL_DOMAIN;

if (!SITE_URL) {
  console.warn('Warning: NEXT_PUBLIC_CANONICAL_DOMAIN is not set. Sitemap generation will be incomplete or use incorrect URLs. Script will use an empty string for base URLs.');
}

const CONTENT_DIR = path.resolve(process.cwd(), 'content');
const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'sitemaps');
const ROBOTS_TXT_PATH = path.resolve(process.cwd(), 'public', 'robots.txt'); // Path for robots.txt
const CONTENT_TYPES = ['products', 'categories'];

function formatDateToISO(dateInput) {
  if (!dateInput) return new Date().toISOString().split('T')[0];
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) { // Check if date is invalid
        // console.warn(`Invalid date input: ${dateInput}, using current date.`);
        return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch (e) {
    // console.warn(`Error parsing date: ${dateInput}, using current date. Error: ${e}`);
    return new Date().toISOString().split('T')[0];
  }
}

function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') {
    return unsafe;
  }
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return c;
    }
  });
}

// This function loads a single JSON file
function loadSlugMapFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
        console.warn(`Warning: Slug map file not found: ${filePath}`);
        return {};
    }
    return fs.readJsonSync(filePath);
  } catch (e) {
    console.error(`Failed to load slug map from ${filePath}:`, e);
    return {};
  }
}

// --- NEW: Load batched product slugs ---
const BATCHED_PRODUCT_SLUG_MAP_DIR = path.join(process.cwd(), 'data', 'batched-product-slug-map');
const productSlugMap = {}; // { productId: { lang: slug, ... }, ... }
if (fs.existsSync(BATCHED_PRODUCT_SLUG_MAP_DIR)) {
  const files = fs.readdirSync(BATCHED_PRODUCT_SLUG_MAP_DIR);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const lang = file.replace('.json', '');
      const langData = fs.readJsonSync(path.join(BATCHED_PRODUCT_SLUG_MAP_DIR, file));
      for (const productId in langData) {
        if (!productSlugMap[productId]) productSlugMap[productId] = {};
        productSlugMap[productId][lang] = langData[productId];
      }
    }
  }
} else {
  console.warn('Warning: batched-product-slug-map directory not found. No product slugs will be loaded.');
}
// --- END NEW ---

const CATEGORY_SLUG_MAP_PATH = path.join(process.cwd(), 'data', 'category-slug-map.json');
const categorySlugMap = loadSlugMapFile(CATEGORY_SLUG_MAP_PATH);

async function getAllContentData(languages) {
  const allContent = { products: {}, categories: {} };

  // PRODUCTS
  for (const productId in productSlugMap) {
    for (const lang of languages) {
      const slug = productSlugMap[productId]?.[lang];
      if (!slug) continue;
      if (!allContent.products[productId]) allContent.products[productId] = {};
      allContent.products[productId][lang] = {
        slug,
        lastmod: formatDateToISO(new Date()),
        fullPath: `${SITE_URL || ''}/${lang}/products/${slug}`,
        changefreq: 'weekly',
        priority: '0.8',
      };
    }
  }

  // CATEGORIES
  for (const categoryId in categorySlugMap) {
    for (const lang of languages) {
      const slug = categorySlugMap[categoryId]?.locales?.[lang];
      if (!slug) continue;
      if (!allContent.categories[categoryId]) allContent.categories[categoryId] = {};
      allContent.categories[categoryId][lang] = {
        slug,
        lastmod: formatDateToISO(new Date()),
        fullPath: `${SITE_URL || ''}/${lang}/categories/${slug}`,
        changefreq: 'weekly',
        priority: '0.8',
      };
    }
  }

  return allContent;
}

async function generateSitemaps(allContentData, languages) {
  const sitemapIndexEntries = [];
  const defaultLangOrder = [...languages]; 
  const englishVariants = languages.filter(l => l.toLowerCase().startsWith('en'));

  await fs.ensureDir(OUTPUT_DIR);

  for (const type of CONTENT_TYPES) {
    for (const lang of languages) {
      const urlEntries = [];
      for (const id in allContentData[type]) {
        const langVersions = allContentData[type][id];
        if (langVersions[lang]) {
          const currentItem = langVersions[lang];
          const loc = escapeXml(currentItem.fullPath);
          const lastmod = currentItem.lastmod;
          const changefreq = currentItem.changefreq; // Get from allContentData
          const priority = currentItem.priority;   // Get from allContentData
          
          let alternatesXml = '';
          let xDefaultHref = null;

          for (const enVariant of englishVariants) {
            if (langVersions[enVariant]) {
              xDefaultHref = escapeXml(langVersions[enVariant].fullPath);
              break;
            }
          }
          if (!xDefaultHref) {
            for (const orderedLang of defaultLangOrder) {
              if (langVersions[orderedLang]) {
                xDefaultHref = escapeXml(langVersions[orderedLang].fullPath);
                break;
              }
            }
          }
          if (!xDefaultHref) {
            xDefaultHref = loc; 
          }
          
          alternatesXml += `  <xhtml:link rel="alternate" hreflang="x-default" href="${xDefaultHref}"/>\n`;

          for (const altLang in langVersions) {
            alternatesXml += `  <xhtml:link rel="alternate" hreflang="${altLang}" href="${escapeXml(langVersions[altLang].fullPath)}"/>\n`;
          }
          
          urlEntries.push(
            `  <url>\n` +
            `    <loc>${loc}</loc>\n` +
            `    <lastmod>${lastmod}</lastmod>\n` +
            `    <changefreq>${changefreq}</changefreq>\n` +
            `    <priority>${priority}</priority>\n` +
            alternatesXml +
            `  </url>`
          );
        }
      }

      if (urlEntries.length > 0) {
        const sitemapContent = 
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
          `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
          urlEntries.join('\n') + '\n' +
          `</urlset>`;
        
        const sitemapFilename = `${type}-${lang}.xml`;
        await fs.writeFile(path.join(OUTPUT_DIR, sitemapFilename), sitemapContent);
        // console.log(`Generated ${sitemapFilename}`); // Optional: Keep or remove
        sitemapIndexEntries.push(
          `  <sitemap>\n` +
          `    <loc>${SITE_URL || ''}/sitemaps/${sitemapFilename}</loc>\n` +
          `    <lastmod>${formatDateToISO(new Date())}</lastmod>\n` +
          `  </sitemap>`
        );
      }
    }
  }
  return sitemapIndexEntries;
}

async function generateSitemapIndex(sitemapIndexEntries) {
  if (sitemapIndexEntries.length === 0) {
    console.warn("No sitemap entries to build index. Skipping sitemap-index.xml.");
    return;
  }
  const sitemapIndexContent = 
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    sitemapIndexEntries.join('\n') + '\n' +
    `</sitemapindex>`;
  await fs.writeFile(path.join(OUTPUT_DIR, 'sitemap-index.xml'), sitemapIndexContent);
  console.log('Generated sitemap-index.xml');
}

async function generateRobotsTxt(siteUrlInput) {
  const siteUrlForRobots = siteUrlInput || ''; // Ensure it's a string
  const robotsContent = 
`User-agent: *
Allow: /

Sitemap: ${siteUrlForRobots}/sitemaps/sitemap-index.xml`;
  await fs.writeFile(ROBOTS_TXT_PATH, robotsContent);
  console.log('Generated robots.txt');
}

async function main() {
  const languagesStr = process.env.TARGET_LANGUAGES;
  if (!languagesStr) {
    console.error('ERROR: TARGET_LANGUAGES environment variable is not set. Please provide a comma-separated list of locales.');
    process.exit(1);
  }
  const languages = languagesStr.split(',').map(l => l.trim()).filter(l => l);
  if (languages.length === 0) {
    console.error('ERROR: No languages found in TARGET_LANGUAGES. Please provide a comma-separated list of locales.');
    process.exit(1);
  }
  
  console.log(`Generating sitemaps for languages: ${languages.join(', ')}`);

  const allContentData = await getAllContentData(languages);
  const sitemapIndexEntries = await generateSitemaps(allContentData, languages);
  await generateSitemapIndex(sitemapIndexEntries);
  await generateRobotsTxt(SITE_URL);
  
  console.log('Sitemap and robots.txt generation complete.');
}

main().catch(error => {
  console.error('Failed to generate sitemaps and robots.txt:', error);
  process.exit(1);
}); 