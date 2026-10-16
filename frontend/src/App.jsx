import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ThreatHunting from './pages/ThreatHunting';
import MitreMatrix from './pages/MitreMatrix';
import Cases from './pages/Cases';
import Timeline from './pages/Timeline';
import GlobalSearch from './pages/GlobalSearch';
import Reports from './pages/Reports';
import HostInvestigation from './pages/HostInvestigation';
import UserInvestigation from './pages/UserInvestigation';
import SplLibrary from './pages/SplLibrary';
import Findings from './pages/Findings';
import ProcessTree from './pages/ProcessTree';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('access_token');
  // Allow navigation for development/demo purposes even if no active token
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="hunt" element={<ThreatHunting />} />
          <Route path="mitre" element={<MitreMatrix />} />
          <Route path="cases" element={<Cases />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="search" element={<GlobalSearch />} />
          <Route path="reports" element={<Reports />} />
          <Route path="hosts" element={<HostInvestigation />} />
          <Route path="users" element={<UserInvestigation />} />
          <Route path="spl-library" element={<SplLibrary />} />
          <Route path="findings" element={<Findings />} />
          <Route path="processes" element={<ProcessTree />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
