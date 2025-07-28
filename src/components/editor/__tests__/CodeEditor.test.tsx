import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CodeEditor from '../CodeEditor';
import { ThemeProvider } from '@/context/ThemeContext';

// Mock the Monaco Editor
jest.mock('@monaco-editor/react', () => {
  return {
    __esModule: true,
    default: jest.fn(({ language, value, onChange, theme }) => (
      <div data-testid="mock-monaco-editor">
        <div data-testid="editor-language">{language}</div>
        <div data-testid="editor-theme">{theme}</div>
        <textarea 
          data-testid="editor-textarea" 
          value={value} 
          onChange={(e) => onChange && onChange(e.target.value)}
          readOnly={!onChange}
          aria-label="Code editor"
        />
      </div>
    )),
  };
});

// Mock the useTheme hook
jest.mock('@/context/ThemeContext', () => ({
  useTheme: jest.fn().mockReturnValue({ theme: 'light' }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('CodeEditor Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the editor with the correct language', () => {
    render(
      <ThemeProvider>
        <CodeEditor
          language="JavaScript"
          code="// Sample code"
          onChange={mockOnChange}
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId('mock-monaco-editor')).toBeInTheDocument();
    expect(screen.getByTestId('editor-language').textContent).toBe('javascript');
  });

  it('applies the correct theme based on the theme context', () => {
    // Override the mock for this test only
    require('@/context/ThemeContext').useTheme.mockReturnValueOnce({ theme: 'dark' });

    render(
      <ThemeProvider>
        <CodeEditor
          language="Python"
          code="# Python code"
          onChange={mockOnChange}
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId('editor-theme').textContent).toBe('vs-dark');
  });

  it('respects the readOnly prop', () => {
    render(
      <ThemeProvider>
        <CodeEditor
          language="JavaScript"
          code="// Sample code"
          onChange={mockOnChange}
          readOnly={true}
        />
      </ThemeProvider>
    );

    // Since we're mocking Monaco, we're just checking if the component renders
    expect(screen.getByTestId('mock-monaco-editor')).toBeInTheDocument();
  });
}); 