import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../visuals/App.css';

function Dashboard() {
  const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwkYpFeApzNcdaf9ae2vdX6idvkOCnFly2cUC7Oz0QxAEOzGNVQhIk8ls0-fpn53ZBElQ/exec";
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

  // MOTOR DE PROCESSAMENTO (ETL TEMPORAL)
  const processarDadosDoGrafico = () => {
    const agrupamento = {};
    const locaisEncontrados = new Set();
    const hoje = new Date();
    
    // Limite de projeção infinita: 12 meses a partir do mês atual
    const limiteProjecao = new Date(hoje.getFullYear(), hoje.getMonth() + 12, 1);

    if (!dadosGerais.gastos || dadosGerais.gastos.length === 0) {
      return { dados: [], locais: [] };
    }

    dadosGerais.gastos.forEach(gasto => {
      if (filtroPessoa && gasto.quem !== filtroPessoa) return;

      const dataInicial = new Date(gasto.data);
      // Ajusta para o dia 1º do mês para evitar bugs com dias 31 pulando meses curtos
      dataInicial.setDate(1);
      dataInicial.setHours(0, 0, 0, 0);

      if (isNaN(dataInicial.getTime())) return;

      const valorTotal = parseFloat(gasto.valor) || 0;
      const local = gasto.local || 'Outros';
      const tipo = gasto.tipo || 'Normal';
      const parcelas = parseInt(gasto.parcelas) || 1;

      // Função ajudante para injetar valor no mês correspondente
      const adicionarValorNoMes = (dataAlvo, valorParcial) => {
        const mesAno = `${dataAlvo.getMonth() + 1}/${dataAlvo.getFullYear()}`;
        
        if (!agrupamento[mesAno]) {
          // Salva o getTime() para podermos ordenar o gráfico cronologicamente depois
          agrupamento[mesAno] = { mes: mesAno, totalMes: 0, sortValue: dataAlvo.getTime() };
        }
        if (!agrupamento[mesAno][local]) agrupamento[mesAno][local] = 0;
        
        agrupamento[mesAno][local] += valorParcial;
        agrupamento[mesAno].totalMes += valorParcial;
        locaisEncontrados.add(local);
      };

      // 1. LÓGICA NORMAL
      if (tipo === 'Normal') {
        adicionarValorNoMes(dataInicial, valorTotal);
      } 
      
      // 2. LÓGICA PARCELADO
      else if (tipo === 'Parcelado') {
        const valorDaParcela = valorTotal / parcelas;
        for (let p = 0; p < parcelas; p++) {
          const dataParcela = new Date(dataInicial.getFullYear(), dataInicial.getMonth() + p, 1);
          adicionarValorNoMes(dataParcela, valorDaParcela);
        }
      } 
      
      // 3. LÓGICA RECORRENTE
      else if (tipo === 'Recorrente') {
        let dataAtualRecorrente = new Date(dataInicial.getTime());
        
        // Descobre até quando esse loop vai rodar
        let dataFim = limiteProjecao;
        if (gasto.data_fim) {
          const dFim = new Date(gasto.data_fim);
          dFim.setDate(1);
          dFim.setHours(0, 0, 0, 0);
          // Se a data de fim for válida e menor que nosso limite de 12 meses, paramos nela
          if (!isNaN(dFim.getTime()) && dFim < limiteProjecao) {
            dataFim = dFim;
          }
        }

        // Vai adicionando o valor mês a mês até bater na data limite
        let loopCount = 0; // Trava de segurança contra loops infinitos
        while (dataAtualRecorrente <= dataFim && loopCount < 120) {
          adicionarValorNoMes(dataAtualRecorrente, valorTotal);
          dataAtualRecorrente.setMonth(dataAtualRecorrente.getMonth() + 1);
          loopCount++;
        }
      }
    });

    // Pega o objeto bagunçado, transforma numa lista e ordena do mês mais antigo pro mais novo
    const dadosOrdenados = Object.values(agrupamento).sort((a, b) => a.sortValue - b.sortValue);

    return {
      dados: dadosOrdenados,
      locais: Array.from(locaisEncontrados)
    };
  };

  const { dados, locais } = processarDadosDoGrafico();
  const cores = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0', '#FF5722', '#00BCD4'];

  return (
    <div className="app-container">
      <div className="app-card" style={{ maxWidth: '600px' }}>
        <Link to="/" style={{ textDecoration: 'none', fontSize: '24px' }}>⬅️</Link>
        <h2>Visão do Caixa 📊</h2>

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
                <Tooltip 
                  formatter={(value, name, props) => {
                    const totalDoMes = props.payload.totalMes;
                    const porcentagem = ((value / totalDoMes) * 100).toFixed(1);
                    return [`R$ ${value.toFixed(2)} (${porcentagem}%)`, name];
                  }} 
                />
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