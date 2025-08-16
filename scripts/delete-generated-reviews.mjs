import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';

dotenv.config();

// --- Configuration (should match generate-reviews-content.mjs for consistency) ---
const TARGET_LANGUAGES = process.env.TARGET_LANGUAGES ? process.env.TARGET_LANGUAGES.split(',') : ['en', 'fr', 'es'];
const OUTPUT_LOCALES_BASE_DIR = process.env.OUTPUT_LOCALES_BASE_DIR || path.join(process.cwd(), 'locales');
const OUTPUT_METADATA_FILE = process.env.OUTPUT_METADATA_FILE || path.join(process.cwd(), 'lib', 'data', 'reviews-metadata.ts');

async function deleteFileIfExists(filePath, fileNameForLogging) {
    try {
        const exists = await fs.pathExists(filePath);
        if (exists) {
            await fs.remove(filePath);
            console.log(`Successfully deleted: ${fileNameForLogging} (at ${filePath})`);
            return true;
        } else {
            console.log(`File not found (skipping deletion): ${fileNameForLogging} (at ${filePath})`);
            return false;
        }
    } catch (error) {
        console.error(`Error deleting ${fileNameForLogging} (at ${filePath}):`, error);
        return false;
    }
}

async function main() {
    console.log('Starting deletion of generated review files...');
    let deletedCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    // 1. Delete locale-specific reviews.json files based on OUTPUT_LOCALES_BASE_DIR
    if (TARGET_LANGUAGES.length > 0) {
        console.log(`\nAttempting to delete reviews.json files from '${path.join(process.cwd(), 'locales')}' for languages: ${TARGET_LANGUAGES.join(', ')}...`);
        for (const lang of TARGET_LANGUAGES) {
            const langDirPath = path.join(OUTPUT_LOCALES_BASE_DIR, lang);
            const reviewFilePath = path.join(langDirPath, 'reviews.json');
            const result = await deleteFileIfExists(reviewFilePath, `reviews.json for language '${lang}' in ${langDirPath}`);
            if (result === true) deletedCount++;
            else if (result === false) notFoundCount++;
        }
    } else {
        console.log('No TARGET_LANGUAGES specified, skipping deletion of locale-specific reviews.json files.');
    }

    // 2. Delete the reviews-metadata.ts file
    console.log(`\nAttempting to delete reviews metadata file: ${OUTPUT_METADATA_FILE}...`);
    const metadataResult = await deleteFileIfExists(OUTPUT_METADATA_FILE, 'reviews-metadata.ts');
    if (metadataResult === true) deletedCount++;
    else if (metadataResult === false) notFoundCount++;

    console.log('\n--- Deletion Summary ---');
    console.log(`Successfully deleted: ${deletedCount} file(s).`);
    console.log(`Files not found (or failed to delete, check logs): ${notFoundCount + errorCount} file(s).`); // Simplified, as deleteFileIfExists logs errors
    console.log('Review file deletion process completed.');
    console.log('Please check the logs above for details on each file.');

}

main().catch(error => {
    console.error("Critical error during deletion script execution:", error);
    process.exit(1);
}); 