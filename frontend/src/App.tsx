// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from "./layouts/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import Login from './pages/Login'; // Import your Login page
import { ProtectedRoute } from './components/ProtectedRoute'; // Import your gatekeeper
import { Incidents } from "./pages/Incidents";
import { PTW } from "./pages/PTW";
import { Training } from "./pages/Training";
import { Audits } from "./pages/Audits";
import { Medical } from "./pages/Medical";
import { PPE } from "./pages/PPE";
import { RCA } from "./pages/RCA";
import { Environmental } from "./pages/Environmental";
import { Governance } from "./pages/Governance";
import { SettingsPage } from "./pages/Settings";
import { Unsafety } from './pages/Unsafety';

// Import other pages
// import { Incidents } from "./pages/Incidents"; 
// import { PTW } from "./pages/PTW";

function App() {
  return (
      <Routes>
        {/* --- PUBLIC ROUTE --- */}
        <Route path="/login" element={<Login />} />

        {/* --- PROTECTED ROUTES --- */}
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
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* --- CATCH-ALL REDIRECT --- */}
        {/* If user types any other URL, send them to the dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
}

export default App;