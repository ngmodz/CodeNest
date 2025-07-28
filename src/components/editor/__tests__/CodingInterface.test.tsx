import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CodingInterface from '../CodingInterface';

// Mock the child components
jest.mock('../CodeEditor', () => {
  return {
    __esModule: true,
    default: jest.fn(({ language, code, onChange }) => (
      <div data-testid="mock-code-editor">
        <div data-testid="editor-language">{language}</div>
        <textarea 
          data-testid="editor-textarea" 
          value={code} 
          onChange={(e) => onChange && onChange(e.target.value)}
          aria-label="Code editor"
        />
      </div>
    )),
  };
});

jest.mock('../EditorToolbar', () => {
  return {
    __esModule: true,
    default: jest.fn(({ language, onLanguageChange, onRun, onSubmit }) => (
      <div data-testid="mock-editor-toolbar">
        <select 
          data-testid="language-selector"
          value={language}
          onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
          aria-label="Language selector"
        >
          <option value="JavaScript">JavaScript</option>
          <option value="Python">Python</option>
        </select>
        <button 
          data-testid="run-button"
          onClick={onRun}
        >
          Run Code
        </button>
        <button 
          data-testid="submit-button"
          onClick={onSubmit}
        >
          Submit
        </button>
      </div>
    )),
  };
});

jest.mock('../OutputDisplay', () => {
  return {
    __esModule: true,
    default: jest.fn(({ results, compilationError, isLoading }) => (
      <div data-testid="mock-output-display">
        {isLoading ? (
          <div data-testid="loading-indicator">Loading...</div>
        ) : compilationError ? (
          <div data-testid="compilation-error">{compilationError}</div>
        ) : results ? (
          <div data-testid="test-results">
            {results.map((result: { passed: any; }, index: React.Key | null | undefined) => (
              <div key={index} data-testid={`test-result-${index}`}>
                {result.passed ? 'Passed' : 'Failed'}
              </div>
            ))}
          </div>
        ) : (
          <div data-testid="no-results">No results</div>
        )}
      </div>
    )),
  };
});

// Mock the hooks
jest.mock('@/hooks/useProfile', () => ({
  useProfile: jest.fn().mockReturnValue({
    profile: { preferredLanguage: 'JavaScript' }
  })
}));

// Mock fetch
global.fetch = jest.fn();

describe('CodingInterface Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders the coding interface with initial values', () => {
    render(<CodingInterface initialCode="// Initial code" />);

    expect(screen.getByTestId('mock-code-editor')).toBeInTheDocument();
    expect(screen.getByTestId('mock-editor-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-output-display')).toBeInTheDocument();
  });

  it('updates language when user changes it', () => {
    render(<CodingInterface />);

    const languageSelector = screen.getByTestId('language-selector');
    fireEvent.change(languageSelector, { target: { value: 'Python' } });

    expect(screen.getByTestId('editor-language').textContent).toBe('Python');
  });

  it('calls the API when Run button is clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { passed: true, input: '1 2', expectedOutput: '3', actualOutput: '3', executionTime: 10, memoryUsage: 1024 }
        ]
      })
    });

    render(<CodingInterface initialCode="console.log('test')" />);

    const runButton = screen.getByTestId('run-button');
    fireEvent.click(runButton);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/compile', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('console.log')
    }));
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'API error' })
    });

    render(<CodingInterface initialCode="console.log('test')" />);

    const runButton = screen.getByTestId('run-button');
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByTestId('compilation-error')).toBeInTheDocument();
    });
  });
}); 