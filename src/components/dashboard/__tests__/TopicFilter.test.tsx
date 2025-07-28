import { render, screen, fireEvent } from '@testing-library/react';
import { TopicFilter } from '../TopicFilter';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

// Mock the hooks
jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: {
      uid: 'test-uid',
      level: 'Intermediate',
      preferredLanguage: 'Python',
      theme: 'light',
      streak: 5,
      lastActiveDate: '2024-01-01',
      totalXP: 150,
      solvedProblems: ['problem1', 'problem2']
    },
    loading: false,
    error: null,
    hasProfile: true,
    createProfile: jest.fn(),
    updateProfile: jest.fn(),
    refreshProfile: jest.fn()
  })
}));

jest.mock('@/context/AuthContext', () => ({
  ...jest.requireActual('@/context/AuthContext'),
  useAuth: () => ({
    user: {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User'
    },
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signInWithGoogle: jest.fn(),
    signOut: jest.fn()
  })
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  }
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </AuthProvider>
);

describe('TopicFilter', () => {
  beforeEach(() => {
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Mock document.documentElement
    Object.defineProperty(document, 'documentElement', {
      writable: true,
      value: {
        classList: {
          remove: jest.fn(),
          add: jest.fn(),
        },
      },
    });
  });

  it('renders topic filter component', () => {
    render(
      <TestWrapper>
        <TopicFilter />
      </TestWrapper>
    );

    expect(screen.getByText('Practice Topics')).toBeInTheDocument();
    expect(screen.getByText('Filter by Difficulty')).toBeInTheDocument();
    expect(screen.getByText('Available Topics for Intermediate Level')).toBeInTheDocument();
  });

  it('shows difficulty filter buttons', () => {
    render(
      <TestWrapper>
        <TopicFilter />
      </TestWrapper>
    );

    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('shows topics appropriate for intermediate level', () => {
    render(
      <TestWrapper>
        <TopicFilter />
      </TestWrapper>
    );

    // Should show beginner and intermediate topics
    expect(screen.getByText('Loops')).toBeInTheDocument();
    expect(screen.getByText('Strings')).toBeInTheDocument();
    expect(screen.getByText('Recursion')).toBeInTheDocument();
    expect(screen.getByText('Dictionaries')).toBeInTheDocument();
  });

  it('handles difficulty selection', () => {
    const mockOnDifficultySelect = jest.fn();
    
    render(
      <TestWrapper>
        <TopicFilter onDifficultySelect={mockOnDifficultySelect} />
      </TestWrapper>
    );

    const basicButton = screen.getByText('Basic');
    fireEvent.click(basicButton);

    expect(mockOnDifficultySelect).toHaveBeenCalledWith('Basic');
  });

  it('handles topic selection', () => {
    const mockOnTopicSelect = jest.fn();
    
    render(
      <TestWrapper>
        <TopicFilter onTopicSelect={mockOnTopicSelect} />
      </TestWrapper>
    );

    const loopsButton = screen.getByText('Loops');
    fireEvent.click(loopsButton);

    expect(mockOnTopicSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'loops',
        name: 'Loops',
        skillLevel: 'Beginner'
      })
    );
  });

  it('shows active filters when selections are made', () => {
    render(
      <TestWrapper>
        <TopicFilter />
      </TestWrapper>
    );

    // Select a difficulty
    const basicButton = screen.getByText('Basic');
    fireEvent.click(basicButton);

    // Select a topic
    const loopsButton = screen.getByText('Loops');
    fireEvent.click(loopsButton);

    // Should show active filters
    expect(screen.getByText('Active Filters:')).toBeInTheDocument();
    expect(screen.getByText('Topic: Loops')).toBeInTheDocument();
    expect(screen.getByText('Difficulty: Basic')).toBeInTheDocument();
  });

  it('toggles selections when clicked again', () => {
    const mockOnDifficultySelect = jest.fn();
    
    render(
      <TestWrapper>
        <TopicFilter onDifficultySelect={mockOnDifficultySelect} />
      </TestWrapper>
    );

    const basicButton = screen.getByText('Basic');
    
    // First click - select
    fireEvent.click(basicButton);
    expect(mockOnDifficultySelect).toHaveBeenCalledWith('Basic');

    // Second click - deselect
    fireEvent.click(basicButton);
    expect(mockOnDifficultySelect).toHaveBeenCalledWith(null);
  });

  it('applies custom className', () => {
    render(
      <TestWrapper>
        <TopicFilter className="custom-class" />
      </TestWrapper>
    );

    const container = screen.getByText('Practice Topics').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('shows problem counts for topics', () => {
    render(
      <TestWrapper>
        <TopicFilter />
      </TestWrapper>
    );

    expect(screen.getByText('15 problems')).toBeInTheDocument(); // Loops
    expect(screen.getByText('12 problems')).toBeInTheDocument(); // Strings
  });
});