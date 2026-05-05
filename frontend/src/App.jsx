import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Forecasting from './pages/Forecasting';
import Reports from './pages/Reports';
import SupplierDashboard from './pages/SupplierDashboard';
import ReorderRequests from './pages/ReorderRequests';
import ProductsSupplied from './pages/ProductsSupplied';
import ClientDashboard from './pages/ClientDashboard';
import ProductCatalogue from './pages/ProductCatalogue';
import MyRequests from './pages/MyRequests';

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
          <Route path="warehouses" element={<div className="p-8"><h1 className="text-2xl font-bold">Warehouses (Placeholder)</h1></div>} />
          <Route path="reports" element={<Reports />} />
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
          <Route path="my-requests" element={<MyRequests />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
