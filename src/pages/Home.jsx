// src/pages/Home.jsx
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="app-container">
      <div className="app-card">
        <h2>Bem-vindo(a) 🏠</h2>
        <p className="app-subtitle">O que você deseja fazer hoje?</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
          
          <Link to="/novo-custo" className="submit-button" style={{ textAlign: 'center', textDecoration: 'none' }}>
            ➕ Adicionar Custo
          </Link>

          <Link to="/dashboard" className="submit-button" style={{ textAlign: 'center', textDecoration: 'none', backgroundColor: '#2196F3', color: 'white' }}>
            📊 Ver Resumo
          </Link>

         <Link to="/central-de-gastos" className="submit-button" style={{ textAlign: 'center', textDecoration: 'none', backgroundColor: '#9C27B0', color: 'white' }}>
           📋 Histórico de Gastos
         </Link>

         <Link to="/configuracoes" className="submit-button" style={{ textAlign: 'center', textDecoration: 'none', backgroundColor: 'var(--border)', color: 'var(--text-h)' }}>
            ⚙️ Configurações
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;