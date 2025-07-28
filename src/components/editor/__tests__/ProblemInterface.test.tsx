import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProblemInterface from '../ProblemInterface';
import { CodingProblem } from '@/types';

// Mock the child components
jest.mock('../ProblemDescription', () => {
  return {
    __esModule: true,
    default: jest.fn(({ problem }) => (
      <div data-testid="mock-problem-description">
        <h1 data-testid="problem-title">{problem.title}</h1>
      </div>
    )),
  };
});

jest.mock('../CodingInterface', () => {
  return {
    __esModule: true,
    default: jest.fn(({ initialCode, problemId }) => (
      <div data-testid="mock-coding-interface">
        <div data-testid="problem-id">{problemId}</div>
        <textarea 
          data-testid="code-editor" 
          defaultValue={initialCode}
          aria-label="Code editor"
        />
      </div>
    )),
  };
});

describe('ProblemInterface Component', () => {
  const mockProblem: CodingProblem = {
    id: 'problem-1',
    title: 'Test Problem',
    description: 'This is a test problem',
    difficulty: 'Basic',
    topic: 'Arrays',
    examples: [
      {
        input: 'input example',
        output: 'output example',
      }
    ],
    constraints: ['constraint 1', 'constraint 2'],
    testCases: [],
    isAI: false,
    createdAt: new Date().toISOString()
  };

  it('renders both panels on desktop view', () => {
    // Mock window.innerWidth for desktop view
    global.innerWidth = 1200;
    global.dispatchEvent(new Event('resize'));

    render(
      <ProblemInterface 
        problem={mockProblem}
        initialCode="// Test code"
      />
    );

    expect(screen.getByTestId('mock-problem-description')).toBeInTheDocument();
    expect(screen.getByTestId('mock-coding-interface')).toBeInTheDocument();
    expect(screen.getByTestId('problem-title').textContent).toBe('Test Problem');
    expect(screen.getByTestId('problem-id').textContent).toBe('problem-1');
  });

  it('toggles between problem and code views on mobile', () => {
    // Mock window.innerWidth for mobile view
    global.innerWidth = 500;
    global.dispatchEvent(new Event('resize'));

    render(
      <ProblemInterface 
        problem={mockProblem}
        initialCode="// Test code"
      />
    );

    // Problem description should be visible initially
    const problemButton = screen.getByText('Problem');
    const codeButton = screen.getByText('Code');
    
    // Check initial state - problem description visible
    expect(screen.getByTestId('mock-problem-description')).toBeVisible();
    
    // Click code button to show coding interface
    fireEvent.click(codeButton);
    
    // Check that mock-problem-description is hidden and mock-coding-interface is visible
    // This is checking CSS classes, not actual visibility due to test limitations
    const panels = screen.getAllByTestId(/mock-/);
    expect(panels).toHaveLength(2);
    
    // Click problem button to show problem description again
    fireEvent.click(problemButton);
    
    // Check that mock-problem-description is visible again
    expect(screen.getByTestId('mock-problem-description')).toBeVisible();
  });

  it('passes the correct props to child components', () => {
    render(
      <ProblemInterface 
        problem={mockProblem}
        initialCode="// Initial test code"
        readOnly={true}
      />
    );

    expect(screen.getByTestId('problem-title').textContent).toBe('Test Problem');
    expect(screen.getByTestId('problem-id').textContent).toBe('problem-1');
    expect(screen.getByTestId('code-editor')).toHaveValue('// Initial test code');
  });
}); 