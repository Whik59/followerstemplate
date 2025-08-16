import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// --- Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TARGET_LANGUAGES = process.env.TARGET_LANGUAGES ? process.env.TARGET_LANGUAGES.split(',') : ['en', 'fr', 'es'];
const NUM_REVIEWS_PER_LANG = parseInt(process.env.NUM_REVIEWS_PER_LANG, 10) || 389;
const SITE_NAME_FROM_ENV = process.env.SITE_NAME_FROM_ENV || 'YourSuperStore';
const SITE_INFO_FROM_ENV = process.env.SITE_INFO_FROM_ENV || 'An e-commerce site for various products.';
const MAX_CONCURRENT_REVIEW_REQUESTS = parseInt(process.env.MAX_CONCURRENT_REVIEW_REQUESTS, 10) || 30;
const OUTPUT_LOCALES_BASE_DIR = process.env.OUTPUT_LOCALES_BASE_DIR || path.join(process.cwd(), 'locales');
const OUTPUT_METADATA_FILE = process.env.OUTPUT_METADATA_FILE || path.join(process.cwd(), 'lib', 'data', 'reviews-metadata.ts');
const CONTENT_BASE_DIR = process.env.CONTENT_BASE_DIR || path.join(process.cwd(), 'content'); // For reading product titles
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const REVIEW_BATCH_SIZE = parseInt(process.env.REVIEW_BATCH_SIZE, 10) || 100; // New batch size configuration

// Path to the new product names file
const PRODUCT_NAMES_FILE_PATH = path.join(process.cwd(), 'data', 'product-ids-names.json');

if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in the .env file.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const generationConfig = {
    temperature: 0.88, // Slightly higher for more style variety and human-like imperfections
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: 'application/json',
};

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// --- Helper Functions ---

async function getProductShortTitles() {
    const shortTitles = [];
    try {
        const exists = await fs.pathExists(PRODUCT_NAMES_FILE_PATH);
        if (!exists) {
            console.warn(`Product names file not found: ${PRODUCT_NAMES_FILE_PATH}`);
            return [];
        }
        const productData = await fs.readJson(PRODUCT_NAMES_FILE_PATH);
        if (Array.isArray(productData)) {
            for (const product of productData) {
                if (product.productNameCanonical) {
                    shortTitles.push(product.productNameCanonical.trim());
                }
            }
        }
    } catch (error) {
        console.error(`Error reading product names from ${PRODUCT_NAMES_FILE_PATH}:`, error.message);
    }
    return [...new Set(shortTitles)]; // Return unique titles
}

function extractJsonFromString(text) {
    if (!text || typeof text !== 'string') return null;
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        console.warn('[extractJsonFromString] No valid JSON structure braces found in text:', text.substring(0, 100) + '...');
        return null;
    }
    let jsonString = text.substring(firstBrace, lastBrace + 1).trim();
    try {
        JSON.parse(jsonString);
        return jsonString;
    } catch (e) {
        console.error(`[extractJsonFromString] Failed to parse JSON string. Error: ${e.message}`);
        const snippet = jsonString.length > 500 ? jsonString.substring(0, 250) + "..." + jsonString.substring(jsonString.length - 250) : jsonString;
        console.error(`[extractJsonFromString] Problematic JSON string (or snippet): ${snippet}`);
        return null;
    }
}

