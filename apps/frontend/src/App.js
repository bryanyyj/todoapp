import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Layout from './components/Layout';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';

// Pages
import Dashboard from './pages/Dashboard';
import Modules from './pages/Modules';
import Chat from './pages/Chat';
import Library from './pages/Library';
import Quiz from './pages/Quiz';
import MasteryMap from './pages/MasteryMap';
import Planner from './pages/Planner';

const queryClient = new QueryClient();

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background text-foreground">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={
                <PublicRoute>
                  <div className="flex justify-center items-center min-h-screen">
                    <LoginForm />
                  </div>
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <div className="flex justify-center items-center min-h-screen">
                    <RegisterForm />
                  </div>
                </PublicRoute>
              } />
              
              {/* Private Routes */}
              <Route path="/" element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }>
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="modules" element={<Modules />} />
                <Route path="chat" element={<Chat />} />
                <Route path="library" element={<Library />} />
                <Route path="quiz" element={<Quiz />} />
                <Route path="mastery" element={<MasteryMap />} />
                <Route path="planner" element={<Planner />} />
              </Route>
            </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;