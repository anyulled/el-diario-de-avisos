const fs = require('fs');

const filePath = 'src/components/search-filters.test.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  '(useRouter as any).mockReturnValue({ replace: replaceMock });',
  '(require("next/navigation").useRouter as any).mockReturnValue({ replace: replaceMock });'
);

fs.writeFileSync(filePath, content);
