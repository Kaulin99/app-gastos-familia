import { useState } from 'react'
import './App.css'

function App() {
  // Substitua o link abaixo pela URL que o Google Apps Script gerou para você
  const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwkYpFeApzNcdaf9ae2vdX6idvkOCnFly2cUC7Oz0QxAEOzGNVQhIk8ls0-fpn53ZBElQ/exec";

  const [dados, setDados] = useState({
    data: new Date().toISOString().split('T')[0], // Já puxa o dia de hoje
    quem: '',
    local: '',
    valor: ''
  });

  const [status, setStatus] = useState('');

  // Atualiza as variáveis enquanto a pessoa digita
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDados({ ...dados, [name]: value });
  };

  // Dispara quando o botão de Salvar é clicado
  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que a página recarregue
    setStatus('Enviando...');

    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors', // Essencial para o Google Sheets não bloquear a requisição
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados)
      });

      setStatus('Gasto registrado com sucesso!');
      // Limpa os campos depois de enviar, mas mantém a data de hoje
      setDados({ ...dados, local: '', valor: '' }); 
      
      // Apaga a mensagem de sucesso após 3 segundos
      setTimeout(() => setStatus(''), 3000);

    } catch (error) {
      setStatus('Erro ao enviar. Tente novamente.');
      console.error(error);
    }
  };

  return (
    <div className="app-container">
      <div className="app-card">
        <h2>Controle de Gastos 💸</h2>
        <p className="app-subtitle">Registre seus despesas rápidas e facilmente no celular.</p>

        <form onSubmit={handleSubmit} className="app-form">
          <div className="form-group">
            <label htmlFor="data">Data</label>
            <input id="data" type="date" name="data" value={dados.data} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="quem">Quem gastou?</label>
            <select id="quem" name="quem" value={dados.quem} onChange={handleChange} required>
              <option value="Selecione Nome">Selecione Nome</option>
              <option value="Ana Maria">Ana Maria</option>
              <option value="Mariana">Mariana</option>
              <option value="Deolinda">Deolinda</option>
              <option value="Rafael">Rafael</option>
              <option value="Kaue">Kaue</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="local">Onde foi? (Local)</label>
            <input id="local" type="text" name="local" value={dados.local} onChange={handleChange} placeholder="Ex: Supermercado" required />
          </div>

          <div className="form-group">
            <label htmlFor="valor">Valor (R$)</label>
            <input id="valor" type="number" step="0.01" name="valor" value={dados.valor} onChange={handleChange} placeholder="Ex: 150.50" required />
          </div>

          <button type="submit" className="submit-button">
            Registrar Gasto
          </button>
        </form>

        {status && (
          <p className={`status-message ${status.includes('Erro') ? 'error' : 'success'}`}>
            {status}
          </p>
        )}
      </div>
    </div>
  )
}

export default App