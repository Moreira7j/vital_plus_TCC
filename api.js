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

// Configuração do Nodemailer para Vital+
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Função para verificar configuração de e-mail
function isEmailConfigured() {
    return process.env.EMAIL_USER && process.env.EMAIL_PASS;
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

// ====================== SISTEMA DE RECUPERAÇÃO DE SENHA ====================== //

// Armazenamento temporário para códigos (em produção, use Redis ou database)
const recoveryCodes = new Map();

// Enviar código de verificação
app.post("/api/esqueci-senha/enviar-codigo", (req, res) => {
    const { email } = req.body;

    console.log(`📧 Solicitação de recuperação de senha para: ${email}`);

    if (!email) {
        return res.status(400).json({ error: "E-mail é obrigatório" });
    }

    // Verificar se o e-mail existe no banco
    const checkUserQuery = "SELECT id, nome, email FROM usuarios WHERE email = ? AND ativo = TRUE";

    db.query(checkUserQuery, [email], (err, results) => {
        if (err) {
            console.error("Erro ao verificar usuário:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.length === 0) {
            console.log("❌ E-mail não encontrado:", email);
            // Por segurança, não revelamos se o e-mail existe ou não
            return res.json({
                success: true,
                message: "Se o e-mail existir em nosso sistema, você receberá um código de verificação."
            });
        }

        const usuario = results[0];

        // Gerar código de 6 dígitos
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiration = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        // Armazenar código
        recoveryCodes.set(email, {
            code: code,
            expiration: expiration,
            attempts: 0,
            userId: usuario.id
        });

        console.log(`✅ Código gerado para ${email}: ${code}`);

        // Enviar e-mail (se configurado)
        if (isEmailConfigured()) {
            const mailOptions = {
                from: `"Vital+ Suporte" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "🔐 Código de Recuperação de Senha - Vital+",
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { 
                                font-family: 'Poppins', Arial, sans-serif; 
                                line-height: 1.6; 
                                color: #2D2D2D; 
                                margin: 0; 
                                padding: 0; 
                                background: #f8f9fa;
                            }
                            .container { 
                                max-width: 600px; 
                                margin: 0 auto; 
                                background: white;
                                border-radius: 15px;
                                overflow: hidden;
                                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                            }
                            .header { 
                                background: linear-gradient(135deg, #00B5C2, #4B0082); 
                                color: white; 
                                padding: 40px 30px; 
                                text-align: center; 
                            }
                            .logo { 
                                font-size: 32px; 
                                font-weight: 700; 
                                margin-bottom: 10px;
                            }
                            .content { 
                                padding: 40px 30px; 
                                background: #FCFCFD; 
                            }
                            .code { 
                                font-size: 48px; 
                                font-weight: bold; 
                                text-align: center; 
                                color: #00B5C2; 
                                margin: 30px 0; 
                                letter-spacing: 10px;
                                background: rgba(0, 181, 194, 0.1); 
                                padding: 25px; 
                                border-radius: 15px;
                                border: 2px dashed #00B5C2;
                            }
                            .info-box { 
                                background: rgba(0, 181, 194, 0.1); 
                                padding: 25px; 
                                border-left: 4px solid #00B5C2; 
                                margin: 30px 0; 
                                border-radius: 10px; 
                            }
                            .footer { 
                                text-align: center; 
                                padding: 30px; 
                                color: #6C757D; 
                                font-size: 14px; 
                                background: #F8F9FA; 
                                border-top: 1px solid #E5E7EB; 
                            }
                            .security-note {
                                background: #FFF3CD; 
                                border: 1px solid #FFEEBA; 
                                padding: 20px; 
                                border-radius: 10px; 
                                margin: 25px 0;
                                color: #856404;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <div class="logo">Vital+</div>
                                <p style="margin: 0; opacity: 0.9; font-size: 18px;">Sistema de Acompanhamento para Cuidadores</p>
                                <h1 style="margin: 20px 0 0 0; font-size: 24px;">🔐 Recuperação de Senha</h1>
                            </div>
                            
                            <div class="content">
                                <p>Olá <strong style="color: #00B5C2;">${usuario.nome}</strong>,</p>
                                <p>Recebemos uma solicitação para redefinir a senha da sua conta Vital+.</p>
                                
                                <div class="info-box">
                                    <p style="margin: 0 0 15px 0; font-weight: 600; font-size: 16px;">Seu código de verificação é:</p>
                                    <div class="code">${code}</div>
                                    <p style="margin: 15px 0 0 0; font-size: 14px; text-align: center;">
                                        <strong>⏰ Este código expira em 15 minutos</strong>
                                    </p>
                                </div>
                                
                                <p><strong>Se você não solicitou esta recuperação:</strong></p>
                                <p>Por favor, ignore este e-mail. Sua senha permanecerá a mesma.</p>
                                
                                <div class="security-note">
                                    <p style="margin: 0;">
                                        <strong>💡 Dica de segurança:</strong><br>
                                        Nunca compartilhe seus códigos de verificação com outras pessoas.
                                    </p>
                                </div>
                            </div>
                            
                            <div class="footer">
                                <p style="margin: 0 0 10px 0;">
                                    <strong>Vital+ - Sistema de Acompanhamento para Cuidadores</strong>
                                </p>
                                <p style="margin: 0; font-size: 12px;">
                                    Este é um e-mail automático, por favor não responda.
                                </p>
                                <p style="margin: 10px 0 0 0; font-size: 12px;">
                                    📧 ${process.env.EMAIL_USER}
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("❌ Erro ao enviar e-mail:", error);
                    // Mesmo com erro, retorna sucesso para segurança
                    return res.json({
                        success: true,
                        message: "Se o e-mail existir em nosso sistema, você receberá um código de verificação."
                    });
                } else {
                    console.log("✅ E-mail enviado com sucesso!");
                    res.json({
                        success: true,
                        message: "Código enviado com sucesso! Verifique seu e-mail."
                    });
                }
            });
        } else {
            // Modo desenvolvimento - sem e-mail configurado
            console.log("🔄 Modo desenvolvimento - Código:", code);
            res.json({
                success: true,
                message: "Código gerado (modo desenvolvimento)",
                debug_code: code // Apenas para desenvolvimento
            });
        }
    });
});

// Verificar código
app.post("/api/esqueci-senha/verificar-codigo", (req, res) => {
    const { email, code } = req.body;

    console.log(`🔍 Verificando código para: ${email}`);

    if (!email || !code) {
        return res.status(400).json({ error: "E-mail e código são obrigatórios" });
    }

    const recoveryData = recoveryCodes.get(email);

    if (!recoveryData) {
        return res.status(400).json({ error: "Código inválido ou expirado" });
    }

    // Verificar expiração
    if (new Date() > recoveryData.expiration) {
        recoveryCodes.delete(email);
        return res.status(400).json({ error: "Código expirado" });
    }

    // Verificar tentativas
    if (recoveryData.attempts >= 5) {
        recoveryCodes.delete(email);
        return res.status(400).json({ error: "Muitas tentativas incorretas. Solicite um novo código." });
    }

    // Verificar código
    if (recoveryData.code !== code) {
        recoveryData.attempts++;
        recoveryCodes.set(email, recoveryData);

        const attemptsLeft = 5 - recoveryData.attempts;
        return res.status(400).json({
            error: `Código incorreto. ${attemptsLeft} tentativas restantes.`
        });
    }

    // Código válido - gerar token de redefinição
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiration = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    // Atualizar dados com token
    recoveryData.resetToken = resetToken;
    recoveryData.tokenExpiration = tokenExpiration;
    recoveryCodes.set(email, recoveryData);

    console.log(`✅ Código verificado com sucesso para: ${email}`);

    res.json({
        success: true,
        message: "Código verificado com sucesso",
        token: resetToken
    });
});

// Redefinir senha
app.post("/api/esqueci-senha/redefinir-senha", (req, res) => {
    const { email, token, newPassword } = req.body;

    console.log(`🔄 Redefinindo senha para: ${email}`);

    if (!email || !token || !newPassword) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres" });
    }

    const recoveryData = recoveryCodes.get(email);

    if (!recoveryData || !recoveryData.resetToken) {
        return res.status(400).json({ error: "Token inválido ou expirado" });
    }

    // Verificar token
    if (recoveryData.resetToken !== token) {
        return res.status(400).json({ error: "Token inválido" });
    }

    // Verificar expiração do token
    if (new Date() > recoveryData.tokenExpiration) {
        recoveryCodes.delete(email);
        return res.status(400).json({ error: "Token expirado" });
    }

    // Atualizar senha no banco
    const updateQuery = "UPDATE usuarios SET senha = ? WHERE id = ?";

    db.query(updateQuery, [newPassword, recoveryData.userId], (err, result) => {
        if (err) {
            console.error("Erro ao atualizar senha:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        // Limpar dados de recuperação
        recoveryCodes.delete(email);

        console.log(`✅ Senha redefinida com sucesso para usuário ID: ${recoveryData.userId}`);

        // Enviar e-mail de confirmação
        if (isEmailConfigured()) {
            const getUserQuery = "SELECT nome FROM usuarios WHERE id = ?";

            db.query(getUserQuery, [recoveryData.userId], (err, userResults) => {
                if (err) {
                    console.error("Erro ao buscar dados do usuário:", err);
                    return;
                }

                const userName = userResults[0]?.nome || "Usuário";

                const mailOptions = {
                    from: `"Vital+ Suporte" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: "✅ Senha Redefinida com Sucesso - Vital+",
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <style>
                                body { 
                                    font-family: 'Poppins', Arial, sans-serif; 
                                    line-height: 1.6; 
                                    color: #2D2D2D; 
                                    margin: 0; 
                                    padding: 0; 
                                    background: #f8f9fa;
                                }
                                .container { 
                                    max-width: 600px; 
                                    margin: 0 auto; 
                                    background: white;
                                    border-radius: 15px;
                                    overflow: hidden;
                                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                                }
                                .header { 
                                    background: linear-gradient(135deg, #27ae60, #219653); 
                                    color: white; 
                                    padding: 40px 30px; 
                                    text-align: center; 
                                }
                                .logo { 
                                    font-size: 32px; 
                                    font-weight: 700; 
                                    margin-bottom: 10px;
                                }
                                .content { 
                                    padding: 40px 30px; 
                                    background: #FCFCFD; 
                                }
                                .success-icon { 
                                    text-align: center; 
                                    font-size: 64px; 
                                    color: #27ae60; 
                                    margin: 20px 0; 
                                }
                                .info-box { 
                                    background: rgba(39, 174, 96, 0.1); 
                                    padding: 25px; 
                                    border-left: 4px solid #27ae60; 
                                    margin: 25px 0; 
                                    border-radius: 10px; 
                                }
                                .footer { 
                                    text-align: center; 
                                    padding: 30px; 
                                    color: #6C757D; 
                                    font-size: 14px; 
                                    background: #F8F9FA; 
                                    border-top: 1px solid #E5E7EB; 
                                }
                                .btn-login {
                                    display: inline-block;
                                    padding: 15px 30px;
                                    background: linear-gradient(135deg, #00B5C2, #4B0082);
                                    color: white;
                                    text-decoration: none;
                                    border-radius: 50px;
                                    font-weight: 600;
                                    margin: 20px 0;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <div class="logo">Vital+</div>
                                    <p style="margin: 0; opacity: 0.9; font-size: 18px;">Sistema de Acompanhamento para Cuidadores</p>
                                    <h1 style="margin: 20px 0 0 0; font-size: 24px;">✅ Senha Redefinida</h1>
                                </div>
                                
                                <div class="content">
                                    <div class="success-icon">✓</div>
                                    <p>Olá <strong style="color: #27ae60;">${userName}</strong>,</p>
                                    <p>A senha da sua conta Vital+ foi redefinida com sucesso!</p>
                                    
                                    <div class="info-box">
                                        <p style="margin: 0 0 15px 0; font-weight: 600; font-size: 16px;">Informações da conta:</p>
                                        <p>📧 E-mail: <strong>${email}</strong></p>
                                        <p>🕒 Data da alteração: <strong>${new Date().toLocaleString('pt-BR')}</strong></p>
                                    </div>
                                    
                                    <p><strong>Se você não realizou esta alteração:</strong></p>
                                    <p>Entre em contato imediatamente com nosso suporte.</p>
                                    
                                    <p style="text-align: center; margin-top: 30px;">
                                        <a href="${process.env.BASE_URL || 'http://localhost:3000'}" class="btn-login">
                                            Fazer Login no Vital+
                                        </a>
                                    </p>
                                </div>
                                
                                <div class="footer">
                                    <p style="margin: 0 0 10px 0;">
                                        <strong>Vital+ - Sistema de Acompanhamento para Cuidadores</strong>
                                    </p>
                                    <p style="margin: 0; font-size: 12px;">
                                        Este é um e-mail automático, por favor não responda.
                                    </p>
                                    <p style="margin: 10px 0 0 0; font-size: 12px;">
                                        📧 ${process.env.EMAIL_USER}
                                    </p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("❌ Erro ao enviar e-mail de confirmação:", error);
                    } else {
                        console.log("✅ E-mail de confirmação enviado com sucesso:", info.response);
                    }
                });
            });
        }

        res.json({
            success: true,
            message: "Senha redefinida com sucesso!"
        });
    });
});

// Limpar códigos expirados periodicamente (a cada hora)
setInterval(() => {
    const now = new Date();
    let cleaned = 0;

    for (const [email, data] of recoveryCodes.entries()) {
        if (now > data.expiration) {
            recoveryCodes.delete(email);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        console.log(`🧹 Limpos ${cleaned} códigos de recuperação expirados`);
    }
}, 60 * 60 * 1000); // A cada hora

// ====================== SISTEMA DE CONVITES PARA CUIDADORES ====================== //

// Enviar convite para cuidador - VERSÃO CORRIGIDA
app.post("/api/convites/enviar-convite", (req, res) => {
    const {
        familiar_contratante_id,
        cuidador_email,
        paciente_id,
        mensagem_personalizada
    } = req.body;

    console.log("🎗️ Recebendo solicitação de convite:", {
        familiar_contratante_id,
        cuidador_email,
        paciente_id,
        mensagem_personalizada
    });

    if (!familiar_contratante_id || !cuidador_email || !paciente_id) {
        return res.status(400).json({ error: "Dados incompletos para enviar convite" });
    }

    // Primeiro, verificar se o paciente existe e pertence ao familiar
    const checkPacienteQuery = `
        SELECT p.nome as paciente_nome, u.nome as familiar_nome, u.email as familiar_email
        FROM pacientes p
        INNER JOIN familiares_contratantes fc ON p.familiar_contratante_id = fc.id
        INNER JOIN usuarios u ON fc.usuario_id = u.id
        WHERE p.id = ? AND fc.id = ?
    `;

    db.query(checkPacienteQuery, [paciente_id, familiar_contratante_id], (err, pacienteResults) => {
        if (err) {
            console.error("Erro ao verificar paciente:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (pacienteResults.length === 0) {
            return res.status(404).json({ error: "Paciente não encontrado ou não pertence a este familiar" });
        }

        const info = pacienteResults[0];

        // Verificar se já existe um convite pendente
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

            // Gerar token único para o convite
            const token_convite = crypto.randomBytes(32).toString('hex');
            const expiracao = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

            // Inserir convite no banco
            const insertConviteQuery = `
                INSERT INTO convites_cuidadores 
                (familiar_contratante_id, cuidador_email, paciente_id, token_convite, expiracao, mensagem_personalizada, data_convite)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
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
                    console.error("❌ Erro ao criar convite:", err);
                    return res.status(500).json({ error: "Erro interno do servidor" });
                }

                console.log("✅ Convite criado com sucesso. ID:", result.insertId);

                // Enviar e-mail de convite
                if (isEmailConfigured()) {
                    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
                    const mailOptions = {
                        from: `"Vital+ Convites" <${process.env.EMAIL_USER}>`,
                        to: cuidador_email,
                        subject: "📋 Convite para Cuidar de um Paciente - Vital+",
                        html: `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta charset="utf-8">
                                <style>
                                    body { 
                                        font-family: 'Poppins', Arial, sans-serif; 
                                        line-height: 1.6; 
                                        color: #2D2D2D; 
                                        margin: 0; 
                                        padding: 0; 
                                        background: #f8f9fa;
                                    }
                                    .container { 
                                        max-width: 600px; 
                                        margin: 0 auto; 
                                        background: white;
                                        border-radius: 15px;
                                        overflow: hidden;
                                        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                                    }
                                    .header { 
                                        background: linear-gradient(135deg, #00B5C2, #4B0082); 
                                        color: white; 
                                        padding: 40px 30px; 
                                        text-align: center; 
                                    }
                                    .logo { 
                                        font-size: 32px; 
                                        font-weight: 700; 
                                        margin-bottom: 10px;
                                    }
                                    .content { 
                                        padding: 40px 30px; 
                                        background: #FCFCFD; 
                                    }
                                    .btn-accept {
                                        display: inline-block;
                                        padding: 15px 30px;
                                        background: linear-gradient(135deg, #27ae60, #219653);
                                        color: white;
                                        text-decoration: none;
                                        border-radius: 50px;
                                        font-weight: 600;
                                        margin: 20px 0;
                                        transition: all 0.3s ease;
                                    }
                                    .btn-accept:hover {
                                        transform: translateY(-2px);
                                        box-shadow: 0 5px 15px rgba(39, 174, 96, 0.3);
                                    }
                                    .info-box { 
                                        background: rgba(0, 181, 194, 0.1); 
                                        padding: 25px; 
                                        border-left: 4px solid #00B5C2; 
                                        margin: 25px 0; 
                                        border-radius: 10px; 
                                    }
                                    .footer { 
                                        text-align: center; 
                                        padding: 30px; 
                                        color: #6C757D; 
                                        font-size: 14px; 
                                        background: #F8F9FA; 
                                        border-top: 1px solid #E5E7EB; 
                                    }
                                    .features-list {
                                        background: #E8F5E8;
                                        padding: 20px;
                                        border-radius: 10px;
                                        margin: 20px 0;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <div class="header">
                                        <div class="logo">Vital+</div>
                                        <p style="margin: 0; opacity: 0.9; font-size: 18px;">Sistema de Acompanhamento para Cuidadores</p>
                                        <h1 style="margin: 20px 0 0 0; font-size: 24px;">🎗️ Convite Vital+</h1>
                                    </div>
                                    
                                    <div class="content">
                                        <p>Olá,</p>
                                        <p>Você recebeu um convite para cuidar de um paciente através da plataforma Vital+!</p>
                                        
                                        <div class="info-box">
                                            <p style="margin: 0 0 15px 0; font-weight: 600; font-size: 16px;">Informações do Convite:</p>
                                            <p>👤 <strong>Paciente:</strong> ${info.paciente_nome}</p>
                                            <p>👨‍👩‍👧‍👦 <strong>Familiar Contratante:</strong> ${info.familiar_nome}</p>
                                            <p>📧 <strong>Contato:</strong> ${info.familiar_email}</p>
                                            ${mensagem_personalizada ? `<p>💬 <strong>Mensagem pessoal:</strong> "${mensagem_personalizada}"</p>` : ''}
                                        </div>

                                        <div class="features-list">
                                            <p style="margin: 0 0 10px 0; font-weight: 600;">🎯 O que você poderá fazer:</p>
                                            <ul style="margin: 0; padding-left: 20px;">
                                                <li>📊 Acompanhar sinais vitais do paciente</li>
                                                <li>💊 Gerenciar medicamentos e horários</li>
                                                <li>📝 Registrar atividades e observações</li>
                                                <li>🚨 Receber alertas importantes</li>
                                                <li>💬 Comunicar-se com a família</li>
                                            </ul>
                                        </div>
                                        
                                        <p style="text-align: center;">
                                            <a href="${baseUrl}/aceitar-convite?token=${token_convite}" class="btn-accept">
                                                ✅ Aceitar Convite e Criar Conta
                                            </a>
                                        </p>
                                        
                                        <p><strong>📋 O que acontece quando você aceitar:</strong></p>
                                        <ul>
                                            <li>✅ Sua conta será criada automaticamente no Vital+</li>
                                            <li>✅ Você escolherá sua própria senha</li>
                                            <li>✅ Será vinculado automaticamente ao paciente ${info.paciente_nome}</li>
                                            <li>✅ Terá acesso completo ao sistema Vital+</li>
                                        </ul>
                                        
                                        <p><strong>⏰ Este convite expira em:</strong> ${expiracao.toLocaleDateString('pt-BR')}</p>
                                        
                                        <p style="color: #666; font-size: 14px;">
                                            <strong>Observação:</strong> Se você não deseja aceitar este convite, por favor ignore este e-mail.
                                        </p>
                                    </div>
                                    
                                    <div class="footer">
                                        <p style="margin: 0 0 10px 0;">
                                            <strong>Vital+ - Sistema de Acompanhamento para Cuidadores</strong>
                                        </p>
                                        <p style="margin: 0; font-size: 12px;">
                                            Este é um e-mail automático, por favor não responda.
                                        </p>
                                        <p style="margin: 10px 0 0 0; font-size: 12px;">
                                            📧 ${process.env.EMAIL_USER} | 🌐 ${baseUrl}
                                        </p>
                                    </div>
                                </div>
                            </body>
                            </html>
                        `
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.error("❌ Erro ao enviar e-mail de convite:", error);
                        } else {
                            console.log("✅ E-mail de convite enviado com sucesso:", info.response);
                        }
                    });
                }

                res.json({
                    success: true,
                    message: "Convite enviado com sucesso!",
                    token_convite: token_convite,
                    convite_id: result.insertId
                });
            });
        });
    });
});

// Verificar convite - VERSÃO CORRIGIDA
app.get("/api/convites/verificar/:token", (req, res) => {
    const token = req.params.token;

    console.log(`🔍 Verificando convite com token: ${token}`);

    const query = `
        SELECT 
            c.*,
            p.nome as paciente_nome,
            p.condicao_principal,
            p.data_nascimento as paciente_data_nascimento,
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
            console.error("❌ Erro ao verificar convite:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.length === 0) {
            console.log("❌ Convite não encontrado ou expirado");
            return res.status(404).json({
                error: "Convite não encontrado, expirado ou já utilizado",
                details: "Este convite pode ter expirado, sido utilizado ou ser inválido."
            });
        }

        const convite = results[0];

        // Calcular idade do paciente
        if (convite.paciente_data_nascimento) {
            const nascimento = new Date(convite.paciente_data_nascimento);
            const hoje = new Date();
            let idade = hoje.getFullYear() - nascimento.getFullYear();
            const mes = hoje.getMonth() - nascimento.getMonth();
            if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
                idade--;
            }
            convite.paciente_idade = idade;
        }

        console.log(`✅ Convite válido encontrado para paciente: ${convite.paciente_nome}`);

        res.json(convite);
    });
});

// Aceitar convite - VERSÃO CORRIGIDA
app.post("/api/convites/aceitar", (req, res) => {
    const { token, cuidador_nome, cuidador_telefone, cuidador_senha } = req.body;

    console.log("🎯 Aceitando convite com token:", token);

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
            console.error("❌ Erro ao verificar convite:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Convite não encontrado, expirado ou já utilizado" });
        }

        const convite = results[0];
        console.log(`📧 Processando convite para: ${convite.cuidador_email}`);

        // Verificar se o e-mail já existe
        const checkEmailQuery = "SELECT id, nome, tipo FROM usuarios WHERE email = ?";
        db.query(checkEmailQuery, [convite.cuidador_email], (err, emailResults) => {
            if (err) {
                console.error("❌ Erro ao verificar email:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            let usuarioCuidadorId;

            if (emailResults.length > 0) {
                // Usuário já existe - atualizar
                usuarioCuidadorId = emailResults[0].id;
                const usuarioExistente = emailResults[0];

                console.log(`📧 Usuário existente encontrado: ${usuarioExistente.nome} (${usuarioExistente.tipo})`);

                const updateUsuarioQuery = "UPDATE usuarios SET tipo = 'cuidador_profissional', senha = ?, ativo = TRUE WHERE id = ?";

                db.query(updateUsuarioQuery, [cuidador_senha, usuarioCuidadorId], (err) => {
                    if (err) {
                        console.error("❌ Erro ao atualizar usuário:", err);
                        return res.status(500).json({ error: "Erro ao atualizar dados do usuário" });
                    }

                    console.log("✅ Senha do usuário existente atualizada");
                    vincularCuidadorPaciente(usuarioCuidadorId, convite, token, res);
                });

            } else {
                // Criar novo usuário - usar nome do formulário ou do convite
                const nomeFinal = cuidador_nome || convite.cuidador_nome || 'Cuidador';
                const telefoneFinal = cuidador_telefone || convite.cuidador_telefone || null;

                console.log("👤 Criando novo usuário cuidador...");

                const insertUsuarioQuery = `
                    INSERT INTO usuarios (nome, email, senha, tipo, telefone, ativo, data_criacao)
                    VALUES (?, ?, ?, 'cuidador_profissional', ?, TRUE, NOW())
                `;

                db.query(insertUsuarioQuery, [
                    nomeFinal,
                    convite.cuidador_email,
                    cuidador_senha,
                    telefoneFinal
                ], (err, usuarioResult) => {
                    if (err) {
                        console.error("❌ Erro ao criar usuário cuidador:", err);
                        return res.status(500).json({ error: "Erro interno do servidor" });
                    }

                    usuarioCuidadorId = usuarioResult.insertId;
                    console.log("✅ Novo usuário criado com ID:", usuarioCuidadorId);

                    // Criar perfil de cuidador profissional (sem data_cadastro)
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
// Função auxiliar para vincular cuidador ao paciente - VERSÃO CORRIGIDA
function vincularCuidadorPaciente(usuarioCuidadorId, convite, token, res) {
    console.log(`🔗 Vinculando cuidador ${usuarioCuidadorId} ao paciente ${convite.paciente_id}`);
    
    const getCuidadorIdQuery = "SELECT id FROM cuidadores_profissionais WHERE usuario_id = ?";
    
    db.query(getCuidadorIdQuery, [usuarioCuidadorId], (err, cuidadorResults) => {
        if (err) {
            console.error("❌ Erro ao buscar ID do cuidador:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        let cuidadorProfissionalId;

        if (cuidadorResults.length === 0) {
            console.log("ℹ️ Criando perfil de cuidador profissional...");
            
            // Criar perfil de cuidador profissional se não existir
            const insertCuidadorQuery = `
                INSERT INTO cuidadores_profissionais (usuario_id, especializacao, disponibilidade)
                VALUES (?, 'A definir', 'A combinar')
            `;
            
            db.query(insertCuidadorQuery, [usuarioCuidadorId], (err, result) => {
                if (err) {
                    console.error("❌ Erro ao criar cuidador profissional:", err);
                    return res.status(500).json({ error: "Erro ao criar perfil do cuidador" });
                }
                
                cuidadorProfissionalId = result.insertId;
                console.log(`✅ Cuidador profissional criado com ID: ${cuidadorProfissionalId}`);
                criarVinculoPaciente(cuidadorProfissionalId, convite, token, res, usuarioCuidadorId);
            });
        } else {
            cuidadorProfissionalId = cuidadorResults[0].id;
            console.log(`✅ Cuidador profissional encontrado com ID: ${cuidadorProfissionalId}`);
            criarVinculoPaciente(cuidadorProfissionalId, convite, token, res, usuarioCuidadorId);
        }
    });
}

// Nova função para criar o vínculo com o paciente
function criarVinculoPaciente(cuidadorProfissionalId, convite, token, res, usuarioCuidadorId) {
    // Verificar se já existe vínculo
    const checkVinculoQuery = `
        SELECT id FROM cuidadores_profissionais_pacientes 
        WHERE cuidador_profissional_id = ? AND paciente_id = ? AND status_vinculo = 'ativo'
    `;

    db.query(checkVinculoQuery, [cuidadorProfissionalId, convite.paciente_id], (err, vinculoResults) => {
        if (err) {
            console.error("Erro ao verificar vínculo existente:", err);
        }

        if (vinculoResults.length === 0) {
            // Criar novo vínculo
            const vinculoQuery = `
                INSERT INTO cuidadores_profissionais_pacientes 
                (cuidador_profissional_id, paciente_id, cuidador_principal, data_inicio, status_vinculo)
                VALUES (?, ?, TRUE, CURDATE(), 'ativo')
            `;

            db.query(vinculoQuery, [cuidadorProfissionalId, convite.paciente_id], (err) => {
                if (err) {
                    console.error("❌ Erro ao criar vínculo:", err);
                    return res.status(500).json({ error: "Erro ao vincular cuidador ao paciente" });
                }

                console.log("✅ Cuidador vinculado ao paciente com sucesso");
                atualizarConviteAceito(token, res, usuarioCuidadorId);
            });
        } else {
            console.log("ℹ️ Vínculo já existe, apenas atualizando convite");
            atualizarConviteAceito(token, res, usuarioCuidadorId);
        }
    });
}

// Função para atualizar status do convite - VERSÃO CORRIGIDA
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

        // Enviar e-mail de confirmação para o familiar
        enviarEmailConfirmacaoConvite(usuarioCuidadorId, token);

        res.json({
            success: true,
            message: "Convite aceito com sucesso! Sua conta foi criada e você já está vinculado ao paciente.",
            usuario_id: usuarioCuidadorId,
            redirect: "/dependentes"
        });
    });
}

// Função para enviar e-mail de confirmação para o familiar
function enviarEmailConfirmacaoConvite(usuarioCuidadorId, token) {
    if (!isEmailConfigured()) return;

    // Buscar informações para o e-mail
    const query = `
        SELECT 
            u_cuidador.nome as cuidador_nome,
            u_cuidador.email as cuidador_email,
            u_familiar.nome as familiar_nome,
            u_familiar.email as familiar_email,
            p.nome as paciente_nome
        FROM convites_cuidadores cc
        INNER JOIN usuarios u_cuidador ON u_cuidador.id = ?
        INNER JOIN familiares_contratantes fc ON cc.familiar_contratante_id = fc.id
        INNER JOIN usuarios u_familiar ON fc.usuario_id = u_familiar.id
        INNER JOIN pacientes p ON cc.paciente_id = p.id
        WHERE cc.token_convite = ?
    `;

    db.query(query, [usuarioCuidadorId, token], (err, results) => {
        if (err || results.length === 0) {
            console.error("Erro ao buscar dados para e-mail de confirmação:", err);
            return;
        }

        const info = results[0];

        const mailOptions = {
            from: `"Vital+ Notificações" <${process.env.EMAIL_USER}>`,
            to: info.familiar_email,
            subject: "✅ Convite Aceito - Cuidador Vinculado com Sucesso - Vital+",
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #2D2D2D; margin: 0; padding: 0; background: #f8f9fa; }
                        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                        .header { background: linear-gradient(135deg, #27ae60, #219653); color: white; padding: 30px; text-align: center; }
                        .content { padding: 30px; background: #FCFCFD; }
                        .info-box { background: rgba(39, 174, 96, 0.1); padding: 20px; border-left: 4px solid #27ae60; margin: 20px 0; border-radius: 8px; }
                        .footer { text-align: center; padding: 20px; color: #6C757D; font-size: 12px; background: #F8F9FA; border-top: 1px solid #E5E7EB; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✅ Convite Aceito</h1>
                        </div>
                        <div class="content">
                            <p>Olá <strong>${info.familiar_nome}</strong>,</p>
                            <p>Seu convite foi aceito com sucesso!</p>
                            
                            <div class="info-box">
                                <p><strong>Cuidador:</strong> ${info.cuidador_nome}</p>
                                <p><strong>E-mail:</strong> ${info.cuidador_email}</p>
                                <p><strong>Paciente:</strong> ${info.paciente_nome}</p>
                                <p><strong>Data da aceitação:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                            </div>
                            
                            <p>O cuidador já tem acesso completo ao sistema e pode começar a acompanhar o paciente imediatamente.</p>
                        </div>
                        <div class="footer">
                            <p>Vital+ - Sistema de Acompanhamento para Cuidadores</p>
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
                console.log("✅ E-mail de confirmação enviado para o familiar");
            }
        });
    });
}

// ====================== LIMPEZA AUTOMÁTICA DE ATIVIDADES CONCLUÍDAS ====================== //

function limparAtividadesConcluidas() {
    console.log('🧹 Iniciando limpeza automática de atividades concluídas...');
    
    const query = `
        DELETE FROM atividades 
        WHERE status = 'concluida' 
        AND DATE(data_conclusao) < CURDATE()
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error('❌ Erro ao limpar atividades concluídas:', err);
            return;
        }

        console.log(`✅ Limpeza concluída: ${result.affectedRows} atividades concluídas removidas`);
    });
}

// Executar limpeza uma vez ao iniciar o servidor (para testes)
limparAtividadesConcluidas();

// Agendar limpeza diária às 00:01
setInterval(() => {
    const agora = new Date();
    if (agora.getHours() === 0 && agora.getMinutes() === 1) {
        limparAtividadesConcluidas();
    }
}, 60000); // Verificar a cada minuto


// Iniciar servidor
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📧 E-mail configurado: ${process.env.EMAIL_USER}`);
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

// ====================== ROTA DE LOGIN CORRIGIDA (REDIRECIONA CUIDADOR PARA DEPENDENTES) ====================== //

app.post("/api/login", (req, res) => {
    const { email, senha } = req.body;

    console.log(`🔐 Tentativa de login: ${email}`);

    if (!email || !senha) {
        return res.status(400).json({ error: "E-mail e senha são obrigatórios" });
    }

    // 1. Primeiro busca o usuário básico
    const userQuery = "SELECT id, nome, email, senha, tipo FROM usuarios WHERE email = ? AND ativo = TRUE";

    console.log(`📊 Buscando usuário: ${email}`);

    db.query(userQuery, [email], (err, userResults) => {
        if (err) {
            console.error("❌ Erro ao buscar usuário:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (userResults.length === 0) {
            return res.status(401).json({ error: "E-mail ou senha incorretos" });
        }

        const usuario = userResults[0];

        // Verificar senha
        if (usuario.senha !== senha) {
            return res.status(401).json({ error: "E-mail ou senha incorretos" });
        }

        console.log(`✅ Login válido: ${usuario.nome} (${usuario.tipo})`);

        // **CORREÇÃO: Para cuidador profissional, SEMPRE redirecionar para dependentes primeiro**
        let redirectUrl = '/dashboard';

        if (usuario.tipo === 'familiar_contratante' || usuario.tipo === 'familiar_cuidador') {
            redirectUrl = '/dependentes';
        } else if (usuario.tipo === 'cuidador_profissional') {
            redirectUrl = '/dependentes'; // **MUDANÇA: Cuidador vai para dependentes primeiro**
        } else if (usuario.tipo === 'admin') {
            redirectUrl = '/adm';
        }

        // **CORREÇÃO: Retornar no formato que o frontend espera**
        const responseData = {
            id: usuario.id,
            nome: usuario.nome,
            tipo: usuario.tipo,
            redirect: redirectUrl
        };

        console.log(`🎯 Redirecionando ${usuario.tipo} para: ${redirectUrl}`);

        res.json(responseData);
    });
});
// ====================== ROTAS PARA PÁGINA DE DEPENDENTES ====================== //

// Buscar TODOS os pacientes vinculados ao cuidador (para a página de dependentes)
app.get("/api/cuidadores/:cuidadorId/pacientes", (req, res) => {
    const cuidadorId = req.params.cuidadorId;

    console.log(`👥 Buscando TODOS os pacientes para cuidador: ${cuidadorId}`);

    const query = `
        SELECT 
            p.*,
            u.nome as familiar_nome,
            u.telefone as familiar_telefone,
            u.email as familiar_email
        FROM pacientes p
        INNER JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id
        INNER JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
        INNER JOIN familiares_contratantes fc ON p.familiar_contratante_id = fc.id
        INNER JOIN usuarios u ON fc.usuario_id = u.id
        WHERE cp.usuario_id = ? AND cpp.status_vinculo = 'ativo' AND p.ativo = TRUE
    `;

    db.query(query, [cuidadorId], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar pacientes do cuidador:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        // Adicionar URLs de foto e calcular idades
        const pacientesComInfo = results.map(paciente => {
            if (paciente.foto_perfil) {
                paciente.foto_url = `/uploads/${paciente.foto_perfil}`;
            } else {
                paciente.foto_url = '/assets/default-avatar.png';
            }

            // Calcular idade
            if (paciente.data_nascimento) {
                const nascimento = new Date(paciente.data_nascimento);
                const hoje = new Date();
                let idade = hoje.getFullYear() - nascimento.getFullYear();
                const mes = hoje.getMonth() - nascimento.getMonth();
                if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
                    idade--;
                }
                paciente.idade = idade;
            }

            return paciente;
        });

        console.log(`✅ ${pacientesComInfo.length} paciente(s) encontrado(s) para cuidador ${cuidadorId}`);
        res.json(pacientesComInfo);
    });
});

// Selecionar paciente para dashboard (quando o cuidador clica em um paciente)
app.post("/api/cuidadores/:cuidadorId/selecionar-paciente", (req, res) => {
    const cuidadorId = req.params.cuidadorId;
    const { pacienteId } = req.body;

    console.log(`🎯 Cuidador ${cuidadorId} selecionando paciente: ${pacienteId}`);

    // Aqui você pode salvar a seleção em sessão ou simplesmente validar o vínculo
    const query = `
        SELECT COUNT(*) as tem_vinculo
        FROM cuidadores_profissionais_pacientes cpp
        INNER JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
        WHERE cp.usuario_id = ? AND cpp.paciente_id = ? AND cpp.status_vinculo = 'ativo'
    `;

    db.query(query, [cuidadorId, pacienteId], (err, results) => {
        if (err) {
            console.error("❌ Erro ao verificar vínculo:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results[0].tem_vinculo === 0) {
            return res.status(403).json({ error: "Você não tem permissão para acessar este paciente" });
        }

        console.log(`✅ Vínculo validado - redirecionando para dashboard`);
        res.json({
            success: true,
            message: "Paciente selecionado com sucesso",
            redirect: "/dashboard_cuidador"
        });
    });
});

// ====================== FUNÇÕES AUXILIARES ====================== //

function buscarCuidadorComPaciente(usuario, res) {
    console.log(`🔍 Buscando cuidador profissional e paciente...`);

    // Buscar ID do cuidador profissional
    const cuidadorQuery = "SELECT id FROM cuidadores_profissionais WHERE usuario_id = ?";

    db.query(cuidadorQuery, [usuario.id], (err, cuidadorResults) => {
        if (err || cuidadorResults.length === 0) {
            console.error("❌ Erro ao buscar cuidador profissional:", err);
            enviarRespostaLogin(res, usuario, null, null);
            return;
        }

        const cuidadorId = cuidadorResults[0].id;
        console.log(`👨‍⚕️ Cuidador profissional ID: ${cuidadorId}`);

        // Buscar paciente vinculado
        const pacienteQuery = `
            SELECT p.id, p.nome, p.data_nascimento, p.condicao_principal
            FROM pacientes p
            INNER JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id
            WHERE cpp.cuidador_profissional_id = ? AND cpp.status_vinculo = 'ativo'
            LIMIT 1
        `;

        db.query(pacienteQuery, [cuidadorId], (err, pacienteResults) => {
            if (err) {
                console.error("❌ Erro ao buscar paciente:", err);
                enviarRespostaLogin(res, usuario, cuidadorId, null);
                return;
            }

            if (pacienteResults.length > 0) {
                const paciente = pacienteResults[0];
                console.log(`👤 Paciente encontrado: ${paciente.nome} (ID: ${paciente.id})`);
                enviarRespostaLogin(res, usuario, cuidadorId, paciente);
            } else {
                console.log("ℹ️ Nenhum paciente vinculado encontrado");
                enviarRespostaLogin(res, usuario, cuidadorId, null);
            }
        });
    });
}

function buscarFamiliarComPacientes(usuario, res) {
    console.log(`🔍 Buscando familiar e pacientes...`);

    let query, params;

    if (usuario.tipo === 'familiar_contratante') {
        query = "SELECT id FROM familiares_contratantes WHERE usuario_id = ?";
    } else {
        query = "SELECT id FROM familiares_cuidadores WHERE usuario_id = ?";
    }

    db.query(query, [usuario.id], (err, familiarResults) => {
        if (err || familiarResults.length === 0) {
            console.error("❌ Erro ao buscar familiar:", err);
            enviarRespostaLogin(res, usuario, null, null);
            return;
        }

        const familiarId = familiarResults[0].id;
        console.log(`👨‍👩‍👧‍👦 Familiar ID: ${familiarId}`);

        // Buscar pacientes do familiar
        let pacienteQuery;
        if (usuario.tipo === 'familiar_contratante') {
            pacienteQuery = "SELECT id, nome, data_nascimento, condicao_principal FROM pacientes WHERE familiar_contratante_id = ? AND ativo = TRUE";
        } else {
            pacienteQuery = "SELECT id, nome, data_nascimento, condicao_principal FROM pacientes WHERE familiar_cuidador_id = ? AND ativo = TRUE";
        }

        db.query(pacienteQuery, [familiarId], (err, pacientesResults) => {
            if (err) {
                console.error("❌ Erro ao buscar pacientes:", err);
                enviarRespostaLogin(res, usuario, familiarId, null);
                return;
            }

            console.log(`📋 ${pacientesResults.length} paciente(s) encontrado(s)`);

            // Para familiares, retornar array de pacientes
            enviarRespostaLogin(res, usuario, familiarId, pacientesResults);
        });
    });
}

function enviarRespostaLogin(res, usuario, perfilId, pacienteInfo) {
    // **CORREÇÃO: Determinar redirecionamento CORRETO**
    let redirectUrl = '/dashboard';

    // TODOS os tipos de usuário vão para dependentes primeiro
    if (usuario.tipo === 'familiar_contratante' ||
        usuario.tipo === 'familiar_cuidador' ||
        usuario.tipo === 'cuidador_profissional') {
        redirectUrl = '/dependentes';
    } else if (usuario.tipo === 'admin') {
        redirectUrl = '/adm';
    }

    // **CORREÇÃO: Retornar no formato que o frontend espera**
    // O frontend espera { id, nome, tipo, redirect } no nível raiz
    const responseData = {
        id: usuario.id,
        nome: usuario.nome,
        tipo: usuario.tipo,
        redirect: redirectUrl
    };

    // **CORREÇÃO: Adicionar dados extras apenas se necessário, mas manter compatibilidade**
    if (pacienteInfo) {
        if (usuario.tipo === 'cuidador_profissional') {
            // Cuidador tem um paciente específico
            responseData.paciente = pacienteInfo;
            responseData.paciente_id = pacienteInfo.id;
            responseData.paciente_nome = pacienteInfo.nome;
        } else if (Array.isArray(pacienteInfo)) {
            // Familiar tem array de pacientes
            responseData.pacientes = pacienteInfo;
            if (pacienteInfo.length > 0) {
                responseData.paciente_principal_id = pacienteInfo[0].id;
                responseData.paciente_principal_nome = pacienteInfo[0].nome;
            }
        }
    }

    console.log(`🎯 Redirecionando ${usuario.tipo} para: ${redirectUrl}`);
    console.log(`📦 Dados enviados (formato frontend):`, {
        id: responseData.id,
        nome: responseData.nome,
        tipo: responseData.tipo,
        redirect: responseData.redirect,
        paciente: responseData.paciente_nome || 'Nenhum'
    });

    res.json(responseData);
}

// ====================== ROTAS PARA DASHBOARD DINÂMICO ====================== //

// Buscar paciente vinculado ao cuidador - CORRIGIDA
app.get("/api/cuidadores/:cuidadorId/paciente", (req, res) => {
    const cuidadorId = req.params.cuidadorId;

    console.log(`🎯 Buscando paciente para dashboard do cuidador: ${cuidadorId}`);

    const query = `
        SELECT 
            p.*,
            u.nome as familiar_nome,
            u.telefone as familiar_telefone,
            u.email as familiar_email
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
            console.error("❌ Erro ao buscar paciente do cuidador:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.length === 0) {
            console.log(`❌ Nenhum paciente encontrado para cuidador: ${cuidadorId}`);
            return res.status(404).json({ error: "Nenhum paciente vinculado encontrado" });
        }

        const paciente = results[0];

        // Adicionar URL da foto
        if (paciente.foto_perfil) {
            paciente.foto_url = `/uploads/${paciente.foto_perfil}`;
        } else {
            paciente.foto_url = '/assets/default-avatar.png';
        }

        // Calcular idade
        if (paciente.data_nascimento) {
            const nascimento = new Date(paciente.data_nascimento);
            const hoje = new Date();
            let idade = hoje.getFullYear() - nascimento.getFullYear();
            const mes = hoje.getMonth() - nascimento.getMonth();
            if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
                idade--;
            }
            paciente.idade = idade;
        }

        console.log(`✅ Paciente encontrado para dashboard: ${paciente.nome}`);
        res.json(paciente);
    });
});

// Buscar informações do familiar - CORRIGIDA
app.get("/api/familiares/:familiarId/info", (req, res) => {
    const familiarId = req.params.familiarId;

    console.log(`👨‍👩‍👧‍👦 Buscando informações do familiar: ${familiarId}`);

    const query = `
        SELECT u.nome, u.telefone, u.email
        FROM familiares_contratantes fc
        INNER JOIN usuarios u ON fc.usuario_id = u.id
        WHERE fc.id = ?
    `;

    db.query(query, [familiarId], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar familiar:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Familiar não encontrado" });
        }

        console.log(`✅ Familiar encontrado: ${results[0].nome}`);
        res.json(results[0]);
    });
});

// Sinais vitais recentes do paciente
app.get("/api/pacientes/:pacienteId/sinais-vitais/recentes", (req, res) => {
    const pacienteId = req.params.pacienteId;

    console.log(`📊 Buscando sinais vitais para paciente: ${pacienteId}`);

    const query = `
        SELECT *
        FROM sinais_vitais 
        WHERE paciente_id = ?
        ORDER BY data_registro DESC
        LIMIT 10
    `;

    db.query(query, [pacienteId], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar sinais vitais:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        console.log(`✅ ${results.length} sinais vitais encontrados`);
        res.json(results);
    });
});

// Medicamentos do paciente
app.get("/api/pacientes/:pacienteId/medicamentos/hoje", (req, res) => {
    const pacienteId = req.params.pacienteId;

    console.log(`💊 Buscando medicamentos para paciente: ${pacienteId}`);

    const query = `
        SELECT *
        FROM medicamentos 
        WHERE paciente_id = ? AND ativo = TRUE
        ORDER BY horarios
    `;

    db.query(query, [pacienteId], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar medicamentos:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        console.log(`✅ ${results.length} medicamentos encontrados`);
        res.json(results);
    });
});

// Atividades/tarefas do cuidador
app.get("/api/cuidadores/:cuidadorId/atividades", (req, res) => {
    const cuidadorId = req.params.cuidadorId;

    console.log(`📝 Buscando atividades para cuidador: ${cuidadorId}`);

    const query = `
        SELECT 
            a.*,
            p.nome as paciente_nome
        FROM atividades a
        INNER JOIN pacientes p ON a.paciente_id = p.id
        INNER JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id
        INNER JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
        WHERE cp.usuario_id = ? AND cpp.status_vinculo = 'ativo'
        ORDER BY a.data_prevista DESC
        LIMIT 10
    `;

    db.query(query, [cuidadorId], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar atividades:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        console.log(`✅ ${results.length} atividades encontradas`);
        res.json(results);
    });
});

// Alertas recentes do paciente
app.get("/api/pacientes/:pacienteId/alertas/recentes", (req, res) => {
    const pacienteId = req.params.pacienteId;

    console.log(`🚨 Buscando alertas para paciente: ${pacienteId}`);

    const query = `
        SELECT *
        FROM alertas 
        WHERE paciente_id = ? AND status = 'ativo'
        ORDER BY data_criacao DESC
        LIMIT 5
    `;

    db.query(query, [pacienteId], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar alertas:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        console.log(`✅ ${results.length} alertas encontrados`);
        res.json(results);
    });
});

// Registrar sinais vitais - NOVA ROTA
app.post("/api/sinais-vitais", (req, res) => {
    const { paciente_id, cuidador_id, sistolica, diastolica, glicemia, temperatura, batimentos } = req.body;

    console.log(`➕ Registrando sinais vitais para paciente: ${paciente_id}`);

    // Inserir pressão arterial
    if (sistolica && diastolica) {
        const pressaoQuery = `
            INSERT INTO sinais_vitais (paciente_id, tipo, valor_principal, valor_secundario, unidade_medida, registrado_por)
            VALUES (?, 'pressao_arterial', ?, ?, 'mmHg', ?)
        `;
        db.query(pressaoQuery, [paciente_id, sistolica, diastolica, cuidador_id]);
    }

    // Inserir glicemia
    if (glicemia) {
        const glicemiaQuery = `
            INSERT INTO sinais_vitais (paciente_id, tipo, valor_principal, unidade_medida, registrado_por)
            VALUES (?, 'glicemia', ?, 'mg/dL', ?)
        `;
        db.query(glicemiaQuery, [paciente_id, glicemia, cuidador_id]);
    }

    // Inserir temperatura
    if (temperatura) {
        const tempQuery = `
            INSERT INTO sinais_vitais (paciente_id, tipo, valor_principal, unidade_medida, registrado_por)
            VALUES (?, 'temperatura', ?, '°C', ?)
        `;
        db.query(tempQuery, [paciente_id, temperatura, cuidador_id]);
    }

    // Inserir batimentos
    if (batimentos) {
        const batimentosQuery = `
            INSERT INTO sinais_vitais (paciente_id, tipo, valor_principal, unidade_medida, registrado_por)
            VALUES (?, 'batimentos_cardiacos', ?, 'bpm', ?)
        `;
        db.query(batimentosQuery, [paciente_id, batimentos, cuidador_id]);
    }

    console.log(`✅ Sinais vitais registrados com sucesso`);
    res.json({ success: true, message: "Sinais vitais registrados com sucesso!" });
});

// ====================== ROTAS PARA FAMILIAR/SUPERVISOR ====================== //

// Buscar pacientes do familiar contratante
app.get("/api/familiares/:usuarioId/pacientes_contratante", (req, res) => {
    const usuarioId = req.params.usuarioId;

    console.log(`👥 Buscando pacientes para familiar contratante: ${usuarioId}`);

    // Primeiro buscar o ID do familiar contratante
    const getFamiliarIdQuery = "SELECT id FROM familiares_contratantes WHERE usuario_id = ?";

    db.query(getFamiliarIdQuery, [usuarioId], (err, familiarResults) => {
        if (err) {
            console.error("❌ Erro ao buscar familiar contratante:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (familiarResults.length === 0) {
            console.log("❌ Familiar contratante não encontrado");
            return res.status(404).json({ error: "Familiar contratante não encontrado" });
        }

        const familiarId = familiarResults[0].id;

        // Buscar pacientes do familiar
        const pacientesQuery = `
            SELECT 
                p.*,
                u.nome as cuidador_nome,
                u.telefone as cuidador_telefone
            FROM pacientes p
            LEFT JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id AND cpp.status_vinculo = 'ativo'
            LEFT JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
            LEFT JOIN usuarios u ON cp.usuario_id = u.id
            WHERE p.familiar_contratante_id = ? AND p.ativo = TRUE
        `;

        db.query(pacientesQuery, [familiarId], (err, pacientesResults) => {
            if (err) {
                console.error("❌ Erro ao buscar pacientes:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            // Adicionar URLs de foto e calcular idades
            const pacientesComInfo = pacientesResults.map(paciente => {
                if (paciente.foto_perfil) {
                    paciente.foto_url = `/uploads/${paciente.foto_perfil}`;
                } else {
                    paciente.foto_url = '/assets/default-avatar.png';
                }

                // Calcular idade
                if (paciente.data_nascimento) {
                    const nascimento = new Date(paciente.data_nascimento);
                    const hoje = new Date();
                    let idade = hoje.getFullYear() - nascimento.getFullYear();
                    const mes = hoje.getMonth() - nascimento.getMonth();
                    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
                        idade--;
                    }
                    paciente.idade = idade;
                }

                return paciente;
            });

            console.log(`✅ ${pacientesComInfo.length} paciente(s) encontrado(s) para familiar contratante`);
            res.json(pacientesComInfo);
        });
    });
});

// Buscar pacientes do familiar cuidador
app.get("/api/familiares/:usuarioId/pacientes_cuidador", (req, res) => {
    const usuarioId = req.params.usuarioId;

    console.log(`👥 Buscando pacientes para familiar cuidador: ${usuarioId}`);

    // Primeiro buscar o ID do familiar cuidador
    const getFamiliarIdQuery = "SELECT id FROM familiares_cuidadores WHERE usuario_id = ?";

    db.query(getFamiliarIdQuery, [usuarioId], (err, familiarResults) => {
        if (err) {
            console.error("❌ Erro ao buscar familiar cuidador:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (familiarResults.length === 0) {
            console.log("❌ Familiar cuidador não encontrado");
            return res.status(404).json({ error: "Familiar cuidador não encontrado" });
        }

        const familiarId = familiarResults[0].id;

        // Buscar pacientes do familiar
        const pacientesQuery = `
            SELECT 
                p.*,
                u.nome as cuidador_nome,
                u.telefone as cuidador_telefone
            FROM pacientes p
            LEFT JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id AND cpp.status_vinculo = 'ativo'
            LEFT JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
            LEFT JOIN usuarios u ON cp.usuario_id = u.id
            WHERE p.familiar_cuidador_id = ? AND p.ativo = TRUE
        `;

        db.query(pacientesQuery, [familiarId], (err, pacientesResults) => {
            if (err) {
                console.error("❌ Erro ao buscar pacientes:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            // Adicionar URLs de foto e calcular idades
            const pacientesComInfo = pacientesResults.map(paciente => {
                if (paciente.foto_perfil) {
                    paciente.foto_url = `/uploads/${paciente.foto_perfil}`;
                } else {
                    paciente.foto_url = '/assets/default-avatar.png';
                }

                // Calcular idade
                if (paciente.data_nascimento) {
                    const nascimento = new Date(paciente.data_nascimento);
                    const hoje = new Date();
                    let idade = hoje.getFullYear() - nascimento.getFullYear();
                    const mes = hoje.getMonth() - nascimento.getMonth();
                    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
                        idade--;
                    }
                    paciente.idade = idade;
                }

                return paciente;
            });

            console.log(`✅ ${pacientesComInfo.length} paciente(s) encontrado(s) para familiar cuidador`);
            res.json(pacientesComInfo);
        });
    });
});

// Rota genérica para dependentes (usa o tipo do usuário para decidir qual rota chamar)
app.get("/api/usuarios/:usuarioId/dependentes", (req, res) => {
    const usuarioId = req.params.usuarioId;

    console.log(`🔍 Buscando tipo do usuário: ${usuarioId}`);

    // Primeiro buscar o tipo do usuário
    const getTipoQuery = "SELECT tipo FROM usuarios WHERE id = ?";

    db.query(getTipoQuery, [usuarioId], (err, tipoResults) => {
        if (err) {
            console.error("❌ Erro ao buscar tipo do usuário:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (tipoResults.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        const tipoUsuario = tipoResults[0].tipo;
        console.log(`👤 Usuário ${usuarioId} é do tipo: ${tipoUsuario}`);

        // Redirecionar para a rota correta baseada no tipo
        if (tipoUsuario === 'familiar_contratante') {
            // Usar a rota de familiar contratante
            const getFamiliarIdQuery = "SELECT id FROM familiares_contratantes WHERE usuario_id = ?";

            db.query(getFamiliarIdQuery, [usuarioId], (err, familiarResults) => {
                if (err || familiarResults.length === 0) {
                    return res.status(404).json({ error: "Familiar contratante não encontrado" });
                }

                const familiarId = familiarResults[0].id;

                const pacientesQuery = `
                    SELECT p.*
                    FROM pacientes p
                    WHERE p.familiar_contratante_id = ? AND p.ativo = TRUE
                `;

                db.query(pacientesQuery, [familiarId], (err, pacientesResults) => {
                    if (err) {
                        console.error("❌ Erro ao buscar pacientes:", err);
                        return res.status(500).json({ error: "Erro interno do servidor" });
                    }

                    const pacientesComInfo = pacientesResults.map(paciente => {
                        if (paciente.foto_perfil) {
                            paciente.foto_url = `/uploads/${paciente.foto_perfil}`;
                        } else {
                            paciente.foto_url = '/assets/default-avatar.png';
                        }

                        if (paciente.data_nascimento) {
                            const nascimento = new Date(paciente.data_nascimento);
                            const hoje = new Date();
                            let idade = hoje.getFullYear() - nascimento.getFullYear();
                            const mes = hoje.getMonth() - nascimento.getMonth();
                            if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
                                idade--;
                            }
                            paciente.idade = idade;
                        }

                        return paciente;
                    });

                    console.log(`✅ ${pacientesComInfo.length} paciente(s) para familiar contratante`);
                    res.json(pacientesComInfo);
                });
            });

        } else if (tipoUsuario === 'familiar_cuidador') {
            // Usar a rota de familiar cuidador
            const getFamiliarIdQuery = "SELECT id FROM familiares_cuidadores WHERE usuario_id = ?";

            db.query(getFamiliarIdQuery, [usuarioId], (err, familiarResults) => {
                if (err || familiarResults.length === 0) {
                    return res.status(404).json({ error: "Familiar cuidador não encontrado" });
                }

                const familiarId = familiarResults[0].id;

                const pacientesQuery = `
                    SELECT p.*
                    FROM pacientes p
                    WHERE p.familiar_cuidador_id = ? AND p.ativo = TRUE
                `;

                db.query(pacientesQuery, [familiarId], (err, pacientesResults) => {
                    if (err) {
                        console.error("❌ Erro ao buscar pacientes:", err);
                        return res.status(500).json({ error: "Erro interno do servidor" });
                    }

                    const pacientesComInfo = pacientesResults.map(paciente => {
                        if (paciente.foto_perfil) {
                            paciente.foto_url = `/uploads/${paciente.foto_perfil}`;
                        } else {
                            paciente.foto_url = '/assets/default-avatar.png';
                        }

                        if (paciente.data_nascimento) {
                            const nascimento = new Date(paciente.data_nascimento);
                            const hoje = new Date();
                            let idade = hoje.getFullYear() - nascimento.getFullYear();
                            const mes = hoje.getMonth() - nascimento.getMonth();
                            if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
                                idade--;
                            }
                            paciente.idade = idade;
                        }

                        return paciente;
                    });

                    console.log(`✅ ${pacientesComInfo.length} paciente(s) para familiar cuidador`);
                    res.json(pacientesComInfo);
                });
            });

        } else if (tipoUsuario === 'cuidador_profissional') {
            // Usar a rota de cuidador profissional
            const query = `
                SELECT 
                    p.*
                FROM pacientes p
                INNER JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id
                INNER JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
                WHERE cp.usuario_id = ? AND cpp.status_vinculo = 'ativo' AND p.ativo = TRUE
            `;

            db.query(query, [usuarioId], (err, results) => {
                if (err) {
                    console.error("❌ Erro ao buscar pacientes do cuidador:", err);
                    return res.status(500).json({ error: "Erro interno do servidor" });
                }

                const pacientesComInfo = results.map(paciente => {
                    if (paciente.foto_perfil) {
                        paciente.foto_url = `/uploads/${paciente.foto_perfil}`;
                    } else {
                        paciente.foto_url = '/assets/default-avatar.png';
                    }

                    if (paciente.data_nascimento) {
                        const nascimento = new Date(paciente.data_nascimento);
                        const hoje = new Date();
                        let idade = hoje.getFullYear() - nascimento.getFullYear();
                        const mes = hoje.getMonth() - nascimento.getMonth();
                        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
                            idade--;
                        }
                        paciente.idade = idade;
                    }

                    return paciente;
                });

                console.log(`✅ ${pacientesComInfo.length} paciente(s) para cuidador profissional`);
                res.json(pacientesComInfo);
            });

        } else {
            return res.status(400).json({ error: "Tipo de usuário não suportado" });
        }
    });
});
// ====================== ROTAS PARA DASHBOARD DO SUPERVISOR/FAMILIAR ====================== //

// Rota CORRIGIDA para buscar paciente do supervisor (familiar contratante)
app.get("/api/supervisores/:supervisorId/paciente/:pacienteId", (req, res) => {
    const { supervisorId, pacienteId } = req.params;

    console.log(`🎯 Buscando paciente ${pacienteId} para supervisor (familiar contratante): ${supervisorId}`);

    // ✅ CORREÇÃO: Verificar acesso para familiar contratante
    const verificarAcessoQuery = `
        SELECT p.id 
        FROM pacientes p
        INNER JOIN familiares_contratantes fc ON p.familiar_contratante_id = fc.id
        WHERE p.id = ? AND fc.usuario_id = ? AND p.ativo = TRUE
    `;

    db.query(verificarAcessoQuery, [pacienteId, supervisorId], (err, acessoResults) => {
        if (err) {
            console.error("❌ Erro ao verificar acesso:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (acessoResults.length === 0) {
            console.log("❌ Acesso negado: paciente não pertence ao familiar contratante");
            return res.status(403).json({ error: "Acesso negado a este paciente" });
        }

        // Buscar informações completas do paciente
        const pacienteQuery = `
            SELECT 
                p.*,
                u_familiar.nome as familiar_nome,
                u_familiar.telefone as familiar_telefone,
                u_cuidador.nome as cuidador_nome,
                u_cuidador.telefone as cuidador_telefone,
                u_cuidador.email as cuidador_email,
                cp.especializacao as cuidador_especializacao,
                TIMESTAMPDIFF(YEAR, p.data_nascimento, CURDATE()) as idade
            FROM pacientes p
            LEFT JOIN familiares_contratantes fc ON p.familiar_contratante_id = fc.id
            LEFT JOIN usuarios u_familiar ON fc.usuario_id = u_familiar.id
            LEFT JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id AND cpp.status_vinculo = 'ativo'
            LEFT JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
            LEFT JOIN usuarios u_cuidador ON cp.usuario_id = u_cuidador.id
            WHERE p.id = ?
        `;

        db.query(pacienteQuery, [pacienteId], (err, pacienteResults) => {
            if (err) {
                console.error("❌ Erro ao buscar paciente:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            if (pacienteResults.length === 0) {
                return res.status(404).json({ error: "Paciente não encontrado" });
            }

            const paciente = pacienteResults[0];

            // Adicionar URL da foto
            if (paciente.foto_perfil) {
                paciente.foto_url = `/uploads/${paciente.foto_perfil}`;
            } else {
                paciente.foto_url = '/assets/default-avatar.png';
            }

            console.log(`✅ Paciente encontrado para familiar contratante: ${paciente.nome}`);
            res.json(paciente);
        });
    });
});

// Rota CORRIGIDA para sinais vitais do supervisor
app.get("/api/supervisores/:supervisorId/pacientes/:pacienteId/sinais-vitais", (req, res) => {
    const { supervisorId, pacienteId } = req.params;

    console.log(`📊 Buscando sinais vitais do paciente ${pacienteId} para supervisor: ${supervisorId}`);

    // ✅ CORREÇÃO: Verificar acesso para familiar contratante
    const verificarAcessoQuery = `
        SELECT p.id 
        FROM pacientes p
        INNER JOIN familiares_contratantes fc ON p.familiar_contratante_id = fc.id
        WHERE p.id = ? AND fc.usuario_id = ? AND p.ativo = TRUE
    `;

    db.query(verificarAcessoQuery, [pacienteId, supervisorId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const query = `
            SELECT *
            FROM sinais_vitais 
            WHERE paciente_id = ?
            ORDER BY data_registro DESC
            LIMIT 10
        `;

        db.query(query, [pacienteId], (err, results) => {
            if (err) {
                console.error("❌ Erro ao buscar sinais vitais:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            console.log(`✅ ${results.length} sinais vitais encontrados para supervisor`);
            res.json(results);
        });
    });
});

// Rota CORRIGIDA para medicamentos do supervisor
app.get("/api/supervisores/:supervisorId/pacientes/:pacienteId/medicamentos", (req, res) => {
    const { supervisorId, pacienteId } = req.params;

    console.log(`💊 Buscando medicamentos do paciente ${pacienteId} para supervisor: ${supervisorId}`);

    // ✅ CORREÇÃO: Verificar acesso para familiar contratante
    const verificarAcessoQuery = `
        SELECT p.id 
        FROM pacientes p
        INNER JOIN familiares_contratantes fc ON p.familiar_contratante_id = fc.id
        WHERE p.id = ? AND fc.usuario_id = ? AND p.ativo = TRUE
    `;

    db.query(verificarAcessoQuery, [pacienteId, supervisorId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const query = `
            SELECT *
            FROM medicamentos 
            WHERE paciente_id = ? AND ativo = TRUE
            ORDER BY horarios
        `;

        db.query(query, [pacienteId], (err, results) => {
            if (err) {
                console.error("❌ Erro ao buscar medicamentos:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            console.log(`✅ ${results.length} medicamentos encontrados para supervisor`);
            res.json(results);
        });
    });
});

// Rota CORRIGIDA para alertas do supervisor
app.get("/api/supervisores/:supervisorId/pacientes/:pacienteId/alertas", (req, res) => {
    const { supervisorId, pacienteId } = req.params;

    console.log(`🚨 Buscando alertas do paciente ${pacienteId} para supervisor: ${supervisorId}`);

    // ✅ CORREÇÃO: Verificar acesso para familiar contratante
    const verificarAcessoQuery = `
        SELECT p.id 
        FROM pacientes p
        INNER JOIN familiares_contratantes fc ON p.familiar_contratante_id = fc.id
        WHERE p.id = ? AND fc.usuario_id = ? AND p.ativo = TRUE
    `;

    db.query(verificarAcessoQuery, [pacienteId, supervisorId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const query = `
            SELECT *
            FROM alertas 
            WHERE paciente_id = ? AND status = 'ativo'
            ORDER BY data_criacao DESC
            LIMIT 5
        `;

        db.query(query, [pacienteId], (err, results) => {
            if (err) {
                console.error("❌ Erro ao buscar alertas:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            console.log(`✅ ${results.length} alertas encontrados para supervisor`);
            res.json(results);
        });
    });
});

// Buscar atividades do paciente para supervisor - NOVA ROTA
app.get("/api/supervisores/:supervisorId/pacientes/:pacienteId/atividades", (req, res) => {
    const { supervisorId, pacienteId } = req.params;

    console.log(`📅 Buscando atividades para supervisor ${supervisorId} do paciente ${pacienteId}`);

    // Verificar acesso do supervisor ao paciente
    const verificarAcessoQuery = `
        SELECT p.id 
        FROM pacientes p
        WHERE p.id = ? AND (p.familiar_contratante_id IN (SELECT id FROM familiares_contratantes WHERE usuario_id = ?)
                          OR p.familiar_cuidador_id IN (SELECT id FROM familiares_cuidadores WHERE usuario_id = ?))
    `;

    db.query(verificarAcessoQuery, [pacienteId, supervisorId, supervisorId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            console.log('❌ Acesso negado ou paciente não encontrado');
            return res.status(403).json({ error: "Acesso negado a este paciente" });
        }

        // Buscar atividades do paciente
        const query = `
            SELECT 
                a.id,
                a.tipo,
                a.descricao,
                a.data_prevista,
                a.status,
                a.observacoes,
                a.data_conclusao,
                u.nome as cuidador_nome,
                p.nome as paciente_nome
            FROM atividades a
            LEFT JOIN pacientes p ON a.paciente_id = p.id
            LEFT JOIN cuidadores_profissionais cp ON a.cuidador_id = cp.id
            LEFT JOIN usuarios u ON cp.usuario_id = u.id
            WHERE a.paciente_id = ? 
            AND (
                (a.status = 'pendente' AND DATE(a.data_prevista) = CURDATE()) 
                OR 
                (a.status = 'concluida' AND DATE(a.data_conclusao) = CURDATE())
            )
            AND a.status != 'cancelada'
            ORDER BY a.data_prevista ASC
        `;

        db.query(query, [pacienteId], (err, results) => {
            if (err) {
                console.error("❌ Erro ao buscar atividades para supervisor:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            console.log(`📊 ${results.length} atividades encontradas para supervisor`);
            
            const atividadesFormatadas = results.map(atividade => ({
                id: atividade.id,
                tipo: atividade.tipo,
                descricao: atividade.descricao,
                data_prevista: atividade.data_prevista,
                status: atividade.status,
                observacoes: atividade.observacoes,
                data_conclusao: atividade.data_conclusao,
                cuidador_nome: atividade.cuidador_nome,
                paciente_nome: atividade.paciente_nome
            }));

            res.json(atividadesFormatadas);
        });
    });
});

// Medicamentos do paciente para supervisor
app.get("/api/supervisores/:supervisorId/pacientes/:pacienteId/medicamentos", (req, res) => {
    const { supervisorId, pacienteId } = req.params;

    console.log(`💊 Buscando medicamentos do paciente ${pacienteId} para supervisor`);

    // Verificar acesso primeiro
    const verificarAcessoQuery = `
        SELECT p.id 
        FROM pacientes p
        WHERE p.id = ? AND (p.familiar_contratante_id IN (SELECT id FROM familiares_contratantes WHERE usuario_id = ?)
                          OR p.familiar_cuidador_id IN (SELECT id FROM familiares_cuidadores WHERE usuario_id = ?))
    `;

    db.query(verificarAcessoQuery, [pacienteId, supervisorId, supervisorId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const query = `
            SELECT *
            FROM medicamentos 
            WHERE paciente_id = ? AND ativo = TRUE
            ORDER BY horarios
        `;

        db.query(query, [pacienteId], (err, results) => {
            if (err) {
                console.error("❌ Erro ao buscar medicamentos:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            console.log(`✅ ${results.length} medicamentos encontrados`);
            res.json(results);
        });
    });
});

// Alertas do paciente para supervisor
app.get("/api/supervisores/:supervisorId/pacientes/:pacienteId/alertas", (req, res) => {
    const { supervisorId, pacienteId } = req.params;

    console.log(`🚨 Buscando alertas do paciente ${pacienteId} para supervisor`);

    // Verificar acesso primeiro
    const verificarAcessoQuery = `
        SELECT p.id 
        FROM pacientes p
        WHERE p.id = ? AND (p.familiar_contratante_id IN (SELECT id FROM familiares_contratantes WHERE usuario_id = ?)
                          OR p.familiar_cuidador_id IN (SELECT id FROM familiares_cuidadores WHERE usuario_id = ?))
    `;

    db.query(verificarAcessoQuery, [pacienteId, supervisorId, supervisorId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const query = `
            SELECT *
            FROM alertas 
            WHERE paciente_id = ? AND status = 'ativo'
            ORDER BY data_criacao DESC
            LIMIT 5
        `;

        db.query(query, [pacienteId], (err, results) => {
            if (err) {
                console.error("❌ Erro ao buscar alertas:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            console.log(`✅ ${results.length} alertas encontrados`);
            res.json(results);
        });
    });
});

// Atividades do paciente para supervisor
app.get("/api/supervisores/:supervisorId/pacientes/:pacienteId/atividades", (req, res) => {
    const { supervisorId, pacienteId } = req.params;

    console.log(`📝 Buscando atividades do paciente ${pacienteId} para supervisor`);

    // Verificar acesso primeiro
    const verificarAcessoQuery = `
        SELECT p.id 
        FROM pacientes p
        WHERE p.id = ? AND (p.familiar_contratante_id IN (SELECT id FROM familiares_contratantes WHERE usuario_id = ?)
                          OR p.familiar_cuidador_id IN (SELECT id FROM familiares_cuidadores WHERE usuario_id = ?))
    `;

    db.query(verificarAcessoQuery, [pacienteId, supervisorId, supervisorId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const query = `
            SELECT 
                a.*,
                u.nome as cuidador_nome
            FROM atividades a
            LEFT JOIN usuarios u ON a.cuidador_id = u.id
            WHERE a.paciente_id = ?
            ORDER BY a.data_prevista DESC
            LIMIT 10
        `;

        db.query(query, [pacienteId], (err, results) => {
            if (err) {
                console.error("❌ Erro ao buscar atividades:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            console.log(`✅ ${results.length} atividades encontradas`);
            res.json(results);
        });
    });
});

// ====================== ROTA PARA CADASTRAR FAMILIAR CUIDADOR ====================== //

app.post("/api/cadastrar-familiar-cuidador", upload.single('foto_perfil'), (req, res) => {
    console.log("📝 Iniciando cadastro de familiar cuidador...");

    const {
        nome,
        email,
        senha,
        telefone,
        data_nascimento,
        parentesco,
        endereco
    } = req.body;

    // Validações básicas (sem CPF e sem genero)
    if (!nome || !email || !senha || !telefone) {
        return res.status(400).json({
            success: false,
            message: 'Nome, email, senha e telefone são obrigatórios'
        });
    }

    if (senha.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'A senha deve ter pelo menos 6 caracteres'
        });
    }

    console.log("📊 Dados recebidos:", {
        nome, email, telefone, data_nascimento, parentesco, endereco
    });

    // 1. Verificar se o email já existe
    const checkEmailQuery = "SELECT id FROM usuarios WHERE email = ?";

    db.query(checkEmailQuery, [email], (err, emailResults) => {
        if (err) {
            console.error("❌ Erro ao verificar email:", err);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }

        if (emailResults.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email já cadastrado'
            });
        }

        // 2. Inserir usuário (sem CPF e sem genero)
        const insertUsuarioQuery = `
            INSERT INTO usuarios 
            (nome, email, senha, telefone, data_nascimento, tipo, ativo, data_criacao)
            VALUES (?, ?, ?, ?, ?, 'familiar_cuidador', TRUE, NOW())
        `;

        db.query(insertUsuarioQuery, [
            nome,
            email,
            senha,
            telefone,
            data_nascimento || null
        ], (err, usuarioResult) => {
            if (err) {
                console.error("❌ Erro ao inserir usuário:", err);
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao cadastrar usuário'
                });
            }

            const usuarioId = usuarioResult.insertId;
            console.log(`✅ Usuário criado com ID: ${usuarioId}`);

            // 3. Inserir familiar cuidador
            const insertFamiliarQuery = `
                INSERT INTO familiares_cuidadores 
                (usuario_id, parentesco, endereco, data_criacao)
                VALUES (?, ?, ?, NOW())
            `;

            db.query(insertFamiliarQuery, [
                usuarioId,
                parentesco || 'Familiar',
                endereco || null
            ], (err, familiarResult) => {
                if (err) {
                    console.error("❌ Erro ao inserir familiar cuidador:", err);

                    // Rollback: deletar usuário se falhar ao criar familiar
                    db.query("DELETE FROM usuarios WHERE id = ?", [usuarioId]);

                    return res.status(500).json({
                        success: false,
                        message: 'Erro ao criar perfil de familiar cuidador'
                    });
                }

                const familiarId = familiarResult.insertId;
                console.log(`🎉 Familiar cuidador cadastrado com sucesso!`);
                console.log(`👤 Usuário ID: ${usuarioId}`);
                console.log(`👨‍👩‍👧‍👦 Familiar ID: ${familiarId}`);
                console.log(`📋 Parentesco: ${parentesco || 'Familiar'}`);

                // Retornar sucesso
                res.json({
                    success: true,
                    message: 'Familiar cuidador cadastrado com sucesso!',
                    usuario_id: usuarioId,
                    familiar_id: familiarId,
                    redirect: '/'
                });
            });
        });
    });
});
// ====================== ROTA PARA CADASTRAR PACIENTE ====================== //

app.post("/api/pacientes", upload.single('foto_perfil'), (req, res) => {
    console.log("👤 Iniciando cadastro de paciente...");

    const {
        nome,
        data_nascimento,
        genero,
        condicao_principal,
        plano_saude,
        alergias,
        historico_medico,
        familiar_cuidador_id
    } = req.body;

    // Validações básicas
    if (!nome || !data_nascimento || !familiar_cuidador_id) {
        return res.status(400).json({
            success: false,
            message: 'Nome, data de nascimento e familiar cuidador são obrigatórios'
        });
    }

    // Processar foto se existir
    let foto_perfil = null;
    if (req.file) {
        foto_perfil = req.file.filename;
    }

    console.log("📊 Dados do paciente recebidos:", {
        nome, data_nascimento, genero, familiar_cuidador_id
    });

    // Inserir paciente
    const insertPacienteQuery = `
        INSERT INTO pacientes 
        (nome, data_nascimento, genero, condicao_principal, plano_saude, alergias, historico_medico, foto_perfil, familiar_cuidador_id, ativo, data_criacao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW())
    `;

    db.query(insertPacienteQuery, [
        nome,
        data_nascimento,
        genero || null,
        condicao_principal || null,
        plano_saude || null,
        alergias || null,
        historico_medico || null,
        foto_perfil,
        familiar_cuidador_id
    ], (err, pacienteResult) => {
        if (err) {
            console.error("❌ Erro ao inserir paciente:", err);
            return res.status(500).json({
                success: false,
                message: 'Erro ao cadastrar paciente'
            });
        }

        const pacienteId = pacienteResult.insertId;
        console.log(`✅ Paciente cadastrado com sucesso! ID: ${pacienteId}`);

        res.json({
            success: true,
            message: 'Paciente cadastrado com sucesso!',
            paciente_id: pacienteId
        });
    });
});
// ====================== ROTAS PARA FAMILIAR CUIDADOR ====================== //

// Rota para buscar pacientes do familiar cuidador
app.get("/api/familiares-cuidadores/:usuarioId/pacientes", (req, res) => {
    const usuarioId = req.params.usuarioId;

    console.log(`👥 Buscando pacientes para familiar cuidador: ${usuarioId}`);

    const query = `
        SELECT 
            p.*,
            TIMESTAMPDIFF(YEAR, p.data_nascimento, CURDATE()) as idade
        FROM pacientes p
        INNER JOIN familiares_cuidadores fc ON p.familiar_cuidador_id = fc.id
        WHERE fc.usuario_id = ? AND p.ativo = TRUE
    `;

    db.query(query, [usuarioId], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar pacientes do familiar cuidador:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        // Adicionar URLs de foto
        const pacientesComInfo = results.map(paciente => {
            if (paciente.foto_perfil) {
                paciente.foto_url = `/uploads/${paciente.foto_perfil}`;
            } else {
                paciente.foto_url = '/assets/default-avatar.png';
            }
            return paciente;
        });

        console.log(`✅ ${pacientesComInfo.length} paciente(s) encontrado(s) para familiar cuidador ${usuarioId}`);
        res.json(pacientesComInfo);
    });
});

// Rota para familiar cuidador selecionar paciente e ir para dashboard_supervisor
app.post("/api/familiares-cuidadores/:usuarioId/selecionar-paciente", (req, res) => {
    const usuarioId = req.params.usuarioId;
    const { pacienteId } = req.body;

    console.log(`🎯 Familiar cuidador ${usuarioId} selecionando paciente: ${pacienteId}`);

    // Verificar se o familiar cuidador tem acesso a este paciente
    const verificarAcessoQuery = `
        SELECT p.id 
        FROM pacientes p
        INNER JOIN familiares_cuidadores fc ON p.familiar_cuidador_id = fc.id
        WHERE p.id = ? AND fc.usuario_id = ? AND p.ativo = TRUE
    `;

    db.query(verificarAcessoQuery, [pacienteId, usuarioId], (err, acessoResults) => {
        if (err) {
            console.error("❌ Erro ao verificar acesso:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado a este paciente" });
        }

        console.log(`✅ Acesso validado - redirecionando para dashboard_supervisor`);

        res.json({
            success: true,
            message: "Paciente selecionado com sucesso",
            redirect: "/dashboard_supervisor",
            paciente_id: pacienteId
        });
    });
});

// Rota para buscar informações do paciente para o dashboard_supervisor
app.get("/api/familiares-cuidadores/:usuarioId/paciente/:pacienteId", (req, res) => {
    const { usuarioId, pacienteId } = req.params;

    console.log(`📊 Buscando paciente ${pacienteId} para familiar cuidador: ${usuarioId}`);

    // Verificar acesso primeiro
    const verificarAcessoQuery = `
        SELECT p.id 
        FROM pacientes p
        INNER JOIN familiares_cuidadores fc ON p.familiar_cuidador_id = fc.id
        WHERE p.id = ? AND fc.usuario_id = ? AND p.ativo = TRUE
    `;

    db.query(verificarAcessoQuery, [pacienteId, usuarioId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        // Buscar informações completas do paciente
        const pacienteQuery = `
            SELECT 
                p.*,
                TIMESTAMPDIFF(YEAR, p.data_nascimento, CURDATE()) as idade
            FROM pacientes p
            WHERE p.id = ?
        `;

        db.query(pacienteQuery, [pacienteId], (err, pacienteResults) => {
            if (err) {
                console.error("❌ Erro ao buscar paciente:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            if (pacienteResults.length === 0) {
                return res.status(404).json({ error: "Paciente não encontrado" });
            }

            const paciente = pacienteResults[0];

            // Adicionar URL da foto
            if (paciente.foto_perfil) {
                paciente.foto_url = `/uploads/${paciente.foto_perfil}`;
            } else {
                paciente.foto_url = '/assets/default-avatar.png';
            }

            console.log(`✅ Paciente encontrado para familiar cuidador: ${paciente.nome}`);
            res.json(paciente);
        });
    });
});

// ====================== ROTAS ADICIONAIS QUE ESTÃO FALTANDO ====================== //

// Rota para dashboard familiar cuidador (NOVA)
app.get("/dashboard_familiar_cuidador", (req, res) => {
    res.sendFile(path.join(__dirname, "public/paginas/dashboard_familiar_cuidador.html"));
});

// Rota para dashboard familiar cuidador com .html também
app.get("/dashboard_familiar_cuidador.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public/paginas/dashboard_familiar_cuidador.html"));
});

// Remova ou comente a rota que não existe
// app.get("/dashboard_familiar", (req, res) => {
//   res.sendFile(path.join(__dirname, "public/paginas/dashboard_familiar.html"));
// });

// ====================== ROTAS PARA DASHBOARD FAMILIAR CUIDADOR ====================== //

// Buscar paciente do familiar cuidador
app.get("/api/familiares-cuidadores/:usuarioId/paciente/:pacienteId", (req, res) => {
    const { usuarioId, pacienteId } = req.params;

    console.log(`📊 Buscando paciente ${pacienteId} para familiar cuidador: ${usuarioId}`);

    // Verificar acesso primeiro
    const verificarAcessoQuery = `
        SELECT p.id 
        FROM pacientes p
        INNER JOIN familiares_cuidadores fc ON p.familiar_cuidador_id = fc.id
        WHERE p.id = ? AND fc.usuario_id = ? AND p.ativo = TRUE
    `;

    db.query(verificarAcessoQuery, [pacienteId, usuarioId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        // Buscar informações completas do paciente
        const pacienteQuery = `
            SELECT 
                p.*,
                TIMESTAMPDIFF(YEAR, p.data_nascimento, CURDATE()) as idade
            FROM pacientes p
            WHERE p.id = ?
        `;

        db.query(pacienteQuery, [pacienteId], (err, pacienteResults) => {
            if (err) {
                console.error("❌ Erro ao buscar paciente:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            if (pacienteResults.length === 0) {
                return res.status(404).json({ error: "Paciente não encontrado" });
            }

            const paciente = pacienteResults[0];

            // Adicionar URL da foto
            if (paciente.foto_perfil) {
                paciente.foto_url = `/uploads/${paciente.foto_perfil}`;
            } else {
                paciente.foto_url = '/assets/default-avatar.png';
            }

            console.log(`✅ Paciente encontrado para familiar cuidador: ${paciente.nome}`);
            res.json(paciente);
        });
    });
});

// Sinais vitais para familiar cuidador
app.get("/api/familiares-cuidadores/:usuarioId/pacientes/:pacienteId/sinais-vitais", (req, res) => {
    const { usuarioId, pacienteId } = req.params;

    console.log(`📊 Buscando sinais vitais para familiar cuidador: ${usuarioId}`);

    // Verificar acesso
    const verificarAcessoQuery = `
        SELECT p.id 
        FROM pacientes p
        INNER JOIN familiares_cuidadores fc ON p.familiar_cuidador_id = fc.id
        WHERE p.id = ? AND fc.usuario_id = ? AND p.ativo = TRUE
    `;

    db.query(verificarAcessoQuery, [pacienteId, usuarioId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const query = `
            SELECT *
            FROM sinais_vitais 
            WHERE paciente_id = ?
            ORDER BY data_registro DESC
            LIMIT 10
        `;

        db.query(query, [pacienteId], (err, results) => {
            if (err) {
                console.error("❌ Erro ao buscar sinais vitais:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            console.log(`✅ ${results.length} sinais vitais encontrados para familiar cuidador`);
            res.json(results);
        });
    });
});

// Medicamentos para familiar cuidador
app.get("/api/familiares-cuidadores/:usuarioId/pacientes/:pacienteId/medicamentos", (req, res) => {
    const { usuarioId, pacienteId } = req.params;

    console.log(`💊 Buscando medicamentos para familiar cuidador: ${usuarioId}`);

    // Verificar acesso
    const verificarAcessoQuery = `
        SELECT p.id 
        FROM pacientes p
        INNER JOIN familiares_cuidadores fc ON p.familiar_cuidador_id = fc.id
        WHERE p.id = ? AND fc.usuario_id = ? AND p.ativo = TRUE
    `;

    db.query(verificarAcessoQuery, [pacienteId, usuarioId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const query = `
            SELECT *
            FROM medicamentos 
            WHERE paciente_id = ? AND ativo = TRUE
            ORDER BY horarios
        `;

        db.query(query, [pacienteId], (err, results) => {
            if (err) {
                console.error("❌ Erro ao buscar medicamentos:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            console.log(`✅ ${results.length} medicamentos encontrados para familiar cuidador`);
            res.json(results);
        });
    });
});

// Alertas para familiar cuidador
app.get("/api/familiares-cuidadores/:usuarioId/pacientes/:pacienteId/alertas", (req, res) => {
    const { usuarioId, pacienteId } = req.params;

    console.log(`🚨 Buscando alertas para familiar cuidador: ${usuarioId}`);

    // Verificar acesso
    const verificarAcessoQuery = `
        SELECT p.id 
        FROM pacientes p
        INNER JOIN familiares_cuidadores fc ON p.familiar_cuidador_id = fc.id
        WHERE p.id = ? AND fc.usuario_id = ? AND p.ativo = TRUE
    `;

    db.query(verificarAcessoQuery, [pacienteId, usuarioId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const query = `
            SELECT *
            FROM alertas 
            WHERE paciente_id = ? AND status = 'ativo'
            ORDER BY data_criacao DESC
            LIMIT 5
        `;

        db.query(query, [pacienteId], (err, results) => {
            if (err) {
                console.error("❌ Erro ao buscar alertas:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            console.log(`✅ ${results.length} alertas encontrados para familiar cuidador`);
            res.json(results);
        });
    });
});

// ✅ ADICIONAR esta rota nova:
app.get("/api/cuidadores/:cuidadorId/pacientes", (req, res) => {
    const cuidadorId = req.params.cuidadorId;

    const query = `
        SELECT p.*
        FROM pacientes p
        INNER JOIN cuidadores_profissionais_pacientes cpp ON p.id = cpp.paciente_id
        INNER JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
        WHERE cp.usuario_id = ? AND cpp.status_vinculo = 'ativo' AND p.ativo = TRUE
    `;

    db.query(query, [cuidadorId], (err, results) => {
        // ... tratamento de resultados
    });
});

// ====================== ROTA PARA CADASTRO COMPLETO FAMILIAR CONTRATANTE ====================== //

app.post("/api/cadastro-completo-familiar-contratante", upload.single('foto_perfil'), async (req, res) => {
    console.log("🎯 Iniciando cadastro completo do familiar contratante...");

    try {
        // Dados do familiar
        const {
            familiar_nome,
            familiar_email,
            familiar_senha,
            familiar_telefone,
            familiar_data_nascimento,
            familiar_parentesco,
            familiar_endereco,

            // Dados do dependente
            dependente_nome,
            dependente_data_nascimento,
            dependente_genero,
            dependente_condicao_principal,
            dependente_plano_saude,
            dependente_alergias,
            dependente_historico_medico,
            dependente_contato_emergencia,

            // Dados do cuidador
            cuidador_nome,
            cuidador_email,
            cuidador_telefone,
            cuidador_cpf,
            cuidador_especializacao,
            cuidador_registro_profissional,
            cuidador_experiencia,
            cuidador_disponibilidade
        } = req.body;

        console.log("📦 Dados recebidos para cadastro completo");

        // Validações básicas
        if (!familiar_nome || !familiar_email || !familiar_senha) {
            return res.status(400).json({ error: "Dados do familiar incompletos" });
        }

        if (!dependente_nome || !dependente_data_nascimento) {
            return res.status(400).json({ error: "Dados do dependente incompletos" });
        }

        if (!cuidador_nome || !cuidador_email) {
            return res.status(400).json({ error: "Dados do cuidador incompletos" });
        }

        // Processar foto do dependente se existir
        let foto_perfil = null;
        if (req.file) {
            foto_perfil = req.file.filename;
        }

        // Iniciar transação
        await new Promise((resolve, reject) => {
            db.query('START TRANSACTION', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        let familiarUsuarioId, familiarContratanteId, pacienteId;

        try {
            // 1. Cadastrar usuário do familiar contratante
            console.log("👤 Cadastrando usuário do familiar contratante...");
            const insertUsuarioQuery = `
                INSERT INTO usuarios (nome, email, senha, telefone, data_nascimento, tipo, ativo, data_criacao)
                VALUES (?, ?, ?, ?, ?, 'familiar_contratante', TRUE, NOW())
            `;

            const usuarioResult = await new Promise((resolve, reject) => {
                db.query(insertUsuarioQuery, [
                    familiar_nome,
                    familiar_email,
                    familiar_senha,
                    familiar_telefone,
                    familiar_data_nascimento
                ], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            familiarUsuarioId = usuarioResult.insertId;
            console.log(`✅ Usuário familiar criado com ID: ${familiarUsuarioId}`);

            // 2. Cadastrar familiar contratante
            console.log("👨‍👩‍👧‍👦 Cadastrando perfil do familiar contratante...");
            const insertFamiliarQuery = `
                INSERT INTO familiares_contratantes (usuario_id, parentesco, endereco, data_criacao)
                VALUES (?, ?, ?, NOW())
            `;

            const familiarResult = await new Promise((resolve, reject) => {
                db.query(insertFamiliarQuery, [
                    familiarUsuarioId,
                    familiar_parentesco,
                    familiar_endereco
                ], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            familiarContratanteId = familiarResult.insertId;
            console.log(`✅ Familiar contratante criado com ID: ${familiarContratanteId}`);

            // 3. Cadastrar paciente/dependente
            console.log("👤 Cadastrando paciente/dependente...");
            const insertPacienteQuery = `
                INSERT INTO pacientes 
                (nome, data_nascimento, genero, condicao_principal, plano_saude, alergias, 
                 historico_medico, contato_emergencia, foto_perfil, familiar_contratante_id, ativo, data_criacao)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW())
            `;

            const pacienteResult = await new Promise((resolve, reject) => {
                db.query(insertPacienteQuery, [
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
                ], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            pacienteId = pacienteResult.insertId;
            console.log(`✅ Paciente criado com ID: ${pacienteId}`);

            // 4. Enviar convite para o cuidador (NÃO criar usuário ainda)
            console.log("📧 Enviando convite para o cuidador...");
            await enviarConviteCuidadorOriginal({
                familiar_contratante_id: familiarContratanteId,
                cuidador_email: cuidador_email,
                paciente_id: pacienteId,
                familiar_nome: familiar_nome,
                paciente_nome: dependente_nome,
                cuidador_nome: cuidador_nome,
                cuidador_telefone: cuidador_telefone,
                cuidador_cpf: cuidador_cpf,
                cuidador_especializacao: cuidador_especializacao,
                cuidador_registro_profissional: cuidador_registro_profissional,
                cuidador_experiencia: cuidador_experiencia,
                cuidador_disponibilidade: cuidador_disponibilidade
            });

            // Commit da transação
            await new Promise((resolve, reject) => {
                db.query('COMMIT', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            console.log("🎉 CADASTRO COMPLETO REALIZADO COM SUCESSO!");

            res.json({
                success: true,
                message: "Cadastro realizado com sucesso! Um convite foi enviado para o cuidador.",
                ids: {
                    familiar: familiarUsuarioId,
                    paciente: pacienteId
                }
            });

        } catch (error) {
            // Rollback em caso de erro
            await new Promise((resolve) => {
                db.query('ROLLBACK', () => resolve());
            });
            throw error;
        }

    } catch (error) {
        console.error("❌ Erro no cadastro completo:", error);
        res.status(500).json({
            error: "Erro ao realizar cadastro completo: " + error.message
        });
    }
});

// ====================== FUNÇÃO PARA ENVIAR CONVITE ORIGINAL ====================== //

async function enviarConviteCuidadorOriginal(dados) {
    const {
        familiar_contratante_id,
        cuidador_email,
        paciente_id,
        familiar_nome,
        paciente_nome,
        cuidador_nome
    } = dados;

    console.log("📧 Preparando envio de convite original para:", cuidador_email);

    try {
        // Gerar token único para o convite
        const token_convite = crypto.randomBytes(32).toString('hex');
        const expiracao = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

        // Verificar se a tabela tem colunas extras
        const checkColumnsQuery = "SHOW COLUMNS FROM convites_cuidadores LIKE 'cuidador_nome'";
        const hasExtraColumns = await new Promise((resolve, reject) => {
            db.query(checkColumnsQuery, (err, results) => {
                if (err) reject(err);
                else resolve(results.length > 0);
            });
        });

        let insertConviteQuery, queryParams;

        if (hasExtraColumns) {
            // Se tem colunas extras, usar todas
            insertConviteQuery = `
                INSERT INTO convites_cuidadores 
                (familiar_contratante_id, cuidador_email, paciente_id, token_convite, expiracao, data_convite,
                 cuidador_nome, cuidador_telefone, cuidador_cpf, cuidador_especializacao, 
                 cuidador_registro_profissional, cuidador_experiencia, cuidador_disponibilidade)
                VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)
            `;
            queryParams = [
                familiar_contratante_id,
                cuidador_email,
                paciente_id,
                token_convite,
                expiracao,
                dados.cuidador_nome,
                dados.cuidador_telefone,
                dados.cuidador_cpf,
                dados.cuidador_especializacao,
                dados.cuidador_registro_profissional,
                dados.cuidador_experiencia,
                dados.cuidador_disponibilidade
            ];
        } else {
            // Se não tem colunas extras, usar apenas as básicas
            insertConviteQuery = `
                INSERT INTO convites_cuidadores 
                (familiar_contratante_id, cuidador_email, paciente_id, token_convite, expiracao, data_convite)
                VALUES (?, ?, ?, ?, ?, NOW())
            `;
            queryParams = [
                familiar_contratante_id,
                cuidador_email,
                paciente_id,
                token_convite,
                expiracao
            ];
        }

        await new Promise((resolve, reject) => {
            db.query(insertConviteQuery, queryParams, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        console.log("✅ Convite criado no banco de dados");

        // Enviar e-mail de convite
        if (isEmailConfigured()) {
            const baseUrl = process.env.BASE_URL || "http://localhost:3000";
            const mailOptions = {
                from: `"Vital+ Convites" <${process.env.EMAIL_USER}>`,
                to: cuidador_email,
                subject: "👨‍⚕️ Convite para Cuidar de um Paciente - Vital+",
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #2D2D2D; margin: 0; padding: 0; background: #f8f9fa; }
                            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                            .header { background: linear-gradient(135deg, #00B5C2, #4B0082); color: white; padding: 30px; text-align: center; }
                            .content { padding: 30px; background: #FCFCFD; }
                            .btn-accept { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #27ae60, #219653); color: white; text-decoration: none; border-radius: 50px; font-weight: 600; margin: 20px 0; }
                            .info-box { background: rgba(0, 181, 194, 0.1); padding: 20px; border-left: 4px solid #00B5C2; margin: 20px 0; border-radius: 8px; }
                            .footer { text-align: center; padding: 20px; color: #6C757D; font-size: 12px; background: #F8F9FA; border-top: 1px solid #E5E7EB; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>👨‍⚕️ Convite Vital+</h1>
                                <p>Sistema de Acompanhamento para Cuidadores</p>
                            </div>
                            <div class="content">
                                <p>Olá <strong>${cuidador_nome}</strong>,</p>
                                <p>Você foi convidado(a) para cuidar de um paciente através da plataforma Vital+!</p>
                                
                                <div class="info-box">
                                    <p><strong>👤 Paciente:</strong> ${paciente_nome}</p>
                                    <p><strong>👨‍👩‍👧‍👦 Familiar Contratante:</strong> ${familiar_nome}</p>
                                    <p><strong>📧 Seu email:</strong> ${cuidador_email}</p>
                                </div>

                                <p><strong>🔐 Sobre sua conta:</strong></p>
                                <p>Clique no botão abaixo para criar sua conta e definir sua senha de acesso.</p>

                                <p style="text-align: center;">
                                    <a href="${baseUrl}/aceitar-convite?token=${token_convite}" class="btn-accept">
                                        ✅ Criar Conta e Definir Senha
                                    </a>
                                </p>
                                
                                <p><strong>⏰ Este convite expira em:</strong> ${expiracao.toLocaleDateString('pt-BR')}</p>
                                
                                <p><strong>🎯 O que você poderá fazer no Vital+:</strong></p>
                                <ul>
                                    <li>📊 Acompanhar sinais vitais do paciente</li>
                                    <li>💊 Gerenciar medicamentos e horários</li>
                                    <li>📝 Registrar atividades e observações</li>
                                    <li>🚨 Receber alertas importantes</li>
                                    <li>💬 Comunicar-se com a família</li>
                                </ul>
                            </div>
                            <div class="footer">
                                <p>Vital+ - Sistema de Acompanhamento para Cuidadores</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("❌ Erro ao enviar e-mail de convite:", error);
                } else {
                    console.log("✅ E-mail de convite enviado com sucesso!");
                }
            });
        } else {
            console.log("🔄 Modo desenvolvimento - Token do convite:", token_convite);
        }

    } catch (error) {
        console.error("❌ Erro ao enviar convite:", error);
        throw error;
    }
}

// ====================== FUNÇÃO PARA ENVIAR CONVITE COMPLETO ====================== //

async function enviarConviteCuidadorCompleto(dados) {
    const { familiar_contratante_id, cuidador_email, paciente_id, familiar_nome, paciente_nome, cuidador_nome } = dados;

    console.log("📧 Preparando envio de convite completo para:", cuidador_email);

    try {
        // Gerar token único para o convite
        const token_convite = crypto.randomBytes(32).toString('hex');
        const expiracao = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

        // Inserir convite no banco
        const insertConviteQuery = `
            INSERT INTO convites_cuidadores 
            (familiar_contratante_id, cuidador_email, paciente_id, token_convite, expiracao, data_convite)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;

        await new Promise((resolve, reject) => {
            db.query(insertConviteQuery, [
                familiar_contratante_id,
                cuidador_email,
                paciente_id,
                token_convite,
                expiracao
            ], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        console.log("✅ Convite criado no banco de dados");

        // Enviar e-mail de convite
        if (isEmailConfigured()) {
            const baseUrl = process.env.BASE_URL || "http://localhost:3000";
            const mailOptions = {
                from: `"Vital+ Convites" <${process.env.EMAIL_USER}>`,
                to: cuidador_email,
                subject: "👨‍⚕️ Convite para Cuidar de um Paciente - Vital+",
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #2D2D2D; margin: 0; padding: 0; background: #f8f9fa; }
                            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                            .header { background: linear-gradient(135deg, #00B5C2, #4B0082); color: white; padding: 30px; text-align: center; }
                            .content { padding: 30px; background: #FCFCFD; }
                            .btn-accept { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #27ae60, #219653); color: white; text-decoration: none; border-radius: 50px; font-weight: 600; margin: 20px 0; }
                            .info-box { background: rgba(0, 181, 194, 0.1); padding: 20px; border-left: 4px solid #00B5C2; margin: 20px 0; border-radius: 8px; }
                            .footer { text-align: center; padding: 20px; color: #6C757D; font-size: 12px; background: #F8F9FA; border-top: 1px solid #E5E7EB; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>👨‍⚕️ Convite Vital+</h1>
                                <p>Sistema de Acompanhamento para Cuidadores</p>
                            </div>
                            <div class="content">
                                <p>Olá <strong>${cuidador_nome}</strong>,</p>
                                <p>Você foi convidado(a) para cuidar de um paciente através da plataforma Vital+!</p>
                                
                                <div class="info-box">
                                    <p><strong>👤 Paciente:</strong> ${paciente_nome}</p>
                                    <p><strong>👨‍👩‍👧‍👦 Familiar Contratante:</strong> ${familiar_nome}</p>
                                    <p><strong>📧 Seu email:</strong> ${cuidador_email}</p>
                                </div>

                                <p><strong>🔐 Sobre sua conta:</strong></p>
                                <p>Você poderá definir sua senha pessoal ao aceitar este convite. É rápido e seguro!</p>

                                <p style="text-align: center;">
                                    <a href="${baseUrl}/aceitar-convite?token=${token_convite}" class="btn-accept">
                                        ✅ Aceitar Convite e Definir Senha
                                    </a>
                                </p>
                                
                                <p><strong>⏰ Este convite expira em:</strong> ${expiracao.toLocaleDateString('pt-BR')}</p>
                                
                                <p><strong>🎯 O que você poderá fazer no Vital+:</strong></p>
                                <ul>
                                    <li>📊 Acompanhar sinais vitais do paciente</li>
                                    <li>💊 Gerenciar medicamentos e horários</li>
                                    <li>📝 Registrar atividades e observações</li>
                                    <li>🚨 Receber alertas importantes</li>
                                    <li>💬 Comunicar-se com a família</li>
                                </ul>
                            </div>
                            <div class="footer">
                                <p>Vital+ - Sistema de Acompanhamento para Cuidadores</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("❌ Erro ao enviar e-mail de convite:", error);
                } else {
                    console.log("✅ E-mail de convite enviado com sucesso!");
                }
            });
        } else {
            console.log("🔄 Modo desenvolvimento - Token do convite:", token_convite);
        }

    } catch (error) {
        console.error("❌ Erro ao enviar convite:", error);
        throw error;
    }
}
// ====================== FUNÇÃO PARA ENVIAR EMAIL COM SENHA TEMPORÁRIA ====================== //

async function enviarEmailSenhaTemporaria(email, nome, senhaTemporaria) {
    if (!isEmailConfigured()) {
        console.log("🔄 Modo desenvolvimento - Senha temporária:", senhaTemporaria);
        return;
    }

    console.log("📧 Enviando email com senha temporária para:", email);

    const mailOptions = {
        from: `"Vital+ Suporte" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "🔐 Sua Senha Temporária - Vital+",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #2D2D2D; margin: 0; padding: 0; background: #f8f9fa; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #00B5C2, #4B0082); color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; background: #FCFCFD; }
                    .password-box { background: #FFF3CD; border: 2px dashed #FFC107; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
                    .password { font-size: 24px; font-weight: bold; color: #856404; letter-spacing: 2px; }
                    .security-note { background: #E8F5E8; padding: 15px; border-radius: 8px; margin: 15px 0; }
                    .footer { text-align: center; padding: 20px; color: #6C757D; font-size: 12px; background: #F8F9FA; border-top: 1px solid #E5E7EB; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Senha Temporária</h1>
                    </div>
                    <div class="content">
                        <p>Olá <strong>${nome}</strong>,</p>
                        <p>Uma conta foi criada para você no Vital+ como cuidador profissional.</p>
                        
                        <div class="password-box">
                            <p style="margin: 0 0 10px 0; font-weight: 600;">Sua senha temporária é:</p>
                            <div class="password">${senhaTemporaria}</div>
                        </div>
                        
                        <div class="security-note">
                            <p style="margin: 0; font-weight: 600;">⚠️ Importante:</p>
                            <p style="margin: 10px 0 0 0;">
                                Esta é uma senha temporária. Recomendamos que você altere sua senha após o primeiro login.
                            </p>
                        </div>
                        
                        <p><strong>Próximos passos:</strong></p>
                        <ol>
                            <li>Acesse o sistema Vital+</li>
                            <li>Use seu email e a senha temporária acima</li>
                            <li>Altere sua senha nas configurações da conta</li>
                        </ol>
                        
                        <p style="text-align: center; margin-top: 25px;">
                            <a href="${process.env.BASE_URL || 'http://localhost:3000'}" 
                               style="display: inline-block; padding: 12px 25px; background: linear-gradient(135deg, #00B5C2, #4B0082); color: white; text-decoration: none; border-radius: 50px; font-weight: 600;">
                                🔗 Acessar Vital+
                            </a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>Vital+ - Sistema de Acompanhamento para Cuidadores</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("❌ Erro ao enviar email com senha temporária:", error);
        } else {
            console.log("✅ Email com senha temporária enviado com sucesso");
        }
    });
}
// ====================== FUNÇÃO PARA ENVIAR EMAIL COM INSTRUÇÕES ====================== //

async function enviarEmailInstrucoesCuidador(email, nome) {
    if (!isEmailConfigured()) {
        console.log("🔄 Modo desenvolvimento - Email não configurado");
        return;
    }

    console.log("📧 Enviando email com instruções para:", email);

    const mailOptions = {
        from: `"Vital+ Suporte" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "👨‍⚕️ Sua Conta de Cuidador - Vital+",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #2D2D2D; margin: 0; padding: 0; background: #f8f9fa; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #00B5C2, #4B0082); color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; background: #FCFCFD; }
                    .info-box { background: #E8F5E8; padding: 20px; border-radius: 10px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #6C757D; font-size: 12px; background: #F8F9FA; border-top: 1px solid #E5E7EB; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>👨‍⚕️ Bem-vindo ao Vital+</h1>
                    </div>
                    <div class="content">
                        <p>Olá <strong>${nome}</strong>,</p>
                        <p>Uma conta de cuidador profissional foi criada para você no Vital+!</p>
                        
                        <div class="info-box">
                            <p style="margin: 0; font-weight: 600;">📧 Seu email: <strong>${email}</strong></p>
                            <p style="margin: 10px 0 0 0;">Você receberá um convite separado para definir sua senha e ativar sua conta.</p>
                        </div>
                        
                        <p><strong>O que você poderá fazer:</strong></p>
                        <ul>
                            <li>📊 Acompanhar sinais vitais do paciente</li>
                            <li>💊 Gerenciar medicamentos e horários</li>
                            <li>📝 Registrar atividades e observações</li>
                            <li>🚨 Receber alertas importantes</li>
                            <li>💬 Comunicar-se com a família</li>
                        </ul>
                        
                        <p style="text-align: center; margin-top: 25px;">
                            <a href="${process.env.BASE_URL || 'http://localhost:3000'}" 
                               style="display: inline-block; padding: 12px 25px; background: linear-gradient(135deg, #00B5C2, #4B0082); color: white; text-decoration: none; border-radius: 50px; font-weight: 600;">
                                🚀 Acessar Vital+
                            </a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>Vital+ - Sistema de Acompanhamento para Cuidadores</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("❌ Erro ao enviar email com instruções:", error);
        } else {
            console.log("✅ Email com instruções enviado com sucesso");
        }
    });
}

// ====================== FUNÇÃO PARA ENVIAR CONVITE AO CUIDADOR ====================== //

async function enviarConviteCuidador(dados) {
    const { familiar_contratante_id, cuidador_email, paciente_id, familiar_nome, paciente_nome } = dados;

    console.log("📧 Preparando envio de convite para:", cuidador_email);

    try {
        // Gerar token único para o convite
        const token_convite = crypto.randomBytes(32).toString('hex');
        const expiracao = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

        // Inserir convite no banco
        const insertConviteQuery = `
            INSERT INTO convites_cuidadores 
            (familiar_contratante_id, cuidador_email, paciente_id, token_convite, expiracao, data_convite)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;

        await new Promise((resolve, reject) => {
            db.query(insertConviteQuery, [
                familiar_contratante_id,
                cuidador_email,
                paciente_id,
                token_convite,
                expiracao
            ], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        console.log("✅ Convite criado no banco de dados");

        // Enviar e-mail de convite
        if (isEmailConfigured()) {
            const baseUrl = process.env.BASE_URL || "http://localhost:3000";
            const mailOptions = {
                from: `"Vital+ Convites" <${process.env.EMAIL_USER}>`,
                to: cuidador_email,
                subject: "📋 Convite para Cuidar de um Paciente - Vital+",
                html: `
                    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            /* ... estilos existentes ... */
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎗️ Convite Vital+</h1>
                <p>Sistema de Acompanhamento para Cuidadores</p>
            </div>
            <div class="content">
                <p>Olá,</p>
                <p>Você recebeu um convite para cuidar de um paciente através da plataforma Vital+!</p>
                
                <div class="info-box">
                    <p><strong>Paciente:</strong> ${paciente_nome}</p>
                    <p><strong>Familiar Contratante:</strong> ${familiar_nome}</p>
                </div>

                <!-- ✅ ADICIONE ESTAS 2 LINHAS SOBRE A SENHA -->
                <p><strong>🔐 Sobre sua senha:</strong></p>
                <p>Você poderá definir sua senha pessoal ao aceitar este convite. É rápido e seguro!</p>

                <p style="text-align: center;">
                    <a href="${baseUrl}/aceitar-convite?token=${token_convite}" class="btn-accept">
                        ✅ Aceitar Convite e Criar Conta
                    </a>
                </p>
                
                <p><strong>Este convite expira em:</strong> ${expiracao.toLocaleDateString('pt-BR')}</p>
            </div>
            <div class="footer">
                <p>Vital+ - Sistema de Acompanhamento para Cuidadores</p>
            </div>
        </div>
    </body>
    </html>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("❌ Erro ao enviar e-mail de convite:", error);
                } else {
                    console.log("✅ E-mail de convite enviado com sucesso!");
                }
            });
        } else {
            console.log("🔄 Modo desenvolvimento - Token do convite:", token_convite);
        }

    } catch (error) {
        console.error("❌ Erro ao enviar convite:", error);
        throw error;
    }
}
// ====================== ROTA PARA PÁGINA DE ACEITAR CONVITE ====================== //

app.get("/aceitar-convite", (req, res) => {
    res.sendFile(path.join(__dirname, "public/paginas/aceitar-convite.html"));
});

// E também com .html para garantir
app.get("/aceitar-convite.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public/paginas/aceitar-convite.html"));
});

// ====================== ROTAS PARA FAMILIAR CUIDADOR ====================== //

// Dashboard
app.get("/dashboard_familiar_cuidador", (req, res) => {
    res.sendFile(path.join(__dirname, "public/paginas/dashboard_familiar_cuidador.html"));
});

// Páginas do familiar cuidador
app.get("/alertas_familiar", (req, res) => {
    res.sendFile(path.join(__dirname, "public/paginas/alertas_familiar.html"));
});

app.get("/relatorios_familiar", (req, res) => {
    res.sendFile(path.join(__dirname, "public/paginas/relatorios_familiar.html"));
});

app.get("/saude_familiar", (req, res) => {
    res.sendFile(path.join(__dirname, "public/paginas/saude_familiar.html"));
});

app.get("/atividades_familiar", (req, res) => {
    res.sendFile(path.join(__dirname, "public/paginas/atividades_familiar.html"));
});

// Rotas com .html também
app.get("/alertas_familiar.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public/paginas/alertas_familiar.html"));
});

app.get("/relatorios_familiar.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public/paginas/relatorios_familiar.html"));
});

app.get("/saude_familiar.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public/paginas/saude_familiar.html"));
});

app.get("/atividades_familiar.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public/paginas/atividades_familiar.html"));
});

