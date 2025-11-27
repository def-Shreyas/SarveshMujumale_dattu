import ReactDOM from "react-dom/client";
import "./index.css";
import { Toaster } from "@/components/ui/sonner";
import AppRouter from "./App"; // This is your App.tsx file
import { AuthProvider } from "./contexts/AuthContext"; // 1. Import the AuthProvider
import { ApiUsageProvider } from "./contexts/ApiUsageContext"; // Import ApiUsageProvider
import { BrowserRouter } from "react-router-dom";    // 2. Import the Router

ReactDOM.createRoot(document.getElementById("root")!).render(
  <>
    {/* 3. Wrap everything in the Router first */}
    <BrowserRouter>
      {/* 4. Wrap your App and Toaster in the AuthProvider */}
      <AuthProvider>
        <ApiUsageProvider>
          <AppRouter />
          <Toaster />
        </ApiUsageProvider>
      </AuthProvider>
    </BrowserRouter>
  </>
);