import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';

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
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
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

describe('ThemeToggle', () => {
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

  it('renders theme toggle button', () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  it('shows sun icon in light mode', () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );

    const sunIcon = screen.getByRole('button').querySelector('svg path[fill-rule="evenodd"]');
    expect(sunIcon).toBeInTheDocument();
  });

  it('toggles theme when clicked', () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    
    // Initially in light mode
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    
    // Click to toggle to dark mode
    fireEvent.click(button);
    
    // Should now show switch to light mode
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
  });

  it('applies custom className', () => {
    render(
      <TestWrapper>
        <ThemeToggle className="custom-class" />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button.getAttribute('aria-label')).toMatch(/Switch to (light|dark) mode/);
  });
});