// ====================== APIs ESPECÍFICAS PARA FAMILIAR CUIDADOR ====================== //

// API para estatísticas do dashboard de relatórios
app.get("/api/familiares-cuidadores/:usuarioId/pacientes/:pacienteId/estatisticas", (req, res) => {
    const { usuarioId, pacienteId } = req.params;
    
    console.log(`📊 Buscando estatísticas para paciente ${pacienteId}`);
    
    // Verificar acesso
    const verificarAcessoQuery = `
        SELECT p.id FROM pacientes p
        INNER JOIN familiares_cuidadores fc ON p.familiar_cuidador_id = fc.id
        WHERE p.id = ? AND fc.usuario_id = ? AND p.ativo = TRUE
    `;
    
    db.query(verificarAcessoQuery, [pacienteId, usuarioId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        // Buscar contagens de diferentes tipos de dados
        const queries = {
            registrosSaude: `SELECT COUNT(*) as count FROM sinais_vitais WHERE paciente_id = ?`,
            medicamentos: `SELECT COUNT(*) as count FROM medicamentos WHERE paciente_id = ? AND ativo = TRUE`,
            atividades: `SELECT COUNT(*) as count FROM atividades WHERE paciente_id = ?`,
            alertas: `SELECT COUNT(*) as count FROM alertas WHERE paciente_id = ? AND status = 'ativo'`
        };

        const resultados = {};
        let queriesExecutadas = 0;
        const totalQueries = Object.keys(queries).length;

        Object.keys(queries).forEach(chave => {
            db.query(queries[chave], [pacienteId], (err, results) => {
                if (err) {
                    resultados[chave] = 0;
                } else {
                    resultados[chave] = results[0].count;
                }
                
                queriesExecutadas++;
                
                // Quando todas as queries terminarem, enviar resposta
                if (queriesExecutadas === totalQueries) {
                    res.json(resultados);
                }
            });
        });
    });
});

