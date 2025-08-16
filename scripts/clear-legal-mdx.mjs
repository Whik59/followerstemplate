import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// --- Configuration ---
// Reads TARGET_LANGUAGES from .env, defaults to ['fr'] if not set
const TARGET_LANGUAGES_ARRAY = process.env.TARGET_LANGUAGES
    ? process.env.TARGET_LANGUAGES.split(',').map(lang => lang.trim()).filter(lang => lang)
    : ['fr'];

const baseContentDir = path.join(process.cwd(), 'content');

// --- Main Execution ---
async function clearLegalMdxFiles() {
    console.log(`Starting process to clear legal MDX files...`);
    console.log(`Target languages: ${TARGET_LANGUAGES_ARRAY.join(', ') || 'NONE SET (defaulting to fr, but fr was not in default if empty)'}`);
    if (TARGET_LANGUAGES_ARRAY.length === 0 && !(process.env.TARGET_LANGUAGES === undefined)) {
        console.warn("Warning: TARGET_LANGUAGES was set but parsed to an empty list. No languages to process.");
        console.log("Legal MDX clearing process completed (no actions taken).");
        return;
    }
     if (TARGET_LANGUAGES_ARRAY.length === 0 && process.env.TARGET_LANGUAGES === undefined) {
        console.log("TARGET_LANGUAGES not set, defaulting to ['fr'] for clearing.");
        // Actual default to ['fr'] is handled by initial TARGET_LANGUAGES_ARRAY declaration
    }


    let filesDeletedCount = 0;
    let dirsProcessedCount = 0;

    for (const lang of TARGET_LANGUAGES_ARRAY) {
        const legalDirForLang = path.join(baseContentDir, lang, 'legal');
        dirsProcessedCount++;

        try {
            if (!await fs.pathExists(legalDirForLang)) {
                console.log(`[SKIP] Directory not found: ${legalDirForLang}`);
                continue;
            }

            const filesInDir = await fs.readdir(legalDirForLang);
            const mdxFiles = filesInDir.filter(file => file.endsWith('.mdx'));

            if (mdxFiles.length === 0) {
                console.log(`No .mdx files found in ${legalDirForLang}`);
                continue;
            }

            console.log(`Found ${mdxFiles.length} .mdx file(s) in ${legalDirForLang}:`);
            for (const mdxFile of mdxFiles) {
                const filePath = path.join(legalDirForLang, mdxFile);
                try {
                    await fs.unlink(filePath);
                    console.log(`  [DELETED] ${filePath}`);
                    filesDeletedCount++;
                } catch (error) {
                    console.error(`  [ERROR] Failed to delete ${filePath}: ${error.message}`);
                }
            }
        } catch (error) {
            console.error(`[ERROR] Could not process directory ${legalDirForLang}: ${error.message}`);
        }
    }

    console.log(`
Legal MDX clearing process completed.`);
    console.log(`Directories processed: ${dirsProcessedCount}`);
    console.log(`Total .mdx files deleted: ${filesDeletedCount}`);
}

clearLegalMdxFiles().catch(error => {
    console.error("An unexpected error occurred during the clearing process:", error);
    process.exit(1);
}); 