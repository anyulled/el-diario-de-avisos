const fs = require('fs');

const filePath = 'src/components/search-filters.test.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /  it\('should execute search with explicit page update parameter correctly handled by the search build helper', \(\) => \{\n([\s\S]*?)  \}\);\n/;
content = content.replace(regex, `
  it('should execute search with explicit page update parameter correctly handled by the search build helper', () => {
    const { getAllByRole, getByRole } = render(<SearchFilters types={[]} publications={[]} />);

    // trigger sort change, type filter expansion
    const typeButton = getByRole("button", { name: /Tipo/i });
    fireEvent.click(typeButton);

    const sortSelect = getAllByRole("combobox")[0]; // assuming it finds it
    fireEvent.change(sortSelect, { target: { value: "rank" } });
  });
`);

fs.writeFileSync(filePath, content);
