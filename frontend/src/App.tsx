import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Unsafety } from "./pages/Unsafety";
import { Incidents } from "./pages/Incidents";
import { PTW } from "./pages/PTW";
import { Training } from "./pages/Training";
import { Audits } from "./pages/Audits";
import { Medical } from "./pages/Medical";
import { PPE } from "./pages/PPE";
import { RCA } from "./pages/RCA";
import { Environmental } from "./pages/Environmental";
import { Governance } from "./pages/Governance";
import { Settings } from "./pages/Settings";
//import SafetyChatPage from "./modules/safety-intelligence/pages/SafetyChatPage";

function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* PROTECTED */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/unsafety" element={<Unsafety />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/ptw" element={<PTW />} />
          <Route path="/training" element={<Training />} />
          <Route path="/audits" element={<Audits />} />
          <Route path="/medical" element={<Medical />} />
          <Route path="/ppe" element={<PPE />} />
          <Route path="/rca" element={<RCA />} />
          <Route path="/environmental" element={<Environmental />} />
          <Route path="/governance" element={<Governance />} />
          <Route path="/settings" element={<Settings />} />
          {/* <Route path="/safety-intelligence" element={<SafetyChatPage/>} /> */}

          {/* 👇 fallback ONLY for authenticated users */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}


export default App;