function getReviewsPromptForLang(lang, numReviewsInBatch, siteName, siteInfo, productShortTitles = [], anonymousAuthorWord = "Anonymous", reviewStartIndex = 0) {
    let reviewPrompts = '';
    for (let i = 0; i < numReviewsInBatch; i++) {
        const currentReviewGlobalIndex = reviewStartIndex + i + 1;
        reviewPrompts += `    - "review_${currentReviewGlobalIndex}_author": (A realistic first name appropriate for the language "${lang}". If this review is to be anonymous, use the specific term: "${anonymousAuthorWord}".)\n`;
        
        let textPrompt = `(The review content for review ${currentReviewGlobalIndex}. Generate with HIGHLY DIVERSE human-like styles. Prioritize making reviews sound genuinely human, including imperfections and casual language where appropriate for the style. Ensure a good number of reviews are primarily in lowercase.):\n`;
        textPrompt += `     STYLE GROUP A (Approx 30-35% of reviews, EMPHASIZE THIS STYLE):
`;
        textPrompt += `       - Ultra-Casual/SMS: 10-25 words. MOSTLY OR ENTIRELY IN LOWERCASE. Use common slang and ${lang}-specific internet abbreviations (e.g., for French 'pk' for 'pourquoi', 'stp' for 's\'il te plaît', 'c' for 'c\'est'; for English 'lol', 'u', 'r', 'gr8', 'idk'; adapt for current language '${lang}'). Minimal or no capitalization. Simple or missing punctuation. Sprinkle relevant EMOJIS (e.g., 👍, 🎉, 😊, 🔥, 💯, 😂, 🤔). Occasional common TYPOS or phonetic spellings (e.g., 'kool' for 'cool', 'gracias' misspelled for Spanish if common, 'merci bcp' instead of 'merci beaucoup' for French) are ENCOURAGED if natural for this very casual SMS style.\n`;
        textPrompt += `     STYLE GROUP B (Approx 30% of reviews):
`;
        textPrompt += `       - Short & Casual: 20-40 words. Conversational tone. A SIGNIFICANT PORTION (around half) SHOULD BE ENTIRELY IN LOWERCASE, others can use standard capitalization. May use some emojis. Standard punctuation, but can be informal. Sentence structure can be simple and direct.\n`;
        textPrompt += `     STYLE GROUP C (Approx 25% of reviews):
`;
        textPrompt += `       - Medium & Descriptive: 40-70 words. Can be more enthusiastic (using exclamation marks!!, maybe even some ALL CAPS for a word or two if very excited and it fits the ${lang} norms) or more balanced and informative. Standard grammar and punctuation expected here, but still sound like a real person. Some lowercase-only sentences can appear here too if it fits a casual but descriptive tone.\n`;
        textPrompt += `     STYLE GROUP D (Approx 10-15% of reviews):
`;
        textPrompt += `       - Longer & Detailed/Formal: 60-90 words. More structured sentences. Could be very positive, or a neutral/mildly negative constructive critique (e.g., 'The product is good, but the packaging could be improved.'). Proper grammar is important here, but one or two very subtle, common slips are acceptable if they don't detract from formality. Few or no emojis. Some might adopt a slightly more formal tone, perhaps even starting with a polite greeting or sign-off if natural for a formal review in "${lang}".\n`;
        textPrompt += `   GENERAL INSTRUCTIONS FOR ALL REVIEWS (VERY IMPORTANT FOR "${lang}"):
`;
        textPrompt += `     - Language Purity: ALL text for this review MUST be in "${lang}". No mixing with other languages.
`;
        textPrompt += `     - Vary topics: product quality, customer service interaction (or lack thereof), delivery speed/packaging, website usability/navigation, overall purchasing experience.
`;
        textPrompt += `     - Tone distribution: Overall mostly positive (approx 70%), some neutral (approx 20%), a few mildly negative but constructive (approx 10%).
`;
        textPrompt += `     - Randomness is KEY: Mix these styles and elements. Not every review in a group should be identical. Introduce believable human imperfections: for AT LEAST ${Math.floor(numReviewsInBatch * 0.15)}-${Math.ceil(numReviewsInBatch * 0.25)} reviews out of ${numReviewsInBatch} total for THIS BATCH (more if it feels natural for the style), intentionally introduce one or two minor, common typos, OR common grammatical slips (e.g., incorrect gender agreement if applicable in "${lang}", common verb tense mistakes for "${lang}", run-on sentences for very casual styles, or a common punctuation error like a missing comma or apostrophe). These imperfections should be subtle and typical of quick, informal writing. Do NOT make it unreadable or nonsensical. The goal is to sound authentically human, not like a perfectly polished AI.
`;

        if (productShortTitles.length > 0 && numReviewsInBatch > 1 && (i % 2 !== 0 || i > numReviewsInBatch / 2) && i > 0) {
            const randomProductCanonical = productShortTitles[Math.floor(Math.random() * productShortTitles.length)];
            textPrompt += `     - Product Specific: For THIS review (review ${currentReviewGlobalIndex}), it should be about a specific product. The canonical name of this product is \"${randomProductCanonical}\" (this name is in French). First, accurately translate \"${randomProductCanonical}\" into the target language \"${lang}\". Let's call this translated name 'localizedProductName'. Then, naturally weave 'localizedProductName' into your review text. For example, you might say in \"${lang}\": 'My thoughts on the localizedProductName: ...' or 'I recently bought the localizedProductName, and I must say...'. Ensure the 'localizedProductName' feels natural in \"${lang}\" and is integrated with the chosen style and tone for this specific review.\n`;
            reviewPrompts += `    - "review_${currentReviewGlobalIndex}_product_title": (The exact localized product name as it appears in your review text for review ${currentReviewGlobalIndex}, translated from \"${randomProductCanonical}\" into language \"${lang}\". This translated name MUST be present in your review_${currentReviewGlobalIndex}_text if this review is product-specific.)\n`;
        }
        reviewPrompts += `    - "review_${currentReviewGlobalIndex}_text": ${textPrompt})\n`;
    }

    const prompt = `
You are an AI tasked with generating realistic customer review data for an e-commerce website.
The website is named "${siteName}". It is described as: "${siteInfo}".
CRITICALLY IMPORTANT: Generate ALL review texts STRICTLY in the language: "${lang}". DO NOT mix languages.

Your output MUST be a single, valid JSON object.
The JSON object should ONLY contain the following types of keys directly at its root, for each review from ${reviewStartIndex + 1} to ${reviewStartIndex + numReviewsInBatch}:
${reviewPrompts}

Example of the expected flat JSON structure (for language '${lang}', showing 2 reviews for illustration only, assuming reviewStartIndex was 0 for this batch - your output will have ${numReviewsInBatch} reviews and follow the detailed per-review text prompt guidance, with keys starting from review_${reviewStartIndex + 1}_...):
{
  "review_${reviewStartIndex + 1}_author": "Léo",
  "review_${reviewStartIndex + 1}_text": "trop cool ce ${productShortTitles.length > 0 ? (lang === 'fr' ? productShortTitles[0] : `[LOCALIZED NAME OF '${productShortTitles[0]}' into ${lang}]`) : 'produit'}!! livraison rapide 👍👍💯",
  "review_${reviewStartIndex + 1}_product_title": "${productShortTitles.length > 0 ? (lang === 'fr' ? productShortTitles[0] : `[LOCALIZED NAME OF '${productShortTitles[0]}' into ${lang}]`) : ''}",
  "review_${reviewStartIndex + 2}_author": "${anonymousAuthorWord}",
  "review_${reviewStartIndex + 2}_text": "Concernant le produit '${productShortTitles.length > 1 ? (lang === 'fr' ? productShortTitles[1] : `[LOCALIZED NAME OF '${productShortTitles[1]}' into ${lang}]`) : (productShortTitles.length > 0 ? (lang === 'fr' ? productShortTitles[0] : `[LOCALIZED NAME OF '${productShortTitles[0]}' into ${lang}]`) : 'le gadget')}', il correspond aux attentes pour cette gamme de prix, bien que l\'emballage puisse être amélioré.",
  "review_${reviewStartIndex + 2}_product_title": "${productShortTitles.length > 1 ? (lang === 'fr' ? productShortTitles[1] : `[LOCALIZED NAME OF '${productShortTitles[1]}' into ${lang}]`) : (productShortTitles.length > 0 ? (lang === 'fr' ? productShortTitles[0] : `[LOCALIZED NAME OF '${productShortTitles[0]}' into ${lang}]`) : 'le gadget')}"
  // ... potentially more reviews up to review_${reviewStartIndex + numReviewsInBatch}_...
}

Ensure all string values within the JSON are properly escaped for valid JSON format.
Critically review your entire output to ensure it is a single, valid JSON object containing ONLY the review-specific keys as requested (e.g., review_${reviewStartIndex + 1}_author, review_${reviewStartIndex + 1}_text, etc.), and is STRICTLY in the language "${lang}".
`;
    return prompt;
}

