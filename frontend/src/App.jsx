import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Forecasting from './pages/Forecasting';

const ProtectedLayout = () => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? <Layout /> : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="forecasting" element={<Forecasting />} />
          {/* Mock routes for UI completeness */}
          <Route path="warehouses" element={<div className="p-8"><h1 className="text-2xl font-bold">Warehouses (Placeholder)</h1></div>} />
          <Route path="reports" element={<div className="p-8"><h1 className="text-2xl font-bold">Reports (Placeholder)</h1></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
