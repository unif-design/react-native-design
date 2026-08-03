import { render, screen } from '@testing-library/react-native';
import App from '../App';

test('挂载 Design runtime placeholder', () => {
  render(<App />);

  expect(screen.getByText('Design Showcase')).toBeOnTheScreen();
});
