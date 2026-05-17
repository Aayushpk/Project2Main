import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Forecasting from './pages/admin/Forecasting';
import Reports from './pages/admin/Reports';
import SupplierDashboard from './pages/supplier/SupplierDashboard';
import ReorderRequests from './pages/supplier/ReorderRequests';
import ProductsSupplied from './pages/supplier/ProductsSupplied';
import ClientDashboard from './pages/client/ClientDashboard';
import ProductCatalogue from './pages/client/ProductCatalogue';
import MyRequests from './pages/client/MyRequests';
import Cart from './pages/client/Cart';
import MyOrders from './pages/client/MyOrders';
import OrderManagement from './pages/admin/OrderManagement';
import ReorderManagement from './pages/admin/ReorderManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes */}
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="forecasting" element={<Forecasting />} />
          <Route path="reports" element={<Reports />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="reorders" element={<ReorderManagement />} />
        </Route>

        {/* Supplier Routes */}
        <Route path="/supplier" element={
          <ProtectedRoute allowedRoles={['supplier']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<SupplierDashboard />} />
          <Route path="reorder-requests" element={<ReorderRequests />} />
          <Route path="products-supplied" element={<ProductsSupplied />} />
        </Route>

        {/* Client Routes */}
        <Route path="/client" element={
          <ProtectedRoute allowedRoles={['client']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<ClientDashboard />} />
          <Route path="catalogue" element={<ProductCatalogue />} />
          <Route path="cart" element={<Cart />} />
          <Route path="orders" element={<MyOrders />} />
          <Route path="my-requests" element={<MyRequests />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
