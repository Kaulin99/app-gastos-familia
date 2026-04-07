import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import NovoCusto from './pages/NovoCusto';
import Configuracoes from './pages/Configuracoes';
import Dashboard from './pages/Dashboard';
import './visuals/App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/novo-custo" element={<NovoCusto />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;