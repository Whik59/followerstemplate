import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Derive __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDirPath = path.join(__dirname, '..', 'public', 'images');

function cleanImages() {
  if (fs.existsSync(imagesDirPath)) {
    try {
      fs.rmSync(imagesDirPath, { recursive: true, force: true });
      console.log(`Successfully deleted directory: ${imagesDirPath}`);
    } catch (error) {
      console.error(`Error deleting directory ${imagesDirPath}:`, error);
    }
  } else {
    console.log(`Directory not found, nothing to delete: ${imagesDirPath}`);
  }
}

cleanImages(); 