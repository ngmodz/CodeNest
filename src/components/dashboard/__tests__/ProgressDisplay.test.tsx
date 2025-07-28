import { render, screen } from '@testing-library/react';
import { ProgressDisplay } from '../ProgressDisplay';
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
      streak: 7,
      lastActiveDate: '2024-01-01',
      totalXP: 150,
      solvedProblems: ['problem1', 'problem2', 'problem3', 'problem4', 'problem5', 'problem6', 'problem7', 'problem8', 'problem9', 'problem10']
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
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </AuthProvider>
);

describe('ProgressDisplay', () => {
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

  it('renders progress display component', () => {
    render(
      <TestWrapper>
        <ProgressDisplay />
      </TestWrapper>
    );

    expect(screen.getByText('Your Progress')).toBeInTheDocument();
    expect(screen.getByText('Intermediate Level')).toBeInTheDocument();
  });

  it('displays current streak', () => {
    render(
      <TestWrapper>
        <ProgressDisplay />
      </TestWrapper>
    );

    expect(screen.getByText('Current Streak')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('days in a row')).toBeInTheDocument();
  });

  it('displays problems solved count', () => {
    render(
      <TestWrapper>
        <ProgressDisplay />
      </TestWrapper>
    );

    expect(screen.getByText('Problems Solved')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('total completed')).toBeInTheDocument();
  });

  it('displays current level and XP progress', () => {
    render(
      <TestWrapper>
        <ProgressDisplay />
      </TestWrapper>
    );

    expect(screen.getByText('Current Level')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Level 2 (150 XP / 100 = 1.5, floor + 1 = 2)
    expect(screen.getByText('Level 2 Progress')).toBeInTheDocument();
    expect(screen.getByText('50/100 XP')).toBeInTheDocument(); // 150 % 100 = 50
  });

  it('shows achievement badges for qualified users', () => {
    render(
      <TestWrapper>
        <ProgressDisplay />
      </TestWrapper>
    );

    expect(screen.getByText('Recent Achievements')).toBeInTheDocument();
    expect(screen.getByText('Week Warrior')).toBeInTheDocument(); // 7+ day streak
    expect(screen.getByText('Problem Solver')).toBeInTheDocument(); // 10+ problems solved
  });

  it('shows loading state when profile is loading', () => {
    // Override the mock for this test
    jest.doMock('@/hooks/useProfile', () => ({
      useProfile: () => ({
        profile: null,
        loading: true,
        error: null,
        hasProfile: false,
        createProfile: jest.fn(),
        updateProfile: jest.fn(),
        refreshProfile: jest.fn()
      })
    }));

    render(
      <TestWrapper>
        <ProgressDisplay />
      </TestWrapper>
    );

    // Should show loading skeletons
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    render(
      <TestWrapper>
        <ProgressDisplay className="custom-class" />
      </TestWrapper>
    );

    const container = screen.getByText('Your Progress').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('formats last active date correctly', () => {
    render(
      <TestWrapper>
        <ProgressDisplay />
      </TestWrapper>
    );

    expect(screen.getByText('Last Active')).toBeInTheDocument();
    // The exact date format will depend on the current date and the mock date
    expect(screen.getByText('last practice session')).toBeInTheDocument();
  });

  it('shows XP needed for next level', () => {
    render(
      <TestWrapper>
        <ProgressDisplay />
      </TestWrapper>
    );

    expect(screen.getByText('50 XP needed for Level 3')).toBeInTheDocument();
  });
});