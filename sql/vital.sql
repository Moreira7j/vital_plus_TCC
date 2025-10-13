-- Criação do banco
CREATE DATABASE IF NOT EXISTS vital_plus;
USE vital_plus;

-- =========================
-- Usuários (familiares e cuidadores)
-- =========================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM("familiar_cuidador", "familiar_contratante", "cuidador_profissional", "admin") NOT NULL,
    telefone VARCHAR(20),
    data_nascimento DATE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    codigo_ativacao VARCHAR(64) UNIQUE,
    conta_ativa BOOLEAN DEFAULT FALSE
);

-- Familiares Cuidadores (que cuidam diretamente)
CREATE TABLE familiares_cuidadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    parentesco VARCHAR(50),
    endereco VARCHAR(255),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Familiares Contratantes (que contratam cuidadores profissionais)
CREATE TABLE familiares_contratantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    endereco VARCHAR(255),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Cuidadores Profissionais (contratados pelos familiares contratantes)
CREATE TABLE cuidadores_profissionais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    especializacao VARCHAR(100),
    registro_profissional VARCHAR(50),
    disponibilidade VARCHAR(50), -- ex: integral, parcial, plantão
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- =========================
-- Pacientes
-- =========================
CREATE TABLE pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    data_nascimento DATE NOT NULL,
    genero ENUM("masculino", "feminino", "outro"),
    condicao_principal VARCHAR(255),
    plano_saude VARCHAR(100),
    alergias TEXT,
    historico_medico TEXT,
    foto_perfil VARCHAR(255),
    -- O paciente pode ser gerenciado por um familiar cuidador ou um familiar contratante
    familiar_cuidador_id INT,
    familiar_contratante_id INT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (familiar_cuidador_id) REFERENCES familiares_cuidadores(id) ON DELETE CASCADE,
    FOREIGN KEY (familiar_contratante_id) REFERENCES familiares_contratantes(id) ON DELETE CASCADE
);

-- Relacionamento cuidador_profissional ↔ paciente
CREATE TABLE cuidadores_profissionais_pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cuidador_profissional_id INT NOT NULL,
    paciente_id INT NOT NULL,
    cuidador_principal BOOLEAN DEFAULT FALSE,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    status_vinculo ENUM("pendente", "ativo", "inativo", "recusado") DEFAULT "pendente",
    token_ativacao VARCHAR(255) UNIQUE,
    data_ativacao TIMESTAMP NULL,
    FOREIGN KEY (cuidador_profissional_id) REFERENCES cuidadores_profissionais(id) ON DELETE CASCADE,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    UNIQUE KEY unq_cuidador_paciente (cuidador_profissional_id, paciente_id)
);

-- =========================
-- Tarefas / Checklist diário
-- =========================
CREATE TABLE tarefas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    cuidador_id INT NOT NULL, -- Pode ser familiar_cuidador ou cuidador_profissional
    tipo_cuidador ENUM("familiar_cuidador", "cuidador_profissional") NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(50), -- medicamento, higiene, alimentação, etc
    horario_previsto TIME,
    data_prevista DATE,
    repetir_diariamente BOOLEAN DEFAULT FALSE,
    status ENUM("pendente", "concluido", "cancelado") DEFAULT "pendente",
    data_conclusao TIMESTAMP NULL,
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
    -- FOREIGN KEY para cuidador_id será feita via aplicação, pois pode ser de duas tabelas diferentes
);

-- =========================
-- Medicamentos
-- =========================
CREATE TABLE medicamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    dosagem VARCHAR(50) NOT NULL,
    forma_farmaceutica VARCHAR(50), -- comprimido, injeção, etc
    frequencia VARCHAR(100) NOT NULL,
    horarios JSON NOT NULL, -- lista de horários
    data_inicio DATE NOT NULL,
    data_termino DATE,
    instrucoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);

-- Registro de administração
CREATE TABLE medicamentos_registros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicamento_id INT NOT NULL,
    cuidador_id INT NOT NULL, -- Pode ser familiar_cuidador ou cuidador_profissional
    tipo_cuidador ENUM("familiar_cuidador", "cuidador_profissional") NOT NULL,
    paciente_id INT NOT NULL,
    data_hora_prevista DATETIME NOT NULL,
    data_hora_administracao DATETIME,
    status ENUM("pendente", "administrado", "omitido", "atrasado") DEFAULT "pendente",
    observacoes TEXT,
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE CASCADE,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
    -- FOREIGN KEY para cuidador_id será feita via aplicação
);

-- =========================
-- Sinais vitais
-- =========================
CREATE TABLE sinais_vitais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    cuidador_id INT NOT NULL, -- Pode ser familiar_cuidador ou cuidador_profissional
    tipo_cuidador ENUM("familiar_cuidador", "cuidador_profissional") NOT NULL,
    tipo ENUM("pressao_arterial", "glicemia", "batimentos", "temperatura", "saturacao") NOT NULL,
    valor_principal DECIMAL(8,2) NOT NULL, -- ex: 120 (sistólica, glicemia, bpm, temp)
    valor_secundario DECIMAL(8,2),        -- ex: 80 (diastólica)
    unidade_medida VARCHAR(20) NOT NULL,
    observacoes TEXT,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
    -- FOREIGN KEY para cuidador_id será feita via aplicação
);

-- =========================
-- Alertas
-- =========================
CREATE TABLE alertas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    cuidador_id INT, -- Pode ser familiar_cuidador ou cuidador_profissional
    tipo_cuidador ENUM("familiar_cuidador", "cuidador_profissional"),
    tipo VARCHAR(50), -- medicamento, sinal_vital, tarefa, compromisso, sistema
    severidade ENUM("baixa", "media", "alta", "critica") NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    lido BOOLEAN DEFAULT FALSE,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_leitura TIMESTAMP NULL,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
    -- FOREIGN KEY para cuidador_id será feita via aplicação
);

-- =========================
-- Compromissos
-- =========================
CREATE TABLE compromissos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    cuidador_id INT, -- Pode ser familiar_cuidador ou cuidador_profissional
    tipo_cuidador ENUM("familiar_cuidador", "cuidador_profissional"),
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(50), -- consulta, exame, terapia, etc
    local VARCHAR(255),
    data_hora_inicio DATETIME NOT NULL,
    data_hora_fim DATETIME,
    lembrete BOOLEAN DEFAULT FALSE,
    minutos_antecedencia_lembrete INT DEFAULT 30,
    status ENUM("agendado", "confirmado", "realizado", "cancelado") DEFAULT "agendado",
    observacoes TEXT,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
    -- FOREIGN KEY para cuidador_id será feita via aplicação
);

-- =========================
-- Relatórios
-- =========================
CREATE TABLE relatorios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    usuario_id INT NOT NULL, -- quem gerou
    tipo ENUM("diario", "semanal", "mensal", "personalizado") NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    dados JSON NOT NULL, -- dados exportados
    arquivo_path VARCHAR(255),
    data_geracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- =========================
-- Índices
-- =========================
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_pacientes_nome ON pacientes(nome);
CREATE INDEX idx_tarefas_paciente_data ON tarefas(paciente_id, data_prevista);
CREATE INDEX idx_medicamentos_paciente ON medicamentos(paciente_id);
CREATE INDEX idx_sinais_vitais_paciente_data ON sinais_vitais(paciente_id, data_registro);
CREATE INDEX idx_alertas_paciente_data ON alertas(paciente_id, data_registro);
CREATE INDEX idx_compromissos_paciente_data ON compromissos(paciente_id, data_hora_inicio);

