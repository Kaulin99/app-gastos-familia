import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../visuals/App.css';

function CentralDeGastos() {
  const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwkYpFeApzNcdaf9ae2vdX6idvkOCnFly2cUC7Oz0QxAEOzGNVQhIk8ls0-fpn53ZBElQ/exec";
  
  const [dados, setDados] = useState({ gastos: [], membros: [], locais: [] });
  const [status, setStatus] = useState('Carregando registros...');
  
  // Estados para Filtros
  const [filtros, setFiltros] = useState({ mes: '', quem: '', local: '' });

  // Estados para Edição e Encerramento
  const [idEncerrando, setIdEncerrando] = useState(null);
  const [dataFimInput, setDataFimInput] = useState('');
  
  const [idEditando, setIdEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});

  const carregarDados = () => {
    setStatus('Sincronizando...');
    fetch(WEBHOOK_URL)
      .then(res => res.json())
      .then(data => {
        if (data && data.gastos) {
          data.gastos.reverse(); // Mais novos primeiro
          setDados(data);
        }
        setStatus('');
      })
      .catch(() => setStatus('Erro de conexão.'));
  };

  useEffect(() => { carregarDados(); }, []);

  // --- FUNÇÕES DE CRUD ---

  const handleExcluir = async (id) => {
    if (!window.confirm('Tem certeza que deseja apagar este registro definitivamente?')) return;
    setStatus('Apagando...');
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify({ acao: 'excluir_gasto', id })
      });
      setTimeout(carregarDados, 1500); 
    } catch (e) {
      setStatus('Erro ao excluir.');
    }
  };

  const salvarEncerramento = async (e, id) => {
    e.preventDefault();
    if (!dataFimInput) return;
    setStatus('Encerrando assinatura...');
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify({ acao: 'encerrar_recorrente', id, data_fim: dataFimInput })
      });
      setIdEncerrando(null);
      setDataFimInput('');
      setTimeout(carregarDados, 1500);
    } catch (error) {
      setStatus('Erro ao encerrar.');
    }
  };

  const iniciarEdicao = (gasto) => {
    setIdEditando(gasto.id);
    setIdEncerrando(null); // Fecha a lixeira se estiver aberta
    
    // Formata a data para o padrão do input type="date"
    let dataFormatada = gasto.data;
    try {
      const d = new Date(gasto.data);
      if (!isNaN(d.getTime())) dataFormatada = d.toISOString().split('T')[0];
    } catch(e) {}

    setFormEdit({ ...gasto, data: dataFormatada });
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    setStatus('Atualizando registro...');
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify({ ...formEdit, acao: 'editar_gasto' })
      });
      setIdEditando(null);
      setTimeout(carregarDados, 1500);
    } catch (error) {
      setStatus('Erro ao salvar edição.');
    }
  };

  // --- MOTOR DE FILTROS ---

  const gastosFiltrados = dados.gastos.filter(gasto => {
    let passa = true;
    
    if (filtros.quem && gasto.quem !== filtros.quem) passa = false;
    if (filtros.local && gasto.local !== filtros.local) passa = false;
    
    // Filtro de Mês/Ano
    if (filtros.mes) {
      try {
        const d = new Date(gasto.data);
        const mesAnoGasto = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (mesAnoGasto !== filtros.mes) passa = false;
      } catch (e) {
        passa = false;
      }
    }
    
    return passa;
  });

  // Função para limpar filtros
  const limparFiltros = () => setFiltros({ mes: '', quem: '', local: '' });

  const formatarData = (dataString) => {
    try {
      const d = new Date(dataString);
      return new Date(d.getTime() + d.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR');
    } catch { return dataString; }
  };

  return (
    <div className="app-container">
      <div className="app-card" style={{ maxWidth: '600px' }}>
        <Link to="/" style={{ textDecoration: 'none', fontSize: '24px' }}>⬅️</Link>
        <h2>Central Administrativa 📋</h2>
        
        {status && <p className="status-message">{status}</p>}

        {/* ÁREA DE FILTROS */}
        <div style={{ background: 'var(--surface-soft)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-muted)', marginTop: '20px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px', color: 'var(--text-h)' }}>Filtros</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            
            <input 
              type="month" 
              value={filtros.mes} 
              onChange={e => setFiltros({...filtros, mes: e.target.value})} 
              className="form-group input" 
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            
            <select value={filtros.quem} onChange={e => setFiltros({...filtros, quem: e.target.value})} className="form-group select">
              <option value="">Todas as pessoas</option>
              {(dados.membros || []).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            
            <select value={filtros.local} onChange={e => setFiltros({...filtros, local: e.target.value})} className="form-group select" style={{ gridColumn: 'span 2' }}>
              <option value="">Todos os locais</option>
              {(dados.locais || []).map(l => <option key={l} value={l}>{l}</option>)}
            </select>

          </div>
          
          {(filtros.mes || filtros.quem || filtros.local) && (
            <button onClick={limparFiltros} style={{ marginTop: '10px', width: '100%', padding: '8px', background: '#ffebee', color: '#d32f2f', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Limpar Filtros
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {gastosFiltrados.map(gasto => (
            <div key={gasto.id} style={{ 
              border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '15px', background: 'var(--surface)',
              borderLeft: gasto.tipo === 'Recorrente' ? '5px solid #2196F3' : gasto.tipo === 'Parcelado' ? '5px solid #FF9800' : '5px solid #4CAF50'
            }}>
              
              {/* === MODO DE EDIÇÃO === */}
              {idEditando === gasto.id ? (
                <form onSubmit={salvarEdicao} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={{ margin: '0', color: 'var(--accent)' }}>Editando Gasto</h4>
                  
                  <input type="date" value={formEdit.data} onChange={e => setFormEdit({...formEdit, data: e.target.value})} className="form-group input" required />
                  
                  <select value={formEdit.quem} onChange={e => setFormEdit({...formEdit, quem: e.target.value})} className="form-group select" required>
                    {(dados.membros || []).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  
                  <select value={formEdit.local} onChange={e => setFormEdit({...formEdit, local: e.target.value})} className="form-group select" required>
                    {(dados.locais || []).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>

                  <select value={formEdit.tipo} onChange={e => setFormEdit({...formEdit, tipo: e.target.value})} className="form-group select" required>
                    <option value="Normal">Normal</option>
                    <option value="Parcelado">Parcelado</option>
                    <option value="Recorrente">Recorrente</option>
                  </select>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="number" step="0.01" value={formEdit.valor} onChange={e => setFormEdit({...formEdit, valor: e.target.value})} className="form-group input" style={{ flex: 2 }} required />
                    
                    {formEdit.tipo === 'Parcelado' && (
                      <input type="number" value={formEdit.parcelas} onChange={e => setFormEdit({...formEdit, parcelas: e.target.value})} className="form-group input" style={{ flex: 1 }} placeholder="Qtd" required />
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="submit" className="submit-button" style={{ flex: 1, padding: '10px' }}>Salvar</button>
                    <button type="button" onClick={() => setIdEditando(null)} className="submit-button" style={{ flex: 1, padding: '10px', backgroundColor: '#9e9e9e' }}>Cancelar</button>
                  </div>
                </form>
              ) : (
                
                /* === MODO DE VISUALIZAÇÃO === */
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px', marginBottom: '8px' }}>
                    <strong style={{ color: 'var(--text-h)', fontSize: '1.2rem' }}>
                      R$ {parseFloat(gasto.valor || 0).toFixed(2)}
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: '#888', fontWeight: 'bold' }}>
                      {gasto.tipo.toUpperCase()}
                    </span>
                  </div>
                  
                  <p style={{ margin: '0 0 5px', color: 'var(--text-h)' }}><strong>📍 Local:</strong> {gasto.local}</p>
                  <p style={{ margin: '0 0 5px', color: 'var(--text-h)' }}><strong>👤 Quem:</strong> {gasto.quem}</p>
                  
                  <p style={{ margin: '0 0 10px', color: '#666', fontSize: '0.9rem' }}>
                    Início/Compra: {formatarData(gasto.data)} 
                    {gasto.tipo === 'Parcelado' && <span> <br/>Dividido em: <strong>{gasto.parcelas}x</strong></span>}
                    {gasto.tipo === 'Recorrente' && <span> <br/>Status: {gasto.data_fim ? <strong style={{color: '#d32f2f'}}>Encerrado em {formatarData(gasto.data_fim)}</strong> : <strong style={{color: '#388e3c'}}>Ativo</strong>}</span>}
                  </p>
                  
                  {/* === LÓGICA DE ENCERRAMENTO E BOTÕES === */}
                  {idEncerrando === gasto.id ? (
                    <form onSubmit={(e) => salvarEncerramento(e, gasto.id)} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', background: '#e3f2fd', padding: '10px', borderRadius: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1565c0' }}>Último mês dessa cobrança:</label>
                      <input type="date" value={dataFimInput} onChange={e => setDataFimInput(e.target.value)} className="form-group input" required />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" className="submit-button" style={{ flex: 1, padding: '8px' }}>Confirmar</button>
                        <button type="button" onClick={() => setIdEncerrando(null)} className="submit-button" style={{ flex: 1, padding: '8px', backgroundColor: '#9e9e9e' }}>Cancelar</button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      <button onClick={() => iniciarEdicao(gasto)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-muted)', background: '#f5f5f5', color: '#333', cursor: 'pointer', fontWeight: 'bold' }}>
                        ✏️ Editar
                      </button>
                      
                      {gasto.tipo === 'Recorrente' && !gasto.data_fim && (
                        <button onClick={() => setIdEncerrando(gasto.id)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #2196F3', background: 'transparent', color: '#2196F3', cursor: 'pointer', fontWeight: 'bold' }}>
                          ⏸️ Encerrar
                        </button>
                      )}
                      
                      <button onClick={() => handleExcluir(gasto.id)} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#ffebee', color: '#d32f2f', cursor: 'pointer' }}>
                        🗑️
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          
          {gastosFiltrados.length === 0 && !status && (
            <p style={{ textAlign: 'center', color: 'var(--text)' }}>Nenhum gasto encontrado para os filtros atuais.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CentralDeGastos;