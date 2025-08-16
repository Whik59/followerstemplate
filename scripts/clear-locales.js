const fs = require('fs-extra');
const path = require('path');

const localesDir = path.join(process.cwd(), 'locales');
const sourceLocale = 'en';

async function clearLocales() {
    console.log('Clearing old common.json files...');
    try {
        const localeDirs = await fs.readdir(localesDir);
        for (const locale of localeDirs) {
            if (locale === sourceLocale || ! (await fs.stat(path.join(localesDir, locale))).isDirectory()) {
                continue;
            }
            
            const commonJsonPath = path.join(localesDir, locale, 'common.json');
            if (await fs.pathExists(commonJsonPath)) {
                await fs.remove(commonJsonPath);
                console.log(`Deleted: ${commonJsonPath}`);
            }
        }
        console.log('Finished clearing old files.');
    } catch (error) {
        console.error('Error clearing locale files:', error);
        process.exit(1);
    }
}

clearLocales();

async function deleteCommonJson() {
  const localesDir = path.join(__dirname, '..', 'locales');
  try {
    const allLocales = await fs.readdir(localesDir);

    for (const locale of allLocales) {
      if (locale === 'en') {
        console.log('Skipping English (en) locale.');
        continue;
      }

      const localePath = path.join(localesDir, locale);
      const stats = await fs.stat(localePath);

      if (stats.isDirectory()) {
        const commonJsonPath = path.join(localePath, 'common.json');
        try {
          await fs.unlink(commonJsonPath);
          console.log(`Deleted ${commonJsonPath}`);
        } catch (error) {
          if (error.code === 'ENOENT') {
            console.log(`No common.json found in ${locale}, skipping.`);
          } else {
            console.error(`Error deleting ${commonJsonPath}:`, error);
          }
        }
      }
    }
    console.log('\nFinished deleting non-English common.json files.');
  } catch (error) {
    console.error('Failed to read locales directory:', error);
  }
}

deleteCommonJson(); 