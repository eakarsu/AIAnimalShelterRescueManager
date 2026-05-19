import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AnimalsPage from './pages/AnimalsPage';
import KennelsPage from './pages/KennelsPage';
import MedicalPage from './pages/MedicalPage';
import BehavioralPage from './pages/BehavioralPage';
import AdoptionsPage from './pages/AdoptionsPage';
import ContractsPage from './pages/ContractsPage';
import FostersPage from './pages/FostersPage';
import VolunteersPage from './pages/VolunteersPage';
import DonationsPage from './pages/DonationsPage';
import InventoryPage from './pages/InventoryPage';
import LostFoundPage from './pages/LostFoundPage';
import StrayHoldsPage from './pages/StrayHoldsPage';
import EventsPage from './pages/EventsPage';
import MedicationsPage from './pages/MedicationsPage';
import QuarantinePage from './pages/QuarantinePage';
import AIToolsPage from './pages/AIToolsPage';
import AnimalDetail from './pages/AnimalDetail';
import CustomViewsPage from './pages/CustomViewsPage';
import './App.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/animals" element={<ProtectedRoute><AnimalsPage /></ProtectedRoute>} />
        <Route path="/animals/:id" element={<ProtectedRoute><AnimalDetail /></ProtectedRoute>} />
        <Route path="/kennels" element={<ProtectedRoute><KennelsPage /></ProtectedRoute>} />
        <Route path="/medical" element={<ProtectedRoute><MedicalPage /></ProtectedRoute>} />
        <Route path="/behavioral" element={<ProtectedRoute><BehavioralPage /></ProtectedRoute>} />
        <Route path="/adoptions" element={<ProtectedRoute><AdoptionsPage /></ProtectedRoute>} />
        <Route path="/contracts" element={<ProtectedRoute><ContractsPage /></ProtectedRoute>} />
        <Route path="/fosters" element={<ProtectedRoute><FostersPage /></ProtectedRoute>} />
        <Route path="/volunteers" element={<ProtectedRoute><VolunteersPage /></ProtectedRoute>} />
        <Route path="/donations" element={<ProtectedRoute><DonationsPage /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
        <Route path="/lostfound" element={<ProtectedRoute><LostFoundPage /></ProtectedRoute>} />
        <Route path="/strayholds" element={<ProtectedRoute><StrayHoldsPage /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
        <Route path="/medications" element={<ProtectedRoute><MedicationsPage /></ProtectedRoute>} />
        <Route path="/quarantine" element={<ProtectedRoute><QuarantinePage /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><AIToolsPage /></ProtectedRoute>} />
        <Route path="/custom-views" element={<ProtectedRoute><CustomViewsPage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
