-- =============================================
-- BANCO DE DADOS VITAL+ (VERSÃO FINAL OTIMIZADA)
-- =============================================

DROP DATABASE IF EXISTS vital_plus;
CREATE DATABASE IF NOT EXISTS vital_plus;
USE vital_plus;

-- ======================
-- TABELA: USUÁRIOS
-- ======================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('familiar_cuidador', 'familiar_contratante', 'cuidador_profissional', 'admin') NOT NULL,
    telefone VARCHAR(20),
    data_nascimento DATE,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);

-- ======================
-- TABELA: FAMILIARES CUIDADORES
-- ======================
CREATE TABLE IF NOT EXISTS familiares_cuidadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    parentesco VARCHAR(100),
    endereco TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_familiares_cuidadores_usuario ON familiares_cuidadores(usuario_id);

-- ======================
-- TABELA: FAMILIARES CONTRATANTES
-- ======================
CREATE TABLE IF NOT EXISTS familiares_contratantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    endereco TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_familiares_contratantes_usuario ON familiares_contratantes(usuario_id);

-- ======================
-- TABELA: CUIDADORES PROFISSIONAIS
-- ======================
CREATE TABLE IF NOT EXISTS cuidadores_profissionais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    especializacao VARCHAR(255),
    registro_profissional VARCHAR(100),
    disponibilidade VARCHAR(100),
    experiencia TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_cuidadores_profissionais_usuario ON cuidadores_profissionais(usuario_id);

-- ======================
-- TABELA: PACIENTES
-- ======================
CREATE TABLE IF NOT EXISTS pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data_nascimento DATE,
    genero ENUM('M', 'F', 'masculino', 'feminino', 'outro')
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    condicao_principal VARCHAR(255),
    plano_saude VARCHAR(255),
    alergias TEXT,
    historico_medico TEXT,
    contato_emergencia VARCHAR(255),
    foto_perfil VARCHAR(255),
    familiar_cuidador_id INT,
    familiar_contratante_id INT,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (familiar_cuidador_id) REFERENCES familiares_cuidadores(id) ON DELETE SET NULL,
    FOREIGN KEY (familiar_contratante_id) REFERENCES familiares_contratantes(id) ON DELETE SET NULL
);

CREATE INDEX idx_pacientes_nome ON pacientes(nome);
CREATE INDEX idx_pacientes_familiar_cuidador ON pacientes(familiar_cuidador_id);
CREATE INDEX idx_pacientes_familiar_contratante ON pacientes(familiar_contratante_id);

-- ======================
-- TABELA: CONVITES PARA CUIDADORES
-- ======================
CREATE TABLE IF NOT EXISTS convites_cuidadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    familiar_contratante_id INT NOT NULL,
    cuidador_email VARCHAR(255) NOT NULL,
    paciente_id INT NOT NULL,
    token_convite VARCHAR(100) UNIQUE NOT NULL,
    status ENUM('pendente', 'aceito', 'recusado', 'expirado') DEFAULT 'pendente',
    data_convite TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_resposta TIMESTAMP NULL,
    expiracao TIMESTAMP NOT NULL,
    mensagem_personalizada TEXT,
    FOREIGN KEY (familiar_contratante_id) REFERENCES familiares_contratantes(id) ON DELETE CASCADE,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);

CREATE INDEX idx_convites_token ON convites_cuidadores(token_convite);
CREATE INDEX idx_convites_email_status ON convites_cuidadores(cuidador_email, status);

-- ======================
-- TABELA: VÍNCULO CUIDADORES-PACIENTES
-- ======================
CREATE TABLE IF NOT EXISTS cuidadores_profissionais_pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cuidador_profissional_id INT NOT NULL,
    paciente_id INT NOT NULL,
    cuidador_principal BOOLEAN DEFAULT FALSE,
    data_inicio DATE NOT NULL,
    data_fim DATE NULL,
    status_vinculo ENUM('ativo', 'inativo', 'suspenso') DEFAULT 'ativo',
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cuidador_profissional_id) REFERENCES cuidadores_profissionais(id) ON DELETE CASCADE,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vinculo_ativo (cuidador_profissional_id, paciente_id, status_vinculo)
);

CREATE INDEX idx_vinculos_cuidador ON cuidadores_profissionais_pacientes(cuidador_profissional_id);
CREATE INDEX idx_vinculos_paciente ON cuidadores_profissionais_pacientes(paciente_id);
CREATE INDEX idx_vinculos_status ON cuidadores_profissionais_pacientes(status_vinculo);

-- ======================
-- TABELA: MEDICAMENTOS
-- ======================
CREATE TABLE IF NOT EXISTS medicamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    nome_medicamento VARCHAR(255) NOT NULL,
    dosagem VARCHAR(100),
    frequencia VARCHAR(100),
    horarios TEXT,
    via_administracao VARCHAR(50),
    observacoes TEXT,
    data_inicio DATE,
    data_termino DATE,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);

