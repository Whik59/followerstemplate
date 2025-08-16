import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';

dotenv.config();

const TARGET_LANGUAGES = process.env.TARGET_LANGUAGES ? process.env.TARGET_LANGUAGES.split(',') : ['en'];
const CONTENT_DIR = path.join(process.cwd(), 'content');

async function clearProductMdx() {
    console.log('Starting to clear product MDX files...');

    if (TARGET_LANGUAGES.length === 0) {
        console.error('No TARGET_LANGUAGES defined. Please check your .env file.');
        return;
    }

    for (const lang of TARGET_LANGUAGES) {
        const productLangDir = path.join(CONTENT_DIR, lang, 'products');
        try {
            const dirExists = await fs.pathExists(productLangDir);
            if (dirExists) {
                console.log(`Clearing contents of directory: ${productLangDir}`);
                await fs.emptyDir(productLangDir);
                console.log(`Successfully cleared: ${productLangDir}`);
            } else {
                console.log(`Directory not found, skipping: ${productLangDir}`);
            }
        } catch (error) {
            console.error(`Error clearing directory ${productLangDir}:`, error);
        }
    }

    console.log('Finished clearing product MDX files.');
}

clearProductMdx().catch(console.error); 