// App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/ClientMorales";
import History from "./pages/History";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Clients from "./pages/ClientsPhysiques";
import Alerts from "./pages/Alerts";
// Redirects unauthenticated users -> login
// Redirects authenticated users -> dashboard
function CatchAllRedirect() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard/clients-morales" replace /> : <Navigate to="/login" replace />;
}

// Redirect wrapper for public pages
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard/clients-morales" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes but blocked if logged in */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <Signup />
              </PublicOnlyRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard/clients-morales" index element={<Dashboard />} />
            <Route path="dashboard/clients-physiques" index element={<Clients />} />
            <Route path="history" element={<History />} />
            <Route path="dashboard/alerts" element={<Alerts />} />
          </Route>

          {/* Catch-all for everything else */}
          <Route path="*" element={<CatchAllRedirect />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
