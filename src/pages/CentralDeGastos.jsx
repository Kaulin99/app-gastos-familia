import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../visuals/App.css';

function CentralDeGastos() {
  const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwkYpFeApzNcdaf9ae2vdX6idvkOCnFly2cUC7Oz0QxAEOzGNVQhIk8ls0-fpn53ZBElQ/exec";
  
  const [dados, setDados] = useState({ membros: [], locais: [], gastos: [] });
  const [status, setStatus] = useState('Carregando registros...');
  const [idEditando, setIdEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});

  const carregarDados = () => {
    setStatus('Sincronizando...');
    fetch(WEBHOOK_URL)
      .then(res => res.json())
      .then(data => {
        if (data && data.gastos) {
          // Inverte a ordem para que os últimos gastos apareçam no topo
          data.gastos.reverse();
          setDados(data);
        }
        setStatus('');
      })
      .catch(() => setStatus('Erro de conexão.'));
  };

  useEffect(() => { carregarDados(); }, []);

  // DELETE
  const handleExcluir = async (id) => {
    if (!window.confirm('Tem certeza que deseja apagar este registro?')) return;
    setStatus('Apagando linha...');
    
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ acao: 'excluir_gasto', id })
      });
      // Sincroniza a base para realinhar as chaves de ID após a exclusão
      setTimeout(carregarDados, 1500); 
    } catch (e) {
      setStatus('Erro ao excluir.');
    }
  };

  // UPDATE - Prepara o formulário
  const iniciarEdicao = (gasto) => {
    setIdEditando(gasto.id);
    let dataFormatada = gasto.data;
    try {
      const d = new Date(gasto.data);
      if (!isNaN(d.getTime())) dataFormatada = d.toISOString().split('T')[0];
    } catch(e) {}
    setFormEdit({ ...gasto, data: dataFormatada });
  };

  // UPDATE - Envia para o servidor
  const salvarEdicao = async (e) => {
    e.preventDefault();
    setStatus('Atualizando planilha...');
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ ...formEdit, acao: 'editar_gasto' })
      });
      setIdEditando(null);
      setTimeout(carregarDados, 1500);
    } catch (error) {
      setStatus('Erro ao salvar.');
    }
  };

  return (
    <div className="app-container">
      <div className="app-card" style={{ maxWidth: '600px' }}>
        <Link to="/" style={{ textDecoration: 'none', fontSize: '24px' }}>⬅️</Link>
        <h2>Histórico de Gastos 📋</h2>
        
        {status && <p className="status-message">{status}</p>}

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {dados.gastos.map(gasto => (
            <div key={gasto.id} style={{ border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '15px', background: 'var(--surface-soft)' }}>
              
              {/* MODO EDIÇÃO */}
              {idEditando === gasto.id ? (
                <form onSubmit={salvarEdicao} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input type="date" value={formEdit.data} onChange={e => setFormEdit({...formEdit, data: e.target.value})} className="form-group input" required />
                  
                  <select value={formEdit.quem} onChange={e => setFormEdit({...formEdit, quem: e.target.value})} className="form-group select" required>
                    {dados.membros.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  
                  <select value={formEdit.local} onChange={e => setFormEdit({...formEdit, local: e.target.value})} className="form-group select" required>
                    {dados.locais.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  
                  <input type="number" step="0.01" value={formEdit.valor} onChange={e => setFormEdit({...formEdit, valor: e.target.value})} className="form-group input" required />
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="submit" className="submit-button" style={{ flex: 1 }}>Salvar</button>
                    <button type="button" onClick={() => setIdEditando(null)} className="submit-button" style={{ flex: 1, backgroundColor: '#9e9e9e' }}>Cancelar</button>
                  </div>
                </form>
              ) : (
                
                /* MODO VISUALIZAÇÃO */
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '8px' }}>
                    <strong style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>R$ {parseFloat(gasto.valor || 0).toFixed(2)}</strong>
                    <span style={{ fontSize: '0.85rem', color: '#888' }}>
                      {new Date(gasto.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 5px', color: 'var(--text-h)' }}><strong>👤 Quem:</strong> {gasto.quem}</p>
                  <p style={{ margin: '0 0 10px', color: 'var(--text-h)' }}><strong>📍 Local:</strong> {gasto.local}</p>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => iniciarEdicao(gasto)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontWeight: 'bold' }}>
                      ✏️ Editar
                    </button>
                    <button onClick={() => handleExcluir(gasto.id)} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#ffebee', color: '#d32f2f', cursor: 'pointer' }}>
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {dados.gastos.length === 0 && !status && (
            <p style={{ textAlign: 'center', color: 'var(--text)' }}>Nenhum gasto registrado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CentralDeGastos;