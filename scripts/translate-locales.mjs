import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import { jsonrepair } from 'jsonrepair';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const APP_LOCALES_STRING = process.env.APP_LOCALES;
const MAX_CONCURRENT_REQUESTS = parseInt(process.env.MAX_CONCURRENT_REQUESTS, 20) || 12; // Default to 3 if not set

const SOURCE_LOCALE = 'en';
const SOURCE_FILE_PATH = path.join(process.cwd(), 'locales', SOURCE_LOCALE, 'common.json');
const OUTPUT_LOCALES_BASE_DIR = path.join(process.cwd(), 'locales');
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

if (!GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY is not set in the .env file.');
    process.exit(1);
}
if (!APP_LOCALES_STRING) {
    console.error('Error: APP_LOCALES is not set in the .env file.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' }); // Using latest pro model for higher accuracy

const generationConfig = {
    temperature: 0.5, // Lower temperature for more deterministic translations
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: 'application/json',
};

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Map of locales to their corresponding country names and flags
const countryData = {
    ar: { name: 'العالم العربي', flag: '🇸🇦' }, // Using Saudi Arabia flag for Arabic
    bg: { name: 'България', flag: '🇧🇬' },
    cs: { name: 'Česká republika', flag: '🇨🇿' },
    da: { name: 'Danmark', flag: '🇩🇰' },
    de: { name: 'Deutschland', flag: '🇩🇪' },
    el: { name: 'Ελλάδα', flag: '🇬🇷' },
    es: { name: 'América Latina', flag: '🌎' }, // Using globe for Latin America
    fi: { name: 'Suomi', flag: '🇫🇮' },
    fr: { name: 'France', flag: '🇫🇷' },
    he: { name: 'ישראל', flag: '🇮🇱' },
    hr: { name: 'Hrvatska', flag: '🇭🇷' },
    hu: { name: 'Magyarország', flag: '🇭🇺' },
    id: { name: 'Indonesia', flag: '🇮🇩' },
    it: { name: 'Italia', flag: '🇮🇹' },
    ja: { name: '日本', flag: '🇯🇵' },
    ko: { name: '대한민국', flag: '🇰🇷' },
    ms: { name: 'Malaysia', flag: '🇲🇾' },
    nl: { name: 'Nederland', flag: '🇳🇱' },
    no: { name: 'Norge', flag: '🇳🇴' },
    pl: { name: 'Polska', flag: '🇵🇱' },
    pt: { name: 'Brasil', flag: '🇧🇷' }, // Specifically Brazil for Portuguese
    ro: { name: 'România', flag: '🇷🇴' },
    ru: { name: 'Россия', flag: '🇷🇺' },
    sk: { name: 'Slovensko', flag: '🇸🇰' },
    sl: { name: 'Slovenija', flag: '🇸🇮' },
    sr: { name: 'Србија', flag: '🇷🇸' },
    sv: { name: 'Sverige', flag: '🇸🇪' },
    th: { name: 'ประเทศไทย', flag: '🇹🇭' },
    tr: { name: 'Türkiye', flag: '🇹🇷' },
    uk: { name: 'Україна', flag: '🇺🇦' },
    vi: { name: 'Việt Nam', flag: '🇻🇳' },
    zh: { name: '中国', flag: '🇨🇳' },
};

function getTranslationPrompt(sourceJsonString, targetLocale, targetLanguageName, countryInfo) {
    const countryRule = countryInfo
        ? `9.  CRITICAL: When you encounter "USA" in the English text, you MUST replace it with "${countryInfo.name}". Similarly, replace the 🇺🇸 flag emoji with the ${countryInfo.flag} emoji.`
        : '';
    
    return `
You are an expert translation AI. Your task is to translate the string values of the provided JSON object from English to ${targetLanguageName}.

VERY IMPORTANT RULES:
1.  Translate ONLY the string values. Do NOT translate the JSON keys.
2.  Keep ALL JSON keys exactly as they are in the original English JSON.
3.  Preserve any placeholders like {variableName}, {count}, or HTML tags (e.g., <br />, <strong>) exactly as they appear within the strings. Do NOT translate the content of these placeholders.
4.  The value for the JSON key "Locale" MUST be exactly "${targetLocale}" in your translated output.
5.  Your entire response MUST be ONLY the translated JSON object. Do not include any other text, explanations, or markdown formatting before or after the JSON object.
6.  Ensure the output is a single, valid JSON object.
7.  Pay close attention to context and provide natural-sounding translations for ${targetLanguageName}.
8.  If an English string contains specific cultural references or wordplay that doesn't directly translate, provide the closest natural equivalent in ${targetLanguageName}.
${countryRule}

Original English JSON to translate:
${sourceJsonString}

Translate all string values to ${targetLanguageName} (locale code: ${targetLocale}).
Remember, the output must be only the valid JSON object.
`;
}

