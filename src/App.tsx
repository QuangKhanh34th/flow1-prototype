import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CustomerFrontpage } from "./pages/CustomerFrontpage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { CustomerCommissionsPage } from "./pages/CustomerCommissionsPage";
import { StaffLayout } from "./pages/staff/StaffLayout";
import { StaffLoginPage } from "./pages/staff/StaffLoginPage";
import { OrdersManagementPage } from "./pages/staff/OrdersManagementPage";
import { DesignRequestsPage } from "./pages/staff/DesignRequestsPage";
import { DesignerWorkspacePage } from "./pages/staff/DesignerWorkspacePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Storefront (Flow 1) */}
        <Route path="/" element={<CustomerFrontpage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* Customer Custom Character Commissions (Flow 3) */}
        <Route path="/commissions" element={<CustomerCommissionsPage />} />

        {/* Internal Staff & Designer Portal (Flow 1 & Flow 3) */}
        <Route path="/dashboard/staff/login" element={<StaffLoginPage />} />
        <Route path="/dashboard/staff" element={<StaffLayout />}>
          <Route index element={<DesignRequestsPage />} />
          <Route path="orders" element={<OrdersManagementPage />} />
          <Route path="designs" element={<DesignRequestsPage />} />
          <Route path="designer" element={<DesignerWorkspacePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}