CREATE INDEX idx_medicamentos_paciente ON medicamentos(paciente_id);
CREATE INDEX idx_medicamentos_ativo ON medicamentos(ativo);

-- ======================
-- TABELA: REGISTROS DE MEDICAÇÃO
-- ======================
CREATE TABLE IF NOT EXISTS registros_medicacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicamento_id INT NOT NULL,
    paciente_id INT NOT NULL,
    cuidador_id INT,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dose_administrada VARCHAR(100),
    observacoes TEXT,
    status ENUM('administrado', 'pendente', 'recusado', 'atrasado') DEFAULT 'pendente',
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE CASCADE,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (cuidador_id) REFERENCES cuidadores_profissionais(id) ON DELETE SET NULL
);

CREATE INDEX idx_medicacao_paciente_data ON registros_medicacao(paciente_id, data_hora);
CREATE INDEX idx_medicacao_status ON registros_medicacao(status);

-- ======================
-- TABELA: SINAIS VITAIS
-- ======================
CREATE TABLE IF NOT EXISTS sinais_vitais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    valor_principal DECIMAL(10,2),
    valor_secundario DECIMAL(10,2),
    unidade_medida VARCHAR(50),
    observacoes TEXT,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registrado_por INT,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (registrado_por) REFERENCES cuidadores_profissionais(id) ON DELETE SET NULL
);

CREATE INDEX idx_sinais_vitais_paciente_data ON sinais_vitais(paciente_id, data_registro);
CREATE INDEX idx_sinais_vitais_tipo ON sinais_vitais(tipo);

-- ======================
-- TABELA: ATIVIDADES E TAREFAS
-- ======================
CREATE TABLE IF NOT EXISTS atividades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    cuidador_id INT,
    tipo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    data_prevista DATETIME,
    data_conclusao DATETIME NULL,
    status ENUM('pendente', 'concluida', 'cancelada') DEFAULT 'pendente',
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (cuidador_id) REFERENCES cuidadores_profissionais(id) ON DELETE SET NULL
);

CREATE INDEX idx_atividades_paciente_data ON atividades(paciente_id, data_prevista);
CREATE INDEX idx_atividades_status ON atividades(status);

-- ======================
-- TABELA: ALERTAS
-- ======================
CREATE TABLE IF NOT EXISTS alertas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    severidade ENUM('baixa', 'media', 'alta', 'critica') DEFAULT 'media',
    status ENUM('ativo', 'resolvido', 'cancelado') DEFAULT 'ativo',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_resolucao TIMESTAMP NULL,
    resolvido_por INT,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (resolvido_por) REFERENCES cuidadores_profissionais(id) ON DELETE SET NULL
);

CREATE INDEX idx_alertas_paciente_data ON alertas(paciente_id, data_criacao);
CREATE INDEX idx_alertas_severidade ON alertas(severidade);
CREATE INDEX idx_alertas_status ON alertas(status);

-- ======================
-- TABELA: MENSAGENS
-- ======================
CREATE TABLE IF NOT EXISTS mensagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    remetente_id INT NOT NULL,
    destinatario_id INT NOT NULL,
    assunto VARCHAR(255),
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (remetente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (destinatario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_mensagens_remetente ON mensagens(remetente_id);
CREATE INDEX idx_mensagens_destinatario ON mensagens(destinatario_id);
CREATE INDEX idx_mensagens_data ON mensagens(data_envio);

-- ======================
-- TABELA: RELATÓRIOS
-- ======================
CREATE TABLE IF NOT EXISTS relatorios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    cuidador_id INT NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    conteudo TEXT,
    data_geracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (cuidador_id) REFERENCES cuidadores_profissionais(id) ON DELETE CASCADE
);

CREATE INDEX idx_relatorios_paciente_periodo ON relatorios(paciente_id, periodo_inicio);
CREATE INDEX idx_relatorios_tipo ON relatorios(tipo);


ALTER TABLE medicamentos 
ADD COLUMN status ENUM('pendente', 'administrado', 'atrasado') DEFAULT 'pendente',
ADD COLUMN data_administracao DATETIME NULL,
ADD COLUMN administrado_por INT NULL,
ADD FOREIGN KEY (administrado_por) REFERENCES usuarios(id);

-- 1. Remover a chave estrangeira problemática
ALTER TABLE sinais_vitais DROP FOREIGN KEY sinais_vitais_ibfk_2;

-- 2. Adicionar a chave estrangeira correta (referenciando usuarios)
ALTER TABLE sinais_vitais 
ADD FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL;

-- 3. Adicionar índices para melhor performance
CREATE INDEX idx_sinais_paciente_tipo ON sinais_vitais(paciente_id, tipo);
CREATE INDEX idx_sinais_data ON sinais_vitais(data_registro);
CREATE INDEX idx_sinais_tipo ON sinais_vitais(tipo);
