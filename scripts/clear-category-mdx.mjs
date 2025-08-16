import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';

dotenv.config();

const TARGET_LANGUAGES = process.env.TARGET_LANGUAGES ? process.env.TARGET_LANGUAGES.split(',') : ['en'];
const CONTENT_DIR = path.join(process.cwd(), 'content');

async function clearCategoryMdx() {
    console.log('Starting to clear category MDX files...');

    if (TARGET_LANGUAGES.length === 0) {
        console.error('No TARGET_LANGUAGES defined. Please check your .env file.');
        return;
    }

    for (const lang of TARGET_LANGUAGES) {
        const categoryLangDir = path.join(CONTENT_DIR, lang, 'categories');
        try {
            const dirExists = await fs.pathExists(categoryLangDir);
            if (dirExists) {
                console.log(`Clearing contents of directory: ${categoryLangDir}`);
                await fs.emptyDir(categoryLangDir);
                console.log(`Successfully cleared: ${categoryLangDir}`);
            } else {
                console.log(`Directory not found, skipping: ${categoryLangDir}`);
            }
        } catch (error) {
            console.error(`Error clearing directory ${categoryLangDir}:`, error);
        }
    }

    console.log('Finished clearing category MDX files.');
}

clearCategoryMdx().catch(console.error); 