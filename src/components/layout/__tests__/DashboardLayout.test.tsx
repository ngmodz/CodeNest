import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardLayout } from '../DashboardLayout';
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

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  })
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    aside: ({ children, ...props }: any) => <aside {...props}>{children}</aside>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => children
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </AuthProvider>
);

describe('DashboardLayout', () => {
  beforeEach(() => {
    // Mock window.innerWidth for responsive tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('renders dashboard layout with sidebar', () => {
    render(
      <TestWrapper>
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      </TestWrapper>
    );

    expect(screen.getByText('CodeNest')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Practice')).toBeInTheDocument();
  });

  it('shows mobile menu button on small screens', () => {
    // Mock mobile screen size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    render(
      <TestWrapper>
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      </TestWrapper>
    );

    const menuButton = screen.getByRole('button', { name: /menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it('opens and closes sidebar on mobile', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    render(
      <TestWrapper>
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      </TestWrapper>
    );

    // Find and click the mobile menu button
    const menuButtons = screen.getAllByRole('button');
    const mobileMenuButton = menuButtons.find(button => 
      button.querySelector('svg path[d*="M4 6h16M4 12h16M4 18h16"]')
    );
    
    expect(mobileMenuButton).toBeInTheDocument();
    
    if (mobileMenuButton) {
      fireEvent.click(mobileMenuButton);
      
      // Wait for sidebar to be visible
      await waitFor(() => {
        const sidebar = screen.getByRole('complementary') || screen.getByText('CodeNest').closest('aside');
        expect(sidebar).toBeInTheDocument();
      });
    }
  });

  it('displays user information in sidebar', () => {
    render(
      <TestWrapper>
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      </TestWrapper>
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText(/Intermediate • 5 day streak/)).toBeInTheDocument();
  });

  it('displays welcome message in header', () => {
    render(
      <TestWrapper>
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      </TestWrapper>
    );

    expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    expect(screen.getByText(/5 day streak • 150 XP/)).toBeInTheDocument();
  });

  it('handles sign out', async () => {
    const mockSignOut = jest.fn();
    
    // Override the mock for this test
    jest.doMock('@/context/AuthContext', () => ({
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
        signOut: mockSignOut
      })
    }));

    render(
      <TestWrapper>
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      </TestWrapper>
    );

    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  it('shows loading state when auth is loading', () => {
    // Override the mock for this test
    jest.doMock('@/context/AuthContext', () => ({
      ...jest.requireActual('@/context/AuthContext'),
      useAuth: () => ({
        user: null,
        loading: true,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signInWithGoogle: jest.fn(),
        signOut: jest.fn()
      })
    }));

    render(
      <TestWrapper>
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      </TestWrapper>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows authentication required when user is not logged in', () => {
    // Override the mock for this test
    jest.doMock('@/context/AuthContext', () => ({
      ...jest.requireActual('@/context/AuthContext'),
      useAuth: () => ({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signInWithGoogle: jest.fn(),
        signOut: jest.fn()
      })
    }));

    render(
      <TestWrapper>
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      </TestWrapper>
    );

    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText('Please sign in to access the dashboard.')).toBeInTheDocument();
  });
});