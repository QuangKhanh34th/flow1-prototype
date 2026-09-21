import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CustomerFrontpage } from './pages/CustomerFrontpage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
// Future imports:
import { CheckoutPage } from './pages/CheckoutPage';
// import { StaffDashboard } from './pages/StaffDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Storefront */}
        <Route path="/" element={<CustomerFrontpage />} />
        
        {/* Product Detail (The :id allows dynamic routing later) */}
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        
        {/* Future Screens */}
        <Route path="/checkout" element={<CheckoutPage />} />
        {/* <Route path="/staff" element={<StaffDashboard />} /> */}
      </Routes>
    </BrowserRouter>
  );
}