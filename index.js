const express = require('express');
const app = express();
const PORT = 3000;

// Aumenta o limite para aceitar imagens em Base64
app.use(express.json({ limit: '10mb' }));

let chamados = [];
let contadorId = 1;

// Função para calcular 2 dias úteis a partir de uma data inicial
function calcularDataFinalizacao(dataInicioStr) {
  let data = new Date(dataInicioStr + 'T00:00:00');
  let diasUteisAdicionados = 0;

  while (diasUteisAdicionados < 2) {
    data.setDate(data.getDate() + 1);
    const diaDaSemana = data.getDay();
    // 0 = Domingo, 6 = Sábado
    if (diaDaSemana !== 0 && diaDaSemana !== 6) {
      diasUteisAdicionados++;
    }
  }

  return data.toISOString().split('T')[0];
}

// API: Listar chamados
app.get('/api/chamados', (req, res) => {
  res.json(chamados);
});

// API: Criar novo chamado
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

// API: Deletar chamado
app.delete('/api/chamados/:numero', (req, res) => {
  const { numero } = req.params;
  chamados = chamados.filter(c => c.numero !== `#${numero}`);
  res.json({ success: true });
});

// Interface Web
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Painel de Gestão Comercial</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --bg-main: #090d16;
          --bg-card: #111827;
          --bg-input: #1f2937;
          --border-color: #374151;
          --primary: #6366f1;
          --primary-hover: #4f46e5;
          --text-main: #f9fafb;
          --text-muted: #9ca3af;
          --accent-green: #10b981;
          --accent-red: #ef4444;
          --accent-amber: #f59e0b;
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
          background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 8px;
        }

        header p {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .card {
          background: var(--bg-card);
          padding: 28px;
          border-radius: 16px;
          border: 1px solid var(--border-color);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
          margin-bottom: 32px;
        }

        .card-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-main);
        }

        .grid-form {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .full-width { grid-column: span 2; }

        .form-group label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-muted);
          display: block;
          margin-bottom: 6px;
        }

        input, select {
          width: 100%;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-input);
          color: var(--text-main);
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        input:focus, select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        input[type="file"] {
          padding: 8px 12px;
          cursor: pointer;
        }

        button.btn-primary {
          width: 100%;
          padding: 14px;
          border: none;
          background: linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%);
          color: #fff;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: transform 0.15s, opacity 0.2s;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
        }

        button.btn-primary:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        .chamados-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .chamados-header h2 {
          font-size: 1.3rem;
          font-weight: 600;
        }

        .chamado-item {
          background: var(--bg-card);
          padding: 20px;
          border-radius: 14px;
          border: 1px solid var(--border-color);
          margin-bottom: 16px;
          transition: border-color 0.2s;
        }

        .chamado-item:hover {
          border-color: #4b5563;
        }

        .chamado-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 12px;
          margin-bottom: 14px;
        }

        .numero {
          font-weight: 700;
          color: var(--primary);
          font-size: 1.1rem;
          margin-right: 8px;
        }

        .cliente-nome {
          font-size: 1.05rem;
          font-weight: 600;
        }

        .badge {
          background: rgba(99, 102, 241, 0.15);
          color: #a5b4fc;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }

        .badge-cif { background: rgba(16, 185, 129, 0.15); color: #6ee7b7; border-color: rgba(16, 185, 129, 0.3); }
        .badge-exw { background: rgba(245, 158, 11, 0.15); color: #fde68a; border-color: rgba(245, 158, 11, 0.3); }

        .detalhes-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          font-size: 0.9rem;
          margin-bottom: 14px;
        }

        .detalhe-card {
          background: rgba(255, 255, 255, 0.02);
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .detalhe-card span {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 2px;
        }

        .detalhe-card strong {
          font-size: 0.95rem;
          color: var(--text-main);
        }

        .btn-delete {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-delete:hover {
          background: rgba(239, 68, 68, 0.3);
        }

        .anexos-box {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed rgba(255, 255, 255, 0.08);
        }

        .anexos-box img {
          max-width: 90px;
          max-height: 70px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          object-fit: cover;
          transition: transform 0.2s;
        }

        .anexos-box img:hover { transform: scale(1.05); }

        .link-anexo {
          color: var(--primary);
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .link-anexo:hover { text-decoration: underline; }

        @media (max-width: 640px) {
          .grid-form, .detalhes-grid { grid-template-columns: 1fr; }
          .full-width { grid-column: span 1; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>Gestão de Acompanhamento Comercial</h1>
          <p>Controle de propostas, prazos úteis de finalização e follow-ups</p>
        </header>

        <div class="card">
          <div class="card-title">📝 Nova Solicitação Comercial</div>
          <div class="grid-form">
            <div class="form-group full-width">
              <label>Cliente / Empresa</label>
              <input type="text" id="cliente" placeholder="Ex: Indústria Silva S.A." />
            </div>
            <div class="form-group">
              <label>Data de Início</label>
              <input type="date" id="dataInicio" />
            </div>
            <div class="form-group">
              <label>Data de Follow-up (Ligação)</label>
              <input type="date" id="dataFollowUp" />
            </div>
            <div class="form-group">
              <label>Valor da Proposta (R$)</label>
              <input type="number" id="valorProposta" placeholder="0,00" step="0.01" />
            </div>
            <div class="form-group">
              <label>Modalidade de Frete</label>
              <select id="frete">
                <option value="CIF">CIF (Emitente)</option>
                <option value="EXW">EXW (Retirada)</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label>Print da Solicitação do Cliente</label>
              <input type="file" id="printSolicitacao" accept="image/*" />
            </div>
            <div class="form-group full-width">
              <label>Anexo da Proposta (PDF / Documento)</label>
              <input type="file" id="anexoProposta" />
            </div>
          </div>
          <button class="btn-primary" onclick="salvarChamado()">Registar Solicitação</button>
        </div>

        <div class="chamados-header">
          <h2>Solicitações em Andamento</h2>
        </div>
        <div id="listaChamados"></div>
      </div>

      <script>
        document.getElementById('dataInicio').valueAsDate = new Date();

        function converterParaBase64(file) {
          return new Promise((resolve, reject) => {
            if (!file) return resolve(null);
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
          });
        }

        async function salvarChamado() {
          const cliente = document.getElementById('cliente').value.trim();
          const dataInicio = document.getElementById('dataInicio').value;
          const dataFollowUp = document.getElementById('dataFollowUp').value;
          const valorProposta = document.getElementById('valorProposta').value;
          const frete = document.getElementById('frete').value;

          const printFile = document.getElementById('printSolicitacao').files[0];
          const anexoFile = document.getElementById('anexoProposta').files[0];

          if (!cliente || !dataInicio) {
            return alert('Preencha o Nome do Cliente e a Data de Início.');
          }

          const printSolicitacao = await converterParaBase64(printFile);
          const anexoProposta = await converterParaBase64(anexoFile);

          const res = await fetch('/api/chamados', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cliente, dataInicio, dataFollowUp, valorProposta, frete, printSolicitacao, anexoProposta
            })
          });

          if (res.ok) {
            document.getElementById('cliente').value = '';
            document.getElementById('valorProposta').value = '';
            document.getElementById('printSolicitacao').value = '';
            document.getElementById('anexoProposta').value = '';
            carregarChamados();
          }
        }

        async function carregarChamados() {
          const res = await fetch('/api/chamados');
          const dados = await res.json();
          const container = document.getElementById('listaChamados');
          container.innerHTML = '';

          if (dados.length === 0) {
            container.innerHTML = \`<div style="text-align: center; color: var(--text-muted); padding: 40px; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color);">Nenhuma solicitação registada no momento.</div>\`;
            return;
          }

          dados.forEach(c => {
            const div = document.createElement('div');
            div.className = 'chamado-item';
            
            const badgeFreteClass = c.frete === 'CIF' ? 'badge-cif' : 'badge-exw';

            div.innerHTML = \`
              <div class="chamado-header">
                <div>
                  <span class="numero">\${c.numero}</span>
                  <span class="cliente-nome">\${c.cliente}</span>
                </div>
                <button class="btn-delete" onclick="deletarChamado('\${c.numero.replace('#','')}')">Excluir</button>
              </div>
              <div class="detalhes-grid">
                <div class="detalhe-card">
                  <span>Data de Início</span>
                  <strong>\${c.dataInicio}</strong>
                </div>
                <div class="detalhe-card">
                  <span>Finalização (2d úteis)</span>
                  <strong style="color: var(--accent-green)">\${c.dataFinalizacao}</strong>
                </div>
                <div class="detalhe-card">
                  <span>Follow-up (Ligar)</span>
                  <strong style="color: var(--accent-amber)">\${c.dataFollowUp}</strong>
                </div>
                <div class="detalhe-card">
                  <span>Frete</span>
                  <span class="badge \${badgeFreteClass}">\${c.frete}</span>
                </div>
                <div class="detalhe-card" style="grid-column: span 2;">
                  <span>Valor da Proposta</span>
                  <strong>R$ \${Number(c.valorProposta).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>
                </div>
              </div>
              \${c.printSolicitacao || c.anexoProposta ? \`
                <div class="anexos-box">
                  \${c.printSolicitacao ? \`<a href="\${c.printSolicitacao}" target="_blank"><img src="\${c.printSolicitacao}" title="Clique para ampliar o print da solicitação" /></a>\` : ''}
                  \${c.anexoProposta ? \`<a href="\${c.anexoProposta}" target="_blank" class="link-anexo">📄 Ver Anexo da Proposta</a>\` : ''}
                </div>
              \` : ''}
            \`;
            container.appendChild(div);
          });
        }

        async function deletarChamado(num) {
          await fetch(\`/api/chamados/\${num}\`, { method: 'DELETE' });
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