// API para dados de gráficos
app.get("/api/familiares-cuidadores/:usuarioId/pacientes/:pacienteId/graficos", (req, res) => {
    const { usuarioId, pacienteId } = req.params;
    const { periodo } = req.query;
    
    console.log(`📈 Buscando dados de gráficos para paciente ${pacienteId}, período: ${periodo}`);
    
    // Verificar acesso
    const verificarAcessoQuery = `
        SELECT p.id FROM pacientes p
        INNER JOIN familiares_cuidadores fc ON p.familiar_cuidador_id = fc.id
        WHERE p.id = ? AND fc.usuario_id = ? AND p.ativo = TRUE
    `;
    
    db.query(verificarAcessoQuery, [pacienteId, usuarioId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        // Dados mock para demonstração - em produção, buscar do banco
        const dadosGraficos = {
            evolucaoSaude: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [
                    {
                        label: 'Frequência Cardíaca',
                        data: [72, 75, 70, 68, 74, 76, 72],
                        borderColor: '#e74c3c'
                    },
                    {
                        label: 'Pressão Sistólica',
                        data: [120, 118, 122, 119, 121, 123, 120],
                        borderColor: '#f39c12'
                    }
                ]
            },
            adesaoMedicamentos: {
                labels: ['Concluídas', 'Pendentes', 'Atrasadas'],
                datasets: [{
                    data: [75, 20, 5],
                    backgroundColor: ['#27ae60', '#f39c12', '#e74c3c']
                }]
            },
            conclusaoAtividades: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Atividades Concluídas',
                    data: [8, 7, 9, 6, 8, 5, 7],
                    backgroundColor: '#3498db'
                }]
            },
            distribuicaoAlertas: {
                labels: ['Críticos', 'Atenção', 'Informativos'],
                datasets: [{
                    data: [2, 5, 12],
                    backgroundColor: ['#e74c3c', '#f39c12', '#3498db']
                }]
            },
            tiposAtividades: {
                labels: ['Medicação', 'Alimentação', 'Exercício', 'Higiene', 'Descanso'],
                datasets: [{
                    data: [30, 25, 20, 15, 10],
                    backgroundColor: ['#e74c3c', '#f39c12', '#3498db', '#9b59b6', '#27ae60']
                }]
            }
        };

        res.json(dadosGraficos);
    });
});

