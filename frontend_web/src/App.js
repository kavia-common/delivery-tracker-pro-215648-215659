import React, { useEffect, useState } from 'react';
import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './hooks/useAuth';
import Navbar from './components/Navbar';

import Dashboard from './pages/Dashboard';
import History from './pages/History';
import DeliveryDetails from './pages/DeliveryDetails';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';

// PUBLIC_INTERFACE
function App() {
  /**
   * PUBLIC_INTERFACE
   * Root application component: sets theme, mounts router and auth provider.
   */
  const [theme, setTheme] = useState('light');

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <Navbar />
          <main style={{ padding: 16 }}>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/deliveries/:id"
                element={
                  <ProtectedRoute>
                    <DeliveryDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
            </Routes>
          </main>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
