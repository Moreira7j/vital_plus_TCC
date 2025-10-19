require('dotenv').config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/styles', express.static(path.join(__dirname, 'public/styles')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

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

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "seu_email@gmail.com",
    pass: process.env.EMAIL_PASS || "sua_senha_de_aplicativo"
  }
});

function isEmailConfigured() {
  return process.env.EMAIL_USER && process.env.EMAIL_PASS && 
         process.env.EMAIL_USER !== "seu_email@gmail.com";
}

// Conexão com MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "tcc_user",
  password: "Gu*2025@",
  database: "vital_plus"
});

db.connect(err => {
  if (err) {
    console.error("Erro ao conectar no MySQL:", err);
    return;
  }
  console.log("✅ Conectado ao MySQL!");
});

// ====================== ROTAS PARA ARQUIVOS ESTÁTICOS ====================== //

// Rotas específicas para arquivos CSS e JS
app.get("/styles/:filename", (req, res) => {
  const filename = req.params.filename;
  res.sendFile(path.join(__dirname, "public/styles", filename));
});

app.get("/js/:filename", (req, res) => {
  const filename = req.params.filename;
  res.sendFile(path.join(__dirname, "public/js", filename));
});

app.get("/assets/:filename", (req, res) => {
  const filename = req.params.filename;
  res.sendFile(path.join(__dirname, "public/assets", filename));
});

// ====================== ROTAS PRINCIPAIS ====================== //

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

app.get("/cadastroPaciente", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/cadastroPaciente.html"));
});

// Rotas adicionais para páginas que podem estar sendo acessadas
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

app.get("/esqueciSenha", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/esqueciSenha.html"));
});

app.get("/ativar_conta", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/ativar_conta.html"));
});

// ====================== ROTAS PARA CUIDADOR ====================== //

app.get("/medicamentos_cuidador", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/medicamentos_cuidador.html"));
});

app.get("/atividades_cuidador", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/atividades_cuidador.html"));
});

app.get("/relatorios_cuidador", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/relatorios_cuidador.html"));
});

app.get("/comunicacao_cuidador", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/comunicacao_cuidador.html"));
});

// ====================== ROTAS CORRIGIDAS PARA SUPERVISOR ====================== //

// Rotas para páginas do supervisor - CORREÇÃO
app.get("/relatorios_supervisor.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/relatorios_supervisor.html"));
});

app.get("/alertas_supervisor.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/alertas_supervisor.html"));
});

app.get("/comunicacao_supervisor.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/comunicacao_supervisor.html"));
});

// E também as rotas sem .html para compatibilidade
app.get("/relatorios_supervisor", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/relatorios_supervisor.html"));
});

app.get("/alertas_supervisor", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/alertas_supervisor.html"));
});

app.get("/comunicacao_supervisor", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/comunicacao_supervisor.html"));
});

// ====================== SISTEMA DE CONVITES PARA CUIDADORES ====================== //

// Enviar convite para cuidador
app.post("/api/convites/enviar-convite", (req, res) => {
    const { 
        familiar_contratante_id, 
        cuidador_email, 
        paciente_id, 
        mensagem_personalizada 
    } = req.body;

    if (!familiar_contratante_id || !cuidador_email || !paciente_id) {
        return res.status(400).json({ error: "Dados incompletos para enviar convite" });
    }

    const checkCuidadorQuery = `
        SELECT u.id, u.email, u.tipo 
        FROM usuarios u 
        WHERE u.email = ? AND u.tipo = 'cuidador_profissional'
    `;

    db.query(checkCuidadorQuery, [cuidador_email], (err, cuidadorResults) => {
        if (err) {
            console.error("Erro ao verificar cuidador:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        const checkConviteQuery = `
            SELECT id FROM convites_cuidadores 
            WHERE cuidador_email = ? AND paciente_id = ? AND status = 'pendente'
        `;

        db.query(checkConviteQuery, [cuidador_email, paciente_id], (err, conviteResults) => {
            if (err) {
                console.error("Erro ao verificar convite existente:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            if (conviteResults.length > 0) {
                return res.status(400).json({ error: "Já existe um convite pendente para este cuidador e paciente" });
            }

            const token_convite = crypto.randomBytes(32).toString('hex');
            const expiracao = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            const insertConviteQuery = `
                INSERT INTO convites_cuidadores 
                (familiar_contratante_id, cuidador_email, paciente_id, token_convite, expiracao, mensagem_personalizada)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.query(insertConviteQuery, [
                familiar_contratante_id,
                cuidador_email,
                paciente_id,
                token_convite,
                expiracao,
                mensagem_personalizada || null
            ], (err, result) => {
                if (err) {
                    console.error("Erro ao criar convite:", err);
                    return res.status(500).json({ error: "Erro interno do servidor" });
                }

                const infoQuery = `
                    SELECT 
                        p.nome as paciente_nome,
                        u.nome as familiar_nome,
                        u.email as familiar_email
                    FROM pacientes p
                    INNER JOIN familiares_contratantes fc ON p.familiar_contratante_id = fc.id
                    INNER JOIN usuarios u ON fc.usuario_id = u.id
                    WHERE p.id = ?
                `;

                db.query(infoQuery, [paciente_id], (err, infoResults) => {
                    if (err) {
                        console.error("Erro ao buscar informações:", err);
                    }

                    const info = infoResults[0] || {};
                    
                    if (isEmailConfigured()) {
                        const baseUrl = process.env.BASE_URL || "http://localhost:3000";
                        const mailOptions = {
                            from: process.env.EMAIL_USER,
                            to: cuidador_email,
                            subject: "📋 Convite para Cuidar de um Paciente - Vital+",
                            html: `
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <style>
                                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                                        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                                        .content { padding: 20px; background-color: #f9f9f9; }
                                        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                                        .info-box { background-color: #fff; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
                                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <div class="header">
                                            <h1>🎗️ Convite Vital+</h1>
                                        </div>
                                        <div class="content">
                                            <p>Olá,</p>
                                            <p>Você recebeu um convite para cuidar de um paciente através da plataforma Vital+!</p>
                                            
                                            <div class="info-box">
                                                <p><strong>Informações do Convite:</strong></p>
                                                <p>👤 <strong>Paciente:</strong> ${info.paciente_nome || 'Não informado'}</p>
                                                <p>👨‍👩‍👧‍👦 <strong>Familiar Contratante:</strong> ${info.familiar_nome || 'Não informado'}</p>
                                                <p>📧 <strong>Contato:</strong> ${info.familiar_email || 'Não informado'}</p>
                                                ${mensagem_personalizada ? `<p>💬 <strong>Mensagem:</strong> "${mensagem_personalizada}"</p>` : ''}
                                            </div>
                                            
                                            <p>Para aceitar este convite e começar a cuidar deste paciente, clique no botão abaixo:</p>
                                            <p style="text-align: center;">
                                                <a href="${baseUrl}/aceitar-convite?token=${token_convite}" class="button">✅ Aceitar Convite</a>
                                            </p>
                                            
                                            <p><strong>Opções:</strong></p>
                                            <ul>
                                                <li><strong>Aceitar:</strong> Você será vinculado ao paciente e terá acesso completo ao sistema</li>
                                                <li><strong>Recusar:</strong> Você pode recusar o convite na plataforma após fazer login</li>
                                                <li><strong>Ignorar:</strong> O convite expirará automaticamente em 7 dias</li>
                                            </ul>
                                            
                                            <p><strong>Importante:</strong> Se você ainda não possui conta no Vital+, será criada uma automaticamente quando aceitar o convite.</p>
                                            
                                            <p>Este convite expira em: ${expiracao.toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <div class="footer">
                                            <p>Vital+ - Sistema de Acompanhamento para Cuidadores</p>
                                            <p>Este é um e-mail automático, por favor não responda.</p>
                                        </div>
                                    </div>
                                </body>
                                </html>
                            `
                        };

                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                console.error("Erro ao enviar e-mail de convite:", error);
                            } else {
                                console.log("E-mail de convite enviado com sucesso:", info.response);
                            }
                        });
                    }

                    res.json({ 
                        success: true, 
                        message: "Convite enviado com sucesso!",
                        token_convite: token_convite,
                        cuidador_existente: cuidadorResults.length > 0
                    });
                });
            });
        });
    });
});

// Verificar convite
app.get("/api/convites/verificar/:token", (req, res) => {
    const token = req.params.token;

    const query = `
        SELECT 
            c.*,
            p.nome as paciente_nome,
            p.condicao_principal,
            u.nome as familiar_nome,
            u.email as familiar_email,
            u.telefone as familiar_telefone
        FROM convites_cuidadores c
        INNER JOIN pacientes p ON c.paciente_id = p.id
        INNER JOIN familiares_contratantes fc ON c.familiar_contratante_id = fc.id
        INNER JOIN usuarios u ON fc.usuario_id = u.id
        WHERE c.token_convite = ? AND c.status = 'pendente' AND c.expiracao > NOW()
    `;

    db.query(query, [token], (err, results) => {
        if (err) {
            console.error("Erro ao verificar convite:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Convite não encontrado, expirado ou já utilizado" });
        }

        res.json(results[0]);
    });
});

