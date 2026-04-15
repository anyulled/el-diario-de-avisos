const fs = require('fs');

const filePath = 'src/components/search-filters.test.tsx';
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('should handle "Enter" key down on search input')) {
  const insertIndex = content.lastIndexOf('});');
  const testCase = `
  it('should handle "Enter" key down on search input', () => {
    const replaceMock = vi.fn();
    (useRouter as any).mockReturnValue({ replace: replaceMock });

    render(<SearchFilters types={[]} publications={[]} />);
    const input = screen.getByPlaceholderText("Buscar por palabra clave o texto...");

    // Changing value
    input.value = "some text";
    fireEvent.change(input, { target: { value: "some text" } });

    // Pressing Enter
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });

    expect(replaceMock).toHaveBeenCalled();
  });
`;
  content = content.slice(0, insertIndex) + testCase + content.slice(insertIndex);
}

fs.writeFileSync(filePath, content);
