import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExecutionResult from '../ExecutionResult';
import { TestResult } from '@/types';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
  };
});

describe('ExecutionResult Component', () => {
  const passedTestResult: TestResult = {
    passed: true,
    input: '1 2',
    expectedOutput: '3',
    actualOutput: '3',
    executionTime: 10,
    memoryUsage: 1024,
  };

  const failedTestResult: TestResult = {
    passed: false,
    input: '1 2',
    expectedOutput: '3',
    actualOutput: '4',
    executionTime: 15,
    memoryUsage: 2048,
    error: 'Wrong answer'
  };

  it('shows summary with all passed tests', () => {
    render(<ExecutionResult results={[passedTestResult, passedTestResult]} />);
    
    expect(screen.getByText('All Tests Passed')).toBeInTheDocument();
    expect(screen.getByText('2 of 2 tests passing')).toBeInTheDocument();
  });

  it('shows summary with failed tests', () => {
    render(<ExecutionResult results={[passedTestResult, failedTestResult]} />);
    
    expect(screen.getByText('Some Tests Failed')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 tests passing')).toBeInTheDocument();
  });

  it('displays execution time and memory usage', () => {
    render(
      <ExecutionResult
        results={[passedTestResult]}
        executionTime={20}
        memoryUsage={3072}
      />
    );
    
    expect(screen.getByText(/Execution Time: 20.00ms/)).toBeInTheDocument();
    expect(screen.getByText(/Memory Usage: 3.00 KB/)).toBeInTheDocument();
  });

  it('displays submission status when isSubmission is true', () => {
    render(
      <ExecutionResult
        results={[passedTestResult]}
        status="Accepted"
        isSubmission={true}
      />
    );
    
    expect(screen.getByText('Accepted')).toBeInTheDocument();
  });

  it('shows detailed test results and allows expanding/collapsing', () => {
    render(<ExecutionResult results={[passedTestResult, failedTestResult]} />);
    
    // Check if both test cases are displayed
    expect(screen.getByText('Test Case 1: Passed')).toBeInTheDocument();
    expect(screen.getByText('Test Case 2: Failed')).toBeInTheDocument();
    
    // Failed test should automatically be expanded with error message
    expect(screen.getByText('Wrong answer')).toBeInTheDocument();
    
    // Test expanding/collapsing
    const passedTestHeader = screen.getByText('Test Case 1: Passed');
    fireEvent.click(passedTestHeader);
    
    // After clicking, the passed test should be expanded
    expect(screen.getAllByText('Output:')).toHaveLength(1);
  });
}); 