// Aceitar convite
app.post("/api/convites/aceitar", (req, res) => {
    const { token, cuidador_nome, cuidador_telefone, cuidador_senha } = req.body;

    if (!token) {
        return res.status(400).json({ error: "Token do convite é obrigatório" });
    }

    if (!cuidador_senha) {
        return res.status(400).json({ error: "Senha é obrigatória" });
    }

    const checkQuery = `
        SELECT * FROM convites_cuidadores 
        WHERE token_convite = ? AND status = 'pendente' AND expiracao > NOW()
    `;

    db.query(checkQuery, [token], (err, results) => {
        if (err) {
            console.error("Erro ao verificar convite:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Convite não encontrado, expirado ou já utilizado" });
        }

        const convite = results[0];

        const checkEmailQuery = "SELECT id, senha FROM usuarios WHERE email = ?";
        db.query(checkEmailQuery, [convite.cuidador_email], (err, emailResults) => {
            if (err) {
                console.error("Erro ao verificar email:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            let usuarioCuidadorId;

            if (emailResults.length > 0) {
                usuarioCuidadorId = emailResults[0].id;
                console.log("📧 Usuário existente encontrado. Atualizando senha...");
                
                const updateUsuarioQuery = "UPDATE usuarios SET tipo = 'cuidador_profissional', senha = ?, ativo = TRUE WHERE id = ?";
                
                db.query(updateUsuarioQuery, [cuidador_senha, usuarioCuidadorId], (err) => {
                    if (err) {
                        console.error("❌ Erro ao atualizar usuário:", err);
                        return res.status(500).json({ error: "Erro ao atualizar dados do usuário" });
                    }
                    
                    console.log("✅ Senha do usuário existente atualizada para:", cuidador_senha);
                    
                    const checkVinculoQuery = `
                        SELECT cpp.id 
                        FROM cuidadores_profissionais cp
                        INNER JOIN cuidadores_profissionais_pacientes cpp ON cp.id = cpp.cuidador_profissional_id
                        WHERE cp.usuario_id = ? AND cpp.paciente_id = ?
                    `;
                    
                    db.query(checkVinculoQuery, [usuarioCuidadorId, convite.paciente_id], (err, vinculoResults) => {
                        if (err) {
                            console.error("Erro ao verificar vínculo:", err);
                        }
                        
                        if (vinculoResults.length === 0) {
                            vincularCuidadorPaciente(usuarioCuidadorId, convite, token, res);
                        } else {
                            atualizarConviteAceito(token, res, usuarioCuidadorId);
                        }
                    });
                });
                
            } else {
                const senha = cuidador_senha;
                const nome = cuidador_nome || convite.cuidador_email.split('@')[0];
                
                console.log("👤 Criando novo usuário com senha:", senha);
                
                const insertUsuarioQuery = `
                    INSERT INTO usuarios (nome, email, senha, tipo, telefone, ativo)
                    VALUES (?, ?, ?, 'cuidador_profissional', ?, TRUE)
                `;

                db.query(insertUsuarioQuery, [nome, convite.cuidador_email, senha, cuidador_telefone], (err, usuarioResult) => {
                    if (err) {
                        console.error("❌ Erro ao criar usuário cuidador:", err);
                        return res.status(500).json({ error: "Erro interno do servidor" });
                    }

                    usuarioCuidadorId = usuarioResult.insertId;
                    console.log("✅ Novo usuário criado com ID:", usuarioCuidadorId);

                    const insertCuidadorQuery = `
                        INSERT INTO cuidadores_profissionais (usuario_id, especializacao, disponibilidade)
                        VALUES (?, 'A definir', 'A combinar')
                    `;

                    db.query(insertCuidadorQuery, [usuarioCuidadorId], (err) => {
                        if (err) {
                            console.error("❌ Erro ao criar cuidador profissional:", err);
                            return res.status(500).json({ error: "Erro ao criar perfil do cuidador" });
                        }
                        
                        console.log("✅ Cuidador profissional criado");
                        vincularCuidadorPaciente(usuarioCuidadorId, convite, token, res);
                    });
                });
            }
        });
    });
});

// Função auxiliar para vincular cuidador ao paciente
function vincularCuidadorPaciente(usuarioCuidadorId, convite, token, res) {
    const getCuidadorIdQuery = "SELECT id FROM cuidadores_profissionais WHERE usuario_id = ?";
    
    db.query(getCuidadorIdQuery, [usuarioCuidadorId], (err, cuidadorResults) => {
        if (err) {
            console.error("❌ Erro ao buscar ID do cuidador:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (cuidadorResults.length === 0) {
            console.error("❌ Cuidador profissional não encontrado para usuário:", usuarioCuidadorId);
            return res.status(500).json({ error: "Erro ao vincular cuidador" });
        }

        const cuidadorProfissionalId = cuidadorResults[0].id;

        const vinculoQuery = `
            INSERT INTO cuidadores_profissionais_pacientes (cuidador_profissional_id, paciente_id, cuidador_principal, data_inicio, status_vinculo)
            VALUES (?, ?, TRUE, CURDATE(), 'ativo')
        `;

        db.query(vinculoQuery, [cuidadorProfissionalId, convite.paciente_id], (err) => {
            if (err) {
                console.error("❌ Erro ao criar vínculo:", err);
                return res.status(500).json({ error: "Erro ao vincular cuidador ao paciente" });
            }

            console.log("✅ Cuidador vinculado ao paciente");
            atualizarConviteAceito(token, res, usuarioCuidadorId);
        });
    });
}

// Função para atualizar status do convite
function atualizarConviteAceito(token, res, usuarioCuidadorId) {
    const updateConviteQuery = `
        UPDATE convites_cuidadores 
        SET status = 'aceito', data_resposta = NOW() 
        WHERE token_convite = ?
    `;

    db.query(updateConviteQuery, [token], (err) => {
        if (err) {
            console.error("❌ Erro ao atualizar convite:", err);
            return res.status(500).json({ error: "Erro ao finalizar convite" });
        }

        console.log("🎉 CONVITE ACEITO COM SUCESSO!");
        console.log("👤 Usuário ID:", usuarioCuidadorId);
        
        res.json({ 
            success: true, 
            message: "Convite aceito com sucesso!",
            usuario_id: usuarioCuidadorId
        });
    });
}

// Recusar convite
app.post("/api/convites/recusar", (req, res) => {
    const { token } = req.body;

    const updateQuery = `
        UPDATE convites_cuidadores 
        SET status = 'recusado', data_resposta = NOW() 
        WHERE token_convite = ? AND status = 'pendente'
    `;

    db.query(updateQuery, [token], (err, result) => {
        if (err) {
            console.error("Erro ao recusar convite:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Convite não encontrado ou já processado" });
        }

        res.json({ success: true, message: "Convite recusado com sucesso" });
    });
});

// Listar convites do familiar
app.get("/api/familiares/:familiar_id/convites", (req, res) => {
    const familiar_id = req.params.familiar_id;

    const query = `
        SELECT 
            c.*,
            p.nome as paciente_nome,
            u.nome as cuidador_nome
        FROM convites_cuidadores c
        INNER JOIN pacientes p ON c.paciente_id = p.id
        LEFT JOIN usuarios u ON c.cuidador_email = u.email
        WHERE c.familiar_contratante_id = ?
        ORDER BY c.data_convite DESC
    `;

    db.query(query, [familiar_id], (err, results) => {
        if (err) {
            console.error("Erro ao buscar convites:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        res.json(results);
    });
});

// Rota para página de aceitar convite
app.get("/aceitar-convite", (req, res) => {
    res.sendFile(path.join(__dirname, "public/paginas/aceitar-convite.html"));
});

// ====================== APIS PRINCIPAIS ====================== //

// Login - CORRIGIDO: Cuidador vai para dependentes.html
app.post("/api/login", (req, res) => {
  const { email, senha } = req.body;
  console.log("=== TENTATIVA DE LOGIN ===");
  console.log("Email:", email);

  if (!email || !senha) {
    console.log("❌ Campos obrigatórios ausentes");
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  const query = "SELECT * FROM usuarios WHERE email = ? AND ativo = TRUE";
  
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error("❌ Erro na consulta do banco:", err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
    
    console.log("Resultados encontrados:", results.length);
    
    if (results.length === 0) {
      console.log("❌ Usuário não encontrado ou inativo");
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }

    const usuario = results[0];
    
    console.log("Verificando senha...");
    
    if (usuario.senha !== senha) {
      console.log("❌ Senha incorreta");
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }

    console.log("✅ Login bem-sucedido para:", usuario.nome);
    
    let redirectUrl = "/";
    
    if (usuario.tipo === 'familiar_cuidador') {
      redirectUrl = "/dependentes";
    } else if (usuario.tipo === 'familiar_contratante') {
      redirectUrl = "/dependentes";
    } else if (usuario.tipo === 'cuidador_profissional') {
      redirectUrl = "/dependentes"; // CORREÇÃO: Cuidador vai para dependentes.html
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
});

// Cadastro de usuário - MODIFICADO: Cuidador profissional sem senha temporária
app.post("/api/cadastrar", (req, res) => {
    const { nome, email, senha, tipo, telefone, data_nascimento, parentesco, endereco, especializacao, registro_profissional, disponibilidade } = req.body;
  console.log("Request body:", req.body);
  console.log("Tentativa de cadastro:", nome, email, tipo);

  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }

  const query = `
    INSERT INTO usuarios (nome, email, senha, tipo, telefone, data_nascimento, ativo)
    VALUES (?, ?, ?, ?, ?, ?, TRUE)
  `;
  
  db.query(query, [nome, email, senha, tipo, telefone, data_nascimento], (err, results) => {
    if (err) {
      console.error("Erro no cadastro:", err);
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "Email já cadastrado" });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
    
    const usuarioId = results.insertId;
    
    if (tipo === 'familiar_cuidador') {
      const familiarCuidadorQuery = "INSERT INTO familiares_cuidadores (usuario_id, parentesco, endereco) VALUES (?, ?, ?)";
      db.query(familiarCuidadorQuery, [usuarioId, parentesco, endereco], (err2) => {
        if (err2) {
          console.error("Erro ao criar familiar cuidador:", err2);
          return res.status(500).json({ error: "Erro ao criar dados do familiar cuidador" });
        }
        console.log("Familiar cuidador cadastrado com sucesso:", usuarioId);
        res.json({ message: "Conta criada com sucesso!", id: usuarioId, tipo: tipo });
      });
    } else if (tipo === 'familiar_contratante') {
      const familiarContratanteQuery = "INSERT INTO familiares_contratantes (usuario_id, endereco) VALUES (?, ?)";
      db.query(familiarContratanteQuery, [usuarioId, endereco], (err2) => {
        if (err2) {
          console.error("Erro ao criar familiar contratante:", err2);
          return res.status(500).json({ error: "Erro ao criar dados do familiar contratante" });
        }
        console.log("Familiar contratante cadastrado com sucesso:", usuarioId);
        res.json({ message: "Conta criada com sucesso!", id: usuarioId, tipo: tipo });
      });
    } else if (tipo === 'cuidador_profissional') {
      const cuidadorProfissionalQuery = "INSERT INTO cuidadores_profissionais (usuario_id, especializacao, registro_profissional, disponibilidade) VALUES (?, ?, ?, ?)";
      db.query(cuidadorProfissionalQuery, [usuarioId, especializacao, registro_profissional, disponibilidade], (err2) => {
        if (err2) {
          console.error("Erro ao criar cuidador profissional:", err2);
          return res.status(500).json({ error: "Erro ao criar dados do cuidador profissional" });
        }
        console.log("Cuidador profissional cadastrado com sucesso:", usuarioId);

        // E-mail de confirmação (sem ativação, pois já tem senha)
        if (isEmailConfigured()) {
          const baseUrl = process.env.BASE_URL || "http://localhost:3000";
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Bem-vindo ao Vital+! Sua conta de Cuidador Profissional foi criada",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                  .content { padding: 20px; background-color: #f9f9f9; }
                  .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                  .credentials { background-color: #fff; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
                  .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Bem-vindo ao Vital+!</h1>
                  </div>
                  <div class="content">
                    <p>Olá <strong>${nome}</strong>,</p>
                    <p>Sua conta de Cuidador Profissional no Vital+ foi criada com sucesso!</p>
                    
                    <div class="credentials">
                      <p><strong>Suas credenciais de acesso:</strong></p>
                      <p>E-mail: <strong>${email}</strong></p>
                      <p>Senha: <strong>*** (a senha que você escolheu)</strong></p>
                    </div>
                    
                    <p>Para acessar sua conta, clique no botão abaixo:</p>
                    <p style="text-align: center;">
                      <a href="${baseUrl}" class="button">Acessar Vital+</a>
                    </p>
                    
                    <p>Obrigado por fazer parte do Vital+!</p>
                  </div>
                  <div class="footer">
                    <p>Vital+ - Sistema de Acompanhamento para Cuidadores</p>
                    <p>Este é um e-mail automático, por favor não responda.</p>
                  </div>
                </div>
              </body>
              </html>
            `
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error("Erro ao enviar e-mail de confirmação:", error);
            } else {
              console.log("E-mail de confirmação enviado com sucesso:", info.response);
            }
          });
        }
        
        res.json({ 
          message: "Conta criada com sucesso!", 
          id: usuarioId, 
          tipo: tipo 
        });
      });
    } else {
      console.log("Usuário cadastrado com sucesso:", usuarioId);
      res.json({ message: "Conta criada com sucesso!", id: usuarioId, tipo: tipo });
    }
  });
});

// ====================== ROTA ESPECÍFICA PARA CADASTRO COMPLETO DO FAMILIAR CONTRATANTE ====================== //
app.post("/api/cadastro-completo-familiar-contratante", upload.single("foto_perfil"), (req, res) => {
  console.log("=== CADASTRO COMPLETO FAMILIAR CONTRATANTE ===");
  console.log("Body recebido:", req.body);

  const { 
    familiar_nome, 
    familiar_email, 
    familiar_senha, 
    familiar_telefone, 
    familiar_data_nascimento, 
    familiar_parentesco, 
    familiar_endereco,
    
    dependente_nome,
    dependente_data_nascimento,
    dependente_genero,
    dependente_condicao_principal,
    dependente_plano_saude,
    dependente_alergias,
    dependente_historico_medico,
    dependente_contato_emergencia,
    
    cuidador_nome,
    cuidador_email,
    cuidador_telefone,
    cuidador_cpf,
    cuidador_especializacao,
    cuidador_registro_profissional,
    cuidador_experiencia,
    cuidador_disponibilidade
    // REMOVIDO: cuidador_senha - O cuidador vai escolher a senha depois
  } = req.body;

  console.log("1. Cadastrando familiar contratante...");
  const usuarioFamiliarQuery = `
    INSERT INTO usuarios (nome, email, senha, tipo, telefone, data_nascimento)
    VALUES (?, ?, ?, 'familiar_contratante', ?, ?)
  `;
  
  db.query(usuarioFamiliarQuery, [familiar_nome, familiar_email, familiar_senha, familiar_telefone, familiar_data_nascimento], (err, usuarioFamiliarResult) => {
    if (err) {
      console.error("Erro ao cadastrar familiar:", err);
      return res.status(500).json({ error: "Erro ao cadastrar familiar contratante" });
    }
    
    const usuarioFamiliarId = usuarioFamiliarResult.insertId;
    console.log("Familiar usuario ID:", usuarioFamiliarId);

    const familiarContratanteQuery = "INSERT INTO familiares_contratantes (usuario_id, endereco) VALUES (?, ?)";
    db.query(familiarContratanteQuery, [usuarioFamiliarId, familiar_endereco], (err2, familiarContratanteResult) => {
      if (err2) {
        console.error("Erro ao criar familiar contratante:", err2);
        return res.status(500).json({ error: "Erro ao criar dados do familiar contratante" });
      }
      
      const familiarContratanteId = familiarContratanteResult.insertId;
      console.log("Familiar contratante ID:", familiarContratanteId);

      console.log("3. Cadastrando paciente/dependente...");
      const foto_perfil = req.file ? req.file.filename : null;
      
      const pacienteQuery = `
        INSERT INTO pacientes (nome, data_nascimento, genero, condicao_principal, plano_saude, alergias, historico_medico, contato_emergencia, foto_perfil, familiar_contratante_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.query(pacienteQuery, [
        dependente_nome,
        dependente_data_nascimento,
        dependente_genero,
        dependente_condicao_principal,
        dependente_plano_saude,
        dependente_alergias,
        dependente_historico_medico,
        dependente_contato_emergencia,
        foto_perfil,
        familiarContratanteId
      ], (err5, pacienteResult) => {
        if (err5) {
          console.error("Erro ao cadastrar paciente:", err5);
          return res.status(500).json({ error: "Erro ao cadastrar paciente" });
        }
        
        const pacienteId = pacienteResult.insertId;
        console.log("Paciente ID:", pacienteId);

        console.log("4. Enviando convite para o cuidador...");
        const token_convite = crypto.randomBytes(32).toString('hex');
        const expiracao = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const insertConviteQuery = `
          INSERT INTO convites_cuidadores 
          (familiar_contratante_id, cuidador_email, paciente_id, token_convite, expiracao, mensagem_personalizada)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        const mensagem_personalizada = `Convite para cuidar de ${dependente_nome} - Cadastro completo realizado por ${familiar_nome}`;

        db.query(insertConviteQuery, [
          familiarContratanteId,
          cuidador_email,
          pacienteId,
          token_convite,
          expiracao,
          mensagem_personalizada
        ], (err6, conviteResult) => {
          if (err6) {
            console.error("Erro ao criar convite:", err6);
            return res.status(500).json({ error: "Erro ao criar convite para o cuidador" });
          }

          console.log("✅ Cadastro familiar e paciente realizado! Convite enviado para o cuidador.");
          
          // E-MAIL DE CONVITE PARA O CUIDADOR (ele vai escolher a senha depois)
          if (isEmailConfigured()) {
            const baseUrl = process.env.BASE_URL || "http://localhost:3000";
            const mailOptions = {
              from: process.env.EMAIL_USER,
              to: cuidador_email,
              subject: "📋 Convite para Cuidar de um Paciente - Vital+",
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                    .info-box { background-color: #fff; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>🎗️ Convite Vital+</h1>
                    </div>
                    <div class="content">
                      <p>Olá,</p>
                      <p>Você recebeu um convite para cuidar de um paciente através da plataforma Vital+!</p>
                      
                      <div class="info-box">
                        <p><strong>Informações do Convite:</strong></p>
                        <p>👤 <strong>Paciente:</strong> ${dependente_nome}</p>
                        <p>👨‍👩‍👧‍👦 <strong>Familiar Contratante:</strong> ${familiar_nome}</p>
                        <p>📧 <strong>Contato:</strong> ${familiar_email}</p>
                        <p>📞 <strong>Telefone:</strong> ${familiar_telefone}</p>
                      </div>
                      
                      <p>Para aceitar este convite e criar sua conta, clique no botão abaixo:</p>
                      <p style="text-align: center;">
                        <a href="${baseUrl}/aceitar-convite?token=${token_convite}" class="button">✅ Aceitar Convite e Criar Conta</a>
                      </p>
                      
                      <p><strong>O que acontece quando você aceitar:</strong></p>
                      <ul>
                        <li>✅ Você criará sua conta no Vital+</li>
                        <li>✅ Escolherá sua própria senha</li>
                        <li>✅ Será vinculado automaticamente ao paciente</li>
                        <li>✅ Terá acesso completo ao sistema</li>
                      </ul>
                      
                      <p><strong>Importante:</strong> Este convite expira em ${expiracao.toLocaleDateString('pt-BR')}</p>
                      
                      <p>Se você não deseja aceitar este convite, por favor ignore este e-mail.</p>
                    </div>
                    <div class="footer">
                      <p>Vital+ - Sistema de Acompanhamento para Cuidadores</p>
                      <p>Este é um e-mail automático, por favor não responda.</p>
                    </div>
                  </div>
                </body>
                </html>
              `
            };

            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.error("Erro ao enviar e-mail de convite:", error);
              } else {
                console.log("E-mail de convite enviado com sucesso:", info.response);
              }
            });
          }
          
          res.json({ 
            success: true,
            message: "Cadastro realizado com sucesso! Familiar e dependente registrados. Um convite foi enviado para o cuidador criar sua conta.",
            ids: {
              familiar: usuarioFamiliarId,
              paciente: pacienteId
            },
            convite_enviado: true
          });
        });
      });
    });
  });
});

// ====================== NOVA ROTA: PACIENTES DO CUIDADOR ====================== //
app.get("/api/cuidadores/:usuarioId/pacientes", (req, res) => {
  const usuarioId = req.params.usuarioId;
  console.log(`Buscando pacientes para cuidador com usuario_id: ${usuarioId}`);

  const query = `
    SELECT 
      p.*,
      u.nome as familiar_nome,
      u.telefone as familiar_telefone
    FROM pacientes p
    INNER JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id
    INNER JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
    INNER JOIN familiares_contratantes fc ON p.familiar_contratante_id = fc.id
    INNER JOIN usuarios u ON fc.usuario_id = u.id
    WHERE cp.usuario_id = ? AND cpp.status_vinculo = 'ativo' AND p.ativo = TRUE
  `;
  
  db.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar pacientes do cuidador:", err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
    
    console.log(`Pacientes encontrados para cuidador ${usuarioId}:`, results.length);
    res.json(results);
  });
});

