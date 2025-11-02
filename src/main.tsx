import ReactDOM from "react-dom/client";
import "./index.css";
import { Toaster } from "@/components/ui/sonner";
import AppRouter from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <>
    <AppRouter />
    <Toaster />
  </> 
);