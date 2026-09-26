const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// Array na memória para guardar as tarefas
let tarefas = [];

// Rota para obter todas as tarefas
app.get('/api/tarefas', (req, res) => {
  res.json(tarefas);
});

// Rota para adicionar uma nova tarefa
app.post('/api/tarefas', (req, res) => {
  const { texto } = req.body;
  if (!texto) return res.status(400).json({ error: 'Texto é obrigatório' });

  const novaTarefa = { id: Date.now(), texto };
  tarefas.push(novaTarefa);
  res.status(201).json(novaTarefa);
});

// Rota para apagar uma tarefa pelo ID
app.delete('/api/tarefas/:id', (req, res) => {
  const { id } = req.params;
  tarefas = tarefas.filter(t => t.id !== Number(id));
  res.json({ success: true });
});

// Serve a interface HTML
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Gerenciador de Tarefas</title>
      <style>
        body { font-family: Arial, sans-serif; background: #0d1117; color: #c9d1d9; display: flex; justify-content: center; padding-top: 50px; }
        .card { background: #161b22; padding: 25px; border-radius: 8px; border: 1px solid #30363d; width: 350px; }
        h1 { font-size: 1.4rem; margin-bottom: 20px; color: #58a6ff; text-align: center; }
        .input-group { display: flex; gap: 8px; margin-bottom: 20px; }
        input { flex: 1; padding: 10px; border-radius: 6px; border: 1px solid #30363d; background: #0d1117; color: #fff; outline: none; }
        button { padding: 10px 15px; border: none; background: #238636; color: #fff; border-radius: 6px; cursor: pointer; font-weight: bold; }
        button:hover { background: #2ea043; }
        ul { list-style: none; padding: 0; margin: 0; }
        li { background: #21262d; padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .btn-delete { background: #da3633; padding: 4px 8px; font-size: 0.8rem; }
        .btn-delete:hover { background: #f85149; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Minhas Tarefas</h1>
        <div class="input-group">
          <input type="text" id="taskInput" placeholder="Digite uma tarefa..." />
          <button onclick="addTask()">Criar</button>
        </div>
        <ul id="taskList"></ul>
      </div>

      <script>
        // Carrega as tarefas salvas ao abrir a página
        async function loadTasks() {
          const res = await fetch('/api/tarefas');
          const tasks = await res.json();
          const ul = document.getElementById('taskList');
          ul.innerHTML = '';
          tasks.forEach(t => renderTask(t));
        }

        function renderTask(task) {
          const ul = document.getElementById('taskList');
          const li = document.createElement('li');
          li.innerHTML = \`
            <span>\${task.texto}</span>
            <button class="btn-delete" onclick="deleteTask(\${task.id})">X</button>
          \`;
          ul.appendChild(li);
        }

        async function addTask() {
          const input = document.getElementById('taskInput');
          const texto = input.value.trim();
          if (!texto) return;

          const res = await fetch('/api/tarefas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto })
          });

          if (res.ok) {
            input.value = '';
            loadTasks();
          }
        }

        async function deleteTask(id) {
          await fetch(\`/api/tarefas/\${id}\`, { method: 'DELETE' });
          loadTasks();
        }

        loadTasks();
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