// API para relatórios gerados
app.get("/api/familiares-cuidadores/:usuarioId/pacientes/:pacienteId/relatorios", (req, res) => {
    const { usuarioId, pacienteId } = req.params;
    
    console.log(`📋 Buscando relatórios para paciente ${pacienteId}`);
    
    // Verificar acesso
    const verificarAcessoQuery = `
        SELECT p.id FROM pacientes p
        INNER JOIN familiares_cuidadores fc ON p.familiar_cuidador_id = fc.id
        WHERE p.id = ? AND fc.usuario_id = ? AND p.ativo = TRUE
    `;
    
    db.query(verificarAcessoQuery, [pacienteId, usuarioId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        // Buscar relatórios (se a tabela existir)
        const query = `
            SELECT * FROM relatorios 
            WHERE paciente_id = ? 
            ORDER BY data_geracao DESC
            LIMIT 10
        `;
        
        db.query(query, [pacienteId], (err, results) => {
            if (err) {
                // Se a tabela não existir, retornar dados mock
                const relatoriosMock = [
                    {
                        id: '1',
                        titulo: 'Relatório de Saúde - Semanal',
                        tipo: 'health',
                        descricao: 'Análise completa dos sinais vitais da última semana',
                        data_geracao: new Date().toISOString(),
                        tamanho: '2.4 MB',
                        periodo: 'Últimos 7 dias'
                    },
                    {
                        id: '2', 
                        titulo: 'Relatório de Medicamentos - Mensal',
                        tipo: 'medications',
                        descricao: 'Relatório de adesão aos medicamentos',
                        data_geracao: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                        tamanho: '1.8 MB',
                        periodo: 'Últimos 30 dias'
                    }
                ];
                return res.json(relatoriosMock);
            }
            
            res.json(results);
        });
    });
});

