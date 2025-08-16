import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'content');
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "ElectroMart";

// Helper function to get content for a specific MDX file
export async function getSectionContent(locale: string, slug: string) {
  // Construct filePath, allowing slug to be a path like 'components/hero'
  const filePath = path.join(contentDirectory, locale, `${slug}.mdx`);
  try {
    const fileContents = await fs.promises.readFile(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    
    // Process content for {siteNameFromEnv}
    const processedContent = content.replace(/\{siteNameFromEnv\}/g, siteName);
    
    // Process frontmatter title for {siteNameFromEnv}
    const processedFrontmatter = { ...data };
    if (processedFrontmatter.title && typeof processedFrontmatter.title === 'string') {
      processedFrontmatter.title = processedFrontmatter.title.replace(/\{siteNameFromEnv\}/g, siteName);
    }
    // Optionally process other frontmatter fields like description, keywords if they also use the placeholder
    if (processedFrontmatter.description && typeof processedFrontmatter.description === 'string') {
      processedFrontmatter.description = processedFrontmatter.description.replace(/\{siteNameFromEnv\}/g, siteName);
    }
    if (processedFrontmatter.keywords && typeof processedFrontmatter.keywords === 'string') {
      processedFrontmatter.keywords = processedFrontmatter.keywords.replace(/\{siteNameFromEnv\}/g, siteName);
    }

    return { frontmatter: processedFrontmatter, content: processedContent, slug };
  } catch (error) {
    console.error(`Error reading MDX file for section ${locale}/${slug}:`, error);
    return null; // Return null if a file isn't found or has errors
  }
}

// Helper function to get localized content for a specific category slug
export async function getLocalizedCategoryDetails(locale: string, categoryFileIdentifier: string): Promise<{ title?: string; shortTitle?: string; slug?: string; slugOverride?: string } | null> {
  const filePath = path.join(contentDirectory, locale, 'categories', `${categoryFileIdentifier}.mdx`);
  try {
    const fileContents = await fs.promises.readFile(filePath, 'utf8');
    const { data } = matter(fileContents);
    // We need title, shortTitle, slug, and slugOverride from frontmatter for categories in the nav
    return {
      title: data.title as string | undefined,
      shortTitle: data.shortTitle as string | undefined,
      slug: data.slug as string | undefined, // Keep original slug if present
      slugOverride: data.slugOverride as string | undefined,
    };
  } catch (error) {
    // It's okay if a category MDX file doesn't exist, we'll use canonical names
    return null;
  }
} 