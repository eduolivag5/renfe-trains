import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import SettingsPage from './pages/SettingsPage';
import Navbar from './ui/Navbar';
import HomePage from './pages/HomePage';
import MapsPage from './pages/MapsPage';

// Componente Wrapper para detectar la ruta actual
function AppContent({ isDarkMode, toggleTheme }: { isDarkMode: boolean, toggleTheme: () => void }) {
  const location = useLocation();
  const isMapPath = location.pathname === '/mapa';

  return (
    <div className="relative min-h-screen transition-colors duration-500 bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      
      {/* CAPA DEL MAPA: Siempre montada para carga instantánea */}
      <div 
        className={`fixed inset-0 z-0 transition-opacity duration-300 ease-linear ${
          isMapPath ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <MapsPage isDarkMode={isDarkMode} />
      </div>

      {/* CAPA DE CONTENIDO: Contiene las rutas normales */}
      <main className={`
        relative z-10 min-h-screen transition-all duration-500
        pt-[calc(2rem+env(safe-area-inset-top))] md:pt-32 
        pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-10
        ${isMapPath ? 'pointer-events-none opacity-0' : 'opacity-100'}
      `}>
        <div className="px-6 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* Ruta vacía para que el router no de 404 al estar en /mapa */}
            <Route path="/mapa" element={<div />} /> 
            <Route path="/trenes" element={<TrenesPage />} />
            <Route 
              path="/ajustes" 
              element={<SettingsPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} 
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    const root = window.document.documentElement;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const color = isDarkMode ? '#020617' : '#f8fafc';
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', color);
    }
  }, [isDarkMode]);

  return (
    <Router>
      <AppContent isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
    </Router>
  );
}

const TrenesPage = () => <div className="text-center dark:text-white pt-20">Página de Trenes</div>;

export default App;