import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';


import { locales } from "@/config/i18n.config";

const contentDirectory = path.join(process.cwd(), 'content');

const allLocales = locales;

// const BASE_URL = process.env.NEXT_PUBLIC_SITE_BASE_URL || '';

export interface MdxFrontmatter {
  slugOverride?: string;
  title?: string; // Or any other frontmatter you might need
  // Add other relevant frontmatter fields, e.g., lastModified
}

export interface MdxFileInfo {
  id: string; // The filename without .mdx (e.g., '3')
  locale: string;
  slug?: string; // The slugOverride value
  frontmatter: MdxFrontmatter;
  filePath: string;
}

/**
 * Lists all MDX files in a given content type directory for a specific locale.
 * Example: getMdxFiles('fr', 'categories')
 */
export function getMdxFiles(locale: string, contentType: 'categories' | 'products'): MdxFileInfo[] {
  const dirPath = path.join(contentDirectory, locale, contentType);
  try {
    const files = fs.readdirSync(dirPath);
    return files
      .filter(file => file.endsWith('.mdx'))
      .map(file => {
        const filePath = path.join(dirPath, file);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(fileContents);
        const id = file.replace(/\.mdx$/, '');
        return {
          id,
          locale,
          slug: (data as MdxFrontmatter).slugOverride,
          frontmatter: data as MdxFrontmatter,
          filePath,
        };
      })
      .filter(info => !!info.slug); // Ensure slugOverride exists
  } catch (error) {
    // console.warn(`Could not read directory ${dirPath} or files within:`, error);
    return []; // Return empty if directory doesn't exist for a locale/type
  }
}

/**
 * Gets the slugOverride for a specific content ID and locale.
 * Used for finding alternate language links.
 * Example: getSlugForIdAndLocale('3', 'en', 'categories')
 */
export function getSlugForIdAndLocale(id: string, targetLocale: string, contentType: 'categories' | 'products'): string | undefined {
  const filePath = path.join(contentDirectory, targetLocale, contentType, `${id}.mdx`);
  try {
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContents);
      return (data as MdxFrontmatter).slugOverride;
    }
  } catch (error) {
    // console.warn(`Error reading MDX file ${filePath}:`, error);
  }
  return undefined;
}

export { allLocales }; 