import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import Login from "@/pages/Login";
import Unsafety from "@/pages/Unsafety";
import ProtectedRoute from "@/components/ProtectedRoute";
import Chatbot from "./pages/Chatbot";
import Module2 from "./pages/Module2";
import Dashboard from "@/pages/Dashboard";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Protected Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard /> {/* Dashboard page */}
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/unsafety"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Unsafety /> {/* Safety Analysis */}
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/module2"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Module2 /> {/* Compliance Tracking */}
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/chatbot"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Chatbot /> {/* AI Assistant */}
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