// A simple helper to get a display name for a locale (can be expanded)
function getLanguageName(localeCode) {
    try {
        const displayName = new Intl.DisplayNames([localeCode], { type: 'language' });
        return displayName.of(localeCode.split('-')[0]); // Use base language code for display name
    } catch (e) {
        console.warn(`Could not get display name for locale: ${localeCode}, using code as fallback.`);
        return localeCode;
    }
}

async function translateJsonForLocale(sourceJsonString, targetLocale) {
    const targetLanguageName = getLanguageName(targetLocale);
    const countryInfo = countryData[targetLocale.split('-')[0]]; // Get country info from base locale
    const prompt = getTranslationPrompt(sourceJsonString, targetLocale, targetLanguageName, countryInfo);
    const taskIdentifier = `Translation to ${targetLanguageName} (${targetLocale})`;
    let originalResponseForDebug = ''; // Declare here for wider scope

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        console.log(`[Attempt ${attempt}/${MAX_RETRIES}] Generating ${taskIdentifier}...`);
        try {
            const chatSession = model.startChat({ generationConfig, safetySettings, history: [] });
            const result = await chatSession.sendMessage(prompt);
            originalResponseForDebug = result.response.text(); // Assign raw response
            
            // Attempt to repair the (potentially incomplete or malformed) JSON string.
            // This is more robust than trying to parse directly or simple substring logic.
            const repairedJsonString = jsonrepair(originalResponseForDebug);
            
            JSON.parse(repairedJsonString); // Final validation on the repaired string
            console.log(`[Attempt ${attempt}] Successfully received and validated JSON for ${taskIdentifier}.`);
            return repairedJsonString; // Return the valid, repaired JSON string

        } catch (error) {
            console.error(`[Attempt ${attempt}] Error for ${taskIdentifier}: ${(error).message}`);
            // Log the problematic responses for debugging
            console.error(`[Debug] Task: ${taskIdentifier} - Original response from AI that failed repair/parsing:`);
            console.error(originalResponseForDebug);

            if (attempt === MAX_RETRIES) {
                console.error(`All ${MAX_RETRIES} attempts failed for ${taskIdentifier}.`);
                return null; // Indicate failure
            }
            const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
            console.log(`Retrying in ${backoffTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
    }
    return null;
}

function chunkObject(obj, size) {
    const keys = Object.keys(obj);
    const chunks = [];
    for (let i = 0; i < keys.length; i += size) {
        const chunk = {};
        for (let j = i; j < i + size && j < keys.length; j++) {
            chunk[keys[j]] = obj[keys[j]];
        }
        chunks.push(chunk);
    }
    return chunks;
}

async function processTranslationTask(sourceJsonString, targetLocale) {
    const targetDir = path.join(OUTPUT_LOCALES_BASE_DIR, targetLocale);
    const targetFilePath = path.join(targetDir, 'common.json');

    if (await fs.pathExists(targetFilePath)) {
        console.log(`[Skipping] Translation for ${targetLocale} already exists at: ${targetFilePath}`);
        return;
    }

    // Parse the source JSON for chunking
    const sourceJson = JSON.parse(sourceJsonString);
    const chunkSize = 100; // Adjust as needed
    const chunks = chunkObject(sourceJson, chunkSize);

    let merged = {};
    for (let i = 0; i < chunks.length; i++) {
        const chunkString = JSON.stringify(chunks[i], null, 2);
        const translatedChunkString = await translateJsonForLocale(chunkString, targetLocale);
        if (translatedChunkString) {
            try {
                const translatedChunk = JSON.parse(translatedChunkString);
                merged = { ...merged, ...translatedChunk };
            } catch (e) {
                console.error(`Error parsing translated chunk for ${targetLocale} (chunk ${i + 1}):`, e);
            }
        } else {
            console.error(`Failed to translate chunk ${i + 1} for ${targetLocale}.`);
        }
    }

    // Fill in any missing keys from the source
    for (const key of Object.keys(sourceJson)) {
        if (!(key in merged)) merged[key] = sourceJson[key];
    }

        try {
            await fs.ensureDir(targetDir);
        await fs.writeJson(targetFilePath, merged, { spaces: 2, EOL: '\n' });
            console.log(`Successfully wrote translated common.json for ${targetLocale} to: ${targetFilePath}`);
        } catch (error) {
            console.error(`Error writing translated JSON for ${targetLocale}:`, error);
    }
    console.log(`--- Finished processing locale: ${targetLocale} ---\n`);
}

async function main() {
    console.log('Starting common.json translation script...');
    console.log(`Max concurrent requests: ${MAX_CONCURRENT_REQUESTS}`);

    let sourceJsonContent;
    try {
        sourceJsonContent = await fs.readJson(SOURCE_FILE_PATH);
        console.log(`Successfully read source file: ${SOURCE_FILE_PATH}`);
    } catch (error) {
        console.error(`Failed to read or parse source JSON file at ${SOURCE_FILE_PATH}:`, error);
        process.exit(1);
    }
    const sourceJsonString = JSON.stringify(sourceJsonContent, null, 2);

    const targetLocales = APP_LOCALES_STRING.split(',').map(loc => loc.trim()).filter(loc => loc !== SOURCE_LOCALE && loc !== '');

    if (targetLocales.length === 0) {
        console.log('No target locales to translate to (after excluding source locale). Exiting.');
        return;
    }

    console.log(`Source locale: ${SOURCE_LOCALE}`);
    console.log(`Target locales: ${targetLocales.join(', ')}`);

    const activeWorkers = [];
    let taskIndex = 0;

    async function runNextTask() {
        if (taskIndex >= targetLocales.length) return Promise.resolve();
        
        const currentTargetLocale = targetLocales[taskIndex++];
        const workerPromise = processTranslationTask(sourceJsonString, currentTargetLocale)
            .catch(err => console.error(`Unhandled error in task for ${currentTargetLocale}:`, err))
            .finally(() => {
                // Remove the promise from activeWorkers once it's done
                const index = activeWorkers.indexOf(workerPromise);
                if (index > -1) {
                    activeWorkers.splice(index, 1);
                }
            });
        activeWorkers.push(workerPromise);
        return workerPromise;
    }
    
    const allTaskPromises = [];
    // Main loop to manage concurrency
    while(taskIndex < targetLocales.length || activeWorkers.length > 0) {
        // Fill up the worker pool
        while(activeWorkers.length < MAX_CONCURRENT_REQUESTS && taskIndex < targetLocales.length) {
           allTaskPromises.push(runNextTask());
        }
        
        // Wait for any worker to finish if the pool is full or all tasks have been dispatched
        if (activeWorkers.length > 0) {
            // Use Promise.race to wait for the next promise to complete
            // Catch errors here to prevent Promise.race from rejecting early
            await Promise.race(activeWorkers.map(p => p.catch(e => e))); 
        } else if (taskIndex >= targetLocales.length && activeWorkers.length === 0) {
            // All tasks dispatched and all workers finished
            break; 
        } else {
            // Small delay if no workers are active but tasks remain (should not happen with current logic but good for safety)
            await new Promise(resolve => setTimeout(resolve, 50)); 
        }
    }
    
    // Ensure all dispatched tasks complete, catching any final errors
    await Promise.all(allTaskPromises.map(p => p.catch(e => e))); 

    console.log('Translation script completed.');
}

main().catch(error => {
    console.error("Unhandled error in main execution:", error);
    process.exit(1);
}); 