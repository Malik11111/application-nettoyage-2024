import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { useAppSelector } from './utils/hooks';
import { lightTheme, darkTheme } from './utils/themes';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard/SuperAdminDashboard';
import AgentDashboard from './pages/AgentDashboard/AgentDashboard';
import Users from './pages/Users/Users';
import Locations from './pages/Locations/Locations';
import Tasks from './pages/Tasks/Tasks';
import PlanningGenerator from './pages/PlanningGenerator/PlanningGenerator';

const AppContent: React.FC = () => {
  const { mode } = useAppSelector((state) => state.theme);
  const { user } = useAppSelector((state) => state.auth);
  const theme = mode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
          },
          success: {
            iconTheme: {
              primary: theme.palette.success.main,
              secondary: theme.palette.success.contrastText,
            },
          },
          error: {
            iconTheme: {
              primary: theme.palette.error.main,
              secondary: theme.palette.error.contrastText,
            },
          },
        }}
      />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <Layout>
                  <SuperAdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent"
            element={
              <ProtectedRoute roles={['AGENT']}>
                <Layout>
                  <AgentDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/locations"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Layout>
                  <Locations />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Layout>
                  <Tasks />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/planning-generator"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Layout>
                  <PlanningGenerator />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={
            !user ? <Navigate to="/login" replace /> :
            user?.role === 'AGENT' ? 
            <Navigate to="/agent" replace /> : 
            user?.role === 'SUPER_ADMIN' ?
            <Navigate to="/super-admin" replace /> :
            <Navigate to="/dashboard" replace />
          } />
          <Route path="*" element={
            !user ? <Navigate to="/login" replace /> :
            user?.role === 'AGENT' ? 
            <Navigate to="/agent" replace /> : 
            user?.role === 'SUPER_ADMIN' ?
            <Navigate to="/super-admin" replace /> :
            <Navigate to="/dashboard" replace />
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;