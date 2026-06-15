import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders button content', () => {
    render(<Button>Launch</Button>);

    expect(screen.getByRole('button', { name: 'Launch' })).toBeInTheDocument();
  });
});
