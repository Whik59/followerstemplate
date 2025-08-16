const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data/category-translations.json');

// Read the JSON file
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// For each category, set all translations to the English value
for (const category of data) {
  const english = category.translations['en'];
  for (const lang of Object.keys(category.translations)) {
    category.translations[lang] = english;
  }
}

// Write the updated data back to the file
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

console.log('All translations have been set to the English value.'); 