import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { Goals } from './pages/Goals';
import { Suspense, lazy } from 'react';
const Analytics = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));
const Investments = lazy(() => import('./pages/Investments').then(m => ({ default: m.Investments })));
const InvestmentDetail = lazy(() => import('./pages/InvestmentDetail').then(m => ({ default: m.InvestmentDetail })));
import { Settings } from './pages/Settings';

// Import glassmorphism styles
import './styles/glassmorphism.css';

function App() {
  try {
    return (
      <ThemeProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <AuthProvider>
            <Router>
            <ProtectedRoute>
              <AppLayout>
                <Suspense fallback={<div />}> 
                <Routes>
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/budgets" element={<Budgets />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/investments" element={<Investments />} />
                  <Route path="/investments/:symbol" element={<InvestmentDetail />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
                </Suspense>
              </AppLayout>
            </ProtectedRoute>
            </Router>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    );
  } catch (error) {
    console.error('App component error:', error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Application Error</h1>
        <p>There was an error loading the application. Check the console for details.</p>
        <pre>{String(error)}</pre>
      </div>
    );
  }
}

export default App;
