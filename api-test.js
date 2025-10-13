require('dotenv').config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// Dados simulados para teste (substituindo o banco de dados)
let usuarios = [
  {
    id: 1,
    nome: "João Silva",
    email: "joao@teste.com",
    senha: "123456",
    tipo: "familiar_cuidador",
    telefone: "(11) 99999-9999",
    ativo: true
  },
  {
    id: 2,
    nome: "Maria Santos",
    email: "maria@teste.com",
    senha: "123456",
    tipo: "familiar_contratante",
    telefone: "(11) 88888-8888",
    ativo: true
  },
  {
    id: 3,
    nome: "Ana Oliveira",
    email: "ana@teste.com",
    senha: "123456",
    tipo: "cuidador_profissional",
    telefone: "(11) 77777-7777",
    ativo: true
  }
];

let familiaresCuidadores = [
  { id: 1, usuario_id: 1, parentesco: "filho", endereco: "Rua A, 123" }
];

let familiaresContratantes = [
  { id: 1, usuario_id: 2, endereco: "Rua B, 456" }
];

let cuidadoresProfissionais = [
  { id: 1, usuario_id: 3, especializacao: "enfermagem", registro_profissional: "COREN-123456", disponibilidade: "periodo_integral" }
];

let pacientes = [];

// ROTAS PRINCIPAIS

// Página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/LandingPage.html"));
});

// Páginas estáticas
app.get("/selecaoTipoUsuario", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/selecaoTipoUsuario.html"));
});

app.get("/criarContaFamiliarCuidador", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/criarContaFamiliarCuidador.html"));
});

app.get("/criarContaFamiliarContratante", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/criarContaFamiliarContratante.html"));
});

app.get("/dependentes", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/dependentes.html"));
});

app.get("/dashboard_cuidador", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/dashboard_cuidador.html"));
});

app.get("/dashboard_familiar", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/dashboard_familiar.html"));
});

app.get("/dashboard_supervisor", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/dashboard_supervisor.html"));
});

app.get("/adm", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/adm.html"));
});

// Rotas adicionais
app.get("/medicamentos", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/medicamentos.html"));
});

app.get("/alertas", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/alertas.html"));
});

app.get("/historico", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/historico.html"));
});

app.get("/relatorios", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/relatorios.html"));
});

// Rotas com extensão .html para compatibilidade
app.get("/LandingPage.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/LandingPage.html"));
});

app.get("/selecaoTipoUsuario.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/selecaoTipoUsuario.html"));
});

// APIS SIMULADAS

// Login simulado
app.post("/api/login", (req, res) => {
  const { email, senha } = req.body;
  console.log("=== TENTATIVA DE LOGIN (TESTE) ===");
  console.log("Email:", email);
  console.log("Senha fornecida:", senha ? "✓ (presente)" : "✗ (ausente)");

  if (!email || !senha) {
    console.log("❌ Campos obrigatórios ausentes");
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  const usuario = usuarios.find(u => u.email === email && u.ativo);
  
  if (!usuario) {
    console.log("❌ Usuário não encontrado");
    return res.status(401).json({ error: "Email ou senha incorretos" });
  }

  if (usuario.senha !== senha) {
    console.log("❌ Senha incorreta");
    return res.status(401).json({ error: "Email ou senha incorretos" });
  }

  console.log("✅ Login bem-sucedido para:", usuario.nome);
  
  let redirectUrl = "/";
  if (usuario.tipo === 'familiar_cuidador') {
    redirectUrl = "/dashboard_familiar";
  } else if (usuario.tipo === 'familiar_contratante') {
    redirectUrl = "/dashboard_supervisor";
  } else if (usuario.tipo === 'cuidador_profissional') {
    redirectUrl = "/dashboard_cuidador";
  } else if (usuario.tipo === 'admin') {
    redirectUrl = "/adm";
  }
  
  console.log("Redirecionando para:", redirectUrl);
  
  res.json({
    id: usuario.id,
    nome: usuario.nome,
    tipo: usuario.tipo,
    redirect: redirectUrl
  });
});

// Cadastro simulado
app.post("/api/cadastrar", (req, res) => {
  const { nome, email, senha, tipo, telefone, data_nascimento, parentesco, endereco, especializacao, registro_profissional, disponibilidade } = req.body;
  console.log("=== CADASTRO SIMULADO ===");
  console.log("Dados recebidos:", { nome, email, tipo });

  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }

  // Verificar se email já existe
  if (usuarios.find(u => u.email === email)) {
    return res.status(400).json({ error: "Email já cadastrado" });
  }

  // Criar novo usuário
  const novoUsuario = {
    id: usuarios.length + 1,
    nome,
    email,
    senha,
    tipo,
    telefone,
    data_nascimento,
    ativo: true
  };

  usuarios.push(novoUsuario);
  
  // Criar registro específico baseado no tipo
  if (tipo === 'familiar_cuidador') {
    familiaresCuidadores.push({
      id: familiaresCuidadores.length + 1,
      usuario_id: novoUsuario.id,
      parentesco,
      endereco
    });
  } else if (tipo === 'familiar_contratante') {
    familiaresContratantes.push({
      id: familiaresContratantes.length + 1,
      usuario_id: novoUsuario.id,
      endereco
    });
  } else if (tipo === 'cuidador_profissional') {
    cuidadoresProfissionais.push({
      id: cuidadoresProfissionais.length + 1,
      usuario_id: novoUsuario.id,
      especializacao,
      registro_profissional,
      disponibilidade
    });
  }

  console.log("✅ Usuário cadastrado com sucesso:", novoUsuario.id);
  res.json({ message: "Conta criada com sucesso!", id: novoUsuario.id, tipo: tipo });
});

