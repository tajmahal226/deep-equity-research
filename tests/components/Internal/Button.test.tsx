// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom matchers
import { Button } from '@/components/Internal/Button';
import { describe, it, expect } from 'vitest';

describe('Button Component', () => {
  it('should use title as aria-label when aria-label is missing', () => {
    render(<Button title="New Research" size="icon">Icon</Button>);

    // Attempt to find the button by its accessible name "New Research"
    // After the fix, this should SUCCEED
    const button = screen.getByRole('button', { name: 'New Research' });

    expect(button).toBeInTheDocument();
  });

  it('should prefer explicit aria-label over title', () => {
    render(<Button title="New Research" aria-label="Start New Research" size="icon">Icon</Button>);

    // If we provide an explicit aria-label, it should be used
    const button = screen.getByRole('button', { name: 'Start New Research' });
    expect(button).toBeInTheDocument();
  });
});
