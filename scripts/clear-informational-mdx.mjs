import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

// Configuration
const TARGET_LANGUAGES = process.env.TARGET_LANGUAGES ? process.env.TARGET_LANGUAGES.split(',') : [];
const baseContentDir = path.join(process.cwd(), 'content');

async function clearLangComponentsDirContents() {
  for (const lang of TARGET_LANGUAGES) {
    const componentsDir = path.join(baseContentDir, lang, 'components');

    if (await fs.pathExists(componentsDir)) {
      if ((await fs.stat(componentsDir)).isDirectory()) {
        console.log(`Emptying directory: ${componentsDir}`);
        try {
          await fs.emptyDir(componentsDir);
          console.log(`Successfully emptied: ${componentsDir}`);
        } catch (error) {
          console.error(`Error emptying directory ${componentsDir}:`, error);
        }
      } else {
        console.warn(`Path is not a directory, skipping emptying: ${componentsDir}`);
      }
    } else {
      console.log(`Components directory not found, skipping: ${componentsDir}`);
    }
  }
}

async function clearRootContentFiles() {
  console.log(`[INFO] Checking for files directly in: ${baseContentDir} (clearRootContentFiles function)`);
  if (await fs.pathExists(baseContentDir)) {
    const itemsInDir = await fs.readdir(baseContentDir);
    for (const item of itemsInDir) {
      const itemPath = path.join(baseContentDir, item);
      try {
        const stat = await fs.stat(itemPath);
        if (stat.isFile()) {
          if (itemPath.startsWith(baseContentDir) && !TARGET_LANGUAGES.includes(item)) { 
            console.warn(`[INFO] clearRootContentFiles would consider deleting: ${itemPath}. This function's call is currently disabled in main().`);
          } else if (TARGET_LANGUAGES.includes(item) && stat.isDirectory()) {
            console.log(`Skipping language directory (handled by clearLangComponentsDirContents): ${itemPath}`);
          } else {
            console.warn(`Skipping deletion of potentially unintended root item: ${itemPath}`);
          }
        }
      } catch (error) {
        console.error(`Error processing item ${itemPath}:`, error);
      }
    }
  } else {
    console.log(`Base content directory not found: ${baseContentDir}`);
  }
}

async function main() {
  if (!process.env.TARGET_LANGUAGES || TARGET_LANGUAGES.length === 0) {
    console.error('TARGET_LANGUAGES is not set in the .env file or is empty. Please define it as a comma-separated list (e.g., en,fr,es).');
    return;
  }
  console.log(`Clearing contents from 'components' subdirectories within each language folder in '${baseContentDir}' for languages: ${TARGET_LANGUAGES.join(', ')}...`);
  await clearLangComponentsDirContents();
  console.log('Language components directory clearing complete.');

  console.log('Informational MDX content clearing operations finished.');
}

main().catch(console.error); 