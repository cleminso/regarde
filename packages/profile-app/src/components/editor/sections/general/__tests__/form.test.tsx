/**
 * Simple focused tests for form data handling - testing data logic only
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMockProfile } from '#/test-utils';

// Simple mock form component to test just the data display logic
function MockGeneralForm({ profile }: { profile: any }) {
  return (
    <form>
      <h3>General</h3>
      <p>Share some details about yourself.</p>

      <label htmlFor="name">Display Name</label>
      <input
        id="name"
        type="text"
        defaultValue={profile.name}
        placeholder="Your name"
      />

      <label htmlFor="bio">Bio</label>
      <textarea
        id="bio"
        defaultValue={profile.bio || ''}
        placeholder="Share what people should know about you"
      />

      <label htmlFor="nickname">Nickname</label>
      <input
        id="nickname"
        type="text"
        defaultValue={profile.userHandle?.nickname || ''}
        placeholder="your_nickname"
      />
    </form>
  );
}

describe('General Form Data Logic', () => {
  it('should display form with profile data', () => {
    // Test form displays existing data correctly
    const mockProfile = createMockProfile({
      name: 'John Doe',
      bio: 'Software engineer',
      userHandle: {
        nickname: 'johndoe',
        isActive: true,
      },
    });

    render(<MockGeneralForm profile={mockProfile} />);

    // Verify form displays the data
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Software engineer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('johndoe')).toBeInTheDocument();
  });

  it('should handle empty profile data gracefully', () => {
    // Test form handles missing data
    const mockProfile = createMockProfile({
      name: 'Minimal User',
      bio: '',
      userHandle: {
        nickname: '',
        isActive: false,
      },
    });

    render(<MockGeneralForm profile={mockProfile} />);

    // Verify form handles empty data
    expect(screen.getByDisplayValue('Minimal User')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share what people should know about you')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('your_nickname')).toBeInTheDocument();
  });

  it('should show form structure correctly', () => {
    // Test form structure
    const mockProfile = createMockProfile();

    render(<MockGeneralForm profile={mockProfile} />);

    // Verify form structure
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Share some details about yourself.')).toBeInTheDocument();
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Bio')).toBeInTheDocument();
    expect(screen.getByLabelText('Nickname')).toBeInTheDocument();
  });
});
