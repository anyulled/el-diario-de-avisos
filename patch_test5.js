const fs = require('fs');

const filePath = 'src/components/search-filters.test.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  '// Not overwriting router mock here since it breaks',
  `
    const { useRouter } = require("next/navigation");
    const replaceMock = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      replace: replaceMock,
      push: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn()
    } as any);
  `
);
content = content.replace(
  'const replaceMock = vi.fn();\n    \n    const { useRouter } =',
  `const { useRouter } =`
);

fs.writeFileSync(filePath, content);
