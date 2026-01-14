import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Recrutement from './pages/Recrutement';
import ContratList from './pages/Contrats/ContratList';
import ContratDetail from './pages/Contrats/ContratDetail';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/candidats" element={<Recrutement />} />
              <Route path="/contrats" element={<ContratList />} />
              <Route path="/contrats/:id" element={<ContratDetail />} />
              <Route path="/contrats" element={<div className="font-bold text-gray-500 p-10">Module Contrats (À implémenter)</div>} />
              <Route path="/finance" element={<div className="font-bold text-gray-500 p-10">Module Finance (À implémenter)</div>} />
              <Route path="/qualite" element={<div className="font-bold text-gray-500 p-10">Module Qualité (À implémenter)</div>} />

              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
