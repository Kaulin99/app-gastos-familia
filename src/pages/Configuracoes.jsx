import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../visuals/App.css';

function Configuracoes() {
  const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwkYpFeApzNcdaf9ae2vdX6idvkOCnFly2cUC7Oz0QxAEOzGNVQhIk8ls0-fpn53ZBElQ/exec";
  const [listas, setListas] = useState({ membros: [], locais: [] });
  const [item, setItem] = useState({ nome: '', tipo: 'membro' });
  const [status, setStatus] = useState('');

  const carregarDados = () => {
    fetch(WEBHOOK_URL)
      .then(res => res.json())
      .then(data => {
        if (data && data.membros) setListas(data);
      })
      .catch(err => console.error("Erro ao carregar dados:", err));
  };

  useEffect(() => carregarDados(), []);

  const handleSalvar = async (e) => {
    e.preventDefault();
    setStatus('Salvando...');
    const acao = item.tipo === 'membro' ? 'add_membro' : 'add_local';
    
    try {
      await fetch(WEBHOOK_URL, { 
        method: 'POST', 
        mode: 'no-cors', 
        body: JSON.stringify({ acao, nome: item.nome }) 
      });
      setItem({ ...item, nome: '' });
      setStatus('Adicionado! Atualizando lista...');
      setTimeout(() => {
        carregarDados();
        setStatus('');
      }, 1500);
    } catch (error) {
      setStatus('Erro ao salvar.');
    }
  };

  const handleExcluir = async (nome, tipo) => {
    const acao = tipo === 'membro' ? 'del_membro' : 'del_local';
    if (!window.confirm(`Excluir ${nome}?`)) return;

    await fetch(WEBHOOK_URL, { 
      method: 'POST', 
      mode: 'no-cors', 
      body: JSON.stringify({ acao, nome }) 
    });
    setTimeout(carregarDados, 1000);
  };

  return (
    <div className="app-container">
      <div className="app-card">
        <Link to="/" style={{ textDecoration: 'none', fontSize: '24px' }}>⬅️</Link>
        <h2>Gerenciar Listas ⚙️</h2>
        
        <form onSubmit={handleSalvar} className="app-form">
          <div className="form-group">
            <label>Tipo</label>
            <select value={item.tipo} onChange={e => setItem({...item, tipo: e.target.value})}>
              <option value="membro">Pessoa</option>
              <option value="local">Local</option>
            </select>
          </div>
          <div className="form-group">
            <label>Nome</label>
            <input value={item.nome} onChange={e => setItem({...item, nome: e.target.value})} placeholder="Ex: Mercado ou Nome" required />
          </div>
          <button type="submit" className="submit-button">Adicionar</button>
        </form>

        {status && <p className="status-message success">{status}</p>}

        <div style={{marginTop: '25px', textAlign: 'left', borderTop: '1px solid #eee', paddingTop: '10px'}}>
          <h4 style={{color: 'var(--accent)'}}>Família:</h4>
          {(listas.membros || []).map(m => (
            <div key={m} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', background: '#f9f9f9', padding: '8px', borderRadius: '8px'}}>
              <span>{m}</span>
              <button onClick={() => handleExcluir(m, 'membro')} style={{border: 'none', background: 'none', cursor: 'pointer'}}>🗑️</button>
            </div>
          ))}

          <h4 style={{color: 'var(--accent)', marginTop: '20px'}}>Locais:</h4>
          {(listas.locais || []).map(l => (
            <div key={l} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', background: '#f9f9f9', padding: '8px', borderRadius: '8px'}}>
              <span>{l}</span>
              <button onClick={() => handleExcluir(l, 'local')} style={{border: 'none', background: 'none', cursor: 'pointer'}}>🗑️</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Configuracoes;