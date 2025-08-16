const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data/category-slug-map.json');

// Read the JSON file
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// For each category, set all locale slugs to the English value
for (const key of Object.keys(data)) {
  const category = data[key];
  const english = category.locales['en'];
  for (const lang of Object.keys(category.locales)) {
    category.locales[lang] = english;
  }
}

// Write the updated data back to the file
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

console.log('All slugs have been set to the English value.'); 