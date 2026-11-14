import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import SettingsPage from './pages/SettingsPage';
import Navbar from './ui/Navbar';
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
import TrainsPage from './pages/TrainsPage';

// El mapa (d3 + geometría) va en su propio chunk: solo se descarga al abrir /mapa
const MapsPage = lazy(() => import('./pages/MapsPage'));

function AppContent({ isDarkMode, toggleTheme }: { isDarkMode: boolean, toggleTheme: () => void }) {
  const location = useLocation();
  const isMapPath = useMemo(() => location.pathname === '/mapa', [location.pathname]);
  const isHome = useMemo(() => location.pathname === '/', [location.pathname]);

  return (
    <div className="relative h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      
      <div className="relative h-full w-full flex flex-col">
        {/* Capa del Mapa */}
        {/* Solo se monta en /mapa: fuera de esa ruta no consume CPU ni hace peticiones */}
        {isMapPath && (
          <div className="absolute inset-0 z-0 animate-[fadeIn_0.4s_ease-out]">
            <Suspense fallback={null}>
              <MapsPage isDarkMode={isDarkMode} />
            </Suspense>
          </div>
        )}

        {/* Contenido Principal */}
        <main className={`relative z-10 h-full overflow-y-auto transition-all duration-500 ${isMapPath ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* Quitamos el padding global aquí y lo manejamos por ruta */}
          <div className={`w-full mx-auto ${isHome ? '' : 'px-6 max-w-7xl pt-10 md:pt-24 pb-28 md:pb-10'}`}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/mapa" element={null} /> 
              <Route path="/ajustes" element={<SettingsPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
              <Route path="/trenes" element={<TrainsPage />} />
              <Route path="/buscar" element={<SearchResultsPage />} />
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

export default App;