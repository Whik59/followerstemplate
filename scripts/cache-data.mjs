import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CACHE_DIR = path.join(process.cwd(), 'cache');

// Reads a directory of separate JSON files (e.g., products/1.json, products/2.json)
async function readJsonDir(dir) {
  const fullDir = path.join(DATA_DIR, dir);
  try {
    const files = await fs.readdir(fullDir);
    const data = await Promise.all(
      files
        .filter((f) => f.endsWith('.json'))
        .map(async (file) => {
          const raw = await fs.readFile(path.join(fullDir, file), 'utf8');
          return JSON.parse(raw);
        })
    );
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') return []; // Directory doesn't exist is ok
    throw error;
  }
}

// Reads a single JSON file (e.g., categories.json)
async function readJsonFile(filePath) {
  const fullPath = path.join(DATA_DIR, filePath);
  try {
    const raw = await fs.readFile(fullPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') return null; // File doesn't exist is ok
    throw error;
  }
}

// Reads a directory of JSON files and maps them by their filename (e.g., product-slug-map/1.json -> { '1': ... })
async function readAndMapJsonDir(dir) {
    const fullDir = path.join(DATA_DIR, dir);
    const map = {};
    try {
        const files = await fs.readdir(fullDir);
        await Promise.all(
            files.filter(f => f.endsWith('.json')).map(async f => {
                const id = f.replace('.json', '');
                const raw = await fs.readFile(path.join(fullDir, f), 'utf8');
                map[id] = JSON.parse(raw);
            })
        );
        return map;
    } catch (error) {
        if (error.code === 'ENOENT') return {}; // Directory doesn't exist is ok
        throw error;
    }
}

async function cacheData() {
  console.log('Starting data caching process...');

  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });

    // --- Process data based on its structure (directory vs. single file) ---

    // Products are now in a single file
    const products = await readJsonFile('products.json');
    if (products) {
      await fs.writeFile(path.join(CACHE_DIR, 'products.json'), JSON.stringify(products));
      console.log(`Cached ${products.length} products.`);
    }

    // Categories are in a single file
    const categories = await readJsonFile('categories.json');
    if (categories) {
      await fs.writeFile(path.join(CACHE_DIR, 'categories.json'), JSON.stringify(categories));
      console.log(`Cached ${categories.length} categories.`);
    }

    // --- NEW: Batched product slug maps ---
    const batchedProductSlugMapsDir = path.join(DATA_DIR, 'batched-product-slug-map');
    const batchedProductSlugMaps = {};
    try {
      const files = await fs.readdir(batchedProductSlugMapsDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const locale = file.replace('.json', '');
          const raw = await fs.readFile(path.join(batchedProductSlugMapsDir, file), 'utf8');
          batchedProductSlugMaps[locale] = JSON.parse(raw);
        }
      }
    } catch {}
    await fs.writeFile(path.join(CACHE_DIR, 'batched-product-slug-map.json'), JSON.stringify(batchedProductSlugMaps));
    console.log(`Cached ${Object.keys(batchedProductSlugMaps).length} batched product slug maps.`);

    // --- NEW: Batched product translations ---
    const batchedProductTranslationsDir = path.join(DATA_DIR, 'batched-product-translations');
    const batchedProductTranslations = {};
    try {
      const files = await fs.readdir(batchedProductTranslationsDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const locale = file.replace('.json', '');
          const raw = await fs.readFile(path.join(batchedProductTranslationsDir, file), 'utf8');
          batchedProductTranslations[locale] = JSON.parse(raw);
        }
      }
    } catch {}
    await fs.writeFile(path.join(CACHE_DIR, 'batched-product-translations.json'), JSON.stringify(batchedProductTranslations));
    console.log(`Cached ${Object.keys(batchedProductTranslations).length} batched product translations.`);

    // Category slugs are in a single file
    const categorySlugMaps = await readJsonFile('category-slug-map.json');
    if (categorySlugMaps) {
      await fs.writeFile(path.join(CACHE_DIR, 'category-slug-map.json'), JSON.stringify(categorySlugMaps));
      console.log(`Cached ${Object.keys(categorySlugMaps).length} category slug maps.`);
    }
    
    // Category translations are in a single file
    const categoryTranslations = await readJsonFile('category-translations.json');
    if (categoryTranslations) {
      await fs.writeFile(path.join(CACHE_DIR, 'category-translations.json'), JSON.stringify(categoryTranslations));
      console.log(`Cached ${Object.keys(categoryTranslations).length} category translations.`);
    }

    console.log('✅ Data caching complete!');
  } catch (error) {
    console.error('❌ Error during data caching:', error);
    process.exit(1);
  }
}

cacheData(); 