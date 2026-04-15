const fs = require('fs');

const filePath = 'src/components/search-filters.test.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'expect(screen.getByText("La fecha inicial no puede ser posterior a la fecha final.")).toBeInTheDocument();',
  'expect(screen.getByText("La fecha inicial no puede ser posterior a la fecha final.")).toBeTruthy();'
);

fs.writeFileSync(filePath, content);
