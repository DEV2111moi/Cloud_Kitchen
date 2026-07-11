import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import PublicLayout from './components/layout/PublicLayout';
import CookLayout from './components/layout/CookLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import HomeCookListPage from './pages/homeCooks/HomeCookListPage';
import CustomerListPage from './pages/customers/CustomerListPage';
import DeliveryPartnerListPage from './pages/deliveryPartners/DeliveryPartnerListPage';

// Public Pages
import PublicLandingPage from './pages/public/PublicLandingPage';
import PublicMenuPage from './pages/public/PublicMenuPage';
import PublicRegisterCookPage from './pages/public/PublicRegisterCookPage';

// Cook Pages
import CookDashboardPage from './pages/cook/CookDashboardPage';
import CookOrdersPage from './pages/cook/CookOrdersPage';
import CookMenuPage from './pages/cook/CookMenuPage';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Guest route wrapper (redirect to dashboard if already logged in)
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'homecook' ? '/cook' : '/admin'} replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<PublicLandingPage />} />
            <Route path="/menu" element={<PublicMenuPage />} />
            <Route path="/register-cook" element={<PublicRegisterCookPage />} />
          </Route>

          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="home-cooks" element={<HomeCookListPage />} />
            <Route path="customers" element={<CustomerListPage />} />
            <Route path="delivery-partners" element={<DeliveryPartnerListPage />} />
          </Route>

          {/* Protected Home Cook Routes */}
          <Route
            path="/cook"
            element={
              <ProtectedRoute>
                <CookLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CookDashboardPage />} />
            <Route path="orders" element={<CookOrdersPage />} />
            <Route path="menu" element={<CookMenuPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#0f172a',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
            padding: '12px 16px',
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
