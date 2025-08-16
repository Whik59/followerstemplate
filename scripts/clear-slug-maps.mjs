import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), 'data');
const productSlugMapPath = path.join(dataDir, 'product-slug-map.json');
const categorySlugMapPath = path.join(dataDir, 'category-slug-map.json');

function clearJsonFile(filePath) {
  try {
    fs.writeFileSync(filePath, '{}');
    console.log(`Successfully cleared ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Error clearing ${path.basename(filePath)}:`, error);
  }
}

clearJsonFile(productSlugMapPath);
clearJsonFile(categorySlugMapPath); 