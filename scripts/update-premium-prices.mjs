import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsPath = path.join(__dirname, '..', 'data', 'products.json');

async function updatePremiumPrices() {
  const data = await fs.readFile(productsPath, 'utf-8');
  const products = JSON.parse(data);
  let updatedCount = 0;

  for (const product of products) {
    if (!Array.isArray(product.prices)) continue;
    for (const priceObj of product.prices) {
      if (priceObj.quality === 'premium') {
        priceObj.price = parseFloat((priceObj.price * 1.5).toFixed(2));
        updatedCount++;
      }
    }
  }

  await fs.writeFile(productsPath, JSON.stringify(products, null, 2) + '\n', 'utf-8');
  console.log(`Updated ${updatedCount} premium prices by 50%.`);
}

updatePremiumPrices().catch(console.error); 