// Cadastro de paciente simulado
app.post("/api/pacientes", upload.single("foto_perfil"), (req, res) => {
  console.log("=== CADASTRO DE PACIENTE SIMULADO ===");
  console.log("Body recebido:", req.body);
  
  const { nome, data_nascimento, genero, condicao_principal, plano_saude, alergias, historico_medico, familiar_cuidador_id, familiar_contratante_id } = req.body;

  if (!nome || !data_nascimento || (!familiar_cuidador_id && !familiar_contratante_id)) {
    console.log("❌ Campos obrigatórios ausentes");
    return res.status(400).json({ error: "Nome, data de nascimento e pelo menos um ID de familiar são obrigatórios" });
  }

  const novoPaciente = {
    id: pacientes.length + 1,
    nome,
    data_nascimento,
    genero,
    condicao_principal,
    plano_saude,
    alergias,
    historico_medico,
    familiar_cuidador_id: familiar_cuidador_id || null,
    familiar_contratante_id: familiar_contratante_id || null,
    foto_perfil: req.file ? req.file.filename : null
  };

  pacientes.push(novoPaciente);
  
  console.log("✅ Paciente cadastrado com sucesso:", novoPaciente.id);
  res.json({ message: "Paciente cadastrado com sucesso!", id: novoPaciente.id });
});

// Buscar familiar simulado
app.get("/api/familiar/:usuarioId/:tipoUsuario", (req, res) => {
  const usuarioId = parseInt(req.params.usuarioId);
  const tipoUsuario = req.params.tipoUsuario;
  
  console.log(`Buscando familiar ${tipoUsuario} para usuário: ${usuarioId}`);
  
  let familiar = null;
  if (tipoUsuario === 'familiar_cuidador') {
    familiar = familiaresCuidadores.find(f => f.usuario_id === usuarioId);
  } else if (tipoUsuario === 'familiar_contratante') {
    familiar = familiaresContratantes.find(f => f.usuario_id === usuarioId);
  }

  if (!familiar) {
    return res.status(404).json({ error: `Familiar ${tipoUsuario} não encontrado` });
  }

  res.json({ id: familiar.id });
});

// Buscar cuidador profissional simulado
app.get("/api/cuidador/:usuarioId/cuidador_profissional", (req, res) => {
  const usuarioId = parseInt(req.params.usuarioId);
  
  const cuidador = cuidadoresProfissionais.find(c => c.usuario_id === usuarioId);
  
  if (!cuidador) {
    return res.status(404).json({ error: "Cuidador profissional não encontrado" });
  }

  res.json({ id: cuidador.id });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de teste rodando em http://localhost:${PORT}`);
  console.log("📝 Usuários de teste disponíveis:");
  console.log("   - joao@teste.com / 123456 (familiar_cuidador)");
  console.log("   - maria@teste.com / 123456 (familiar_contratante)");
  console.log("   - ana@teste.com / 123456 (cuidador_profissional)");
});
