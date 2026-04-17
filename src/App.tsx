import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import SettingsPage from './pages/SettingsPage';
import Navbar from './ui/Navbar';
import HomePage from './pages/HomePage';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // EFECTO PARA SINCRONIZAR CON iOS
  useEffect(() => {
    const root = window.document.documentElement;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    // 1. Aplicamos la clase dark al HTML (raíz)
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 2. Actualizamos el color de la barra de estado de iOS
    // slate-50 es #f8fafc | slate-950 es #020617
    const color = isDarkMode ? '#020617' : '#f8fafc';
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', color);
    }
  }, [isDarkMode]);

  return (
    <Router>
      <div className="min-h-screen transition-colors duration-500 bg-slate-50 dark:bg-slate-950">
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        
        <main className={`
          min-h-screen transition-colors duration-500
          /* Usamos env(safe-area-inset) para evitar que el notch o la barra de iOS tapen nada */
          pt-[calc(2rem+env(safe-area-inset-top))] md:pt-32 
          pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-10
          
        `}>
          <div className="max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/rutas" element={<RutasPage />} />
              <Route path="/trenes" element={<TrenesPage />} />
              <Route 
                path="/ajustes" 
                element={<SettingsPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} 
              />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

const RutasPage = () => <div className="text-center dark:text-white">Página de Rutas</div>;
const TrenesPage = () => <div className="text-center dark:text-white">Página de Trenes</div>;

export default App;