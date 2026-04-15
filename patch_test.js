const fs = require('fs');

const filePath = 'src/components/search-filters.test.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/fireEvent\.change\(screen\.getByPlaceholderText\("Buscar por palabra clave o texto\.\.\."\), \{ target: \{ value: "(.*?)" \} \}\);/g, (match, value) => {
    return `const input = screen.getByPlaceholderText("Buscar por palabra clave o texto...");\n    input.value = "${value}";\n    fireEvent.change(input, { target: { value: "${value}" } });`;
});

fs.writeFileSync(filePath, content);
