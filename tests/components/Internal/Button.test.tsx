// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '@/components/Internal/Button';
import { describe, it, expect } from 'vitest';

describe('Button Component', () => {
  it('should use title as aria-label when aria-label is missing', () => {
    render(<Button title="New Research" size="icon">Icon</Button>);
    const button = screen.getByRole('button', { name: 'New Research' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'New Research');
  });

  it('should prefer explicit aria-label over title', () => {
    render(<Button title="New Research" aria-label="Start New Research" size="icon">Icon</Button>);
    const button = screen.getByRole('button', { name: 'Start New Research' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Start New Research');
  });

  it('should not add aria-label if title is missing', () => {
    render(<Button size="icon">Icon</Button>);
    const button = screen.getByRole('button');
    expect(button).not.toHaveAttribute('aria-label');
  });

  it('should support button with text children and no title', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveAttribute('aria-label');
  });

  it('should support button with title and text children', () => {
    // If title is present, we currently set it as aria-label if one isn't provided.
    // This overrides the text content for accessible name calculation in most screen readers,
    // which is generally acceptable if the title provides more context, or redundant if same.
    render(<Button title="Submit Form">Submit</Button>);
    const button = screen.getByRole('button', { name: 'Submit Form' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Submit Form');
  });
});
