/**
 * React testing utilities with Jazz context
 * Focused on testing component logic, not Jazz internals
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router';

// Mock Jazz hooks for testing component logic
export const mockJazzHooks = {
  useAccount: () => ({
    me: {
      id: 'test-account-id',
      profile: {
        'regarde.bio': 'test-profile-id',
      },
    },
  }),
  useCoState: (id: string) => {
    // Return mock profile data for testing components
    if (id === 'test-profile-id') {
      return {
        id: 'test-profile-id',
        name: 'Test User',
        bio: 'Test bio',
        userHandle: {
          nickname: 'testuser',
          isActive: true,
        },
        projects: [
          {
            title: 'Test Project',
            year: '2024',
            description: 'A test project',
          },
        ],
        workExp: [
          {
            title: 'Test Engineer',
            company: 'Test Corp',
            from: '2020',
            description: 'Test work experience',
          },
        ],
        socialLinks: {
          github: 'https://github.com/testuser',
          website: 'https://testuser.dev',
        },
        version: 1,
      };
    }
    return null;
  },
  useIsAuthenticated: () => true,
};

// Custom render function with Router context
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

// Helper to create mock profile data for testing
export function createMockProfile(overrides = {}) {
  return {
    id: 'test-profile-id',
    name: 'Test User',
    bio: 'Test bio',
    userHandle: {
      nickname: 'testuser',
      isActive: true,
      registeredAt: Date.now(),
      lastModified: Date.now(),
    },
    projects: [],
    workExp: [],
    socialLinks: {},
    version: 1,
    ...overrides,
  };
}

// Helper to create mock account data
export function createMockAccount(overrides = {}) {
  return {
    id: 'test-account-id',
    me: {
      id: 'test-account-id',
      profile: {
        'regarde.bio': 'test-profile-id',
      },
    },
    ...overrides,
  };
}