// API para medicamentos do familiar cuidador
app.get("/api/familiares-cuidadores/:usuarioId/pacientes/:pacienteId/medicamentos", (req, res) => {
    const { usuarioId, pacienteId } = req.params;
    
    console.log(`💊 Buscando medicamentos para paciente ${pacienteId}`);
    
    // Verificar acesso
    const verificarAcessoQuery = `
        SELECT p.id FROM pacientes p
        INNER JOIN familiares_cuidadores fc ON p.familiar_cuidador_id = fc.id
        WHERE p.id = ? AND fc.usuario_id = ? AND p.ativo = TRUE
    `;
    
    db.query(verificarAcessoQuery, [pacienteId, usuarioId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        // Buscar medicamentos
        const query = `
            SELECT * FROM medicamentos 
            WHERE paciente_id = ? 
            ORDER BY nome_medicamento ASC
        `;
        
        db.query(query, [pacienteId], (err, results) => {
            if (err) {
                console.error("Erro ao buscar medicamentos:", err);
                // Retornar dados mock para demonstração
                const medicamentosMock = [
                    {
                        id: '1',
                        nome: 'Losartana',
                        descricao: 'Anti-hipertensivo',
                        dosagem: '50mg',
                        tipo: 'oral',
                        frequencia: 'daily',
                        horario: '08:00',
                        ativo: true,
                        proxima_dose: new Date().toISOString(),
                        urgente: false
                    },
                    {
                        id: '2',
                        nome: 'Sinvastatina',
                        descricao: 'Redutor de colesterol',
                        dosagem: '20mg',
                        tipo: 'oral',
                        frequencia: 'daily',
                        horario: '20:00',
                        ativo: true,
                        proxima_dose: new Date().toISOString(),
                        urgente: false
                    }
                ];
                return res.json(medicamentosMock);
            }
            
            res.json(results);
        });
    });
});

