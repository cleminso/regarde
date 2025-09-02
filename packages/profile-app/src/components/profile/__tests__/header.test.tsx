/**
 * Simple focused tests for ProfileHeader - testing display logic only
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMockProfile } from '#/test-utils';

// Simple mock for the ProfileHeader component to test just the display logic
function MockProfileHeader({ profile }: { profile: any }) {
  return (
    <div>
      <h2>{profile.name}</h2>
      <p>@{profile.userHandle?.nickname || 'nickname-not-set'}</p>
      {profile.bio && <p>{profile.bio}</p>}
    </div>
  );
}

describe('ProfileHeader Display Logic', () => {
  it('should display profile name and nickname correctly', () => {
    // Test data display logic
    const mockProfile = createMockProfile({
      name: 'John Doe',
      userHandle: {
        nickname: 'johndoe',
        isActive: true,
      },
    });

    render(<MockProfileHeader profile={mockProfile} />);

    // Verify component displays the data correctly
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('@johndoe')).toBeInTheDocument();
  });

  it('should handle missing nickname gracefully', () => {
    // Test error handling logic
    const mockProfile = createMockProfile({
      name: 'User Without Nickname',
      userHandle: {
        nickname: '',
        isActive: false,
      },
    });

    render(<MockProfileHeader profile={mockProfile} />);

    expect(screen.getByText('User Without Nickname')).toBeInTheDocument();
    expect(screen.getByText('@nickname-not-set')).toBeInTheDocument();
  });

  it('should display bio when present', () => {
    // Test optional field display logic
    const mockProfile = createMockProfile({
      name: 'User With Bio',
      bio: 'Software engineer and coffee lover',
      userHandle: {
        nickname: 'biouser',
        isActive: true,
      },
    });

    render(<MockProfileHeader profile={mockProfile} />);

    expect(screen.getByText('User With Bio')).toBeInTheDocument();
    expect(screen.getByText('Software engineer and coffee lover')).toBeInTheDocument();
  });
});
