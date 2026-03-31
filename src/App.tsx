import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ClientProvider } from '@/context/ClientContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { Sidebar } from '@/components/ui-custom/Sidebar';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Clients } from '@/pages/Clients';
import { AddClient } from '@/pages/AddClient';
import { ClientDetail } from '@/pages/ClientDetail';
import './App.css';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B3A3E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1EEBBA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="pt-16 lg:pt-0">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B3A3E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1EEBBA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <PrivateRoute>
            <Clients />
          </PrivateRoute>
        }
      />
      <Route
        path="/add-client"
        element={
          <PrivateRoute>
            <AddClient />
          </PrivateRoute>
        }
      />
      <Route
        path="/client/:id"
        element={
          <PrivateRoute>
            <ClientDetail />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ClientProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ClientProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
