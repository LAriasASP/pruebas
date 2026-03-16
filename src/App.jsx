import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AgendaModule from './pages/AgendaModule';
import LoginPage from './pages/LoginPage';
import { RoleProvider } from './context/RoleContext';
import { AgendaProvider } from './context/AgendaContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const AppLayout = () => (
  <div className="flex min-h-screen bg-background text-primary">
    <Sidebar />

    <main className="flex-1 lg:ml-72 p-4 md:p-8 lg:p-12 min-w-0 pt-20 lg:pt-12">
      <Outlet />
    </main>
  </div>
);

const ProtectedRoute = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <AppLayout />;
};

const PublicOnlyRoute = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <LoginPage />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicOnlyRoute />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<AgendaModule />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <AgendaProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AgendaProvider>
      </RoleProvider>
    </AuthProvider>
  );
}

export default App;