// Cadastro de paciente individual
app.post("/api/pacientes", upload.single("foto_perfil"), (req, res) => {
  console.log("=== CADASTRO DE PACIENTE INDIVIDUAL ===");
  console.log("Body recebido:", req.body);
  console.log("Arquivo recebido:", req.file);
  
  const { nome, data_nascimento, genero, condicao_principal, plano_saude, alergias, historico_medico, contato_emergencia, familiar_cuidador_id, familiar_contratante_id, cuidador_profissional_id } = req.body;

  console.log("Validando campos obrigatórios:");
  console.log("- Nome:", nome ? "✓" : "✗");
  console.log("- Data nascimento:", data_nascimento ? "✓" : "✗");
  console.log("- Familiar cuidador ID:", familiar_cuidador_id ? "✓" : "✗");
  console.log("- Familiar contratante ID:", familiar_contratante_id ? "✓" : "✗");

  if (!nome || !data_nascimento || (!familiar_cuidador_id && !familiar_contratante_id)) {
    console.log("❌ Campos obrigatórios ausentes");
    return res.status(400).json({ 
      error: "Nome, data de nascimento e pelo menos um ID de familiar são obrigatórios"
    });
  }

  const foto_perfil = req.file ? req.file.filename : null;

  const query = `
    INSERT INTO pacientes (nome, data_nascimento, genero, condicao_principal, plano_saude, alergias, historico_medico, contato_emergencia, foto_perfil, familiar_cuidador_id, familiar_contratante_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  console.log("Executando query com dados:", [nome, data_nascimento, genero, condicao_principal, plano_saude, alergias, historico_medico, contato_emergencia, foto_perfil, familiar_cuidador_id, familiar_contratante_id]);
  
  db.query(query, [nome, data_nascimento, genero, condicao_principal, plano_saude, alergias, historico_medico, contato_emergencia, foto_perfil, familiar_cuidador_id, familiar_contratante_id], (err, results) => {
    if (err) {
      console.error("Erro ao cadastrar paciente:", err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
    
    const pacienteId = results.insertId;
    console.log("Paciente cadastrado com sucesso! ID:", pacienteId);
    
    if (cuidador_profissional_id) {
      const vinculoQuery = `
        INSERT INTO cuidadores_profissionais_pacientes (cuidador_profissional_id, paciente_id, cuidador_principal, data_inicio, status_vinculo)
        VALUES (?, ?, TRUE, CURDATE(), 'ativo')
      `;
      
      db.query(vinculoQuery, [cuidador_profissional_id, pacienteId], (err2) => {
        if (err2) {
          console.error("Erro ao criar vínculo cuidador-paciente:", err2);
        } else {
          console.log("Vínculo cuidador-paciente criado com sucesso!");
        }
      });
    }
    
    res.json({ message: "Paciente cadastrado com sucesso!", id: pacienteId });
  });
});

// Buscar familiar por usuário
app.get("/api/familiar/:usuarioId/:tipoUsuario", (req, res) => {
  const usuarioId = req.params.usuarioId;
  const tipoUsuario = req.params.tipoUsuario;
  console.log(`Buscando familiar ${tipoUsuario} para usuário: ${usuarioId}`);
  
  let query = "";
  if (tipoUsuario === 'familiar_cuidador') {
    query = "SELECT id FROM familiares_cuidadores WHERE usuario_id = ?";
  } else if (tipoUsuario === 'familiar_contratante') {
    query = "SELECT id FROM familiares_contratantes WHERE usuario_id = ?";
  } else {
    return res.status(400).json({ error: "Tipo de usuário inválido" });
  }

  db.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar familiar:", err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
    if (results.length === 0) {
      console.log(`Familiar ${tipoUsuario} não encontrado para usuário: ${usuarioId}`);
      return res.status(404).json({ error: `Familiar ${tipoUsuario} não encontrado` });
    }
    console.log(`Familiar ${tipoUsuario} encontrado:`, results[0]);
    res.json(results[0]);
  });
});

// Buscar cuidador profissional por usuário
app.get("/api/cuidador/:usuarioId/cuidador_profissional", (req, res) => {
  const usuarioId = req.params.usuarioId;
  console.log(`Buscando cuidador profissional para usuário: ${usuarioId}`);
  
  const query = "SELECT id FROM cuidadores_profissionais WHERE usuario_id = ?";
  
  db.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar cuidador profissional:", err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
    if (results.length === 0) {
      console.log(`Cuidador profissional não encontrado para usuário: ${usuarioId}`);
      return res.status(404).json({ error: "Cuidador profissional não encontrado" });
    }
    console.log(`Cuidador profissional encontrado:`, results[0]);
    res.json(results[0]);
  });
});

// Listar pacientes de um familiar
app.get("/api/familiares/:usuarioId/pacientes_cuidador", (req, res) => {
  const usuarioId = req.params.usuarioId;
  console.log(`Buscando pacientes para familiar cuidador com usuario_id: ${usuarioId}`);

  const getFamiliarCuidadorIdQuery = "SELECT id FROM familiares_cuidadores WHERE usuario_id = ?";
  db.query(getFamiliarCuidadorIdQuery, [usuarioId], (err, familiarResults) => {
    if (err) {
      console.error("Erro ao buscar familiar cuidador ID:", err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
    if (familiarResults.length === 0) {
      return res.status(404).json({ error: "Familiar cuidador não encontrado" });
    }
    const familiarCuidadorId = familiarResults[0].id;

    const query = "SELECT * FROM pacientes WHERE ativo = TRUE AND familiar_cuidador_id = ?";
    db.query(query, [familiarCuidadorId], (err, results) => {
      if (err) {
        console.error("Erro ao buscar pacientes para familiar cuidador:", err);
        return res.status(500).json({ error: "Erro interno do servidor" });
      }
      console.log("Pacientes encontrados para familiar cuidador:", results.length);
      res.json(results);
    });
  });
});

app.get("/api/familiares/:usuarioId/pacientes_contratante", (req, res) => {
  const usuarioId = req.params.usuarioId;
  console.log(`Buscando pacientes para familiar contratante com usuario_id: ${usuarioId}`);

  const getFamiliarContratanteIdQuery = "SELECT id FROM familiares_contratantes WHERE usuario_id = ?";
  db.query(getFamiliarContratanteIdQuery, [usuarioId], (err, familiarResults) => {
    if (err) {
      console.error("Erro ao buscar familiar contratante ID:", err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
    if (familiarResults.length === 0) {
      return res.status(404).json({ error: "Familiar contratante não encontrado" });
    }
    const familiarContratanteId = familiarResults[0].id;

    const query = "SELECT * FROM pacientes WHERE ativo = TRUE AND familiar_contratante_id = ?";
    db.query(query, [familiarContratanteId], (err, results) => {
      if (err) {
        console.error("Erro ao buscar pacientes para familiar contratante:", err);
        return res.status(500).json({ error: "Erro interno do servidor" });
      }
      console.log("Pacientes encontrados para familiar contratante:", results.length);
      res.json(results);
    });
  });
});

app.get("/ativar_conta", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/ativar_conta.html"));
});

app.post("/api/ativar_conta", (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token e nova senha são obrigatórios." });
  }

  const checkUserQuery = "SELECT id, tipo FROM usuarios WHERE id = ? AND tipo = 'cuidador_profissional'";
  db.query(checkUserQuery, [token], (err, results) => {
    if (err) {
      console.error("Erro ao verificar usuário para ativação:", err);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Usuário ou token inválido para ativação." });
    }

    const updatePasswordQuery = "UPDATE usuarios SET senha = ?, ativo = TRUE WHERE id = ?";
    db.query(updatePasswordQuery, [newPassword, token], (err2) => {
      if (err2) {
        console.error("Erro ao atualizar senha e ativar conta:", err2);
        return res.status(500).json({ error: "Erro interno do servidor ao ativar conta." });
      }
      res.json({ message: "Conta ativada e senha definida com sucesso!" });
    });
  });
});

// Buscar cuidador de um paciente
app.get("/api/pacientes/:pacienteId/cuidador", (req, res) => {
    const pacienteId = req.params.pacienteId;
    
    const query = `
        SELECT u.nome, u.telefone 
        FROM usuarios u
        INNER JOIN cuidadores_profissionais cp ON u.id = cp.usuario_id
        INNER JOIN cuidadores_profissionais_pacientes cpp ON cp.id = cpp.cuidador_profissional_id
        WHERE cpp.paciente_id = ? AND cpp.status_vinculo = 'ativo'
        LIMIT 1
    `;
    
    db.query(query, [pacienteId], (err, results) => {
        if (err) {
            console.error("Erro ao buscar cuidador:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: "Cuidador não encontrado" });
        }
        
        res.json(results[0]);
    });
});

// Buscar paciente vinculado ao cuidador
app.get("/api/cuidadores/:cuidadorId/paciente", (req, res) => {
    const cuidadorId = req.params.cuidadorId;
    
    console.log(`Buscando paciente para cuidador: ${cuidadorId}`);
    
    const query = `
        SELECT 
            p.*,
            u.nome as familiar_nome,
            u.telefone as familiar_telefone
        FROM pacientes p
        INNER JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id
        INNER JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
        INNER JOIN familiares_contratantes fc ON p.familiar_contratante_id = fc.id
        INNER JOIN usuarios u ON fc.usuario_id = u.id
        WHERE cp.usuario_id = ? AND cpp.status_vinculo = 'ativo'
        LIMIT 1
    `;
    
    db.query(query, [cuidadorId], (err, results) => {
        if (err) {
            console.error("Erro ao buscar paciente do cuidador:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        if (results.length === 0) {
            console.log(`Nenhum paciente encontrado para cuidador: ${cuidadorId}`);
            return res.status(404).json({ error: "Nenhum paciente vinculado encontrado" });
        }
        
        console.log(`Paciente encontrado:`, results[0].nome);
        res.json(results[0]);
    });
});

// ====================== ROTAS PARA ATIVIDADES DO CUIDADOR ====================== //

// CORREÇÃO: Rota para atividades do cuidador - COMPLETA E FUNCIONAL
app.get("/api/cuidadores/:cuidadorId/atividades", (req, res) => {
    const cuidadorId = req.params.cuidadorId;
    
    console.log(`Buscando atividades para cuidador: ${cuidadorId}`);
    
    // Query corrigida - busca atividades do paciente vinculado ao cuidador
    const query = `
        SELECT 
            a.*,
            p.nome as paciente_nome,
            a.status as status_atividade
        FROM atividades a
        INNER JOIN pacientes p ON a.paciente_id = p.id
        INNER JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id
        INNER JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
        WHERE cp.usuario_id = ? AND cpp.status_vinculo = 'ativo'
        ORDER BY a.data_prevista DESC
    `;
    
    db.query(query, [cuidadorId], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar atividades:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        console.log(`✅ ${results.length} atividades encontradas para cuidador ${cuidadorId}`);
        res.json(results);
    });
});

// ====================== ROTAS PARA SUPERVISOR ====================== //

// Relatórios do supervisor
app.get("/api/supervisor/:familiarId/relatorios", (req, res) => {
    const familiarId = req.params.familiarId;
    
    const query = `
        SELECT 
            r.*,
            p.nome as paciente_nome
        FROM relatorios r
        INNER JOIN pacientes p ON r.paciente_id = p.id
        WHERE p.familiar_contratante_id = ? OR p.familiar_cuidador_id = ?
        ORDER BY r.data_criacao DESC
    `;
    
    db.query(query, [familiarId, familiarId], (err, results) => {
        if (err) {
            console.error("Erro ao buscar relatórios:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        res.json(results);
    });
});

// Comunicação do supervisor
app.get("/api/supervisor/:familiarId/comunicacao", (req, res) => {
    const familiarId = req.params.familiarId;
    
    const query = `
        SELECT 
            m.*,
            u.nome as remetente_nome,
            u.tipo as remetente_tipo,
            p.nome as paciente_nome
        FROM mensagens m
        LEFT JOIN usuarios u ON m.remetente_id = u.id
        LEFT JOIN pacientes p ON m.paciente_id = p.id
        WHERE (p.familiar_contratante_id = ? OR p.familiar_cuidador_id = ?)
        ORDER BY m.data_envio DESC
        LIMIT 50
    `;
    
    db.query(query, [familiarId, familiarId], (err, results) => {
        if (err) {
            console.error("Erro ao buscar mensagens:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        res.json(results);
    });
});

// Alertas do supervisor
app.get("/api/supervisor/:familiarId/alertas", (req, res) => {
    const familiarId = req.params.familiarId;
    
    const query = `
        SELECT 
            a.*,
            p.nome as paciente_nome,
            u.nome as cuidador_nome,
            a.prioridade,
            a.status as status_alerta
        FROM alertas a
        INNER JOIN pacientes p ON a.paciente_id = p.id
        LEFT JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id
        LEFT JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
        LEFT JOIN usuarios u ON cp.usuario_id = u.id
        WHERE (p.familiar_contratante_id = ? OR p.familiar_cuidador_id = ?)
        ORDER BY a.data_criacao DESC
    `;
    
    db.query(query, [familiarId, familiarId], (err, results) => {
        if (err) {
            console.error("Erro ao buscar alertas:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        res.json(results || []);
    });
});

// ====================== ROTAS PARA CUIDADOR ====================== //

// Medicamentos do cuidador
app.get("/api/cuidadores/:cuidadorId/medicamentos", (req, res) => {
    const cuidadorId = req.params.cuidadorId;
    
    const query = `
        SELECT 
            m.*,
            p.nome as paciente_nome
        FROM medicamentos m
        INNER JOIN pacientes p ON m.paciente_id = p.id
        INNER JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id
        INNER JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
        WHERE cp.usuario_id = ? AND m.ativo = TRUE
        ORDER BY m.horario
    `;
    
    db.query(query, [cuidadorId], (err, results) => {
        if (err) {
            console.error("Erro ao buscar medicamentos:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        res.json(results);
    });
});

// Relatórios do cuidador
app.get("/api/cuidadores/:cuidadorId/relatorios", (req, res) => {
    const cuidadorId = req.params.cuidadorId;
    
    const query = `
        SELECT 
            r.*,
            p.nome as paciente_nome
        FROM relatorios r
        INNER JOIN pacientes p ON r.paciente_id = p.id
        INNER JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id
        INNER JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
        WHERE cp.usuario_id = ?
        ORDER BY r.data_criacao DESC
    `;
    
    db.query(query, [cuidadorId], (err, results) => {
        if (err) {
            console.error("Erro ao buscar relatórios:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        res.json(results);
    });
});

// Comunicação do cuidador
app.get("/api/cuidadores/:cuidadorId/comunicacao", (req, res) => {
    const cuidadorId = req.params.cuidadorId;
    
    const query = `
        SELECT 
            m.*,
            u.nome as remetente_nome,
            u.tipo as remetente_tipo,
            p.nome as paciente_nome
        FROM mensagens m
        LEFT JOIN usuarios u ON m.remetente_id = u.id
        LEFT JOIN pacientes p ON m.paciente_id = p.id
        INNER JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id
        INNER JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
        WHERE cp.usuario_id = ?
        ORDER BY m.data_envio DESC
        LIMIT 50
    `;
    
    db.query(query, [cuidadorId], (err, results) => {
        if (err) {
            console.error("Erro ao buscar mensagens:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        res.json(results);
    });
});

// Enviar mensagem
app.post("/api/mensagens/enviar", (req, res) => {
    const { remetente_id, destinatario_id, paciente_id, mensagem, tipo } = req.body;
    
    const query = `
        INSERT INTO mensagens (remetente_id, destinatario_id, paciente_id, mensagem, tipo, data_envio)
        VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    db.query(query, [remetente_id, destinatario_id, paciente_id, mensagem, tipo], (err, result) => {
        if (err) {
            console.error("Erro ao enviar mensagem:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        res.json({ success: true, id: result.insertId });
    });
});

// Criar relatório
app.post("/api/relatorios/criar", (req, res) => {
    const { paciente_id, cuidador_id, titulo, conteudo, tipo } = req.body;
    
    const query = `
        INSERT INTO relatorios (paciente_id, cuidador_id, titulo, conteudo, tipo, data_criacao)
        VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    db.query(query, [paciente_id, cuidador_id, titulo, conteudo, tipo], (err, result) => {
        if (err) {
            console.error("Erro ao criar relatório:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        res.json({ success: true, id: result.insertId });
    });
});

// Registrar atividade
app.post("/api/atividades/registrar", (req, res) => {
    const { paciente_id, cuidador_id, tipo, descricao, observacoes } = req.body;
    
    const query = `
        INSERT INTO atividades (paciente_id, cuidador_id, tipo, descricao, observacoes, data_realizacao, status)
        VALUES (?, ?, ?, ?, ?, NOW(), 'concluída')
    `;
    
    db.query(query, [paciente_id, cuidador_id, tipo, descricao, observacoes], (err, result) => {
        if (err) {
            console.error("Erro ao registrar atividade:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        res.json({ success: true, id: result.insertId });
    });
});

// ====================== ROTAS DE EXEMPLO/DEMO ====================== //

// Dados de exemplo para medicamentos
app.get("/api/pacientes/:pacienteId/medicamentos/hoje", (req, res) => {
    const pacienteId = req.params.pacienteId;
    
    const medicamentos = [
        {
            id: 1,
            nome_medicamento: "Metformina 850mg",
            dosagem: "1 comprimido",
            horario: "08:00",
            status: "pendente"
        },
        {
            id: 2,
            nome_medicamento: "Insulina NPH",
            dosagem: "20 UI",
            horario: "13:30", 
            status: "pendente"
        },
        {
            id: 3,
            nome_medicamento: "Losartana 50mg",
            dosagem: "1 comprimido",
            horario: "20:00",
            status: "pendente"
        }
    ];
    
    res.json(medicamentos);
});

// Dados de exemplo para tarefas
app.get("/api/cuidadores/:cuidadorId/tarefas/hoje", (req, res) => {
    const tarefas = [
        {
            id: 1,
            descricao: "Aplicar insulina",
            horario_previsto: "13:30",
            tipo: "medicacao",
            status: "pendente"
        },
        {
            id: 2, 
            descricao: "Acompanhar almoço",
            horario_previsto: "12:00",
            tipo: "alimentacao",
            status: "concluída"
        },
        {
            id: 3,
            descricao: "Caminhada leve",
            horario_previsto: "16:00",
            tipo: "exercicio",
            status: "pendente"
        }
    ];
    
    res.json(tarefas);
});

// Dados de exemplo para alertas
app.get("/api/pacientes/:pacienteId/alertas/recentes", (req, res) => {
    const alertas = [
        {
            id: 1,
            titulo: "Glicemia elevada",
            descricao: "156 mg/dL registrado às 10:45",
            data_criacao: new Date().toISOString()
        }
    ];
    
    res.json(alertas);
});

// Dados de exemplo para sinais vitais
app.get("/api/pacientes/:pacienteId/sinais-vitais/recentes", (req, res) => {
    const sinais = [
        {
            id: 1,
            tipo: "pressao_arterial",
            valor_principal: "126",
            valor_secundario: "82",
            unidade_medida: "mmHg",
            data_registro: new Date().toISOString()
        },
        {
            id: 2,
            tipo: "glicemia",
            valor_principal: "98",
            unidade_medida: "mg/dL", 
            data_registro: new Date().toISOString()
        },
        {
            id: 3,
            tipo: "temperatura",
            valor_principal: "36.7",
            unidade_medida: "°C",
            data_registro: new Date().toISOString()
        },
        {
            id: 4,
            tipo: "batimentos_cardiacos",
            valor_principal: "72", 
            unidade_medida: "bpm",
            data_registro: new Date().toISOString()
        }
    ];
    
    res.json(sinais);
});

// Buscar informações do familiar
app.get("/api/familiares/:familiarId/info", (req, res) => {
    const familiarId = req.params.familiarId;
    
    const query = `
        SELECT u.nome, u.telefone, u.email
        FROM familiares_contratantes fc
        INNER JOIN usuarios u ON fc.usuario_id = u.id
        WHERE fc.id = ?
    `;
    
    db.query(query, [familiarId], (err, results) => {
        if (err) {
            console.error("Erro ao buscar familiar:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: "Familiar não encontrado" });
        }
        
        res.json(results[0]);
    });
});

// Buscar dependente por ID para dashboard supervisor
app.get("/api/dependentes/:dependenteId", (req, res) => {
    const dependenteId = req.params.dependenteId;
    console.log(`Buscando dependente ID: ${dependenteId}`);
    
    const query = `
        SELECT 
            p.*,
            u.nome as familiar_nome,
            u.telefone as familiar_telefone,
            u.email as familiar_email,
            cp.usuario_id as cuidador_usuario_id,
            cu.nome as cuidador_nome,
            cu.telefone as cuidador_telefone
        FROM pacientes p
        LEFT JOIN familiares_contratantes fc ON p.familiar_contratante_id = fc.id
        LEFT JOIN usuarios u ON fc.usuario_id = u.id
        LEFT JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id AND cpp.status_vinculo = 'ativo'
        LEFT JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
        LEFT JOIN usuarios cu ON cp.usuario_id = cu.id
        WHERE p.id = ? AND p.ativo = TRUE
    `;
    
    db.query(query, [dependenteId], (err, results) => {
        if (err) {
            console.error("Erro ao buscar dependente:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: "Dependente não encontrado" });
        }
        
        const dependente = results[0];
        
        if (dependente.foto_perfil) {
            dependente.foto_url = `/uploads/${dependente.foto_perfil}`;
        } else {
            dependente.foto_url = '/assets/default-avatar.png';
        }
        
        if (dependente.data_nascimento) {
            const nascimento = new Date(dependente.data_nascimento);
            const hoje = new Date();
            const idade = hoje.getFullYear() - nascimento.getFullYear();
            const mes = hoje.getMonth() - nascimento.getMonth();
            if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
                dependente.idade = idade - 1;
            } else {
                dependente.idade = idade;
            }
        }
        
        console.log("Dependente encontrado:", dependente.nome);
        res.json(dependente);
    });
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

// ====================== ROTAS PARA CUIDADOR ====================== //

// Adicione estas rotas se não existirem:
app.get("/atividades_cuidador", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/atividades_cuidador.html"));
});

app.get("/medicamentos_cuidador", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/medicamentos_cuidador.html"));
});

app.get("/relatorios_cuidador", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/relatorios_cuidador.html"));
});

app.get("/comunicacao_cuidador", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/comunicacao_cuidador.html"));
});

// Rota para dashboard do cuidador (se não existir)
app.get("/dashboard_cuidador", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/dashboard_cuidador.html"));
});

// ====================== ROTAS PARA ARQUIVOS ESTÁTICOS ====================== //

// Rotas específicas para arquivos CSS, JS e Assets
app.get("/styles/:filename", (req, res) => {
  const filename = req.params.filename;
  res.sendFile(path.join(__dirname, "public/styles", filename));
});

app.get("/js/:filename", (req, res) => {
  const filename = req.params.filename;
  res.sendFile(path.join(__dirname, "public/js", filename));
});

app.get("/assets/:filename", (req, res) => {
  const filename = req.params.filename;
  res.sendFile(path.join(__dirname, "public/assets", filename));
});

// Rota para uploads (se necessário)
app.get("/uploads/:filename", (req, res) => {
  const filename = req.params.filename;
  res.sendFile(path.join(__dirname, "public/uploads", filename));
});

// Rota para páginas dentro da pasta paginas
app.get("/paginas/:filename", (req, res) => {
  const filename = req.params.filename;
  res.sendFile(path.join(__dirname, "public/paginas", filename));
});

// ====================== ROTAS PARA CUIDADOR ====================== //

// Adicione estas rotas se não existirem
app.get("/atividades_cuidador", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/atividades_cuidador.html"));
});

app.get("/medicamentos_cuidador", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/medicamentos_cuidador.html"));
});

app.get("/relatorios_cuidador", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/relatorios_cuidador.html"));
});

app.get("/comunicacao_cuidador", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/comunicacao_cuidador.html"));
});

app.get("/dashboard_cuidador", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/dashboard_cuidador.html"));
});

// Rotas com .html também (para garantir)
app.get("/atividades_cuidador.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/atividades_cuidador.html"));
});

app.get("/medicamentos_cuidador.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/paginas/medicamentos_cuidador.html"));
});

// ====================== ROTA CURINGA PARA TODAS AS PÁGINAS ====================== //

// Adicione isto DEPOIS das rotas específicas existentes
app.get("/:page", (req, res, next) => {
  const page = req.params.page;
  
  // Lista de páginas que devem ser servidas
  const paginasValidas = [
    'relatorios_supervisor', 'alertas_supervisor', 'comunicacao_supervisor',
    'relatorios_supervisor.html', 'alertas_supervisor.html', 'comunicacao_supervisor.html',
    'dashboard_supervisor', 'dashboard_supervisor.html',
    'relatorios_cuidador', 'alertas_cuidador', 'comunicacao_cuidador',
    'atividades_cuidador', 'medicamentos_cuidador'
  ];
  
  if (paginasValidas.includes(page) || page.endsWith('.html')) {
    const filename = page.endsWith('.html') ? page : page + '.html';
    const filePath = path.join(__dirname, "public/paginas", filename);
    
    // Verifica se o arquivo existe
    if (require('fs').existsSync(filePath)) {
      console.log(`📄 Servindo página: ${filename}`);
      res.sendFile(filePath);
    } else {
      next(); // Arquivo não existe, passa para próxima rota
    }
  } else {
    next(); // Não é uma página, passa para próxima rota
  }
});

// ====================== SISTEMA DE CHAT ENTRE CUIDADORES E SUPERVISORES ====================== //

// Buscar conversas do cuidador - VERSÃO CORRIGIDA
app.get("/api/cuidadores/:cuidadorId/conversas", (req, res) => {
    const cuidadorId = req.params.cuidadorId;
    
    console.log(`Buscando conversas para cuidador: ${cuidadorId}`);
    
    const query = `
        SELECT DISTINCT
            u.id as usuario_id,
            u.nome,
            u.tipo,
            u.email,
            p.id as paciente_id,
            p.nome as paciente_nome,
            (
                SELECT m.mensagem 
                FROM mensagens m 
                WHERE (m.remetente_id = u.id OR m.destinatario_id = u.id) 
                AND (m.remetente_id = ? OR m.destinatario_id = ?)
                ORDER BY m.data_envio DESC 
                LIMIT 1
            ) as ultima_mensagem,
            (
                SELECT m.data_envio 
                FROM mensagens m 
                WHERE (m.remetente_id = u.id OR m.destinatario_id = u.id) 
                AND (m.remetente_id = ? OR m.destinatario_id = ?)
                ORDER BY m.data_envio DESC 
                LIMIT 1
            ) as ultima_mensagem_timestamp,
            (
                SELECT COUNT(*) 
                FROM mensagens m 
                WHERE m.destinatario_id = ? 
                AND m.remetente_id = u.id 
                AND m.lida = FALSE
            ) as mensagens_nao_lidas
        FROM usuarios u
        INNER JOIN familiares_contratantes fc ON u.id = fc.usuario_id
        INNER JOIN pacientes p ON fc.id = p.familiar_contratante_id
        INNER JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id
        INNER JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
        WHERE cp.usuario_id = ?
        AND u.tipo = 'familiar_contratante'
        AND cpp.status_vinculo = 'ativo'
        
        UNION
        
        SELECT DISTINCT
            u.id as usuario_id,
            u.nome,
            u.tipo,
            u.email,
            p.id as paciente_id,
            p.nome as paciente_nome,
            (
                SELECT m.mensagem 
                FROM mensagens m 
                WHERE (m.remetente_id = u.id OR m.destinatario_id = u.id) 
                AND (m.remetente_id = ? OR m.destinatario_id = ?)
                ORDER BY m.data_envio DESC 
                LIMIT 1
            ) as ultima_mensagem,
            (
                SELECT m.data_envio 
                FROM mensagens m 
                WHERE (m.remetente_id = u.id OR m.destinatario_id = u.id) 
                AND (m.remetente_id = ? OR m.destinatario_id = ?)
                ORDER BY m.data_envio DESC 
                LIMIT 1
            ) as ultima_mensagem_timestamp,
            (
                SELECT COUNT(*) 
                FROM mensagens m 
                WHERE m.destinatario_id = ? 
                AND m.remetente_id = u.id 
                AND m.lida = FALSE
            ) as mensagens_nao_lidas
        FROM usuarios u
        INNER JOIN familiares_cuidadores fc ON u.id = fc.usuario_id
        INNER JOIN pacientes p ON fc.id = p.familiar_cuidador_id
        INNER JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id
        INNER JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
        WHERE cp.usuario_id = ?
        AND u.tipo = 'familiar_cuidador'
        AND cpp.status_vinculo = 'ativo'
    `;
    
    // Parâmetros para substituir os ? na query
    const params = [
        // Primeira parte da UNION (familiar_contratante)
        cuidadorId, cuidadorId,                    // para ultima_mensagem
        cuidadorId, cuidadorId,                    // para ultima_mensagem_timestamp  
        cuidadorId,                                // para mensagens_nao_lidas
        cuidadorId,                                // para WHERE cp.usuario_id
        
        // Segunda parte da UNION (familiar_cuidador)
        cuidadorId, cuidadorId,                    // para ultima_mensagem
        cuidadorId, cuidadorId,                    // para ultima_mensagem_timestamp
        cuidadorId,                                // para mensagens_nao_lidas
        cuidadorId                                 // para WHERE cp.usuario_id
    ];
    
    console.log("Executando query com parâmetros:", params);
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error("Erro ao buscar conversas do cuidador:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        console.log(`✅ ${results.length} conversas encontradas para cuidador ${cuidadorId}`);
        res.json(results);
    });
});

// Buscar conversas do supervisor - VERSÃO CORRIGIDA
app.get("/api/supervisores/:supervisorId/conversas", (req, res) => {
    const supervisorId = req.params.supervisorId;
    
    console.log(`Buscando conversas para supervisor: ${supervisorId}`);
    
    // Primeiro, determinar se é familiar_contratante ou familiar_cuidador
    const getTipoQuery = "SELECT tipo FROM usuarios WHERE id = ?";
    
    db.query(getTipoQuery, [supervisorId], (err, tipoResults) => {
        if (err) {
            console.error("Erro ao buscar tipo do supervisor:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        if (tipoResults.length === 0) {
            return res.status(404).json({ error: "Supervisor não encontrado" });
        }
        
        const tipoSupervisor = tipoResults[0].tipo;
        let query = "";
        let params = [];
        
        if (tipoSupervisor === 'familiar_contratante') {
            query = `
                SELECT DISTINCT
                    u.id as usuario_id,
                    u.nome,
                    u.tipo,
                    u.email,
                    p.id as paciente_id,
                    p.nome as paciente_nome,
                    (
                        SELECT m.mensagem 
                        FROM mensagens m 
                        WHERE (m.remetente_id = u.id OR m.destinatario_id = u.id) 
                        AND (m.remetente_id = ? OR m.destinatario_id = ?)
                        ORDER BY m.data_envio DESC 
                        LIMIT 1
                    ) as ultima_mensagem,
                    (
                        SELECT m.data_envio 
                        FROM mensagens m 
                        WHERE (m.remetente_id = u.id OR m.destinatario_id = u.id) 
                        AND (m.remetente_id = ? OR m.destinatario_id = ?)
                        ORDER BY m.data_envio DESC 
                        LIMIT 1
                    ) as ultima_mensagem_timestamp,
                    (
                        SELECT COUNT(*) 
                        FROM mensagens m 
                        WHERE m.destinatario_id = ? 
                        AND m.remetente_id = u.id 
                        AND m.lida = FALSE
                    ) as mensagens_nao_lidas
                FROM usuarios u
                INNER JOIN cuidadores_profissionais cp ON u.id = cp.usuario_id
                INNER JOIN cuidadores_profissionais_pacientes cpp ON cp.id = cpp.cuidador_profissional_id
                INNER JOIN pacientes p ON cpp.paciente_id = p.id
                INNER JOIN familiares_contratantes fc ON p.familiar_contratante_id = fc.id
                WHERE fc.usuario_id = ?
                AND u.tipo = 'cuidador_profissional'
                AND cpp.status_vinculo = 'ativo'
            `;
            params = [
                supervisorId, supervisorId,  // ultima_mensagem
                supervisorId, supervisorId,  // ultima_mensagem_timestamp
                supervisorId,                // mensagens_nao_lidas
                supervisorId                 // WHERE fc.usuario_id
            ];
        } else if (tipoSupervisor === 'familiar_cuidador') {
            query = `
                SELECT DISTINCT
                    u.id as usuario_id,
                    u.nome,
                    u.tipo,
                    u.email,
                    p.id as paciente_id,
                    p.nome as paciente_nome,
                    (
                        SELECT m.mensagem 
                        FROM mensagens m 
                        WHERE (m.remetente_id = u.id OR m.destinatario_id = u.id) 
                        AND (m.remetente_id = ? OR m.destinatario_id = ?)
                        ORDER BY m.data_envio DESC 
                        LIMIT 1
                    ) as ultima_mensagem,
                    (
                        SELECT m.data_envio 
                        FROM mensagens m 
                        WHERE (m.remetente_id = u.id OR m.destinatario_id = u.id) 
                        AND (m.remetente_id = ? OR m.destinatario_id = ?)
                        ORDER BY m.data_envio DESC 
                        LIMIT 1
                    ) as ultima_mensagem_timestamp,
                    (
                        SELECT COUNT(*) 
                        FROM mensagens m 
                        WHERE m.destinatario_id = ? 
                        AND m.remetente_id = u.id 
                        AND m.lida = FALSE
                    ) as mensagens_nao_lidas
                FROM usuarios u
                INNER JOIN cuidadores_profissionais cp ON u.id = cp.usuario_id
                INNER JOIN cuidadores_profissionais_pacientes cpp ON cp.id = cpp.cuidador_profissional_id
                INNER JOIN pacientes p ON cpp.paciente_id = p.id
                INNER JOIN familiares_cuidadores fc ON p.familiar_cuidador_id = fc.id
                WHERE fc.usuario_id = ?
                AND u.tipo = 'cuidador_profissional'
                AND cpp.status_vinculo = 'ativo'
            `;
            params = [
                supervisorId, supervisorId,  // ultima_mensagem
                supervisorId, supervisorId,  // ultima_mensagem_timestamp
                supervisorId,                // mensagens_nao_lidas
                supervisorId                 // WHERE fc.usuario_id
            ];
        } else {
            return res.status(400).json({ error: "Tipo de usuário inválido para supervisor" });
        }
        
        console.log("Executando query do supervisor com parâmetros:", params);
        
        db.query(query, params, (err, results) => {
            if (err) {
                console.error("Erro ao buscar conversas do supervisor:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }
            
            console.log(`✅ ${results.length} conversas encontradas para supervisor ${supervisorId}`);
            res.json(results);
        });
    });
});

// Buscar mensagens entre dois usuários
app.get("/api/mensagens/:remetenteId/:destinatarioId", (req, res) => {
    const { remetenteId, destinatarioId } = req.params;
    
    console.log(`Buscando mensagens entre ${remetenteId} e ${destinatarioId}`);
    
    const query = `
        SELECT 
            m.*,
            ur.nome as remetente_nome,
            ur.tipo as remetente_tipo,
            ud.nome as destinatario_nome,
            ud.tipo as destinatario_tipo
        FROM mensagens m
        INNER JOIN usuarios ur ON m.remetente_id = ur.id
        INNER JOIN usuarios ud ON m.destinatario_id = ud.id
        WHERE (m.remetente_id = ? AND m.destinatario_id = ?)
           OR (m.remetente_id = ? AND m.destinatario_id = ?)
        ORDER BY m.data_envio ASC
        LIMIT 100
    `;
    
    db.query(query, [remetenteId, destinatarioId, destinatarioId, remetenteId], (err, results) => {
        if (err) {
            console.error("Erro ao buscar mensagens:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        // Marcar mensagens como lidas
        if (results.length > 0) {
            const updateQuery = `
                UPDATE mensagens 
                SET lida = TRUE 
                WHERE destinatario_id = ? AND remetente_id = ? AND lida = FALSE
            `;
            
            db.query(updateQuery, [remetenteId, destinatarioId], (err) => {
                if (err) {
                    console.error("Erro ao marcar mensagens como lidas:", err);
                }
            });
        }
        
        console.log(`✅ ${results.length} mensagens encontradas`);
        res.json(results);
    });
});

// Enviar mensagem
app.post("/api/mensagens", (req, res) => {
    const { remetente_id, destinatario_id, mensagem } = req.body;
    
    if (!remetente_id || !destinatario_id || !mensagem) {
        return res.status(400).json({ error: "Remetente, destinatário e mensagem são obrigatórios" });
    }
    
    const query = `
        INSERT INTO mensagens (remetente_id, destinatario_id, mensagem, data_envio)
        VALUES (?, ?, ?, NOW())
    `;
    
    db.query(query, [remetente_id, destinatario_id, mensagem], (err, result) => {
        if (err) {
            console.error("Erro ao enviar mensagem:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        // Buscar dados da mensagem recém-criada
        const selectQuery = `
            SELECT 
                m.*,
                ur.nome as remetente_nome,
                ur.tipo as remetente_tipo,
                ud.nome as destinatario_nome,
                ud.tipo as destinatario_tipo
            FROM mensagens m
            INNER JOIN usuarios ur ON m.remetente_id = ur.id
            INNER JOIN usuarios ud ON m.destinatario_id = ud.id
            WHERE m.id = ?
        `;
        
        db.query(selectQuery, [result.insertId], (err, messageResults) => {
            if (err) {
                console.error("Erro ao buscar mensagem criada:", err);
                return res.status(500).json({ error: "Erro ao buscar mensagem criada" });
            }
            
            console.log(`✅ Mensagem enviada com sucesso - ID: ${result.insertId}`);
            res.json(messageResults[0]);
        });
    });
});

// Marcar mensagens como lidas
app.post("/api/mensagens/marcar-lidas", (req, res) => {
    const { remetente_id, destinatario_id } = req.body;
    
    const query = `
        UPDATE mensagens 
        SET lida = TRUE 
        WHERE remetente_id = ? AND destinatario_id = ? AND lida = FALSE
    `;
    
    db.query(query, [remetente_id, destinatario_id], (err, result) => {
        if (err) {
            console.error("Erro ao marcar mensagens como lidas:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        console.log(`✅ ${result.affectedRows} mensagens marcadas como lidas`);
        res.json({ success: true, mensagens_afetadas: result.affectedRows });
    });
});

// Buscar usuário por ID
app.get("/api/usuarios/:usuarioId", (req, res) => {
    const usuarioId = req.params.usuarioId;
    
    const query = "SELECT id, nome, email, tipo, telefone FROM usuarios WHERE id = ?";
    
    db.query(query, [usuarioId], (err, results) => {
        if (err) {
            console.error("Erro ao buscar usuário:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }
        
        res.json(results[0]);
    });
});

// Buscar paciente em comum entre cuidador e supervisor
app.get("/api/pacientes/comum/:cuidadorId/:supervisorId", (req, res) => {
    const { cuidadorId, supervisorId } = req.params;
    
    const query = `
        SELECT p.*
        FROM pacientes p
        INNER JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id
        INNER JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
        WHERE cp.usuario_id = ?
        AND (p.familiar_contratante_id IN (SELECT id FROM familiares_contratantes WHERE usuario_id = ?)
             OR p.familiar_cuidador_id IN (SELECT id FROM familiares_cuidadores WHERE usuario_id = ?))
        AND cpp.status_vinculo = 'ativo'
        LIMIT 1
    `;
    
    db.query(query, [cuidadorId, supervisorId, supervisorId], (err, results) => {
        if (err) {
            console.error("Erro ao buscar paciente em comum:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: "Nenhum paciente em comum encontrado" });
        }
        
        res.json(results[0]);
    });
});