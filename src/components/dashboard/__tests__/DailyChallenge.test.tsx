import { render, screen } from '@testing-library/react';
import { DailyChallenge } from '../DailyChallenge';
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

describe('DailyChallenge', () => {
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

  it('renders daily challenge component', () => {
    render(
      <TestWrapper>
        <DailyChallenge />
      </TestWrapper>
    );

    expect(screen.getByText('Daily Challenge')).toBeInTheDocument();
    expect(screen.getByText('Start Challenge')).toBeInTheDocument();
  });

  it('shows intermediate level challenge for intermediate user', () => {
    render(
      <TestWrapper>
        <DailyChallenge />
      </TestWrapper>
    );

    expect(screen.getByText('Find Missing Number')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('+25 XP')).toBeInTheDocument();
  });

  it('displays challenge details', () => {
    render(
      <TestWrapper>
        <DailyChallenge />
      </TestWrapper>
    );

    expect(screen.getByText(/Given an array containing n distinct numbers/)).toBeInTheDocument();
    expect(screen.getByText('15-20 minutes')).toBeInTheDocument();
    expect(screen.getByText('Arrays')).toBeInTheDocument();
  });

  it('shows streak information', () => {
    render(
      <TestWrapper>
        <DailyChallenge />
      </TestWrapper>
    );

    expect(screen.getByText(/Complete today's challenge to maintain your 5 day streak!/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <TestWrapper>
        <DailyChallenge className="custom-class" />
      </TestWrapper>
    );

    const container = screen.getByText('Daily Challenge').closest('div');
    expect(container).toHaveClass('custom-class');
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
        <DailyChallenge />
      </TestWrapper>
    );

    // Should show loading skeletons
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});