import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import AppShell from './components/layout/AppShell';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppProvider>
          <AppShell />
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