// API para histórico de administração
app.get("/api/familiares-cuidadores/:usuarioId/pacientes/:pacienteId/historico-administracao", (req, res) => {
    const { usuarioId, pacienteId } = req.params;
    
    console.log(`📋 Buscando histórico de administração para paciente ${pacienteId}`);
    
    // Verificar acesso
    const verificarAcessoQuery = `
        SELECT p.id FROM pacientes p
        INNER JOIN familiares_cuidadores fc ON p.familiar_cuidador_id = fc.id
        WHERE p.id = ? AND fc.usuario_id = ? AND p.ativo = TRUE
    `;
    
    db.query(verificarAcessoQuery, [pacienteId, usuarioId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        // Buscar histórico (se a tabela existir)
        const query = `
            SELECT * FROM historico_administracao 
            WHERE paciente_id = ? 
            ORDER BY data_administracao DESC
            LIMIT 20
        `;
        
        db.query(query, [pacienteId], (err, results) => {
            if (err) {
                // Se a tabela não existir, retornar dados mock
                const historicoMock = [
                    {
                        id: '1',
                        nome_medicamento: 'Losartana',
                        dosagem: '50mg',
                        data_administracao: new Date().toISOString(),
                        status: 'administered',
                        administrado_por: 'Sistema',
                        observacoes: 'Administrado conforme prescrição'
                    },
                    {
                        id: '2',
                        nome_medicamento: 'Sinvastatina',
                        dosagem: '20mg',
                        data_administracao: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                        status: 'administered',
                        administrado_por: 'Familiar',
                        observacoes: 'Dose noturna'
                    }
                ];
                return res.json(historicoMock);
            }
            
            res.json(results);
        });
    });
});

