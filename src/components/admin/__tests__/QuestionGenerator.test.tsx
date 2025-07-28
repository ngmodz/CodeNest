import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestionGenerator } from '../QuestionGenerator';

// Mock Firebase auth
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn(() => Promise.resolve('mock-token'))
    }
  }
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test-user' }
  })
}));

// Mock fetch
global.fetch = jest.fn();

describe('QuestionGenerator', () => {
  const mockOnQuestionGenerated = jest.fn();
  const mockOnSwitchToPreview = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders generator form correctly', () => {
    render(
      <QuestionGenerator
        onQuestionGenerated={mockOnQuestionGenerated}
        onSwitchToPreview={mockOnSwitchToPreview}
      />
    );

    expect(screen.getByText('AI Question Generator')).toBeInTheDocument();
    expect(screen.getByText('Difficulty Level')).toBeInTheDocument();
    expect(screen.getByText('Topic')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate question/i })).toBeInTheDocument();
  });

  it('allows selecting different difficulty levels', () => {
    render(
      <QuestionGenerator
        onQuestionGenerated={mockOnQuestionGenerated}
        onSwitchToPreview={mockOnSwitchToPreview}
      />
    );

    const intermediateButton = screen.getByText('Intermediate');
    fireEvent.click(intermediateButton);

    // Topic should change to Recursion (first topic for Intermediate)
    expect(screen.getByDisplayValue('Recursion')).toBeInTheDocument();
  });

  it('updates topic when difficulty changes', () => {
    render(
      <QuestionGenerator
        onQuestionGenerated={mockOnQuestionGenerated}
        onSwitchToPreview={mockOnSwitchToPreview}
      />
    );

    // Start with Beginner (should show Loops)
    expect(screen.getByDisplayValue('Loops')).toBeInTheDocument();

    // Switch to Advanced
    const advancedButton = screen.getByText('Advanced');
    fireEvent.click(advancedButton);

    // Should now show Trees (first Advanced topic)
    expect(screen.getByDisplayValue('Trees')).toBeInTheDocument();
  });

  it('submits form and calls API successfully', async () => {
    const mockResponse = {
      success: true,
      question: {
        title: 'Test Question',
        description: 'Test description',
        difficulty: 'Basic',
        topic: 'Arrays',
        examples: [],
        constraints: [],
        testCases: []
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    render(
      <QuestionGenerator
        onQuestionGenerated={mockOnQuestionGenerated}
        onSwitchToPreview={mockOnSwitchToPreview}
      />
    );

    const generateButton = screen.getByRole('button', { name: /generate question/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/generateQuestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          userLevel: 'Beginner',
          topic: 'Loops',
          previousProblems: []
        })
      });
    });

    expect(mockOnQuestionGenerated).toHaveBeenCalledWith(mockResponse.question);
    expect(mockOnSwitchToPreview).toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(
      <QuestionGenerator
        onQuestionGenerated={mockOnQuestionGenerated}
        onSwitchToPreview={mockOnSwitchToPreview}
      />
    );

    const generateButton = screen.getByRole('button', { name: /generate question/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Generation Error/i)).toBeInTheDocument();
      expect(screen.getByText(/API Error/i)).toBeInTheDocument();
    });

    expect(mockOnQuestionGenerated).not.toHaveBeenCalled();
    expect(mockOnSwitchToPreview).not.toHaveBeenCalled();
  });

  it('parses previous problems correctly', async () => {
    const mockResponse = {
      success: true,
      question: {
        title: 'Test Question',
        description: 'Test description',
        difficulty: 'Basic',
        topic: 'Arrays',
        examples: [],
        constraints: [],
        testCases: []
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    render(
      <QuestionGenerator
        onQuestionGenerated={mockOnQuestionGenerated}
        onSwitchToPreview={mockOnSwitchToPreview}
      />
    );

    // Add previous problems
    const textArea = screen.getByPlaceholderText(/Enter problem titles/i);
    fireEvent.change(textArea, {
      target: { value: 'Two Sum\nReverse String\nValid Parentheses' }
    });

    const generateButton = screen.getByRole('button', { name: /generate question/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/generateQuestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          userLevel: 'Beginner',
          topic: 'Loops',
          previousProblems: ['Two Sum', 'Reverse String', 'Valid Parentheses']
        })
      });
    });
  });

  it('shows loading state during generation', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, question: {} })
      }), 100))
    );

    render(
      <QuestionGenerator
        onQuestionGenerated={mockOnQuestionGenerated}
        onSwitchToPreview={mockOnSwitchToPreview}
      />
    );

    const generateButton = screen.getByRole('button', { name: /generate question/i });
    fireEvent.click(generateButton);

    expect(screen.getByRole('button', { name: /generating question/i })).toBeInTheDocument();
    expect(generateButton).toBeDisabled();
  });
});
