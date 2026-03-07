import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import HomePage from "../pages/HomePage";
import RegisterPage from "../pages/RegisterPage";
import LoginPage from "../pages/LoginPage";
import AdminDashboard from "../pages/AdminDashboard";
import PartnerDashboard from "../pages/PartnerDashboard";
import UsersPage from "../pages/UsersPage";
import PaymentRequestsPage from "../pages/PaymentRequestsPage";
import MyProfitPage from "../pages/MyProfitPage";
import StockPage from "../pages/StockPage";
import SalesPage from "../pages/SalesPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="Admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute role="Admin">
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stocks"
          element={
            <ProtectedRoute role="Admin">
              <StockPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sales"
          element={
            <ProtectedRoute role="Admin">
              <SalesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payment-requests"
          element={
            <ProtectedRoute role="Admin">
              <PaymentRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner"
          element={
            <ProtectedRoute role="Partner">
              <PartnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/my-profit"
          element={
            <ProtectedRoute role="Partner">
              <MyProfitPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
