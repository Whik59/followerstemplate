import {promises as fs} from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
// import { getTranslations } from 'next-intl/server';
import { MDXRemote } from 'next-mdx-remote/rsc'; // Assuming you use next-mdx-remote for RSC
import matter from 'gray-matter'; // To parse frontmatter

// Define a type for the frontmatter
interface LegalPageFrontmatter {
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
}

// Helper function to get the MDX file path
function getMdxFilePath(locale: string, slug: string): string {
  return path.join(process.cwd(), 'content', locale, 'legal', `${slug}.mdx`);
}

// Function to read and parse the MDX file
async function getLegalPageContent(locale: string, slug: string) {
  const filePath = getMdxFilePath(locale, slug);

  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const { data, content } = matter(fileContents); // Parse frontmatter and content
    return {
      frontmatter: data as LegalPageFrontmatter,
      content,
    };
  } catch (error) {
    // If the file doesn't exist or there's an error reading it
    console.error(`Error reading legal page ${filePath}:`, error);
    return null;
  }
}

// Generate metadata for the page (title, description)
export async function generateMetadata({ params }: { params: { locale: string, slug: string } }) {
  const pageData = await getLegalPageContent(params.locale, params.slug);

  if (!pageData) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: pageData.frontmatter.metaTitle || pageData.frontmatter.title,
    description: pageData.frontmatter.metaDescription,
    keywords: pageData.frontmatter.keywords?.split(',').map(k => k.trim()),
  };
}

// Generate static paths for all legal pages if you want to use SSG
// This is optional but recommended for better performance and SEO.
export async function generateStaticParams({ params }: { params: { locale: string }}) {
  try {
    const legalDir = path.join(process.cwd(), 'content', params.locale, 'legal');
    const files = await fs.readdir(legalDir);
    return files
      .filter(file => file.endsWith('.mdx'))
      .map(file => ({
        slug: file.replace('.mdx', ''),
      }));
  } catch (error) {
    // If the directory doesn't exist for a locale, return empty array
    console.warn(`No legal content directory found for locale ${params.locale}:`, error);
    return [];
  }
}


export default async function LegalPage({ params }: { params: { locale: string, slug: string } }) {
  const locale = await getLocale();
  if (params.locale !== locale) {
    notFound(); // Ensure locale consistency
  }

  const pageData = await getLegalPageContent(params.locale, params.slug);

  if (!pageData) {
    notFound(); // Show 404 if the MDX file isn't found
  }

  // Here you might want to pass custom components to MDXRemote if needed
  // const components = { /* Custom components to use in MDX */ };

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 prose dark:prose-invert max-w-3xl">
      {/* The title from frontmatter could be displayed here if not handled by layout */}
      {/* <h1>{pageData.frontmatter.title}</h1> */}
      
      {/* Render the MDX content */}
     
      <MDXRemote source={pageData.content} /> 
      {/* If you have custom components: <MDXRemote source={pageData.content} components={components} /> */}
    </div>
  );
} 