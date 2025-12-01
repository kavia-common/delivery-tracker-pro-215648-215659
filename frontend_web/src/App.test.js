import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app navbar branding', () => {
  render(<App />);
  const brand = screen.getByText(/Delivery Tracker/i);
  expect(brand).toBeInTheDocument();
});
