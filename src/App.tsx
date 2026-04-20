import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import SettingsPage from './pages/SettingsPage';
import Navbar from './ui/Navbar';
import HomePage from './pages/HomePage';
import MapsPage from './pages/MapsPage';

function AppContent({ isDarkMode, toggleTheme }: { isDarkMode: boolean, toggleTheme: () => void }) {
  const location = useLocation();
  const isMapPath = useMemo(() => location.pathname === '/mapa', [location.pathname]);

  return (
    <div className="relative h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      
      <div className="relative h-full w-full flex flex-col">
        {/* Capa del Mapa */}
        <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${isMapPath ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <MapsPage isDarkMode={isDarkMode} />
        </div>

        {/* Contenido Principal */}
        <main className={`relative z-10 h-full overflow-y-auto transition-all duration-500 ${isMapPath ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="px-6 max-w-7xl mx-auto w-full pt-24 pb-28 md:pb-10">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/mapa" element={null} /> 
              <Route path="/trenes" element={<TrenesPage />} />
              <Route path="/ajustes" element={<SettingsPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    const color = isDarkMode ? '#020617' : '#f8fafc';
    metaThemeColor.setAttribute('content', color);
  }, [isDarkMode]);

  return (
    <Router>
      <AppContent isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
    </Router>
  );
}

const TrenesPage = () => <div className="text-center dark:text-white pt-20">Página de Trenes</div>;

export default App;