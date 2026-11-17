import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useLayoutEffect, useMemo, useRef, lazy, Suspense } from 'react';
import SettingsPage from './pages/SettingsPage';
import Navbar from './ui/Navbar';
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
import TrainsPage from './pages/TrainsPage';
import AlertsPage from './pages/AlertsPage';
import { useSmoothWheelScroll } from './hooks/useSmoothWheelScroll';
import { clearPrefs, getPref, setPref, systemPrefersDark } from './utils/preferences';

// El mapa (d3 + geometría) va en su propio chunk: solo se descarga al abrir /mapa
const MapsPage = lazy(() => import('./pages/MapsPage'));

function AppContent({ isDarkMode, toggleTheme, resetPreferences }: { isDarkMode: boolean; toggleTheme: () => void; resetPreferences: () => void }) {
  const location = useLocation();
  const isMapPath = useMemo(() => location.pathname === '/mapa', [location.pathname]);
  const isHome = useMemo(() => location.pathname === '/', [location.pathname]);

  // El scroll de la app vive en <main> (no en window), así que el navegador no lo reinicia al navegar.
  // Al cambiar de página volvemos arriba antes del pintado (sin ver la página nueva a media altura).
  // Solo depende del pathname: cambiar parámetros (p. ej. el día en /buscar) conserva la posición.
  const mainRef = useRef<HTMLElement>(null);
  // Rueda del ratón: desplazamiento suave en lugar de saltos (no en el mapa, que usa la rueda para el zoom)
  useSmoothWheelScroll(mainRef, !isMapPath);
  useLayoutEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="relative h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      
      {/* En escritorio se reserva el ancho del rail lateral (88px) */}
      <div className="relative h-full w-full flex flex-col md:pl-[88px]">
        {/* Capa del Mapa */}
        {/* Solo se monta en /mapa: fuera de esa ruta no consume CPU ni hace peticiones */}
        {isMapPath && (
          <div className="absolute inset-0 md:left-[88px] z-0 animate-[fadeIn_0.4s_ease-out]">
            <Suspense fallback={null}>
              <MapsPage isDarkMode={isDarkMode} />
            </Suspense>
          </div>
        )}

        {/* Contenido Principal */}
        <main ref={mainRef} className={`relative z-10 h-full overflow-y-auto overflow-x-hidden transition-opacity duration-500 ${isMapPath ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* Quitamos el padding global aquí y lo manejamos por ruta */}
          <div className={`w-full mx-auto ${isHome ? '' : 'px-page max-w-page pt-10 md:pt-14 pb-28 md:pb-10'}`}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/mapa" element={null} /> 
              <Route path="/ajustes" element={<SettingsPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} onReset={resetPreferences} />} />
              <Route path="/trenes" element={<TrainsPage />} />
              <Route path="/buscar" element={<SearchResultsPage />} />
              <Route path="/avisos" element={<AlertsPage />} />
              {/* Dirección antigua: redirige conservando los filtros (?nucleo=…) */}
              <Route path="/alertas" element={<Navigate to={{ pathname: '/avisos', search: location.search }} replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  // Tema guardado por el visitante o, si no eligió ninguno, el del sistema
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = getPref('theme');
    return saved ? saved === 'dark' : systemPrefersDark();
  });

  const toggleTheme = () => {
    const next = !isDarkMode;
    setPref('theme', next ? 'dark' : 'light');
    setIsDarkMode(next);
  };

  /** Restablece todas las preferencias (el tema vuelve a seguir al sistema) */
  const resetPreferences = () => {
    clearPrefs();
    setIsDarkMode(systemPrefersDark());
  };

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
      <AppContent isDarkMode={isDarkMode} toggleTheme={toggleTheme} resetPreferences={resetPreferences} />
    </Router>
  );
}

export default App;