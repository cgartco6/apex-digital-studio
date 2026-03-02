import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AIProvider } from './context/AIContext';
import { AddictionProvider } from './context/AddictionContext';
import GamificationOverlay from './components/gamification/GamificationOverlay';
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import VendorLayout from './layouts/VendorLayout';
import CreatorLayout from './layouts/CreatorLayout';

// Lazy loaded components
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

// Marketplace pages
const MarketplaceHome = lazy(() => import('./pages/marketplace/MarketplaceHome'));
const VendorRegistration = lazy(() => import('./pages/marketplace/VendorRegistration'));
const VendorDashboard = lazy(() => import('./pages/marketplace/VendorDashboard'));
const VendorListings = lazy(() => import('./pages/marketplace/VendorListings'));
const ListingDetail = lazy(() => import('./pages/marketplace/ListingDetail'));
const SearchResults = lazy(() => import('./pages/marketplace/SearchResults'));
const CategoryPage = lazy(() => import('./pages/marketplace/CategoryPage'));

// Creator pages
const CreatorDashboard = lazy(() => import('./pages/creator/CreatorDashboard'));
const CreatorCourseCreation = lazy(() => import('./pages/creator/CourseCreation'));
const CreatorDocumentCreation = lazy(() => import('./pages/creator/DocumentCreation'));
const CreatorProductManagement = lazy(() => import('./pages/creator/ProductManagement'));
const CourseLanding = lazy(() => import('./pages/CourseLanding'));
const CoursePlayer = lazy(() => import('./pages/CoursePlayer'));

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
              <AddictionProvider>
                <Router>
                  <div className="App">
                    <GamificationOverlay />
                    <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#363636', color: '#fff' } }} />
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
                          <Route path="course/:id" element={<CoursePlayer />} />
                          <Route path="course" element={<CourseLanding />} />
                          
                          {/* Marketplace routes */}
                          <Route path="marketplace" element={<MarketplaceHome />} />
                          <Route path="marketplace/search" element={<SearchResults />} />
                          <Route path="marketplace/category/:slug" element={<CategoryPage />} />
                          <Route path="marketplace/listing/:id" element={<ListingDetail />} />
                          <Route path="marketplace/store/:vendorId" element={<VendorStore />} />
                        </Route>

                        {/* Vendor Dashboard */}
                        <Route path="/marketplace/vendor" element={<VendorLayout />}>
                          <Route index element={<VendorDashboard />} />
                          <Route path="register" element={<VendorRegistration />} />
                          <Route path="listings" element={<VendorListings />} />
                          <Route path="listings/new" element={<CreateListing />} />
                          <Route path="listings/:id/edit" element={<EditListing />} />
                          <Route path="orders" element={<VendorOrders />} />
                          <Route path="payouts" element={<PayoutHistory />} />
                        </Route>

                        {/* Creator Dashboard */}
                        <Route path="/creator" element={<CreatorLayout />}>
                          <Route index element={<CreatorDashboard />} />
                          <Route path="course/new" element={<CreatorCourseCreation />} />
                          <Route path="document/new" element={<CreatorDocumentCreation />} />
                          <Route path="products" element={<CreatorProductManagement />} />
                          <Route path="analytics" element={<CreatorAnalytics />} />
                        </Route>

                        {/* Client Dashboard */}
                        <Route path="/dashboard" element={<DashboardLayout />}>
                          <Route index element={<ClientDashboard />} />
                          <Route path="orders" element={<Orders />} />
                          <Route path="design-projects" element={<DesignProjects />} />
                          <Route path="settings" element={<Settings />} />
                          <Route path="purchased-courses" element={<PurchasedCourses />} />
                        </Route>

                        {/* Admin Dashboard */}
                        <Route path="/admin" element={<AdminLayout />}>
                          <Route index element={<AdminDashboard />} />
                          <Route path="analytics" element={<AdminAnalytics />} />
                          <Route path="products" element={<AdminProducts />} />
                          <Route path="orders" element={<AdminOrders />} />
                          <Route path="users" element={<UserManagement />} />
                          <Route path="vendors" element={<VendorManagement />} />
                          <Route path="creators" element={<CreatorManagement />} />
                          <Route path="ai-agents" element={<AIAgentControl />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Suspense>
                  </div>
                </Router>
              </AddictionProvider>
            </AIProvider>
          </CartProvider>
        </AuthProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
