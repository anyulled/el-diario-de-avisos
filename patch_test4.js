const fs = require('fs');

const filePath = 'src/components/search-filters.test.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  '(require("next/navigation").useRouter as any).mockReturnValue({ replace: replaceMock });',
  '// Not overwriting router mock here since it breaks'
);

fs.writeFileSync(filePath, content);