// ====================== API PARA ALERTAS DO FAMILIAR CUIDADOR ====================== //

app.get("/api/familiares-cuidadores/:usuarioId/pacientes/:pacienteId/alertas", (req, res) => {
    const { usuarioId, pacienteId } = req.params;
    
    console.log(`🚨 Buscando alertas para paciente ${pacienteId}`);
    
    // Verificar acesso
    const verificarAcessoQuery = `
        SELECT p.id FROM pacientes p
        INNER JOIN familiares_cuidadores fc ON p.familiar_cuidador_id = fc.id
        WHERE p.id = ? AND fc.usuario_id = ? AND p.ativo = TRUE
    `;
    
    db.query(verificarAcessoQuery, [pacienteId, usuarioId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        // Buscar alertas do paciente
        const query = `
            SELECT * FROM alertas 
            WHERE paciente_id = ? 
            ORDER BY data_criacao DESC
            LIMIT 50
        `;
        
        db.query(query, [pacienteId], (err, results) => {
            if (err) {
                console.error("Erro ao buscar alertas:", err);
                // Se a tabela não existir ou der erro, retornar alertas baseados nos dados do paciente
                return res.json(gerarAlertasDinamicos(pacienteId));
            }
            
            // Se não houver alertas, gerar alguns baseados no estado do paciente
            if (results.length === 0) {
                const alertasDinamicos = gerarAlertasDinamicos(pacienteId);
                return res.json(alertasDinamicos);
            }
            
            res.json(results);
        });
    });
});

// Função para gerar alertas dinâmicos baseados no estado do paciente
function gerarAlertasDinamicos(pacienteId) {
    console.log(`🎯 Gerando alertas dinâmicos para paciente ${pacienteId}`);
    
    const alertasBase = [
        {
            id: '1',
            titulo: 'Monitoramento de Saúde Ativo',
            descricao: 'Sistema de monitoramento está acompanhando a saúde do paciente.',
            tipo: 'system',
            severidade: 'info',
            data_criacao: new Date().toISOString(),
            lido: false,
            resolvido: false,
            paciente_id: pacienteId
        },
        {
            id: '2',
            titulo: 'Lembrete de Check-up',
            descricao: 'Check-up mensal recomendado para acompanhamento da saúde.',
            tipo: 'health',
            severidade: 'info', 
            data_criacao: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            lido: true,
            resolvido: false,
            paciente_id: pacienteId
        }
    ];

    // Adicionar alertas baseados em condições específicas (simulação)
    const horaAtual = new Date().getHours();
    if (horaAtual >= 20) {
        alertasBase.push({
            id: '3',
            titulo: 'Medicamento Noturno Pendente',
            descricao: 'Verificar se todos os medicamentos noturnos foram administrados.',
            tipo: 'medication',
            severidade: 'warning',
            data_criacao: new Date().toISOString(),
            lido: false,
            resolvido: false,
            paciente_id: pacienteId
        });
    }

    return alertasBase;
}

