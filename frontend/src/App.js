import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import GamificationOverlay from './components/gamification/GamificationOverlay';
import { AddictionProvider } from './context/AddictionContext';
import CourseLanding from './pages/CourseLanding';
import ReferralDashboard from './pages/ReferralDashboard';

// Add to routes
<Route path="/course" element={<CourseLanding />} />
<Route path="/referral" element={<ReferralDashboard />} />

// Wrap the entire app with AddictionProvider
function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<Loading />} persistor={persistor}>
        <AuthProvider>
          <CartProvider>
            <AIProvider>
              <AddictionProvider>  {/* Add this */}
                <Router>
                  <div className="App">
                    <GamificationOverlay />  {/* Add this */}
                    <Toaster />
                    {/* ... rest of the code ... */}
                  </div>
                </Router>
              </AddictionProvider>  {/* Add this */}
            </AIProvider>
          </CartProvider>
        </AuthProvider>
      </PersistGate>
    </Provider>
  );
}

// Redux store
import { store, persistor } from './redux/store';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AIProvider } from './context/AIContext';

// Layout Components
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';

// Lazy loaded components for code splitting
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ClientDashboard = lazy(() => import('./pages/dashboard/ClientDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));
const AIDesignStudio = lazy(() => import('./pages/AIDesignStudio'));
const Orders = lazy(() => import('./pages/dashboard/Orders'));
const DesignProjects = lazy(() => import('./pages/dashboard/DesignProjects'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));

// Loading component
const Loading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<Loading />} persistor={persistor}>
        <AuthProvider>
          <CartProvider>
            <AIProvider>
              <Router>
                <div className="App">
                  <Toaster 
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#363636',
                        color: '#fff',
                      },
                    }}
                  />
                  <Suspense fallback={<Loading />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<MainLayout />}>
                        <Route index element={<Home />} />
                        <Route path="products" element={<Products />} />
                        <Route path="products/:id" element={<ProductDetail />} />
                        <Route path="cart" element={<Cart />} />
                        <Route path="checkout" element={<Checkout />} />
                        <Route path="login" element={<Login />} />
                        <Route path="register" element={<Register />} />
                        <Route path="ai-design-studio" element={<AIDesignStudio />} />
                      </Route>

                      {/* Client Dashboard Routes */}
                      <Route path="/dashboard" element={<DashboardLayout />}>
                        <Route index element={<ClientDashboard />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="design-projects" element={<DesignProjects />} />
                        <Route path="settings" element={<Settings />} />
                      </Route>

                      {/* Admin Dashboard Routes */}
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="analytics" element={<div>Analytics</div>} />
                        <Route path="products" element={<div>Products</div>} />
                        <Route path="orders" element={<div>Orders</div>} />
                        <Route path="users" element={<div>Users</div>} />
                        <Route path="ai-agents" element={<div>AIAgents</div>} />
                      </Route>

                      {/* 404 Route */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </div>
              </Router>
            </AIProvider>
          </CartProvider>
        </AuthProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
