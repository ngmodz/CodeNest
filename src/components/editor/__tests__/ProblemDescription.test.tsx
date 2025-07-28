import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProblemDescription from '../ProblemDescription';
import { CodingProblem } from '@/types';

describe('ProblemDescription Component', () => {
  const mockProblem: CodingProblem = {
    id: 'problem-1',
    title: 'Test Problem',
    description: 'This is a test problem description with multiple lines.\nIt should preserve line breaks.',
    difficulty: 'Basic',
    topic: 'Arrays',
    examples: [
      {
        input: 'input example 1',
        output: 'output example 1',
        explanation: 'This is an explanation'
      },
      {
        input: 'input example 2',
        output: 'output example 2'
      }
    ],
    constraints: ['constraint 1', 'constraint 2'],
    testCases: [],
    isAI: false,
    createdAt: new Date().toISOString()
  };

  it('renders the problem title and description', () => {
    render(<ProblemDescription problem={mockProblem} />);
    
    expect(screen.getByText('Test Problem')).toBeInTheDocument();
    expect(screen.getByText(/This is a test problem description/)).toBeInTheDocument();
  });

  it('displays difficulty and topic tags', () => {
    render(<ProblemDescription problem={mockProblem} />);
    
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Arrays')).toBeInTheDocument();
  });

  it('renders constraints section', () => {
    render(<ProblemDescription problem={mockProblem} />);
    
    expect(screen.getByText('Constraints')).toBeInTheDocument();
    expect(screen.getByText('constraint 1')).toBeInTheDocument();
    expect(screen.getByText('constraint 2')).toBeInTheDocument();
  });

  it('renders examples with input, output and explanation', () => {
    render(<ProblemDescription problem={mockProblem} />);
    
    expect(screen.getByText('Examples')).toBeInTheDocument();
    expect(screen.getByText('Example 1')).toBeInTheDocument();
    expect(screen.getByText('Example 2')).toBeInTheDocument();
    
    expect(screen.getByText('input example 1')).toBeInTheDocument();
    expect(screen.getByText('output example 1')).toBeInTheDocument();
    expect(screen.getByText('This is an explanation')).toBeInTheDocument();
    
    expect(screen.getByText('input example 2')).toBeInTheDocument();
    expect(screen.getByText('output example 2')).toBeInTheDocument();
  });

  it('handles problems without constraints', () => {
    const problemWithoutConstraints = {
      ...mockProblem,
      constraints: []
    };
    
    render(<ProblemDescription problem={problemWithoutConstraints} />);
    
    expect(screen.queryByText('Constraints')).not.toBeInTheDocument();
  });

  it('handles problems without examples', () => {
    const problemWithoutExamples = {
      ...mockProblem,
      examples: []
    };
    
    render(<ProblemDescription problem={problemWithoutExamples} />);
    
    expect(screen.queryByText('Examples')).not.toBeInTheDocument();
  });
}); 