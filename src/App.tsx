import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import Login from "@/pages/Login";
import Unsafety from "@/pages/Unsafety";
import ProtectedRoute from "@/components/ProtectedRoute";
import Chatbot from "./pages/Chatbot";
import Module2 from "./pages/Module2";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Protected Layout */}
        <Route
          path="/unsafety"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Unsafety /> {/* default page */}
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/module2"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Module2 /> {/* default page */}
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chatbot"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Chatbot /> {/* default page */}
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}