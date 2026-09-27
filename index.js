const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

let chamados = [];
let contadorId = 1;

function calcularDataFinalizacao(dataInicioStr) {
  let data = new Date(dataInicioStr + 'T00:00:00');
  let diasUteisAdicionados = 0;

  while (diasUteisAdicionados < 2) {
    data.setDate(data.getDate() + 1);
    const diaDaSemana = data.getDay();
    if (diaDaSemana !== 0 && diaDaSemana !== 6) {
      diasUteisAdicionados++;
    }
  }

  return data.toISOString().split('T')[0];
}

app.get('/api/chamados', (req, res) => {
  res.json(chamados);
});

app.post('/api/chamados', (req, res) => {
  const { cliente, dataFollowUp, dataInicio, valorProposta, frete, printSolicitacao, anexoProposta } = req.body;

  if (!cliente || !dataInicio) {
    return res.status(400).json({ error: 'Cliente e Data de Início são obrigatórios.' });
  }

  const dataFinalizacao = calcularDataFinalizacao(dataInicio);

  const novoChamado = {
    numero: `#${contadorId.toString().padStart(4, '0')}`,
    cliente,
    dataFollowUp: dataFollowUp || 'Não informada',
    dataInicio,
    dataFinalizacao,
    valorProposta: valorProposta || 0,
    frete: frete || 'CIF',
    printSolicitacao: printSolicitacao || null,
    anexoProposta: anexoProposta || null
  };

  contadorId++;
  chamados.push(novoChamado);
  res.status(201).json(novoChamado);
});

app.delete('/api/chamados/:numero', (req, res) => {
  const { numero } = req.params;
  chamados = chamados.filter(c => c.numero !== `#${numero}`);
  res.json({ success: true });
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Painel de Gestão Comercial</title>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --bg-main: #090d16;
          --bg-card: #111827;
          --bg-input: #1f2937;
          --border-color: #374151;
          --primary: #6366f1;
          --text-main: #f9fafb;
          --text-muted: #9ca3af;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background-color: var(--bg-main);
          color: var(--text-main);
          padding: 40px 20px;
          display: flex;
          justify-content: center;
          min-height: 100vh;
        }

        .container { width: 100%; max-width: 900px; }

        header {
          text-align: center;
          margin-bottom: 32px;
        }

        header h1 {
          font-size: 2.2rem;
          font-weight: 700;
          color: #818cf8;
          margin-bottom: 8px;
        }

        .card {
          background: var(--bg-card);
          padding: 28px;
          border-radius: 16px;
          border: 1px solid var(--border-color);
          margin-bottom: 32px;
        }

        .grid-form {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .full-width { grid-column: span 2; }

        label {
          font-size: 0.85rem;
          color: var(--text-muted);
          display: block;
          margin-bottom: 6px;
        }

        input, select {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-input);
          color: var(--text-main);
        }

        button.btn-primary {
          width: 100%;
          padding: 14px;
          border: none;
          background: var(--primary);
          color: #fff;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .chamado-item {
          background: var(--bg-card);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          margin-bottom: 16px;
        }

        .chamado-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
          margin-bottom: 12px;
        }

        .btn-delete {
          background: #ef4444;
          color: #fff;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>Gestão Comercial</h1>
        </header>

        <div class="card">
          <div class="grid-form">
            <div class="form-group full-width">
              <label>Cliente</label>
              <input type="text" id="cliente" placeholder="Nome do Cliente" />
            </div>
            <div class="form-group">
              <label>Data de Início</label>
              <input type="date" id="dataInicio" />
            </div>
            <div class="form-group">
              <label>Data de Follow-up</label>
              <input type="date" id="dataFollowUp" />
            </div>
            <div class="form-group">
              <label>Valor Proposta (R$)</label>
              <input type="number" id="valorProposta" step="0.01" />
            </div>
            <div class="form-group">
              <label>Frete</label>
              <select id="frete">
                <option value="CIF">CIF</option>
                <option value="EXW">EXW</option>
              </select>
            </div>
          </div>
          <button class="btn-primary" onclick="salvarChamado()">Registar Solicitação</button>
        </div>

        <div id="listaChamados"></div>
      </div>

      <script>
        document.getElementById('dataInicio').valueAsDate = new Date();

        async function salvarChamado() {
          const cliente = document.getElementById('cliente').value.trim();
          const dataInicio = document.getElementById('dataInicio').value;
          const dataFollowUp = document.getElementById('dataFollowUp').value;
          const valorProposta = document.getElementById('valorProposta').value;
          const frete = document.getElementById('frete').value;

          if (!cliente || !dataInicio) return alert('Preencha os campos obrigatórios.');

          const res = await fetch('/api/chamados', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cliente, dataInicio, dataFollowUp, valorProposta, frete })
          });

          if (res.ok) {
            document.getElementById('cliente').value = '';
            carregarChamados();
          }
        }

        async function carregarChamados() {
          const res = await fetch('/api/chamados');
          const dados = await res.json();
          const container = document.getElementById('listaChamados');
          container.innerHTML = '';

          dados.forEach(c => {
            const div = document.createElement('div');
            div.className = 'chamado-item';
            div.innerHTML = \`
              <div class="chamado-header">
                <strong>\${c.numero} - \${c.cliente}</strong>
                <button class="btn-delete" onclick="deletarChamado('\${c.numero.replace('#','')}')">Excluir</button>
              </div>
              <p>Início: \${c.dataInicio} | Previsão: \${c.dataFinalizacao} | Follow-up: \${c.dataFollowUp}</p>
              <p>Valor: R$ \${c.valorProposta} | Frete: \${c.frete}</p>
            \`;
            container.appendChild(div);
          });
        }

        async function deletarChamado(num) {
          await fetch('/api/chamados/' + num, { method: 'DELETE' });
          carregarChamados();
        }

        carregarChamados();
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Gerenciador Comercial rodando em http://localhost:${PORT}`);
});