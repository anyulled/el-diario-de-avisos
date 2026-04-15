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

    // trigger handle validation dates
    const dateFromInput = screen.getByLabelText("Fecha desde");
    fireEvent.blur(dateFromInput);

    const sizeSelect = getAllByRole("combobox")[1];
    fireEvent.change(sizeSelect, { target: { value: "100" } });
  });

  it('triggers onBlur and tests invalid date', () => {
      const { getByLabelText } = render(<SearchFilters types={[]} publications={[]} />);
      const dateFromInput = getByLabelText("Fecha desde");
      const dateToInput = getByLabelText("Fecha hasta");

      fireEvent.change(dateFromInput, { target: { value: "2024-01-01" } });
      fireEvent.change(dateToInput, { target: { value: "2023-01-01" } });
      fireEvent.blur(dateToInput);

      expect(screen.getByText("La fecha inicial no puede ser posterior a la fecha final.")).toBeInTheDocument();

      const typeButton = screen.getByRole("button", { name: /Tipo/i });
      fireEvent.click(typeButton);
      const radio = screen.getByRole("radio", { name: /Mostar Todos/i });
      fireEvent.click(radio);
  });
`);

fs.writeFileSync(filePath, content);
