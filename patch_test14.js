const fs = require('fs');

const filePath = 'src/components/search-filters.test.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/input\.value = "(.*?)";/g, '(input as HTMLInputElement).value = "$1";');

fs.writeFileSync(filePath, content);
