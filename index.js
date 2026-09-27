const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// Array na memória para guardar os negócios/tarefas comerciais
let negocios = [];

// API: Listar todos os negócios
app.get('/api/negocios', (req, res) => {
  res.json(negocios);
});

// API: Criar novo negócio comercial
app.post('/api/negocios', (req, res) => {
  const { cliente, valor, etapa } = req.body;
  if (!cliente) return res.status(400).json({ error: 'Nome do cliente é obrigatório' });

  const novoNegocio = {
    id: Date.now(),
    cliente,
    valor: valor || 0,
    etapa: etapa || 'Lead / Primeiro Contato'
  };

  negocios.push(novoNegocio);
  res.status(201).json(novoNegocio);
});

// API: Eliminar negócio
app.delete('/api/negocios/:id', (req, res) => {
  const { id } = req.params;
  negocios = negocios.filter(n => n.id !== Number(id));
  res.json({ success: true });
});

// Interface Web Comercial
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CRM Comercial - Gerenciador de Vendas</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0d1117; color: #c9d1d9; display: flex; flex-direction: column; align-items: center; padding: 40px 20px; margin: 0; }
        .card { background: #161b22; padding: 25px; border-radius: 8px; border: 1px solid #30363d; width: 100%; max-width: 500px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        h1 { font-size: 1.5rem; margin-bottom: 20px; color: #58a6ff; text-align: center; }
        .form-group { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        input, select { padding: 10px; border-radius: 6px; border: 1px solid #30363d; background: #0d1117; color: #fff; outline: none; }
        button { padding: 12px; border: none; background: #238636; color: #fff; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1rem; }
        button:hover { background: #2ea043; }
        ul { list-style: none; padding: 0; margin: 0; }
        li { background: #21262d; padding: 12px 15px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-left: 4px solid #58a6ff; }
        .info { display: flex; flex-direction: column; gap: 4px; }
        .cliente { font-weight: bold; color: #f0f6fc; }
        .detalhes { font-size: 0.85rem; color: #8b949e; }
        .badge { background: #388bfd1a; color: #58a6ff; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; border: 1px solid #388bfd4d; display: inline-block; width: fit-content; }
        .btn-delete { background: #da3633; padding: 6px 10px; font-size: 0.8rem; border-radius: 4px; }
        .btn-delete:hover { background: #f85149; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>📊 CRM Comercial</h1>
        
        <div class="form-group">
          <input type="text" id="cliente" placeholder="Nome do Cliente / Empresa" />
          <input type="number" id="valor" placeholder="Valor Estimado (R$)" />
          <select id="etapa">
            <option value="Prospecção">Prospecção</option>
            <option value="Proposta Enviada">Proposta Enviada</option>
            <option value="Em Negociação">Em Negociação</option>
            <option value="Fechado (Ganho)">Fechado (Ganho)</option>
          </select>
          <button onclick="addDeal()">Adicionar Oportunidade</button>
        </div>

        <ul id="dealList"></ul>
      </div>

      <script>
        async function loadDeals() {
          const res = await fetch('/api/negocios');
          const deals = await res.json();
          const ul = document.getElementById('dealList');
          ul.innerHTML = '';
          deals.forEach(d => renderDeal(d));
        }

        function renderDeal(deal) {
          const ul = document.getElementById('dealList');
          const li = document.createElement('li');
          li.innerHTML = \`
            <div class="info">
              <span class="cliente">\${deal.cliente}</span>
              <span class="detalhes">R$ \${Number(deal.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
              <span class="badge">\${deal.etapa}</span>
            </div>
            <button class="btn-delete" onclick="deleteDeal(\${deal.id})">Remover</button>
          \`;
          ul.appendChild(li);
        }

        async function addDeal() {
          const cliente = document.getElementById('cliente').value.trim();
          const valor = document.getElementById('valor').value;
          const etapa = document.getElementById('etapa').value;

          if (!cliente) return alert('Por favor, informe o nome do cliente.');

          const res = await fetch('/api/negocios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cliente, valor, etapa })
          });

          if (res.ok) {
            document.getElementById('cliente').value = '';
            document.getElementById('valor').value = '';
            loadDeals();
          }
        }

        async function deleteTask(id) {
          await fetch(\`/api/negocios/\${id}\`, { method: 'DELETE' });
          loadDeals();
        }

        loadDeals();
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`CRM Comercial rodando em http://localhost:${PORT}`);
});