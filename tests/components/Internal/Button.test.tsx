import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '@/components/Internal/Button';
import { describe, it, expect } from 'vitest';

describe('Button Component', () => {
  it('should use title as aria-label when aria-label is missing', () => {
    render(<Button title="New Research" size="icon">Icon</Button>);

    // After the fix, the button should have an accessible name from the title prop
    const button = screen.getByRole('button', { name: 'New Research' });

    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'New Research');
  });

  it('should prefer explicit aria-label over title', () => {
    render(<Button title="New Research" aria-label="Start New Research" size="icon">Icon</Button>);

    // If we provide an explicit aria-label, it should be used instead of title
    const button = screen.getByRole('button', { name: 'Start New Research' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Start New Research');
  });

  it('should not add aria-label when button has no title prop', () => {
    render(<Button size="icon">Icon</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveAttribute('aria-label');
  });

  it('should work with text children without title prop', () => {
    render(<Button>Submit</Button>);

    // Button with text children should be accessible by its text content
    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveAttribute('aria-label');
  });

  it('should have aria-label from title even when button has text children', () => {
    render(<Button title="Submit form">Submit</Button>);

    // When both title and text children exist, aria-label from title takes precedence
    const button = screen.getByRole('button', { name: 'Submit form' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Submit form');
  });
});
