import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../visuals/App.css';

function NovoCusto() {
  const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwkYpFeApzNcdaf9ae2vdX6idvkOCnFly2cUC7Oz0QxAEOzGNVQhIk8ls0-fpn53ZBElQ/exec";

  const [dados, setDados] = useState({
    data: new Date().toISOString().split('T')[0], 
    quem: '',
    local: '',
    valor: '',
    tipo: 'Normal', // Novo campo com valor padrão
    parcelas: 1     // Novo campo
  });

  const [status, setStatus] = useState('');
  const [opcoes, setOpcoes] = useState({ membros: [], locais: [] });

  useEffect(() => {
    fetch(WEBHOOK_URL)
      .then(res => res.json())
      .then(data => {
        if (data && data.membros) setOpcoes(data);
      })
      .catch(err => console.error("Erro ao buscar nomes:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDados({ ...dados, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setStatus('Enviando...');

    // Se não for parcelado, garante que vai apenas 1 parcela pro banco
    const parcelasFinais = dados.tipo === 'Parcelado' ? parseInt(dados.parcelas) : 1;

    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...dados, 
          parcelas: parcelasFinais,
          data_fim: "", // Sempre vazio na criação
          acao: 'salvar_gasto' 
        })
      });

      setStatus('Gasto registrado com sucesso!');
      // Limpa o formulário, mas mantém a data e o tipo para facilitar o próximo cadastro
      setDados({ ...dados, local: '', valor: '', parcelas: 1 }); 
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('Erro ao enviar. Tente novamente.');
    }
  };

  return (
    <div className="app-container">
      <div className="app-card">
        <Link to="/" style={{ textDecoration: 'none', fontSize: '24px' }}>⬅️</Link>
        <h2>Controle de Gastos 💸</h2>
        <p className="app-subtitle">Registre suas despesas rápida e facilmente.</p>

        <form onSubmit={handleSubmit} className="app-form">
          <div className="form-group">
            <label>Data</label>
            <input type="date" name="data" value={dados.data} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Quem gastou?</label>
            <select name="quem" value={dados.quem} onChange={handleChange} required>
              <option value="">Selecione...</option>
              {(opcoes.membros || []).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Onde foi?</label>
            <select name="local" value={dados.local} onChange={handleChange} required>
              <option value="">Selecione o local...</option>
              {(opcoes.locais || []).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* NOVO: SELETOR DE TIPO */}
          <div className="form-group">
            <label>Tipo de Gasto</label>
            <select name="tipo" value={dados.tipo} onChange={handleChange} required>
              <option value="Normal">Pontual (Normal)</option>
              <option value="Parcelado">Parcelado</option>
              <option value="Recorrente">Assinatura / Recorrente</option>
            </select>
          </div>

          <div className="form-group">
            <label>{dados.tipo === 'Parcelado' ? 'Valor Total da Compra (R$)' : 'Valor Mensal (R$)'}</label>
            <input type="number" step="0.01" name="valor" value={dados.valor} onChange={handleChange} placeholder="Ex: 150.50" required />
          </div>

          {/* NOVO: CAMPO DINÂMICO DE PARCELAS */}
          {dados.tipo === 'Parcelado' && (
            <div className="form-group" style={{ animation: 'fadeIn 0.3s' }}>
              <label>Quantidade de Parcelas</label>
              <input type="number" min="2" max="48" name="parcelas" value={dados.parcelas} onChange={handleChange} required />
            </div>
          )}

          <button type="submit" className="submit-button">Registrar Gasto</button>
        </form>

        {status && <p className={`status-message ${status.includes('Erro') ? 'error' : 'success'}`}>{status}</p>}
      </div>
    </div>
  )
}

export default NovoCusto;