// API para marcar alerta como lido
app.post("/api/alertas/:alertaId/marcar-lido", (req, res) => {
    const { alertaId } = req.params;
    
    console.log(`📌 Marcando alerta ${alertaId} como lido`);
    
    const query = `
        UPDATE alertas 
        SET lido = TRUE, data_leitura = NOW() 
        WHERE id = ?
    `;
    
    db.query(query, [alertaId], (err, result) => {
        if (err) {
            console.error("Erro ao marcar alerta como lido:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        res.json({ success: true, message: "Alerta marcado como lido" });
    });
});

// API para resolver alerta
app.post("/api/alertas/:alertaId/resolver", (req, res) => {
    const { alertaId } = req.params;
    
    console.log(`✅ Resolvendo alerta ${alertaId}`);
    
    const query = `
        UPDATE alertas 
        SET resolvido = TRUE, data_resolucao = NOW() 
        WHERE id = ?
    `;
    
    db.query(query, [alertaId], (err, result) => {
        if (err) {
            console.error("Erro ao resolver alerta:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        res.json({ success: true, message: "Alerta resolvido" });
    });
});

// API para marcar todos os alertas como lidos
app.post("/api/familiares-cuidadores/:usuarioId/pacientes/:pacienteId/alertas/marcar-todos-lidos", (req, res) => {
    const { usuarioId, pacienteId } = req.params;
    
    console.log(`📋 Marcando todos os alertas como lidos para paciente ${pacienteId}`);
    
    // Verificar acesso primeiro
    const verificarAcessoQuery = `
        SELECT p.id FROM pacientes p
        INNER JOIN familiares_cuidadores fc ON p.familiar_cuidador_id = fc.id
        WHERE p.id = ? AND fc.usuario_id = ? AND p.ativo = TRUE
    `;
    
    db.query(verificarAcessoQuery, [pacienteId, usuarioId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const query = `
            UPDATE alertas 
            SET lido = TRUE, data_leitura = NOW() 
            WHERE paciente_id = ? AND lido = FALSE
        `;
        
        db.query(query, [pacienteId], (err, result) => {
            if (err) {
                console.error("Erro ao marcar alertas como lidos:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }
            
            res.json({ 
                success: true, 
                message: `${result.affectedRows} alertas marcados como lidos` 
            });
        });
    });

});




// ====================== ROTAS PARA MEDICAMENTOS ====================== //

// Criar novo medicamento - VERIFICAR SE TODOS OS CAMPOS ESTÃO SENDO RECEBIDOS
app.post("/api/medicamentos", (req, res) => {
    const {
        paciente_id,
        nome,
        dosagem,
        frequencia,
        horario,
        via,
        instrucoes
    } = req.body;

    console.log("💊 Recebendo solicitação de cadastro de medicamento:", req.body);

    // Verificar campos obrigatórios
    if (!paciente_id || !nome || !dosagem || !horario || !via) {
        return res.status(400).json({ 
            error: "Paciente ID, nome, dosagem, horário e via são obrigatórios",
            received: req.body
        });
    }

    const query = `
        INSERT INTO medicamentos 
        (paciente_id, nome_medicamento, dosagem, frequencia, horarios, via_administracao, observacoes, ativo, data_inicio)
        VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, CURDATE())
    `;

    db.query(query, [
        paciente_id,
        nome,
        dosagem,
        frequencia,
        horario,
        via,
        instrucoes || ''
    ], (err, result) => {
        if (err) {
            console.error("❌ Erro ao cadastrar medicamento:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        console.log("✅ Medicamento cadastrado com sucesso. ID:", result.insertId);
        
        // Retornar o medicamento criado com TODOS os campos
        res.json({
            id: result.insertId,
            nome_medicamento: nome,
            nome: nome,
            dosagem: dosagem,
            frequencia: frequencia,
            horario: horario,
            via: via,
            instrucoes: instrucoes || '',
            status: 'pendente'
        });
    });
});

// Versão alternativa da API sem alterar a tabela
app.get("/api/pacientes/:pacienteId/medicamentos/hoje", (req, res) => {
    const pacienteId = req.params.pacienteId;

    console.log(`💊 Buscando medicamentos para paciente: ${pacienteId}`);

    const query = `
        SELECT 
            id,
            nome_medicamento as nome,
            nome_medicamento,
            dosagem,
            frequencia,
            horarios as horario,
            via_administracao as via,
            observacoes as instrucoes,
            'pendente' as status  -- Status fixo como pendente
        FROM medicamentos 
        WHERE paciente_id = ? AND ativo = TRUE
        ORDER BY horarios ASC
    `;

    db.query(query, [pacienteId], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar medicamentos:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        console.log(`✅ ${results.length} medicamentos encontrados para paciente ${pacienteId}`);
        res.json(results);
    });
});

// Atualizar status do medicamento - VERSÃO CORRIGIDA
app.put("/api/medicamentos/:medicamentoId/status", (req, res) => {
    const medicamentoId = req.params.medicamentoId;
    const { status, cuidador_id } = req.body;

    console.log(`🔄 Atualizando status do medicamento ${medicamentoId} para: ${status}`, req.body);

    // Primeiro, verificar se a tabela tem coluna status
    const checkColumnQuery = `
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'medicamentos' 
        AND COLUMN_NAME = 'status'
    `;

    db.query(checkColumnQuery, (err, results) => {
        if (err) {
            console.error("❌ Erro ao verificar colunas:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        let updateQuery, queryParams;

        if (results.length > 0) {
            // Se a coluna status existe, usá-la
            updateQuery = `
                UPDATE medicamentos 
                SET status = ?, data_administracao = NOW(), administrado_por = ?
                WHERE id = ?
            `;
            queryParams = [status, cuidador_id, medicamentoId];
        } else {
            // Se não existe, usar observações
            updateQuery = `
                UPDATE medicamentos 
                SET observacoes = CONCAT(IFNULL(observacoes, ''), ' | Administrado em: ', NOW())
                WHERE id = ?
            `;
            queryParams = [medicamentoId];
        }

        db.query(updateQuery, queryParams, (err, result) => {
            if (err) {
                console.error("❌ Erro ao atualizar medicamento:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Medicamento não encontrado" });
            }

            console.log(`✅ Medicamento ${medicamentoId} atualizado com sucesso`);
            
            // Buscar o medicamento atualizado para retornar
            const selectQuery = `SELECT * FROM medicamentos WHERE id = ?`;
            db.query(selectQuery, [medicamentoId], (err, medResults) => {
                if (err) {
                    console.error("❌ Erro ao buscar medicamento atualizado:", err);
                    return res.status(500).json({ error: "Erro interno do servidor" });
                }

                const medicamento = medResults[0];
                res.json({
                    success: true,
                    message: "Medicamento atualizado com sucesso",
                    medicamento: {
                        id: medicamento.id,
                        nome_medicamento: medicamento.nome_medicamento,
                        dosagem: medicamento.dosagem,
                        horario: medicamento.horarios,
                        via: medicamento.via_administracao,
                        status: medicamento.status || 'administrado', // Fallback
                        instrucoes: medicamento.observacoes
                    }
                });
            });
        });
    });
});
// Atualizar status do medicamento (marcar como administrado)
app.put("/api/medicamentos/:medicamentoId/status", (req, res) => {
    const medicamentoId = req.params.medicamentoId;
    const { status } = req.body;

    console.log(`🔄 Atualizando status do medicamento ${medicamentoId} para: ${status}`);

    // Como a tabela não tem campo status, vamos adicionar uma observação
    const query = `
        UPDATE medicamentos 
        SET observacoes = CONCAT(IFNULL(observacoes, ''), ' - Administrado em: ', NOW())
        WHERE id = ?
    `;

    db.query(query, [medicamentoId], (err, result) => {
        if (err) {
            console.error("❌ Erro ao atualizar medicamento:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Medicamento não encontrado" });
        }

        console.log(`✅ Status do medicamento ${medicamentoId} atualizado`);
        res.json({ success: true, message: "Medicamento atualizado com sucesso" });
    });
});

// Excluir medicamento (desativar)
app.delete("/api/medicamentos/:medicamentoId", (req, res) => {
    const medicamentoId = req.params.medicamentoId;

    console.log(`🗑️ Excluindo medicamento: ${medicamentoId}`);

    const query = `
        UPDATE medicamentos 
        SET ativo = FALSE 
        WHERE id = ?
    `;

    db.query(query, [medicamentoId], (err, result) => {
        if (err) {
            console.error("❌ Erro ao excluir medicamento:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Medicamento não encontrado" });
        }

        console.log(`✅ Medicamento ${medicamentoId} excluído (desativado)`);
        res.json({ success: true, message: "Medicamento excluído com sucesso" });
    });
});

// Atualizar medicamento existente
app.put("/api/medicamentos/:medicamentoId", (req, res) => {
    const medicamentoId = req.params.medicamentoId;
    const {
        nome,
        dosagem,
        frequencia,
        horario,
        via,
        instrucoes
    } = req.body;

    console.log("✏️ Recebendo solicitação de atualização de medicamento:", {
        medicamentoId, nome, dosagem, frequencia, horario, via
    });

    if (!nome || !dosagem || !horario || !via) {
        return res.status(400).json({ 
            error: "Nome, dosagem, horário e via são obrigatórios" 
        });
    }

    const query = `
        UPDATE medicamentos 
        SET nome_medicamento = ?, dosagem = ?, frequencia = ?, horarios = ?, via_administracao = ?, observacoes = ?
        WHERE id = ?
    `;

    db.query(query, [
        nome,
        dosagem,
        frequencia,
        horario,
        via,
        instrucoes || '',
        medicamentoId
    ], (err, result) => {
        if (err) {
            console.error("❌ Erro ao atualizar medicamento:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Medicamento não encontrado" });
        }

        console.log("✅ Medicamento atualizado com sucesso. ID:", medicamentoId);
        
        // Retornar o medicamento atualizado
        res.json({
            id: medicamentoId,
            nome_medicamento: nome,
            nome: nome,
            dosagem: dosagem,
            frequencia: frequencia,
            horario: horario,
            via: via,
            instrucoes: instrucoes,
            status: 'pendente'
        });
    });
});

   // ====================== ROTAS PARA ATIVIDADES ====================== //

// ✅ ROTA CORRIGIDA: Criar atividade
app.post("/api/atividades", (req, res) => {
    const {
        paciente_id,
        usuario_id,
        tipo,
        descricao,
        data_prevista,
        observacoes
    } = req.body;

    console.log("📝 Recebendo solicitação de criação de atividade:", req.body);

    if (!paciente_id || !usuario_id || !tipo || !descricao || !data_prevista) {
        return res.status(400).json({ 
            error: "Paciente ID, usuário ID, tipo, descrição e data prevista são obrigatórios" 
        });
    }

    // Primeiro buscar o ID do cuidador profissional baseado no usuario_id
    const getCuidadorIdQuery = `
        SELECT id FROM cuidadores_profissionais WHERE usuario_id = ?
    `;

    console.log(`🔍 Buscando cuidador profissional para usuario_id: ${usuario_id}`);

    db.query(getCuidadorIdQuery, [usuario_id], (err, cuidadorResults) => {
        if (err) {
            console.error("❌ Erro ao buscar cuidador profissional:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        console.log(`📋 Resultados do cuidador:`, cuidadorResults);

        if (cuidadorResults.length === 0) {
            console.error("❌ Cuidador profissional não encontrado para usuario_id:", usuario_id);
            return res.status(404).json({ error: "Cuidador profissional não encontrado" });
        }

        const cuidadorProfissionalId = cuidadorResults[0].id;
        console.log(`✅ Cuidador profissional ID encontrado: ${cuidadorProfissionalId}`);

        const insertQuery = `
            INSERT INTO atividades 
            (paciente_id, cuidador_id, tipo, descricao, data_prevista, observacoes, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pendente')
        `;

        console.log(`💾 Inserindo atividade com dados:`, {
            paciente_id,
            cuidadorProfissionalId,
            tipo,
            descricao,
            data_prevista,
            observacoes
        });

        db.query(insertQuery, [
            paciente_id,
            cuidadorProfissionalId,
            tipo,
            descricao,
            data_prevista,
            observacoes || ''
        ], (err, result) => {
            if (err) {
                console.error("❌ Erro ao criar atividade:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            console.log("✅ Atividade criada com sucesso. ID:", result.insertId);
            
            // Buscar a atividade criada para retornar
            const selectQuery = `
                SELECT a.*, p.nome as paciente_nome 
                FROM atividades a 
                LEFT JOIN pacientes p ON a.paciente_id = p.id 
                WHERE a.id = ?
            `;
            
            db.query(selectQuery, [result.insertId], (err, results) => {
                if (err) {
                    console.error("❌ Erro ao buscar atividade criada:", err);
                    return res.status(500).json({ error: "Erro interno do servidor" });
                }

                const atividade = results[0];
                console.log("📤 Retornando atividade criada:", atividade);
                res.json({
                    id: atividade.id,
                    tipo: atividade.tipo,
                    descricao: atividade.descricao,
                    data_prevista: atividade.data_prevista,
                    observacoes: atividade.observacoes,
                    status: atividade.status,
                    paciente_nome: atividade.paciente_nome
                });
            });
        });
    });
});

// ✅ ROTA CORRIGIDA: Excluir atividade
app.delete("/api/atividades/:id", (req, res) => {
    const atividadeId = req.params.id;
    console.log(`🗑️ Excluindo atividade ID: ${atividadeId}`);

    const deleteQuery = 'DELETE FROM atividades WHERE id = ?';
    db.query(deleteQuery, [atividadeId], (err, result) => {
        if (err) {
            console.error("❌ Erro ao excluir atividade:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Atividade não encontrada" });
        }

        console.log('✅ Atividade excluída com sucesso');
        res.json({ 
            success: true, 
            message: 'Atividade excluída com sucesso',
            id: parseInt(atividadeId)
        });
    });
});

// ✅ ROTA CORRIGIDA: Editar atividade
app.put("/api/atividades/:id", (req, res) => {
    const atividadeId = req.params.id;
    const { tipo, descricao, data_prevista, observacoes } = req.body;

    console.log(`✏️ Editando atividade ID: ${atividadeId}`, req.body);

    if (!tipo || !descricao || !data_prevista) {
        return res.status(400).json({ 
            error: "Tipo, descrição e data prevista são obrigatórios" 
        });
    }

    const updateQuery = `
        UPDATE atividades 
        SET tipo = ?, descricao = ?, data_prevista = ?, observacoes = ?
        WHERE id = ?
    `;
    
    db.query(updateQuery, [tipo, descricao, data_prevista, observacoes, atividadeId], (err, result) => {
        if (err) {
            console.error("❌ Erro ao editar atividade:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Atividade não encontrada" });
        }

        console.log('✅ Atividade editada com sucesso');
        
        // Buscar atividade atualizada com nome do paciente
        const selectQuery = `
            SELECT a.*, p.nome as paciente_nome 
            FROM atividades a 
            LEFT JOIN pacientes p ON a.paciente_id = p.id 
            WHERE a.id = ?
        `;
        db.query(selectQuery, [atividadeId], (err, results) => {
            if (err) {
                console.error("❌ Erro ao buscar atividade:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            const atividade = results[0];
            res.json({
                id: atividade.id,
                tipo: atividade.tipo,
                descricao: atividade.descricao,
                data_prevista: atividade.data_prevista,
                observacoes: atividade.observacoes,
                status: atividade.status,
                paciente_nome: atividade.paciente_nome
            });
        });
    });
});

// ✅ ROTA CORRIGIDA: Buscar atividades do paciente (para hoje)
app.get("/api/pacientes/:pacienteId/atividades/hoje", (req, res) => {
    const pacienteId = req.params.pacienteId;

    console.log(`📅 Buscando atividades para paciente: ${pacienteId}`);

    const query = `
        SELECT 
            a.id,
            a.tipo,
            a.descricao,
            a.data_prevista,
            a.status,
            a.observacoes,
            a.data_conclusao,
            p.nome as paciente_nome
        FROM atividades a
        LEFT JOIN pacientes p ON a.paciente_id = p.id
        WHERE a.paciente_id = ? 
        AND (
            (a.status = 'pendente' AND DATE(a.data_prevista) = CURDATE()) 
            OR 
            (a.status = 'concluida' AND DATE(a.data_conclusao) = CURDATE())
        )
        AND a.status != 'cancelada'
        ORDER BY a.data_prevista ASC
    `;

    db.query(query, [pacienteId], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar atividades:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        console.log(`📊 ${results.length} atividades encontradas para hoje`);
        
        const atividadesFormatadas = results.map(atividade => ({
            id: atividade.id,
            tipo: atividade.tipo,
            descricao: atividade.descricao,
            data_prevista: atividade.data_prevista,
            status: atividade.status,
            observacoes: atividade.observacoes,
            data_conclusao: atividade.data_conclusao,
            paciente_nome: atividade.paciente_nome
        }));

        res.json(atividadesFormatadas);
    });
});

// ✅ ROTA CORRIGIDA: Marcar atividade como concluída
app.put("/api/atividades/:atividadeId/concluir", (req, res) => {
    const atividadeId = req.params.atividadeId;

    console.log(`✅ Recebendo solicitação para concluir atividade: ${atividadeId}`);

    const query = `
        UPDATE atividades 
        SET status = 'concluida', data_conclusao = NOW()
        WHERE id = ?
    `;

    console.log(`🔍 Executando query: ${query} com ID: ${atividadeId}`);

    db.query(query, [atividadeId], (err, result) => {
        if (err) {
            console.error("❌ Erro ao marcar atividade como concluída:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        console.log(`📊 Resultado da atualização:`, result);

        if (result.affectedRows === 0) {
            console.log(`❌ Nenhuma atividade encontrada com ID: ${atividadeId}`);
            return res.status(404).json({ error: "Atividade não encontrada" });
        }

        console.log(`✅ Atividade ${atividadeId} marcada como concluída. Linhas afetadas: ${result.affectedRows}`);
        
        // Buscar a atividade atualizada para retornar
        const selectQuery = `
            SELECT a.*, p.nome as paciente_nome 
            FROM atividades a 
            LEFT JOIN pacientes p ON a.paciente_id = p.id 
            WHERE a.id = ?
        `;
        db.query(selectQuery, [atividadeId], (err, results) => {
            if (err) {
                console.error("❌ Erro ao buscar atividade atualizada:", err);
                return res.status(500).json({ error: "Erro ao buscar atividade" });
            }

            const atividade = results[0];
            res.json({
                success: true,
                message: "Atividade concluída com sucesso",
                atividade: {
                    id: atividade.id,
                    tipo: atividade.tipo,
                    descricao: atividade.descricao,
                    data_prevista: atividade.data_prevista,
                    observacoes: atividade.observacoes,
                    status: atividade.status,
                    data_conclusao: atividade.data_conclusao,
                    paciente_nome: atividade.paciente_nome
                }
            });
        });
    });
});

// ✅ ROTA CORRIGIDA: Buscar atividades do cuidador para um paciente específico
app.get("/api/cuidadores/:cuidadorId/pacientes/:pacienteId/atividades", (req, res) => {
    const { cuidadorId, pacienteId } = req.params;

    console.log(`📝 Buscando atividades para cuidador ${cuidadorId} do paciente ${pacienteId}`);

    // Verificar se o cuidador tem acesso ao paciente
    const verificarAcessoQuery = `
        SELECT cpp.id 
        FROM cuidadores_profissionais_pacientes cpp
        INNER JOIN cuidadores_profissionais cp ON cpp.cuidador_profissional_id = cp.id
        WHERE cp.usuario_id = ? AND cpp.paciente_id = ? AND cpp.status_vinculo = 'ativo'
    `;

    db.query(verificarAcessoQuery, [cuidadorId, pacienteId], (err, acessoResults) => {
        if (err || acessoResults.length === 0) {
            console.log('❌ Acesso negado ou vínculo não encontrado');
            return res.status(403).json({ error: "Acesso negado a este paciente" });
        }

        // Buscar atividades do paciente
        const query = `
            SELECT 
                a.id,
                a.tipo,
                a.descricao,
                a.data_prevista,
                a.status,
                a.observacoes,
                a.data_conclusao,
                u.nome as cuidador_nome,
                p.nome as paciente_nome
            FROM atividades a
            LEFT JOIN pacientes p ON a.paciente_id = p.id
            LEFT JOIN cuidadores_profissionais cp ON a.cuidador_id = cp.id
            LEFT JOIN usuarios u ON cp.usuario_id = u.id
            WHERE a.paciente_id = ? 
            ORDER BY a.data_prevista DESC
        `;

        db.query(query, [pacienteId], (err, results) => {
            if (err) {
                console.error("❌ Erro ao buscar atividades para cuidador:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            console.log(`📊 ${results.length} atividades encontradas para cuidador`);
            
            const atividadesFormatadas = results.map(atividade => ({
                id: atividade.id,
                tipo: atividade.tipo,
                descricao: atividade.descricao,
                data_prevista: atividade.data_prevista,
                status: atividade.status,
                observacoes: atividade.observacoes,
                data_conclusao: atividade.data_conclusao,
                cuidador_nome: atividade.cuidador_nome,
                paciente_nome: atividade.paciente_nome
            }));

            res.json(atividadesFormatadas);
        });
    });
});

// ✅ ROTA CORRIGIDA: Estatísticas de adesão (usando MySQL)
app.get('/api/pacientes/:id/estatisticas-adesao', (req, res) => {
    const pacienteId = req.params.id;
    
    console.log(`📊 Buscando estatísticas de adesão para paciente: ${pacienteId}`);

    // Buscar dados dos últimos 7 dias usando MySQL
    const query = `
        SELECT 
            DATE(data_registro) as data,
            COUNT(*) as total_medicamentos,
            SUM(CASE WHEN status = 'administrado' THEN 1 ELSE 0 END) as administrados
        FROM medicamentos 
        WHERE paciente_id = ? 
        AND data_registro >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(data_registro)
        ORDER BY data ASC
    `;

    db.query(query, [pacienteId], (err, results) => {
        if (err) {
            console.error('❌ Erro ao calcular estatísticas de adesão:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        // Preparar dados para os últimos 7 dias
        const dadosSemana = [];
        const hoje = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const data = new Date(hoje);
            data.setDate(data.getDate() - i);
            const dataFormatada = data.toISOString().split('T')[0];
            
            const dadosDia = results.find(item => {
                const itemData = new Date(item.data).toISOString().split('T')[0];
                return itemData === dataFormatada;
            });
            
            const taxaDia = dadosDia && dadosDia.total_medicamentos > 0 
                ? Math.round((dadosDia.administrados / dadosDia.total_medicamentos) * 100) 
                : 0;
            
            dadosSemana.push(taxaDia);
        }

        // Calcular estatísticas gerais
        const totalGeral = results.reduce((sum, item) => sum + item.total_medicamentos, 0);
        const administradosGeral = results.reduce((sum, item) => sum + item.administrados, 0);
        const taxaGeral = totalGeral > 0 ? Math.round((administradosGeral / totalGeral) * 100) : 0;

        console.log(`✅ Estatísticas calculadas: ${taxaGeral}% de adesão`);

        res.json({
            taxaGeral,
            dadosSemana,
            totalMedicamentos: totalGeral,
            administrados: administradosGeral,
            pendentes: totalGeral - administradosGeral
        });
    });
});

// ====================== ROTA CORRIGIDA PARA ATIVIDADES DO DIA ====================== //

// ✅ ROTA ADICIONADA: Buscar atividades do paciente para hoje
app.get("/api/pacientes/:pacienteId/atividades/hoje", (req, res) => {
    const pacienteId = req.params.pacienteId;

    console.log(`📅 Buscando atividades de HOJE para paciente: ${pacienteId}`);

    const query = `
        SELECT 
            a.id,
            a.tipo,
            a.descricao,
            a.data_prevista,
            a.status,
            a.observacoes,
            a.data_conclusao,
            p.nome as paciente_nome
        FROM atividades a
        LEFT JOIN pacientes p ON a.paciente_id = p.id
        WHERE a.paciente_id = ? 
        AND DATE(a.data_prevista) = CURDATE()
        AND a.status != 'cancelada'
        ORDER BY a.data_prevista ASC
    `;

    db.query(query, [pacienteId], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar atividades de hoje:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        console.log(`📊 ${results.length} atividades de hoje encontradas`);
        
        const atividadesFormatadas = results.map(atividade => ({
            id: atividade.id,
            tipo: atividade.tipo,
            descricao: atividade.descricao,
            data_prevista: atividade.data_prevista,
            status: atividade.status,
            observacoes: atividade.observacoes,
            data_conclusao: atividade.data_conclusao,
            paciente_nome: atividade.paciente_nome
        }));

        res.json(atividadesFormatadas);
    });
});

// ====================== ROTA ALTERNATIVA PARA ATIVIDADES ====================== //

// ✅ ROTA ALTERNATIVA: Buscar atividades do paciente (todas)
app.get("/api/pacientes/:pacienteId/atividades", (req, res) => {
    const pacienteId = req.params.pacienteId;

    console.log(`📅 Buscando TODAS atividades para paciente: ${pacienteId}`);

    const query = `
        SELECT 
            a.id,
            a.tipo,
            a.descricao,
            a.data_prevista,
            a.status,
            a.observacoes,
            a.data_conclusao,
            p.nome as paciente_nome
        FROM atividades a
        LEFT JOIN pacientes p ON a.paciente_id = p.id
        WHERE a.paciente_id = ? 
        ORDER BY a.data_prevista DESC
    `;

    db.query(query, [pacienteId], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar atividades:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        console.log(`📊 ${results.length} atividades encontradas`);
        
        const atividadesFormatadas = results.map(atividade => ({
            id: atividade.id,
            tipo: atividade.tipo,
            descricao: atividade.descricao,
            data_prevista: atividade.data_prevista,
            status: atividade.status,
            observacoes: atividade.observacoes,
            data_conclusao: atividade.data_conclusao,
            paciente_nome: atividade.paciente_nome
        }));

        res.json(atividadesFormatadas);
    });
});

// ====================== ROTAS PARA ATIVIDADES - VERIFICAR SE EXISTEM ====================== //

// ✅ ROTA 1: Buscar atividades de hoje
app.get("/api/pacientes/:pacienteId/atividades/hoje", (req, res) => {
    const pacienteId = req.params.pacienteId;
    console.log(`📅 [ROTA CHAMADA] Buscando atividades de HOJE para paciente: ${pacienteId}`);

    const query = `
        SELECT 
            a.id,
            a.tipo,
            a.descricao,
            a.data_prevista,
            a.status,
            a.observacoes,
            a.data_conclusao,
            p.nome as paciente_nome
        FROM atividades a
        LEFT JOIN pacientes p ON a.paciente_id = p.id
        WHERE a.paciente_id = ? 
        AND DATE(a.data_prevista) = CURDATE()
        AND a.status != 'cancelada'
        ORDER BY a.data_prevista ASC
    `;

    db.query(query, [pacienteId], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar atividades de hoje:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        console.log(`📊 ${results.length} atividades de hoje encontradas para paciente ${pacienteId}`);
        
        const atividadesFormatadas = results.map(atividade => ({
            id: atividade.id,
            tipo: atividade.tipo,
            descricao: atividade.descricao,
            data_prevista: atividade.data_prevista,
            status: atividade.status,
            observacoes: atividade.observacoes,
            data_conclusao: atividade.data_conclusao,
            paciente_nome: atividade.paciente_nome
        }));

        res.json(atividadesFormatadas);
    });
});

// ✅ ROTA 2: Buscar todas as atividades
app.get("/api/pacientes/:pacienteId/atividades", (req, res) => {
    const pacienteId = req.params.pacienteId;
    console.log(`📅 [ROTA CHAMADA] Buscando TODAS atividades para paciente: ${pacienteId}`);

    const query = `
        SELECT 
            a.id,
            a.tipo,
            a.descricao,
            a.data_prevista,
            a.status,
            a.observacoes,
            a.data_conclusao,
            p.nome as paciente_nome
        FROM atividades a
        LEFT JOIN pacientes p ON a.paciente_id = p.id
        WHERE a.paciente_id = ? 
        ORDER BY a.data_prevista DESC
    `;

    db.query(query, [pacienteId], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar atividades:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        console.log(`📊 ${results.length} atividades encontradas para paciente ${pacienteId}`);
        
        const atividadesFormatadas = results.map(atividade => ({
            id: atividade.id,
            tipo: atividade.tipo,
            descricao: atividade.descricao,
            data_prevista: atividade.data_prevista,
            status: atividade.status,
            observacoes: atividade.observacoes,
            data_conclusao: atividade.data_conclusao,
            paciente_nome: atividade.paciente_nome
        }));

        res.json(atividadesFormatadas);
    });
});

// ✅ ROTA 3: Criar atividade
app.post("/api/atividades", (req, res) => {
    const {
        paciente_id,
        usuario_id,
        tipo,
        descricao,
        data_prevista,
        observacoes
    } = req.body;

    console.log("📝 [ROTA CHAMADA] Criando nova atividade:", req.body);

    if (!paciente_id || !usuario_id || !tipo || !descricao || !data_prevista) {
        return res.status(400).json({ 
            error: "Paciente ID, usuário ID, tipo, descrição e data prevista são obrigatórios" 
        });
    }

    // Buscar ID do cuidador profissional
    const getCuidadorIdQuery = `SELECT id FROM cuidadores_profissionais WHERE usuario_id = ?`;

    db.query(getCuidadorIdQuery, [usuario_id], (err, cuidadorResults) => {
        if (err) {
            console.error("❌ Erro ao buscar cuidador profissional:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (cuidadorResults.length === 0) {
            return res.status(404).json({ error: "Cuidador profissional não encontrado" });
        }

        const cuidadorProfissionalId = cuidadorResults[0].id;

        const insertQuery = `
            INSERT INTO atividades 
            (paciente_id, cuidador_id, tipo, descricao, data_prevista, observacoes, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pendente')
        `;

        db.query(insertQuery, [
            paciente_id,
            cuidadorProfissionalId,
            tipo,
            descricao,
            data_prevista,
            observacoes || ''
        ], (err, result) => {
            if (err) {
                console.error("❌ Erro ao criar atividade:", err);
                return res.status(500).json({ error: "Erro interno do servidor" });
            }

            console.log("✅ Atividade criada com sucesso. ID:", result.insertId);
            
            // Buscar a atividade criada
            const selectQuery = `
                SELECT a.*, p.nome as paciente_nome 
                FROM atividades a 
                LEFT JOIN pacientes p ON a.paciente_id = p.id 
                WHERE a.id = ?
            `;
            
            db.query(selectQuery, [result.insertId], (err, results) => {
                if (err) {
                    console.error("❌ Erro ao buscar atividade criada:", err);
                    return res.status(500).json({ error: "Erro interno do servidor" });
                }

                const atividade = results[0];
                res.json(atividade);
            });
        });
    });
});