import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';
import { unstable_setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';
import { locales } from "@/config/i18n.config";


const contentDirectory = path.join(process.cwd(), 'content');
const siteNameFromEnv = process.env.NEXT_PUBLIC_SITE_NAME || "Your Awesome Shop";
const canonicalDomain = process.env.NEXT_PUBLIC_CANONICAL_DOMAIN || "YOUR_FALLBACK_DOMAIN.COM";

const defaultLocale = 'en';

interface Frontmatter {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalSlug?: string; // To group translations
  slugOverride?: string; // The actual slug for this locale, if different from filename
  [key: string]: unknown; // Changed any to unknown
}

interface PageData {
  frontmatter: Frontmatter;
  content: string;
  locale: string;
  originalSlug: string; // Filename without .mdx, used as a fallback or internal ID
}

// Helper to get all MDX file data for a locale
async function getAllPagesForLocale(locale: string): Promise<PageData[]> {
  if (typeof locale !== 'string' || !locale) {
    console.warn(`getAllPagesForLocale called with invalid locale: ${locale}. Skipping.`);
    return []; // Return empty array if locale is invalid
  }
  const localeDir = path.join(contentDirectory, locale);
  try {
    const filenames = fs.readdirSync(localeDir).filter(name => name.endsWith('.mdx'));
    const pagesData = filenames.map(filename => {
      const filePath = path.join(localeDir, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content: rawContent } = matter(fileContents) as { data: Frontmatter, content: string };

      const content = rawContent.replace(/\{siteNameFromEnv\}/g, siteNameFromEnv);
      const fieldsToProcess = ['title', 'description', 'keywords'];
      for (const field of fieldsToProcess) {
        if (data[field] && typeof data[field] === 'string') {
          data[field] = (data[field] as string).replace(/\{siteNameFromEnv\}/g, siteNameFromEnv);
        }
      }
      return {
        frontmatter: data,
        content,
        locale,
        originalSlug: filename.replace(/\.mdx$/, '')
      };
    });
    return pagesData;
  } catch (error) {
    // If locale directory doesn't exist or other error
    console.warn(`Could not read content for locale ${locale}:`, error);
    return [];
  }
}

export async function generateStaticParams({ params: { locale } }: { params: { locale: string } }) {
  // Prevent execution if locale is somehow undefined when Next.js calls this
  if (typeof locale !== 'string' || !locale) {
    console.warn(`[MDX page generateStaticParams] Called with invalid locale: ${locale}. Returning empty array.`);
    return [];
  }
  const pages = await getAllPagesForLocale(locale);
  return pages.map(page => ({
    slug: page.frontmatter.slugOverride || page.originalSlug,
  }));
}

interface MDXPageProps {
  params: {
    locale: string;
    slug: string; // This will be the potentially translated slug from the URL
  };
}

async function getPageContent(locale: string, requestedSlug: string): Promise<PageData | null> {
  const allPagesInLocale = await getAllPagesForLocale(locale);
  const pageData = allPagesInLocale.find(page =>
    (page.frontmatter.slugOverride || page.originalSlug) === requestedSlug
  );

  if (!pageData) {
    console.error(`MDX content not found for ${locale}/${requestedSlug}`);
    return null;
  }
  return pageData;
}

export async function generateMetadata({ params: { locale, slug } }: MDXPageProps): Promise<Metadata> {
  unstable_setRequestLocale(locale);
  const pageData = await getPageContent(locale, slug);

  if (!pageData) {
    return {
      title: `${siteNameFromEnv} | Page Not Found`,
      alternates: { canonical: `${canonicalDomain}/${locale}/${slug}` } // Basic canonical
    };
  }

  const { frontmatter, originalSlug: mdxFileBaseSlug } = pageData;
  const canonicalSlugForHreflang = frontmatter.canonicalSlug || mdxFileBaseSlug;

  const alternates: Record<string, string> = {};
  // For hreflang, we need to find the corresponding slugOverride for each locale
  // This requires reading frontmatter of other locale versions of this canonicalSlug
  for (const altLocale of locales) {
    if (altLocale === locale) { // Current page
      alternates[altLocale] = `${canonicalDomain}/${altLocale}/${frontmatter.slugOverride || mdxFileBaseSlug}`;
    } else {
      // Find the corresponding page in other locales by canonicalSlug
      const otherLocalePages = await getAllPagesForLocale(altLocale);
      const translatedPage = otherLocalePages.find(p => p.frontmatter.canonicalSlug === canonicalSlugForHreflang);
      if (translatedPage) {
        alternates[altLocale] = `${canonicalDomain}/${altLocale}/${translatedPage.frontmatter.slugOverride || translatedPage.originalSlug}`;
      }
    }
  }
  if (alternates[defaultLocale]) { // Ensure x-default is set if default locale version exists
      alternates['x-default'] = alternates[defaultLocale];
  } else { // Fallback x-default to the current page if defaultLocale version isn't found/defined
    alternates['x-default'] = `${canonicalDomain}/${locale}/${frontmatter.slugOverride || mdxFileBaseSlug}`;
  }


  return {
    title: frontmatter.title || `${siteNameFromEnv} | Content Page`,
    description: frontmatter.description,
    keywords: frontmatter.keywords,
    alternates: {
      canonical: `${canonicalDomain}/${locale}/${frontmatter.slugOverride || mdxFileBaseSlug}`,
      languages: alternates,
    }
  };
}

export default async function MDXPage({ params: { locale, slug } }: MDXPageProps) {
  unstable_setRequestLocale(locale);
  const pageData = await getPageContent(locale, slug);

  if (!pageData) {
    notFound();
  }

  return (
    <article className="container mx-auto px-4 py-8 md:py-12 prose prose-amber lg:prose-lg max-w-3xl">
      <MDXRemote source={pageData.content} />
    </article>
  );
} 