function generateRandomRating() {
    const roll = Math.random();
    if (roll < 0.5) { // 50% chance for 5 stars
        return 5;
    } else if (roll < 0.8) { // 30% chance for 4.5 stars (0.8 - 0.5 = 0.3)
        return 4.5;
    } else { // 20% chance for 4 stars (1.0 - 0.8 = 0.2)
        return 4;
    }
}

async function generateReviewsDataForLang(lang, siteName, siteInfo) {
    const productShortTitles = await getProductShortTitles();
    if (productShortTitles.length > 0) {
        console.log(`[${lang}] Found ${productShortTitles.length} product canonical names (used as short titles for prompt): [${productShortTitles.join(", ").substring(0,100)}...]`);
    } else {
        console.log(`[${lang}] No product canonical names found. Reviews will be generic.`);
    }

    const langJsonFilePath = path.join(OUTPUT_LOCALES_BASE_DIR, lang, 'reviews.json');
    const langDir = path.dirname(langJsonFilePath);
    await fs.ensureDir(langDir);

    // Initialize currentJsonDataForFile with static data, attempting to load existing file first.
    let currentJsonDataForFile = {
        // Default static values, can be overridden by existing file or specific language maps later
        // if you have them, for now, we ensure these keys exist if not loaded.
    };
    const staticKeysToPreserve = ["sectionTitle", "verifiedBadgeText", "anonymousAuthor", "basedOnReviewsText", "overallRatingText", "seeAllReviewsLinkText"]; // Add any other static keys you have
    let anonymousAuthorForPrompt = "Anonymous"; // Default

    try {
        if (await fs.pathExists(langJsonFilePath)) {
            const existingData = await fs.readJson(langJsonFilePath);
            for (const key of staticKeysToPreserve) {
                if (existingData.hasOwnProperty(key)) {
                    currentJsonDataForFile[key] = existingData[key];
                }
            }
            if (currentJsonDataForFile.anonymousAuthor && typeof currentJsonDataForFile.anonymousAuthor === 'string' && currentJsonDataForFile.anonymousAuthor.trim() !== '') {
                anonymousAuthorForPrompt = currentJsonDataForFile.anonymousAuthor;
            } else {
                currentJsonDataForFile.anonymousAuthor = anonymousAuthorForPrompt; // Ensure it's in the JSON
            }
            console.log(`[${lang}] Loaded existing data from ${langJsonFilePath}. Using "${anonymousAuthorForPrompt}" for anonymous reviews prompt.`);
        } else {
            console.warn(`[${lang}] No existing ${langJsonFilePath} found. Will create new file. Using default "${anonymousAuthorForPrompt}" for anonymous reviews prompt.`);
            // Initialize with default static data if file doesn't exist
            currentJsonDataForFile.anonymousAuthor = anonymousAuthorForPrompt;
            // Add other default static fields here if necessary
            // e.g., currentJsonDataForFile.sectionTitle = "Customer Reviews";
        }
    } catch (error) {
        console.error(`[${lang}] Error reading existing ${langJsonFilePath}:`, error.message, `Will proceed assuming new/empty file using default "${anonymousAuthorForPrompt}".`);
        currentJsonDataForFile.anonymousAuthor = anonymousAuthorForPrompt;
    }
    
    const allStructuredReviewsForMetadata = []; // To store structured metadata from all batches

    console.log(`[${lang}] Starting review generation. Total to generate: ${NUM_REVIEWS_PER_LANG}, Batch Size: ${REVIEW_BATCH_SIZE}`);

    for (let batchStartIndex = 0; batchStartIndex < NUM_REVIEWS_PER_LANG; batchStartIndex += REVIEW_BATCH_SIZE) {
        const numReviewsInThisBatch = Math.min(REVIEW_BATCH_SIZE, NUM_REVIEWS_PER_LANG - batchStartIndex);
        if (numReviewsInThisBatch <= 0) break; 

        const currentBatchIdentifier = `[${lang}] Batch reviews ${batchStartIndex + 1}-${batchStartIndex + numReviewsInThisBatch}`;
        console.log(`Processing ${currentBatchIdentifier} (${numReviewsInThisBatch} items)`);

        const prompt = getReviewsPromptForLang(lang, numReviewsInThisBatch, siteName, siteInfo, productShortTitles, anonymousAuthorForPrompt, batchStartIndex);
        let parsedAiReviewDataForBatch = null; 

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            console.log(`[Attempt ${attempt}/${MAX_RETRIES}] Generating ${currentBatchIdentifier}...`);
            try {
                const chatSession = model.startChat({ generationConfig, safetySettings, history: [] });
                const result = await chatSession.sendMessage(prompt);
                const responseText = result.response.text();
                const cleanJsonString = extractJsonFromString(responseText);

                if (!cleanJsonString) {
                    console.error(`[Attempt ${attempt}] Raw API response for ${currentBatchIdentifier} (first 500 chars):\n${responseText.substring(0, 500)}...`);
                    throw new Error('Failed to extract valid JSON from API response for batch.');
                }
                parsedAiReviewDataForBatch = JSON.parse(cleanJsonString);

                let foundReviewsInBatchCount = 0;
                for (let i = 0; i < numReviewsInThisBatch; i++) {
                    const globalReviewIdx = batchStartIndex + i + 1;
                    if (parsedAiReviewDataForBatch[`review_${globalReviewIdx}_author`] && parsedAiReviewDataForBatch[`review_${globalReviewIdx}_text`]) {
                        foundReviewsInBatchCount++;
                    } else {
                        console.warn(`[Attempt ${attempt}] Missing author or text for review (global index ${globalReviewIdx}) in AI response for ${currentBatchIdentifier}.`);
                    }
                }

                if (foundReviewsInBatchCount === 0 && numReviewsInThisBatch > 0) {
                    console.error(`[Attempt ${attempt}] No valid review data fields found in AI response for ${currentBatchIdentifier}.`);
                    throw new Error(`Parsed JSON for ${currentBatchIdentifier} is missing all critical review fields.`);
                } else if (foundReviewsInBatchCount < numReviewsInThisBatch) {
                     console.warn(`[Attempt ${attempt}] AI returned ${foundReviewsInBatchCount} reviews for ${currentBatchIdentifier}, but ${numReviewsInThisBatch} were requested.`);
                }
                
                console.log(`[Attempt ${attempt}] Successfully generated and parsed review data for ${currentBatchIdentifier}. Found ${foundReviewsInBatchCount} reviews.`);
                break; 
            } catch (error) {
                console.error(`[Attempt ${attempt}] Error for ${currentBatchIdentifier}: ${error.message}`);
                parsedAiReviewDataForBatch = null; 
                if (attempt === MAX_RETRIES) {
                    console.error(`All ${MAX_RETRIES} attempts failed for ${currentBatchIdentifier}. This batch will be skipped.`);
                } else {
                    const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
                    console.log(`Retrying ${currentBatchIdentifier} in ${backoffTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                }
            }
        } 

        if (parsedAiReviewDataForBatch) {
            for (let i = 0; i < numReviewsInThisBatch; i++) {
                const globalReviewIdx = batchStartIndex + i + 1;
                const authorKey = `review_${globalReviewIdx}_author`;
                const textKey = `review_${globalReviewIdx}_text`;
                const productTitleKey = `review_${globalReviewIdx}_product_title`;

                const author = parsedAiReviewDataForBatch[authorKey];
                const text = parsedAiReviewDataForBatch[textKey];
                const productTitle = parsedAiReviewDataForBatch[productTitleKey];

                if (author && text) { 
                    currentJsonDataForFile[authorKey] = author;
                    currentJsonDataForFile[textKey] = text;
                    if (productTitle) { 
                        currentJsonDataForFile[productTitleKey] = productTitle;
                    }

                    const isAnonymous = (author === anonymousAuthorForPrompt);
                    allStructuredReviewsForMetadata.push({
                        authorName: author, 
                        text: text,
                        productTitle: productTitle || "", 
                        rating: generateRandomRating(), 
                        isVerified: Math.random() < 0.7, 
                        isAnonymous: isAnonymous,
                        authorKey, 
                        textKey,
                        productTitleKey: productTitle ? productTitleKey : ""
                    });
                }
            }
            // Incremental write after processing the batch
            try {
                await fs.writeJson(langJsonFilePath, currentJsonDataForFile, { spaces: 2, EOL: '\n' });
                console.log(`[${lang}] Successfully wrote batch (up to review ${batchStartIndex + numReviewsInThisBatch}) to ${langJsonFilePath}`);
            } catch (writeError) {
                console.error(`[${lang}] Error writing batch to ${langJsonFilePath}: ${writeError.message}. Data for this batch might be lost for the file.`);
            }
        } else {
            console.log(`No review data was processed for ${currentBatchIdentifier} (likely due to repeated AI failures). File not updated for this batch.`);
        }
    } 

    if (allStructuredReviewsForMetadata.length < NUM_REVIEWS_PER_LANG) {
        console.warn(`[${lang}] Generated ${allStructuredReviewsForMetadata.length} structured reviews in total, but ${NUM_REVIEWS_PER_LANG} were expected.`);
    } else {
        console.log(`[${lang}] Successfully processed all batches. Total structured reviews for metadata: ${allStructuredReviewsForMetadata.length}.`);
    }
    
    // No longer returns flatReviewJson, as it's written incrementally.
    return { 
        structuredReviewsForMetadata: allStructuredReviewsForMetadata 
    };
}

async function processLanguageReviewGenerationTask(task) {
    const { lang } = task;
    console.log(`Starting review generation task for language: ${lang}...`);

    const generationResult = await generateReviewsDataForLang(lang, SITE_NAME_FROM_ENV, SITE_INFO_FROM_ENV);

    // generationResult now only contains structuredReviewsForMetadata or is null/undefined if error
    if (!generationResult || !generationResult.structuredReviewsForMetadata) {
        console.error(`Failed to generate review data for ${lang}.`);
        return null; 
    }
    
    // No longer writes the main JSON file here; it's done incrementally in generateReviewsDataForLang.
    console.log(`[${lang}] Incremental writing to reviews.json completed within generateReviewsDataForLang.`);
    return generationResult.structuredReviewsForMetadata; 
}

async function main() {
    console.log(`Starting review content generation script...`);
    console.log(`Languages: ${TARGET_LANGUAGES.join(', ')}`);
    console.log(`Reviews per language: ${NUM_REVIEWS_PER_LANG}`);
    console.log(`Max concurrent language tasks: ${MAX_CONCURRENT_REVIEW_REQUESTS}`);

    const allLanguageTasks = TARGET_LANGUAGES.map(lang => ({ lang }));

    if (allLanguageTasks.length === 0) {
        console.log('No target languages specified. Exiting.');
        return;
    }

    const allResultsForMetadata = [];
    let taskIndex = 0;
    const activeWorkers = [];

    console.log(`Starting review generation for ${allLanguageTasks.length} languages with up to ${MAX_CONCURRENT_REVIEW_REQUESTS} concurrent tasks...`);

    function runNextTask() {
        if (taskIndex >= allLanguageTasks.length) {
            return null; // All tasks have been started
        }
        const task = allLanguageTasks[taskIndex];
        taskIndex++;
        console.log(`[Main] Starting task for language: ${task.lang} (Task ${taskIndex}/${allLanguageTasks.length})`);
        
        const promise = processLanguageReviewGenerationTask(task)
            .then(structuredReviews => {
                if (structuredReviews) {
                    console.log(`[Main] Successfully completed task for language: ${task.lang}. Reviews for metadata: ${structuredReviews.length}`);
                    allResultsForMetadata.push({ lang: task.lang, reviews: structuredReviews });
                } else {
                    console.warn(`[Main] Task for language ${task.lang} did not return structured reviews (possibly due to errors).`);
                }
            })
            .catch(err => {
                console.error(`[Main] Critical error processing task for ${task.lang}:`, err);
                // Optionally, you could push an error marker to allResultsForMetadata here
            })
            .finally(() => {
                // Remove this worker from activeWorkers and try to run the next task
                const workerIndex = activeWorkers.indexOf(promiseWrapper);
                if (workerIndex > -1) {
                    activeWorkers.splice(workerIndex, 1);
                }
                const nextTaskPromise = runNextTask();
                if (nextTaskPromise) {
                    activeWorkers.push(nextTaskPromise);
                }
            });
        
        const promiseWrapper = { promise }; // Wrapping to manage it in activeWorkers
        return promiseWrapper;
    }

    // Start initial workers
    for (let i = 0; i < Math.min(MAX_CONCURRENT_REVIEW_REQUESTS, allLanguageTasks.length); i++) {
        const initialTaskPromise = runNextTask();
        if (initialTaskPromise) {
            activeWorkers.push(initialTaskPromise);
        }
    }

    // Wait for all active workers to complete.
    // The `finally` block in runNextTask handles queuing new tasks, so we just need to wait for the current set to drain.
    // This loop ensures we wait until all tasks are truly done, as new ones get added dynamically.
    while (activeWorkers.length > 0 || taskIndex < allLanguageTasks.length) {
        if (activeWorkers.length > 0) {
             // Check the status of the active workers without blocking indefinitely if some are stuck
            // This is a simplified wait; a more robust solution might use Promise.race with a timeout
            // or a more sophisticated queue management system for production.
            // For this script, we rely on the .finally() chain to keep things moving.
            await Promise.race(activeWorkers.map(p => p.promise)).catch(() => { /* Errors handled in .catch within runNextTask */ });
        } else if (taskIndex < allLanguageTasks.length && activeWorkers.length < MAX_CONCURRENT_REVIEW_REQUESTS) {
            // If there are pending tasks and capacity, start new ones.
            // This case helps kickstart if somehow all active workers finished but more tasks remain.
            const newTaskPromise = runNextTask();
            if (newTaskPromise) {
                activeWorkers.push(newTaskPromise);
            }
        } else {
            // Small delay to prevent a tight loop if something unexpected happens
            await new Promise(resolve => setTimeout(resolve, 250)); 
        }
    }

    console.log("All language processing tasks have been initiated and completed/failed.");

    const firstSuccessfulResult = allResultsForMetadata.find(r => r.reviews && r.reviews.length > 0);

    if (firstSuccessfulResult && firstSuccessfulResult.reviews) {
        const metadataEntries = firstSuccessfulResult.reviews.map((reviewDetails, index) => {
            const reviewIdx = index + 1;
            const entry = {
                id: `review-gen-${uuidv4().slice(0, 12)}`,
                rating: reviewDetails.rating,
                authorKey: `review_${reviewIdx}_author`,
                textKey: `review_${reviewIdx}_text`,
                isVerified: reviewDetails.isVerified,
                isAnonymous: reviewDetails.isAnonymous,
            };
            if (reviewDetails.productTitle) {
                entry.productShortTitleKey = `review_${reviewIdx}_product_title`;
            }
            return entry;
        });

        const metadataFileContent = `import { ReviewMetadata } from '@/types';

export const reviewsMetadata: ReviewMetadata[] = ${JSON.stringify(metadataEntries, null, 2)};
`;
        try {
            await fs.ensureDir(path.dirname(OUTPUT_METADATA_FILE));
            await fs.writeFile(OUTPUT_METADATA_FILE, metadataFileContent);
            console.log(`Successfully wrote reviews metadata to: ${OUTPUT_METADATA_FILE}`);
        } catch (error) {
            console.error(`Error writing reviews metadata to ${OUTPUT_METADATA_FILE}:`, error);
        }
    } else {
        console.log('No successful review data was structured for metadata. Skipping metadata file creation.');
    }

    console.log('Review content generation process completed.');
}
main().catch(error => {
    console.error("Critical error in main execution:", error);
    process.exit(1);
}); 
