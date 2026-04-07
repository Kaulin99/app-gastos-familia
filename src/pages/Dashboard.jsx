import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../visuals/App.css';

function Dashboard() {
  const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwkYpFeApzNcdaf9ae2vdX6idvkOCnFly2cUC7Oz0QxAEOzGNVQhIk8ls0-fpn53ZBElQ/exec"; // Cole a sua URL
  const [dadosGerais, setDadosGerais] = useState({ membros: [], locais: [], gastos: [] });
  const [filtroPessoa, setFiltroPessoa] = useState('');

  useEffect(() => {
    fetch(WEBHOOK_URL)
      .then(res => res.json())
      .then(data => {
        if (data && data.gastos) setDadosGerais(data);
      })
      .catch(err => console.error("Erro ao carregar dados:", err));
  }, []);

  // Motor de Processamento de Dados (ETL no Front-end)
  const processarDadosDoGrafico = () => {
    const agrupamento = {};
    const locaisEncontrados = new Set();

    dadosGerais.gastos.forEach(gasto => {
      // Aplica o filtro de pessoa (se houver alguém selecionado)
      if (filtroPessoa && gasto.quem !== filtroPessoa) return;

      // Extrai o Mês/Ano da data (Ex: "4/2026")
      const dataObj = new Date(gasto.data);
      const mesAno = `${dataObj.getMonth() + 1}/${dataObj.getFullYear()}`;
      const local = gasto.local;
      const valor = parseFloat(gasto.valor) || 0;

      // Agrupa e soma os valores
      if (!agrupamento[mesAno]) agrupamento[mesAno] = { mes: mesAno };
      if (!agrupamento[mesAno][local]) agrupamento[mesAno][local] = 0;
      
      agrupamento[mesAno][local] += valor;
      locaisEncontrados.add(local);
    });

    // O Recharts precisa de uma Array pura
    return {
      dados: Object.values(agrupamento),
      locais: Array.from(locaisEncontrados)
    };
  };

  const { dados, locais } = processarDadosDoGrafico();

  // Uma paleta de cores automática para os diferentes locais
  const cores = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0', '#FF5722', '#00BCD4'];

  return (
    <div className="app-container">
      <div className="app-card" style={{ maxWidth: '600px' }}>
        <Link to="/" style={{ textDecoration: 'none', fontSize: '24px' }}>⬅️</Link>
        <h2>Resumo de Gastos 📊</h2>

        <div className="form-group" style={{ marginTop: '20px', marginBottom: '20px' }}>
          <label>Filtrar por Pessoa:</label>
          <select value={filtroPessoa} onChange={e => setFiltroPessoa(e.target.value)}>
            <option value="">Todos da Família</option>
            {(dadosGerais.membros || []).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Área do Gráfico */}
        <div style={{ width: '100%', height: '350px', marginTop: '20px' }}>
          {dados.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados}>
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                {locais.map((local, index) => (
                  <Bar 
                    key={local} 
                    dataKey={local} 
                    stackId="a" 
                    fill={cores[index % cores.length]} 
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text)' }}>
              Nenhum gasto encontrado para este filtro.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;