const { createClient } = require('@supabase/supabase-js');
const fs = require('fs/promises');
const path = require('path');
require('dotenv').config();

async function main() {
  const pLimit = (await import('p-limit')).default;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const CONTENT_DIR = path.join(process.cwd(), 'content');
  const CONCURRENCY = 100; // Set concurrency limit

  const languages = await fs.readdir(CONTENT_DIR);
  const limit = pLimit(CONCURRENCY);
  const allPromises = [];

  for (const lang of languages) {
    const langDir = path.join(CONTENT_DIR, lang);
    for (const type of ['products', 'categories']) {
      const dirPath = path.join(langDir, type);
      let files;
      try {
        files = await fs.readdir(dirPath);
      } catch {
        continue;
      }
      for (const file of files) {
        if (!file.endsWith('.mdx')) continue;
        const filePath = path.join(dirPath, file);
        allPromises.push(
          limit(async () => {
            const mdx_full = await fs.readFile(filePath, 'utf8');
            const id = file.replace('.mdx', '');
            const table = type === 'products' ? 'product_mdx' : 'category_mdx';
            const { error } = await supabase.from(table).upsert({
              id,
              language: lang,
              mdx_full,
            });
            if (error) {
              console.error(`Failed to insert ${id} (${lang}) in ${table}:`, error);
            } else {
              console.log(`Inserted ${id} (${lang}) in ${table}`);
            }
          })
        );
      }
    }
  }
  await Promise.all(allPromises);
  console.log('Migration complete.');
}

main().catch(console.error);

// To use this script, install p-limit:
// npm install p-limit