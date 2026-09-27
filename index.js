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
      <title>Gerenciador Comercial de Vendas</title>
      <style>
        body { font-family: Arial, sans-serif; background: #0d1117; color: #c9d1d9; padding: 20px; display: flex; justify-content: center; }
        .container { width: 100%; max-width: 800px; }
        .card { background: #161b22; padding: 20px; border-radius: 8px; border: 1px solid #30363d; margin-bottom: 20px; }
        h1, h2 { color: #58a6ff; text-align: center; margin-top: 0; }
        .grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px; }
        .full-width { grid-column: span 2; }
        label { font-size: 0.85rem; color: #8b949e; display: block; margin-bottom: 4px; }
        input, select { width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #30363d; background: #0d1117; color: #fff; box-sizing: border-box; }
        button { width: 100%; padding: 12px; border: none; background: #238636; color: #fff; border-radius: 6px; cursor: pointer; font-weight: bold; }
        button:hover { background: #2ea043; }
        .chamado-item { background: #21262d; padding: 15px; border-radius: 6px; border: 1px solid #30363d; margin-bottom: 15px; position: relative; }
        .chamado-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363d; padding-bottom: 8px; margin-bottom: 10px; }
        .numero { font-weight: bold; color: #58a6ff; font-size: 1.1rem; }
        .badge { background: #388bfd1a; color: #58a6ff; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; border: 1px solid #388bfd4d; }
        .detalhes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.9rem; }
        .btn-delete { background: #da3633; width: auto; padding: 4px 10px; font-size: 0.8rem; }
        .btn-delete:hover { background: #f85149; }
        .anexos-box { margin-top: 10px; display: flex; gap: 10px; }
        .anexos-box img { max-width: 100px; max-height: 80px; border-radius: 4px; border: 1px solid #30363d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <h1>📋 Solicitação Comercial</h1>
          <div class="grid-form">
            <div class="full-width">
              <label>Cliente / Empresa</label>
              <input type="text" id="cliente" placeholder="Nome do cliente..." />
            </div>
            <div>
              <label>Data de Início</label>
              <input type="date" id="dataInicio" />
            </div>
            <div>
              <label>Data de Follow-up (Acompanhamento)</label>
              <input type="date" id="dataFollowUp" />
            </div>
            <div>
              <label>Valor da Proposta (R$)</label>
              <input type="number" id="valorProposta" placeholder="0,00" step="0.01" />
            </div>
            <div>
              <label>Frete</label>
              <select id="frete">
                <option value="CIF">CIF (Emitente)</option>
                <option value="EXW">EXW (Retirada)</option>
              </select>
            </div>
            <div class="full-width">
              <label>Print da Solicitação do Cliente (Imagem)</label>
              <input type="file" id="printSolicitacao" accept="image/*" />
            </div>
            <div class="full-width">
              <label>Anexo da Proposta (PDF/Arquivo)</label>
              <input type="file" id="anexoProposta" />
            </div>
          </div>
          <button onclick="salvarChamado()">Criar Solicitação</button>
        </div>

        <h2>Solicitações em Andamento</h2>
        <div id="listaChamados"></div>
      </div>

      <script>
        // Define a data atual no input de inicio
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

          dados.forEach(c => {
            const div = document.createElement('div');
            div.className = 'chamado-item';
            div.innerHTML = \`
              <div class="chamado-header">
                <div>
                  <span class="numero">\${c.numero}</span> - <strong>\${c.cliente}</strong>
                </div>
                <button class="btn-delete" onclick="deletarChamado('\${c.numero.replace('#','')}')">Excluir</button>
              </div>
              <div class="detalhes-grid">
                <div><strong>Início:</strong> \${c.dataInicio}</div>
                <div><strong>Finalização (2 dias úteis):</strong> <span style="color:#3fb950">\${c.dataFinalizacao}</span></div>
                <div><strong>Follow-up:</strong> \${c.dataFollowUp}</div>
                <div><strong>Frete:</strong> <span class="badge">\${c.frete}</span></div>
                <div><strong>Valor:</strong> R$ \${Number(c.valorProposta).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
              </div>
              <div class="anexos-box">
                \${c.printSolicitacao ? \`<a href="\${c.printSolicitacao}" target="_blank"><img src="\${c.printSolicitacao}" title="Print da Solicitação" /></a>\` : ''}
                \${c.anexoProposta ? \`<a href="\${c.anexoProposta}" target="_blank" style="color:#58a6ff; font-size:0.85rem;">📄 Ver Anexo da Proposta</a>\` : ''}
              </div>
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