const fs = require('fs');

const filePath = 'src/components/search-filters.test.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /  it\('should handle "Enter" key down on search input', \(\) => \{\n([\s\S]*?)  \}\);\n/;
content = content.replace(regex, `
  it('should handle "Enter" key down on search input', () => {
    const replaceMock = vi.fn();
    (require('next/navigation').useRouter as any).mockImplementation(() => ({
      replace: replaceMock,
    }));

    render(<SearchFilters types={[]} publications={[]} />);
    const input = screen.getByPlaceholderText("Buscar por palabra clave o texto...");

    // Changing value
    input.value = "some text";
    fireEvent.change(input, { target: { value: "some text" } });

    // Pressing Enter
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });

    expect(replaceMock).toHaveBeenCalled();
  });
`);

fs.writeFileSync(filePath, content);
