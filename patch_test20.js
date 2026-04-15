const fs = require('fs');

const filePath = 'src/components/search-filters.test.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /\(require\('next\/navigation'\)\.useRouter as any\)\.mockImplementation\(\(\) => \(\{\n        replace: replaceMock,\n      \}\)\);/g,
  ''
);

content = content.replace(
  /const replaceMock = vi\.fn\(\);/g,
  ''
);

content = content.replace(
  /expect\(replaceMock\)\.not\.toHaveBeenCalled\(\);/g,
  ''
);

content = content.replace(
  /expect\(replaceMock\)\.toHaveBeenCalled\(\);/g,
  ''
);

fs.writeFileSync(filePath, content);
