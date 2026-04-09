import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('react-router-dom', () => {
  const React = require('react');

  return {
    BrowserRouter: ({ children }) => React.createElement(React.Fragment, null, children),
    Routes: ({ children }) => React.createElement(React.Fragment, null, children),
    Route: ({ path, element }) => {
      const currentPath = globalThis.location?.pathname || '/';
      return currentPath === path ? element : null;
    },
    NavLink: ({ children, to, className }) =>
      React.createElement('a', { href: to, className }, children),
    useNavigate: () => jest.fn(),
    Navigate: ({ to }) => React.createElement('span', null, to),
    Link: ({ children, to }) => React.createElement('a', { href: to }, children),
  };
}, { virtual: true });

test('renders login screen', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
});
