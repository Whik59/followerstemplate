import fs from 'fs-extra';
import path from 'path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'sitemaps');
const ROBOTS_TXT_PATH = path.resolve(process.cwd(), 'public', 'robots.txt');

async function cleanSitemaps() {
  try {
    if (await fs.pathExists(OUTPUT_DIR)) {
      await fs.remove(OUTPUT_DIR);
      console.log(`Successfully deleted directory: ${OUTPUT_DIR}`);
    } else {
      console.log(`Directory not found, skipping deletion: ${OUTPUT_DIR}`);
    }
  } catch (err) {
    console.error(`Error deleting directory ${OUTPUT_DIR}:`, err);
  }
}

async function cleanRobotsTxt() {
  try {
    if (await fs.pathExists(ROBOTS_TXT_PATH)) {
      await fs.remove(ROBOTS_TXT_PATH);
      console.log(`Successfully deleted file: ${ROBOTS_TXT_PATH}`);
    } else {
      console.log(`File not found, skipping deletion: ${ROBOTS_TXT_PATH}`);
    }
  } catch (err) {
    console.error(`Error deleting file ${ROBOTS_TXT_PATH}:`, err);
  }
}

async function main() {
  console.log('Starting cleanup of sitemaps and robots.txt...');
  await cleanSitemaps();
  await cleanRobotsTxt();
  console.log('Cleanup complete.');
}

main().catch(error => {
  console.error('Failed during cleanup process:', error);
  process.exit(1);
}); 