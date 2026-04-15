const fs = require('fs');

const filePath = 'src/components/search-filters.test.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  '/* Changing value */',
  ''
);

content = content.replace(
  '/* Pressing Enter */',
  ''
);

const regex = /  it\('triggers onBlur and tests invalid date and also execute search error', \(\) => \{\n([\s\S]*?)  \}\);\n/;
content = content.replace(regex, `
  it('triggers onBlur and tests invalid date and also execute search error', () => {
      const replaceMock = vi.fn();
      (require('next/navigation').useRouter as any).mockImplementation(() => ({
        replace: replaceMock,
      }));

      const { getByLabelText, getByRole } = render(<SearchFilters types={[]} publications={[]} />);
      const dateFromInput = getByLabelText("Fecha desde") as HTMLInputElement;
      const dateToInput = getByLabelText("Fecha hasta") as HTMLInputElement;

      fireEvent.change(dateFromInput, { target: { value: "2024-01-01" } });
      fireEvent.change(dateToInput, { target: { value: "2023-01-01" } });
      fireEvent.blur(dateToInput);

      expect(screen.getByText("La fecha inicial no puede ser posterior a la fecha final.")).toBeTruthy();

      const typeButton = screen.getByRole("button", { name: /Tipo/i });
      fireEvent.click(typeButton);

      // Now trigger execute search when dates are already invalid to hit line 321
      const searchButton = getByRole("button", { name: "Buscar" });
      fireEvent.click(searchButton);

      expect(replaceMock).not.toHaveBeenCalled();

      const radio = screen.getByRole("radio", { name: /Mostar Todos/i });
      fireEvent.click(radio);
      expect(replaceMock).toHaveBeenCalled();
  });

  it('tests handle manual search directly when Enter is pressed', () => {
      const replaceMock = vi.fn();
      (require('next/navigation').useRouter as any).mockImplementation(() => ({
        replace: replaceMock,
      }));
      render(<SearchFilters types={[]} publications={[]} />);
      const input = screen.getByPlaceholderText("Buscar por palabra clave o texto...") as HTMLInputElement;
      input.value = "my explicit search";
      fireEvent.change(input, { target: { value: "my explicit search" } });
      fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });

      expect(replaceMock).toHaveBeenCalled();
  });
`);

fs.writeFileSync(filePath, content);
