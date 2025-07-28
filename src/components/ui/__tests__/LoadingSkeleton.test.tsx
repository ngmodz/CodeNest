import { render, screen } from '@testing-library/react';
import { LoadingSkeleton, CardSkeleton, DashboardSkeleton } from '../LoadingSkeleton';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

describe('LoadingSkeleton', () => {
  it('renders basic skeleton with default props', () => {
    render(<LoadingSkeleton />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('animate-pulse', 'bg-gray-200', 'dark:bg-gray-700', 'rounded', 'h-4');
  });

  it('renders with custom className', () => {
    render(<LoadingSkeleton className="custom-class" />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('custom-class');
  });

  it('renders card variant', () => {
    render(<LoadingSkeleton variant="card" />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('h-32');
  });

  it('renders avatar variant', () => {
    render(<LoadingSkeleton variant="avatar" />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('h-10', 'w-10', 'rounded-full');
  });

  it('renders button variant', () => {
    render(<LoadingSkeleton variant="button" />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('h-10');
  });

  it('renders multiple lines for text variant', () => {
    render(<LoadingSkeleton variant="text" lines={3} />);
    
    const container = screen.getByRole('generic');
    const lines = container.querySelectorAll('div');
    expect(lines).toHaveLength(3);
  });

  it('makes last line shorter when multiple lines', () => {
    render(<LoadingSkeleton variant="text" lines={2} />);
    
    const container = screen.getByRole('generic');
    const lines = container.querySelectorAll('div');
    
    // Last line should have 75% width
    expect(lines[1]).toHaveStyle('width: 75%');
  });
});

describe('CardSkeleton', () => {
  it('renders card skeleton structure', () => {
    render(<CardSkeleton />);
    
    const card = screen.getByRole('generic');
    expect(card).toHaveClass('p-6', 'border', 'border-gray-200', 'dark:border-gray-700', 'rounded-lg');
  });

  it('applies custom className', () => {
    render(<CardSkeleton className="custom-card" />);
    
    const card = screen.getByRole('generic');
    expect(card).toHaveClass('custom-card');
  });
});

describe('DashboardSkeleton', () => {
  it('renders dashboard skeleton structure', () => {
    render(<DashboardSkeleton />);
    
    const dashboard = screen.getByRole('generic');
    expect(dashboard).toHaveClass('space-y-6');
  });

  it('renders header section', () => {
    render(<DashboardSkeleton />);
    
    // Should have header with title and avatar
    const skeletons = screen.getAllByRole('generic');
    expect(skeletons.length).toBeGreaterThan(1);
  });

  it('renders stats cards section', () => {
    render(<DashboardSkeleton />);
    
    // Should render 3 card skeletons for stats
    const dashboard = screen.getByRole('generic');
    const gridSection = dashboard.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
    expect(gridSection).toBeInTheDocument();
  });

  it('renders main content section', () => {
    render(<DashboardSkeleton />);
    
    // Should render main content grid
    const dashboard = screen.getByRole('generic');
    const mainGrid = dashboard.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2');
    expect(mainGrid).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<DashboardSkeleton className="custom-dashboard" />);
    
    const dashboard = screen.getByRole('generic');
    expect(dashboard).toHaveClass('custom-dashboard');
  });
});