// dashboard_supervisor.js - CORRIGIDO (header e paciente selecionado)
const token = localStorage.getItem("token");
const headersAutenticacao = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
};

let currentPatient = null;

// ✅ NOVO: Inicializar header primeiro
function inicializarHeader() {
    console.log('🔧 Inicializando header...');

    // Tentar carregar dados básicos do header mesmo antes da API
    const usuarioNome = localStorage.getItem('usuarioNome');
    const userNameElement = document.getElementById('userName');

    if (userNameElement && usuarioNome) {
        userNameElement.textContent = usuarioNome;
        console.log('✅ Header inicializado com:', usuarioNome);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 DOM carregado, inicializando dashboard supervisor...');

    // DEBUG: Verificar localStorage
    console.log('🔍 DEBUG - localStorage:');
    console.log('usuarioId:', localStorage.getItem('usuarioId'));
    console.log('pacienteSelecionadoId:', localStorage.getItem('pacienteSelecionadoId'));
    console.log('usuarioTipo:', localStorage.getItem('usuarioTipo'));

    // Inicializar ícones
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    // Inicializar header
    inicializarHeader();

    // ✅ CORREÇÃO: Carregar dados do dependente e DEPOIS configurar sincronização
    carregarDadosDependente().then(() => {
        console.log('✅ Dados do dependente carregados, configurando sincronização...');
        
        // Configurar eventos
        configurarEventos();
        
        // Configurar sincronização automática
        configurarAtualizacaoAutomatica();
        
        console.log('🎯 Dashboard supervisor totalmente inicializado!');
        
        // ✅ VERIFICAÇÃO FINAL: Executar verificação de carregamento
        setTimeout(verificarCarregamentoInicial, 1000);
    }).catch(error => {
        console.error('❌ Erro ao carregar dados do dependente:', error);
    });
});

// ✅ NOVO: FUNÇÃO PARA ATUALIZAR O HEADER DO SUPERVISOR
function atualizarHeaderSupervisor(paciente) {
    console.log('🎯 Atualizando header do supervisor...');

    // Elementos do header
    const userNameElement = document.getElementById('userName');
    const patientNameElement = document.getElementById('patientName');

    // Obter nome do usuário logado do localStorage
    const usuarioNome = localStorage.getItem('usuarioNome') || 'Familiar Supervisor';

    // Atualizar elementos
    if (userNameElement) {
        userNameElement.textContent = usuarioNome;
        console.log('✅ Nome do usuário atualizado:', usuarioNome);
    }

    if (patientNameElement && paciente) {
        patientNameElement.textContent = paciente.nome || 'Paciente não informado';
        console.log('✅ Nome do paciente atualizado:', paciente.nome);
    }
}

// Função para carregar dados do dependente - CORREÇÃO COMPLETA
async function carregarDadosDependente() {
    try {
        console.log('🔍 Iniciando carregamento de dados do dependente...');

        // Recuperar dados do usuário
        const usuarioId = localStorage.getItem('usuarioId');
        const usuarioTipo = localStorage.getItem('usuarioTipo');

        // ✅ CORREÇÃO COMPLETA: Buscar paciente selecionado de TODAS as formas
        let pacienteSelecionadoId = null;
        let pacienteSelecionadoObj = null;

        // 1. Tentar buscar por pacienteSelecionadoId (chave direta)
        pacienteSelecionadoId = localStorage.getItem('pacienteSelecionadoId');

        // 2. Se não encontrou, tentar extrair de dependenteSelecionado (JSON)
        if (!pacienteSelecionadoId) {
            const dependenteObjStr = localStorage.getItem('dependenteSelecionado');
            if (dependenteObjStr) {
                try {
                    pacienteSelecionadoObj = JSON.parse(dependenteObjStr);
                    pacienteSelecionadoId = pacienteSelecionadoObj.id || pacienteSelecionadoObj.paciente_id;
                    console.log('✅ Paciente encontrado em dependenteSelecionado:', pacienteSelecionadoId);
                } catch (e) {
                    console.error('❌ Erro ao parsear dependenteSelecionado:', e);
                }
            }
        }

        // 3. Se ainda não encontrou, tentar outras chaves possíveis
        if (!pacienteSelecionadoId) {
            pacienteSelecionadoId = localStorage.getItem('dependenteSelecionadoId') ||
                localStorage.getItem('pacienteId') ||
                localStorage.getItem('selectedPatientId');
        }

        console.log('👤 Usuário:', usuarioId, 'Tipo:', usuarioTipo);
        console.log('🎯 Paciente selecionado ID final:', pacienteSelecionadoId);

        if (!usuarioId) {
            console.error('❌ Usuário não logado');
            window.location.href = '/';
            return;
        }

        // ✅ CORREÇÃO: Se não tem paciente selecionado, redirecionar SILENCIOSAMENTE
        if (!pacienteSelecionadoId) {
            console.log('🔁 Nenhum paciente selecionado, redirecionando para dependentes...');
            window.location.href = 'dependentes.html';
            return;
        }

        // ✅ CORREÇÃO: Garantir que o ID está salvo em todas as chaves para compatibilidade futura
        localStorage.setItem('pacienteSelecionadoId', pacienteSelecionadoId);
        if (pacienteSelecionadoObj) {
            localStorage.setItem('dependenteSelecionado', JSON.stringify(pacienteSelecionadoObj));
        }

        // ✅ CORREÇÃO: Buscar dados do paciente baseado no tipo de usuário
        // ✅ CORREÇÃO: Buscar dados do paciente baseado no tipo de usuário
        let paciente;
        let apiUrl;

        if (usuarioTipo === 'familiar_contratante') {
            // Familiar contratante usa rota de supervisor
            apiUrl = `/api/supervisores/${usuarioId}/paciente/${pacienteSelecionadoId}`;
            console.log('🌐 Buscando via rota supervisor (familiar_contratante):', apiUrl);

        } else if (usuarioTipo === 'familiar_cuidador') {
            // Familiar cuidador usa rota específica
            apiUrl = `/api/familiares-cuidadores/${usuarioId}/paciente/${pacienteSelecionadoId}`;
            console.log('🌐 Buscando via rota familiar cuidador:', apiUrl);

        } else if (usuarioTipo === 'cuidador_profissional') {
            // Cuidador profissional usa rota de cuidador
            apiUrl = `/api/cuidadores/${usuarioId}/paciente`;
            console.log('🌐 Buscando via rota cuidador profissional:', apiUrl);
        } else {
            // Para outros tipos, usar rota genérica
            apiUrl = `/api/dependentes/${pacienteSelecionadoId}`;
            console.log('🌐 Buscando via rota genérica:', apiUrl);
        }

        // Fazer a requisição
        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro na resposta da API:', response.status, errorText);

            if (response.status === 404) {
                console.log('🔁 Paciente não encontrado, redirecionando para dependentes...');
                window.location.href = 'dependentes.html';
                return;
            }
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }

        paciente = await response.json();
        console.log('✅ Dados do paciente recebidos:', paciente);

        // ✅ APENAS ESTA LINHA: Atualizar variável global
        currentPatient = paciente;

        // ✅ CORREÇÃO: Garantir que o paciente está salvo em TODOS os formatos
        localStorage.setItem('pacienteSelecionadoId', paciente.id || pacienteSelecionadoId);
        localStorage.setItem('dependenteSelecionado', JSON.stringify(paciente));

        // Atualizar interface
        atualizarInterfaceDependente(paciente);

        // Carregar dados adicionais
        console.log('🔄 Carregando dados adicionais...');
        await carregarDadosAdicionais(usuarioId, paciente.id || pacienteSelecionadoId);

        console.log('✅ Todos os dados carregados com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao carregar dados do dependente:', error);
    }
}


// Função para carregar atividades no dashboard do supervisor
async function loadTasks() {
    try {
        if (!currentPatient) {
            console.log('❌ Nenhum paciente selecionado no supervisor');
            return;
        }

        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = currentPatient.id;

        console.log(`📝 Buscando atividades para supervisor ${usuarioId} do paciente ${pacienteId}`);

        const response = await fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/atividades`);

        if (!response.ok) {
            throw new Error('Erro ao carregar atividades para supervisor');
        }

        const atividades = await response.json();
        console.log('📦 Atividades recebidas no dashboard do supervisor:', atividades);

        updateTasksInterface(atividades);
    } catch (error) {
        console.error('❌ Erro ao carregar atividades no dashboard do supervisor:', error);
        updateTasksInterface([]);
    }
}

// Função para atualizar a interface de atividades do supervisor
function updateTasksInterface(atividades) {
    const container = document.getElementById("tasksList");

    if (!container) {
        console.error('❌ Container tasksList não encontrado no dashboard do supervisor');
        return;
    }

    if (!Array.isArray(atividades)) {
        atividades = [];
    }

    console.log('🎨 Renderizando atividades no dashboard do supervisor:', atividades);

    if (atividades.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-feather="check-circle"></i>
                <p>Nenhuma atividade registrada hoje</p>
            </div>
        `;
        if (typeof feather !== 'undefined') feather.replace();
        return;
    }

    container.innerHTML = atividades.map(atividade => {
        const descricao = atividade.descricao || 'Atividade sem descrição';

        // Formatar horário
        let horario = 'Horário não informado';
        if (atividade.data_prevista) {
            const data = new Date(atividade.data_prevista);
            horario = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }

        const status = atividade.status || 'pendente';
        const tipo = atividade.tipo || 'outro';
        const cuidador = atividade.cuidador_nome || 'Cuidador';

        return `
            <div class="task-item" data-atividade-id="${atividade.id}">
                <div class="task-icon">
                    <i data-feather="${getTaskIcon(tipo)}"></i>
                </div>
                <div class="task-info">
                    <h5>${descricao}</h5>
                    <small>${horario} - ${obterTextoTipo(tipo)}</small>
                    <small class="text-muted">Registrado por: ${cuidador}</small>
                </div>
                <span class="badge ${status === 'pendente' ? 'bg-warning' : 'bg-success'}">
                    ${status === 'pendente' ? 'Pendente' : 'Concluída'}
                </span>
            </div>
        `;
    }).join('');

    if (typeof feather !== 'undefined') feather.replace();
}

// Função para obter texto do tipo de atividade
function obterTextoTipo(tipo) {
    const textos = {
        'alimentacao': 'Alimentação',
        'exercicio': 'Exercício',
        'higiene': 'Higiene',
        'medicacao': 'Medicação',
        'repouso': 'Repouso',
        'social': 'Social',
        'outro': 'Outro'
    };
    return textos[tipo] || tipo;
}

// Função para obter ícone baseado no tipo de atividade
function getTaskIcon(tipo) {
    const iconMap = {
        'alimentacao': 'coffee',
        'exercicio': 'activity',
        'higiene': 'droplet',
        'medicacao': 'pill',
        'repouso': 'moon',
        'social': 'users',
        'outro': 'check-square'
    };
    return iconMap[tipo] || 'check-square';
}
// Função para atualizar a interface - ATUALIZADA
function atualizarInterfaceDependente(paciente) {
    console.log('🎨 Atualizando interface para paciente:', paciente);

    // ✅ NOVO: Atualizar header primeiro
    atualizarHeaderSupervisor(paciente);

    // Elementos principais
    const elementos = {
        'dependenteNome': paciente.nome || 'Nome não informado',
        'dependenteIdade': (paciente.idade || calcularIdade(paciente.data_nascimento)) + ' anos',
        'dependenteCondicao': paciente.condicao_principal || 'Condição não informada',
        'healthPlan': paciente.plano_saude || 'Não informado',
        'patientAllergies': paciente.alergias || 'Nenhuma alergia informada'
    };

    // Atualizar elementos textuais
    Object.keys(elementos).forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = elementos[id];
            console.log(`✅ ${id} atualizado:`, elementos[id]);
        }
    });

    // Informações do cuidador
    if (paciente.cuidador_nome) {
        const cuidadorNome = document.getElementById('cuidadorNome');
        const cuidadorContato = document.getElementById('cuidadorContato');
        const cuidadorEspecializacao = document.getElementById('cuidadorEspecializacao');
        const cuidadorNomeCompleto = document.getElementById('cuidadorNomeCompleto');
        const cuidadorTelefone = document.getElementById('cuidadorTelefone');
        const cuidadorEmail = document.getElementById('cuidadorEmail');

        if (cuidadorNome) cuidadorNome.textContent = paciente.cuidador_nome;
        if (cuidadorContato) cuidadorContato.textContent = paciente.cuidador_telefone || 'Contato não informado';
        if (cuidadorEspecializacao) cuidadorEspecializacao.textContent = paciente.cuidador_especializacao || 'Especialização não informada';
        if (cuidadorNomeCompleto) cuidadorNomeCompleto.textContent = paciente.cuidador_nome;
        if (cuidadorTelefone) cuidadorTelefone.textContent = paciente.cuidador_telefone || '--';
        if (cuidadorEmail) cuidadorEmail.textContent = paciente.cuidador_email || '--';
    }

    // Informações do familiar
    const familiarName = document.getElementById('familiarName');
    if (familiarName && paciente.familiar_nome) {
        familiarName.textContent = paciente.familiar_nome;
    }

    // Foto do dependente
    const fotoElement = document.getElementById('dependenteFoto') || document.getElementById('patientAvatar');
    if (fotoElement) {
        let fotoUrl = paciente.foto_url || paciente.foto_perfil;

        if (fotoUrl && fotoUrl !== 'null' && fotoUrl !== 'undefined') {
            if (!fotoUrl.startsWith('http') && !fotoUrl.startsWith('/')) {
                fotoUrl = '/' + fotoUrl;
            }

            console.log('🖼️ Tentando carregar foto:', fotoUrl);
            fotoElement.src = fotoUrl;

            fotoElement.onerror = function () {
                console.error('❌ Erro ao carregar imagem, usando padrão:', fotoUrl);
                this.src = '../assets/default-avatar.png';
                this.alt = 'Foto não disponível';
            };

            fotoElement.onload = function () {
                console.log('✅ Foto carregada com sucesso:', fotoUrl);
            };
        } else {
            console.log('📸 Usando foto padrão');
            fotoElement.src = '../assets/default-avatar.png';
            fotoElement.alt = 'Foto padrão';
        }
    }

    // Atualizar timestamp
    const ultimaAtualizacao = document.getElementById('ultimaAtualizacao');
    if (ultimaAtualizacao) {
        ultimaAtualizacao.textContent = new Date().toLocaleString('pt-BR');
    }
}

// ✅ FUNÇÃO CORRIGIDA PARA CARREGAR SINAIS VITAIS
async function carregarSinaisVitais(usuarioId, pacienteId) {
    try {
        console.log('💓 Carregando sinais vitais para supervisor...');
        console.log(`🌐 URL: /api/supervisores/${usuarioId}/pacientes/${pacienteId}/sinais-vitais`);

        const response = await fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/sinais-vitais`);
        console.log('📡 Status da resposta:', response.status);

        if (response.ok) {
            const sinais = await response.json();
            console.log('✅ Sinais vitais recebidos no supervisor:', sinais);
            atualizarSinaisVitais(sinais);
        } else if (response.status === 404) {
            console.log('⚠️ Nenhum sinal vital encontrado');
            atualizarSinaisVitais([]);
        } else {
            console.error('❌ Erro na API:', response.status);
            // Tentar rota alternativa
            await tentarRotaAlternativaSinaisVitais(pacienteId);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar sinais vitais:', error);
        await tentarRotaAlternativaSinaisVitais(pacienteId);
    }
}

// ✅ NOVA FUNÇÃO AUXILIAR: Tentar rota alternativa
async function tentarRotaAlternativaSinaisVitais(pacienteId) {
    try {
        console.log('🔄 Tentando rota alternativa para sinais vitais...');
        const response = await fetch(`/api/pacientes/${pacienteId}/sinais-vitais/recentes`);

        if (response.ok) {
            const sinais = await response.json();
            console.log('✅ Sinais vitais recebidos via rota alternativa:', sinais);
            atualizarSinaisVitais(sinais);
        } else {
            atualizarSinaisVitais([]);
        }
    } catch (error) {
        console.error('❌ Erro na rota alternativa:', error);
        atualizarSinaisVitais([]);
    }
}

async function carregarMedicamentos(usuarioId, pacienteId) {
    try {
        console.log('💊 Carregando medicamentos...');
        const response = await fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/medicamentos`);

        if (response.ok) {
            const medicamentos = await response.json();
            console.log('✅ Medicamentos recebidos:', medicamentos.length);
            atualizarMedicamentos(medicamentos);
        } else {
            console.log('⚠️ API de medicamentos não respondeu');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar medicamentos:', error);
    }
}

async function carregarAtividades(usuarioId, pacienteId) {
    try {
        console.log('📅 Carregando atividades...');
        const response = await fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/atividades`);

        if (response.ok) {
            const atividades = await response.json();
            console.log('✅ Atividades recebidas:', atividades.length);
            exibirAtividades(atividades);
        } else {
            console.log('⚠️ API de atividades não respondeu');
            exibirAtividades([]);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar atividades:', error);
        exibirAtividades([]);
    }
}

async function carregarAlertas(usuarioId, pacienteId) {
    try {
        console.log('🚨 Carregando alertas...');
        const response = await fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/alertas`);

        if (response.ok) {
            const alertas = await response.json();
            console.log('✅ Alertas recebidos:', alertas.length);
            exibirAlertas(alertas);
        } else {
            console.log('⚠️ API de alertas não respondeu');
            exibirAlertas([]);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar alertas:', error);
        exibirAlertas([]);
    }
}


// ✅ FUNÇÃO PARA ANALISAR ESTRUTURA DOS DADOS
window.analisarDadosSinais = function() {
    const usuarioId = localStorage.getItem('usuarioId');
    const pacienteId = localStorage.getItem('pacienteSelecionadoId');
    
    console.log('🔍 ANALISANDO ESTRUTURA DOS DADOS...');
    console.log('👤 Usuário ID:', usuarioId);
    console.log('🎯 Paciente ID:', pacienteId);
    
    fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/sinais-vitais`)
        .then(response => response.json())
        .then(sinais => {
            console.log('📦 ESTRUTURA COMPLETA DOS SINAIS:', sinais);
            
            if (sinais && sinais.length > 0) {
                console.log('📝 PRIMEIRO REGISTRO DETALHADO:');
                const primeiro = sinais[0];
                console.log('Tipo:', primeiro.tipo);
                console.log('Valor principal:', primeiro.valor_principal);
                console.log('Valor:', primeiro.valor);
                console.log('Data registro:', primeiro.data_registro);
                console.log('Created at:', primeiro.created_at);
                console.log('Todas as propriedades:', Object.keys(primeiro));
                
                // Mostrar todos os tipos disponíveis
                const tipos = [...new Set(sinais.map(s => s.tipo))];
                console.log('🎯 TIPOS DISPONÍVEIS:', tipos);
            }
        })
        .catch(error => console.error('❌ Erro ao analisar dados:', error));
};

// ✅ FUNÇÕES AUXILIARES PARA AVALIAÇÃO (ADICIONE SE NÃO EXISTIREM)
function avaliarPressao(valor) {
    if (!valor) return "Normal";
    const [sistolica, diastolica] = valor.toString().split('/').map(Number);
    if (sistolica < 120 && diastolica < 80) return "Ótima";
    if (sistolica < 130 && diastolica < 85) return "Normal";
    if (sistolica < 140 && diastolica < 90) return "Limítrofe";
    if (sistolica < 160 && diastolica < 100) return "Alta";
    return "Muito Alta";
}

function avaliarGlicemia(valor) {
    if (!valor) return "Normal";
    const glic = Number(valor);
    if (glic < 70) return "Baixa";
    if (glic <= 99) return "Normal";
    if (glic <= 125) return "Alterada";
    return "Alta";
}

function avaliarTemperatura(valor) {
    if (!valor) return "Normal";
    const temp = Number(valor);
    if (temp < 36) return "Baixa";
    if (temp <= 37.2) return "Normal";
    if (temp <= 38) return "Febril";
    return "Febre Alta";
}

function avaliarBatimentos(valor) {
    if (!valor) return "Normal";
    const bpm = Number(valor);
    if (bpm < 60) return "Baixo";
    if (bpm <= 100) return "Normal";
    return "Alto";
}

function getStatusClass(status) {
    const statusMap = {
        "Ótima": "bg-success",
        "Normal": "bg-success",
        "Limítrofe": "bg-warning",
        "Alta": "bg-warning",
        "Muito Alta": "bg-danger",
        "Baixa": "bg-danger",
        "Alterada": "bg-warning",
        "Febril": "bg-warning",
        "Febre Alta": "bg-danger",
        "Baixo": "bg-warning",
        "Alto": "bg-warning"
    };
    return statusMap[status] || "bg-secondary";
}

function atualizarMedicamentos(medicamentos) {
    const container = document.getElementById('medicationSchedule');
    if (!container) return;

    if (!medicamentos || medicamentos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-feather="calendar"></i>
                <p>Nenhum medicamento cadastrado</p>
            </div>
        `;
        feather.replace();
        return;
    }

    container.innerHTML = medicamentos.map(med => `
        <div class="medication-item">
            <div class="medication-icon">
                <i data-feather="pill"></i>
            </div>
            <div class="medication-info">
                <h5>${med.nome_medicamento}</h5>
                <small>${med.dosagem} - ${med.horarios || 'Horário não definido'}</small>
            </div>
        </div>
    `).join('');

    feather.replace();
}
// Função para recarregar tarefas quando uma atividade for criada/concluída
async function recarregarTarefasSupervisor() {
    try {
        await loadTasks();
        console.log('✅ Tarefas recarregadas no dashboard do supervisor');
    } catch (error) {
        console.error('❌ Erro ao recarregar tarefas no dashboard do supervisor:', error);
    }
}

// Tornar a função global para ser chamada de outros arquivos
window.recarregarTarefasSupervisor = recarregarTarefasSupervisor;

function exibirAtividades(atividades) {
    const activityFeed = document.getElementById('activityFeed');
    if (!activityFeed) return;

    if (!atividades || atividades.length === 0) {
        activityFeed.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clock"></i>
                <p>Nenhuma atividade recente</p>
                <small class="text-muted">As atividades aparecerão aqui quando forem registradas</small>
            </div>
        `;
        return;
    }

    const atividadesHTML = atividades.map(atividade => {
        const descricao = atividade.descricao || 'Atividade sem descrição';
        const tipo = atividade.tipo || 'outro';
        const cuidador = atividade.cuidador_nome || 'Cuidador';

        // Formatar data
        let dataFormatada = 'Data não informada';
        if (atividade.data_prevista) {
            const data = new Date(atividade.data_prevista);
            dataFormatada = data.toLocaleDateString('pt-BR') + ' ' +
                data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }

        // Verificar se está atrasada
        const isAtrasada = atividade.status === 'pendente' &&
            new Date(atividade.data_prevista) < new Date();

        const statusClass = isAtrasada ? 'bg-danger' :
            (atividade.status === 'concluida' ? 'bg-success' : 'bg-warning');

        const statusText = isAtrasada ? 'Atrasada' :
            (atividade.status === 'concluida' ? 'Concluída' : 'Pendente');

        return `
            <div class="activity-item ${isAtrasada ? 'atrasada' : ''} ${tipo}">
                <div class="activity-icon">
                    <i class="${obterIconeClasseAtividade(tipo)}"></i>
                </div>
                <div class="activity-content">
                    <h5>${descricao}</h5>
                    <div class="activity-meta">
                        <span>
                            <i class="fas fa-calendar"></i>
                            ${dataFormatada}
                        </span>
                        <span>
                            <i class="fas fa-user"></i>
                            ${cuidador}
                        </span>
                        <span>
                            <i class="fas fa-tag"></i>
                            ${obterTextoTipo(tipo)}
                        </span>
                    </div>
                    ${atividade.observacoes ? `
                        <div class="activity-notes">
                            <strong>Observações:</strong> ${atividade.observacoes}
                        </div>
                    ` : ''}
                </div>
                <span class="badge ${statusClass}">${statusText}</span>
            </div>
        `;
    }).join('');

    activityFeed.innerHTML = atividadesHTML;
}

// Função auxiliar para obter classe do ícone Font Awesome
function obterIconeClasseAtividade(tipo) {
    const iconMap = {
        'alimentacao': 'fas fa-utensils',
        'exercicio': 'fas fa-running',
        'higiene': 'fas fa-shower',
        'medicacao': 'fas fa-pills',
        'repouso': 'fas fa-bed',
        'social': 'fas fa-users',
        'consulta': 'fas fa-stethoscope',
        'outro': 'fas fa-tasks'
    };
    return iconMap[tipo] || 'fas fa-tasks';
}

// Função para obter texto do tipo de atividade
function obterTextoTipo(tipo) {
    const textos = {
        'alimentacao': 'Alimentação',
        'exercicio': 'Exercício',
        'higiene': 'Higiene',
        'medicacao': 'Medicação',
        'repouso': 'Repouso',
        'social': 'Social',
        'consulta': 'Consulta',
        'outro': 'Outro'
    };
    return textos[tipo] || tipo;
}

function exibirAlertas(alertas) {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) return;

    if (!alertas || alertas.length === 0) {
        alertsList.innerHTML = `
            <div class="empty-state">
                <i data-feather="bell-off"></i>
                <p>Nenhum alerta no momento</p>
            </div>
        `;
        feather.replace();
        return;
    }

    const alertasHTML = alertas.map(alerta => `
        <div class="alert-item ${alerta.severidade || 'media'}">
            <i data-feather="${obterIconeAlerta(alerta.severidade)}" class="alert-icon"></i>
            <div class="alert-content">
                <h5>${alerta.titulo || 'Alerta'}</h5>
                <p>${alerta.descricao || 'Descrição não disponível'}</p>
                <small class="alert-time">${formatarData(alerta.data_criacao)}</small>
            </div>
        </div>
    `).join('');

    alertsList.innerHTML = alertasHTML;
    feather.replace();
}

// FUNÇÃO CONFIGURAR EVENTOS - MANTIDA (já está correta)
function configurarEventos() {
    console.log('⚙️ Configurando eventos...');

    // Filtro de período
    const periodoFilter = document.getElementById('periodoFilter');
    if (periodoFilter) {
        periodoFilter.addEventListener('change', function () {
            const usuarioId = localStorage.getItem('usuarioId');
            const pacienteId = localStorage.getItem('pacienteSelecionadoId');
            if (usuarioId && pacienteId) {
                carregarAtividades(usuarioId, pacienteId);
            }
        });
    }

    // Botão de atualizar
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            carregarDadosDependente();
        });
    }

    // Links de navegação
    const links = {
        'relatoriosLink': 'relatorios_supervisor.html',
        'alertasLink': 'alertas_supervisor.html',
        'comunicacaoLink': 'comunicacao_supervisor.html'
    };

    Object.keys(links).forEach(linkId => {
        const link = document.getElementById(linkId);
        if (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = links[linkId];
            });
        }
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.clear();
            window.location.href = "/";
        });
    }
}

// FUNÇÕES AUXILIARES - MANTIDAS (já estão corretas)
function atualizarElemento(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
}

function atualizarStatus(id, status) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.textContent = status;
        elemento.className = `badge ${obterClasseStatus(status)}`;
    }
}

function obterClasseStatus(status) {
    const statusMap = {
        'Normal': 'bg-success',
        'Estável': 'bg-success',
        'Baixa': 'bg-warning',
        'Alta': 'bg-warning',
        'Crítico': 'bg-danger'
    };
    return statusMap[status] || 'bg-secondary';
}

function calcularIdade(dataNascimento) {
    if (!dataNascimento) return '--';
    try {
        const nascimento = new Date(dataNascimento);
        const hoje = new Date();
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        return idade;
    } catch (e) {
        return '--';
    }
}

function avaliarPressao(sinal) {
    const sistolica = parseInt(sinal.valor_principal);
    if (isNaN(sistolica)) return '--';
    if (sistolica < 90) return 'Baixa';
    if (sistolica > 140) return 'Alta';
    return 'Normal';
}

function avaliarGlicemia(sinal) {
    const valor = parseInt(sinal.valor_principal);
    if (isNaN(valor)) return '--';
    if (valor < 70) return 'Baixa';
    if (valor > 180) return 'Alta';
    return 'Normal';
}

function avaliarTemperatura(sinal) {
    const valor = parseFloat(sinal.valor_principal);
    if (isNaN(valor)) return '--';
    if (valor < 36) return 'Baixa';
    if (valor > 37.5) return 'Alta';
    return 'Normal';
}

function avaliarBatimentos(sinal) {
    const valor = parseInt(sinal.valor_principal);
    if (isNaN(valor)) return '--';
    if (valor < 60) return 'Baixo';
    if (valor > 100) return 'Alto';
    return 'Normal';
}

function atualizarStatusGeral(sinais) {
    const statusElement = document.getElementById('statusGeral');
    if (!statusElement) return;

    let status = 'Estável';
    let classe = 'bg-success';

    const problemas = sinais.filter(sinal => {
        const avaliacao = avaliarPressao(sinal) || avaliarGlicemia(sinal) || avaliarTemperatura(sinal);
        return avaliacao === 'Baixa' || avaliacao === 'Alta' || avaliacao === 'Baixo' || avaliacao === 'Alto';
    });

    if (problemas.length > 0) {
        status = 'Atenção';
        classe = 'bg-warning';
    }

    statusElement.textContent = status;
    statusElement.className = `badge ${classe}`;
}

function obterIconeAtividade(tipo) {
    const icones = {
        'medicacao': 'pill',
        'alimentacao': 'coffee',
        'exercicio': 'activity',
        'banho': 'droplet',
        'consulta': 'calendar',
        'default': 'activity'
    };
    return icones[tipo] || icones.default;
}

function obterIconeAlerta(severidade) {
    const icones = {
        'critica': 'alert-triangle',
        'alta': 'alert-octagon',
        'media': 'alert-circle',
        'baixa': 'info',
        'default': 'bell'
    };
    return icones[severidade] || icones.default;
}

function formatarData(dataString) {
    try {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Data não disponível';
    }
}

function mostrarErro(mensagem) {
    console.error('❌ ' + mensagem);
    alert('❌ ' + mensagem);
}

function mostrarSucesso(mensagem) {
    console.log('✅ ' + mensagem);
    alert('✅ ' + mensagem);
}

// FUNÇÃO PARA VOLTAR PARA A PÁGINA DE DEPENDENTES (CORRIGIDA)
function voltarParaDependentes() {
    console.log('🔄 Voltando para página de dependentes...');

    // Limpar apenas os dados do paciente selecionado, mantendo o login
    const token = localStorage.getItem('token');
    const usuarioId = localStorage.getItem('usuarioId');
    const usuarioTipo = localStorage.getItem('usuarioTipo');
    const usuarioNome = localStorage.getItem('usuarioNome');

    console.log('💾 Salvando dados do usuário para manter login:', {
        usuarioId,
        usuarioTipo,
        usuarioNome
    });

    // Limpar dados específicos do paciente/dependente
    const keysToRemove = [
        'pacienteSelecionadoId',
        'dependenteSelecionado',
        'dependenteSelecionadoId',
        'pacienteId',
        'selectedPatientId'
    ];

    keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
            console.log(`🗑️ Removendo ${key}:`, localStorage.getItem(key));
            localStorage.removeItem(key);
        }
    });

    // Manter dados do usuário logado
    if (token) localStorage.setItem('token', token);
    if (usuarioId) localStorage.setItem('usuarioId', usuarioId);
    if (usuarioTipo) localStorage.setItem('usuarioTipo', usuarioTipo);
    if (usuarioNome) localStorage.setItem('usuarioNome', usuarioNome);

    console.log('✅ Dados limpos. Redirecionando para dependentes.html');

    // ✅ CORREÇÃO: Redirecionar IMEDIATAMENTE sem mostrar erro
    window.location.href = 'dependentes.html';
}

// FUNÇÃO PARA SAIR DO SISTEMA (LOGOUT COMPLETO)
function sair() {
    console.log('🚪 Saindo do sistema...');

    // Limpar todo o localStorage
    localStorage.clear();

    console.log('✅ Todos os dados removidos. Redirecionando para login.');

    // Redirecionar para a página de login
    window.location.href = '/';
}

// Atualizar ícones periodicamente
setInterval(() => {
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}, 2000);

// ✅ FUNÇÃO PARA CARREGAR ATIVIDADES DO CUIDADOR
async function loadTasks() {
    try {
        if (!currentPatient) {
            console.log('❌ Nenhum paciente selecionado no supervisor');
            return;
        }

        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = currentPatient.id;

        console.log(`📝 Buscando atividades para supervisor ${usuarioId} do paciente ${pacienteId}`);

        const response = await fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/atividades`);

        if (!response.ok) {
            throw new Error('Erro ao carregar atividades para supervisor');
        }

        const atividades = await response.json();
        console.log('📦 Atividades recebidas no dashboard do supervisor:', atividades);

        updateTasksInterface(atividades);
    } catch (error) {
        console.error('❌ Erro ao carregar atividades no dashboard do supervisor:', error);
        updateTasksInterface([]);
    }
}

// ✅ FUNÇÃO PARA ATUALIZAR A INTERFACE DE ATIVIDADES
function updateTasksInterface(atividades) {
    const container = document.getElementById("activityFeed");

    if (!container) {
        console.error('❌ Container activityFeed não encontrado no dashboard do supervisor');
        return;
    }

    if (!Array.isArray(atividades)) {
        atividades = [];
    }

    console.log('🎨 Renderizando atividades no dashboard do supervisor:', atividades);

    if (atividades.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-feather="clock"></i>
                <p>Nenhuma atividade recente</p>
                <small class="text-muted">As atividades aparecerão aqui quando forem registradas</small>
            </div>
        `;
        if (typeof feather !== 'undefined') feather.replace();
        return;
    }

    container.innerHTML = atividades.map(atividade => {
        const descricao = atividade.descricao || 'Atividade sem descrição';

        // Formatar horário
        let horario = 'Horário não informado';
        if (atividade.data_prevista) {
            const data = new Date(atividade.data_prevista);
            horario = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }

        const status = atividade.status || 'pendente';
        const tipo = atividade.tipo || 'outro';
        const cuidador = atividade.cuidador_nome || 'Cuidador';

        // Formatar data de conclusão se existir
        let conclusaoInfo = '';
        if (atividade.data_conclusao) {
            const dataConclusao = new Date(atividade.data_conclusao);
            conclusaoInfo = `<small class="text-muted">Concluída em: ${dataConclusao.toLocaleString('pt-BR')}</small>`;
        }

        return `
            <div class="activity-item">
                <div class="activity-icon">
                    <i data-feather="${getTaskIcon(tipo)}"></i>
                </div>
                <div class="activity-info">
                    <h5>${descricao}</h5>
                    <small>${horario} - ${obterTextoTipo(tipo)}</small>
                    <small class="text-muted">Registrado por: ${cuidador}</small>
                    ${conclusaoInfo}
                </div>
                <span class="badge ${status === 'pendente' ? 'bg-warning' : 'bg-success'}">
                    ${status === 'pendente' ? 'Pendente' : 'Concluída'}
                </span>
            </div>
        `;
    }).join('');

    if (typeof feather !== 'undefined') feather.replace();
}

// ✅ FUNÇÕES AUXILIARES
function obterTextoTipo(tipo) {
    const textos = {
        'alimentacao': 'Alimentação',
        'exercicio': 'Exercício',
        'higiene': 'Higiene',
        'medicacao': 'Medicação',
        'repouso': 'Repouso',
        'social': 'Social',
        'outro': 'Outro'
    };
    return textos[tipo] || tipo;
}

function getTaskIcon(tipo) {
    const iconMap = {
        'alimentacao': 'coffee',
        'exercicio': 'activity',
        'higiene': 'droplet',
        'medicacao': 'pill',
        'repouso': 'moon',
        'social': 'users',
        'outro': 'check-square'
    };
    return iconMap[tipo] || 'check-square';
}

// ✅ FUNÇÃO PARA RECARREGAR TAREFAS
async function recarregarTarefasSupervisor() {
    try {
        await loadTasks();
        console.log('✅ Tarefas recarregadas no dashboard do supervisor');
    } catch (error) {
        console.error('❌ Erro ao recarregar tarefas no dashboard do supervisor:', error);
    }
}

// ✅ TORNAR FUNÇÃO GLOBAL
window.recarregarTarefasSupervisor = recarregarTarefasSupervisor;
// ====================== FUNÇÃO VOLTAR PARA LANDING PAGE ====================== //
function voltarParaLanding() {
    console.log('🏠 Voltando para a landing page...');
    window.location.href = 'landingpage.html';
}

// ✅ ADICIONE ESTAS FUNÇÕES AO dashboard_supervisor.js

// Função para carregar dados sincronizados do cuidador
async function carregarDadosSincronizados() {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');

        if (!usuarioId || !pacienteId) {
            console.log('❌ Dados insuficientes para sincronização');
            return;
        }

        console.log('🔄 Carregando dados sincronizados do cuidador...');

        // Carregar dados em paralelo
        const [atividadesData, sinaisVitaisData, dashboardData] = await Promise.all([
            fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/atividades-compartilhadas?periodo=7`).then(r => r.json()),
            fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/sinais-vitais-compartilhados?dias=7`).then(r => r.json()),
            fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/dashboard-tempo-real`).then(r => r.json())
        ]);

        // Atualizar interface com dados sincronizados
        atualizarDashboardSincronizado(atividadesData, sinaisVitaisData, dashboardData);

    } catch (error) {
        console.error('❌ Erro ao carregar dados sincronizados:', error);
    }
}

// Função para atualizar dashboard com dados sincronizados
function atualizarDashboardSincronizado(atividadesData, sinaisVitaisData, dashboardData) {
    console.log('🎯 Atualizando dashboard com dados sincronizados');

    // Atualizar atividades
    if (atividadesData && atividadesData.atividades) {
        exibirAtividadesSincronizadas(atividadesData);
    }

    // Atualizar sinais vitais
    if (sinaisVitaisData && sinaisVitaisData.dados) {
        atualizarSinaisVitaisSincronizados(sinaisVitaisData);
    }

    // Atualizar dashboard em tempo real
    if (dashboardData) {
        atualizarDashboardTempoReal(dashboardData);
    }
}

// Função para exibir atividades sincronizadas
function exibirAtividadesSincronizadas(atividadesData) {
    const container = document.getElementById('activityFeed');
    if (!container) return;

    const atividades = atividadesData.atividades;
    const estatisticas = atividadesData.estatisticas;

    if (!atividades || atividades.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-feather="clock"></i>
                <p>Nenhuma atividade registrada</p>
                <small class="text-muted">As atividades do cuidador aparecerão aqui</small>
            </div>
        `;
        if (window.feather) window.feather.replace();
        return;
    }

    // Atualizar estatísticas
    atualizarEstatisticasAtividades(estatisticas);

    // Exibir atividades
    container.innerHTML = atividades.map(atividade => {
        const descricao = atividade.descricao || 'Atividade sem descrição';
        const tipo = atividade.tipo || 'outro';
        const cuidador = atividade.cuidador_nome || 'Cuidador';

        // Formatar data
        let dataFormatada = 'Data não informada';
        if (atividade.data_prevista) {
            const data = new Date(atividade.data_prevista);
            dataFormatada = data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', {
                hour: '2-digit', minute: '2-digit'
            });
        }

        // Verificar se está atrasada
        const isAtrasada = atividade.status === 'pendente' && new Date(atividade.data_prevista) < new Date();
        const statusClass = isAtrasada ? 'bg-danger' : (atividade.status === 'concluida' ? 'bg-success' : 'bg-warning');
        const statusText = isAtrasada ? 'Atrasada' : (atividade.status === 'concluida' ? 'Concluída' : 'Pendente');

        return `
            <div class="activity-item ${isAtrasada ? 'atrasada' : ''}">
                <div class="activity-icon">
                    <i data-feather="${getTaskIcon(tipo)}"></i>
                </div>
                <div class="activity-info">
                    <h5>${descricao}</h5>
                    <div class="activity-meta">
                        <span><i data-feather="calendar"></i> ${dataFormatada}</span>
                        <span><i data-feather="user"></i> ${cuidador}</span>
                        <span><i data-feather="tag"></i> ${obterTextoTipo(tipo)}</span>
                    </div>
                    ${atividade.observacoes ? `<p class="activity-notes">${atividade.observacoes}</p>` : ''}
                </div>
                <span class="badge ${statusClass}">${statusText}</span>
            </div>
        `;
    }).join('');

    if (window.feather) window.feather.replace();
}

// Função para atualizar estatísticas de atividades
function atualizarEstatisticasAtividades(estatisticas) {
    const elementos = {
        'totalAtividades': estatisticas.total,
        'atividadesConcluidas': estatisticas.concluidas,
        'atividadesPendentes': estatisticas.pendentes,
        'atividadesAtrasadas': estatisticas.atrasadas
    };

    Object.keys(elementos).forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = elementos[id];
        }
    });

    // Atualizar percentual de conclusão
    const percentualElement = document.getElementById('percentualConclusao');
    if (percentualElement) {
        percentualElement.textContent = `${estatisticas.percentualConclusao}%`;
    }
}

// Função para atualizar sinais vitais sincronizados
function atualizarSinaisVitaisSincronizados(sinaisData) {
    console.log('💓 Atualizando sinais vitais sincronizados');

    const estatisticas = sinaisData.estatisticas;

    // Atualizar cards de sinais vitais
    if (estatisticas.pressao_arterial) {
        document.getElementById('pressaoMedia').textContent =
            `${estatisticas.pressao_arterial.mediaSistolica}/${estatisticas.pressao_arterial.mediaDiastolica}`;
    }

    if (estatisticas.glicemia) {
        document.getElementById('glicemiaMedia').textContent = estatisticas.glicemia.media;
        document.getElementById('glicemiaStatus').textContent = estatisticas.glicemia.classificacao;
    }

    if (estatisticas.temperatura) {
        document.getElementById('temperaturaMedia').textContent = estatisticas.temperatura.media + '°C';
    }

    if (estatisticas.batimentos) {
        document.getElementById('heartRate').textContent = estatisticas.batimentos.media;
    }

    // Atualizar último registro
    const ultimaAtualizacao = document.getElementById('ultimaAtualizacaoSinais');
    if (ultimaAtualizacao) {
        ultimaAtualizacao.textContent = `Última atualização: ${new Date().toLocaleTimeString('pt-BR')}`;
    }
}

// Correção para a função de atualização de sinais vitais
function atualizarDashboardTempoReal(dados) {
    try {
        console.log('📊 Atualizando dashboard tempo real com:', dados);

        // Glicemia
        const glicemiaElement = document.getElementById('vitalGlicemia');
        if (glicemiaElement && dados.glicemia !== undefined) {
            glicemiaElement.textContent = `${dados.glicemia} mg/dL`;
        }

        // Pressão Arterial
        const pressaoElement = document.getElementById('vitalPressaoArterial');
        if (pressaoElement && dados.pressao_arterial) {
            pressaoElement.textContent = dados.pressao_arterial;
        }

        // Temperatura
        const temperaturaElement = document.getElementById('vitalTemperatura');
        if (temperaturaElement && dados.temperatura !== undefined) {
            temperaturaElement.textContent = `${dados.temperatura}°C`;
        }

        // Adesão a Medicamentos
        const adesaoElement = document.getElementById('vitalAdesao');
        if (adesaoElement && dados.adesao_medicamentos !== undefined) {
            adesaoElement.textContent = `${dados.adesao_medicamentos}%`;
        }

    } catch (error) {
        console.error('❌ Erro ao atualizar dashboard tempo real:', error);
    }
}

// ✅ FUNÇÃO CORRIGIDA: Carregar dados adicionais
async function carregarDadosAdicionais(usuarioId, pacienteId) {
    try {
        console.log('🔄 Carregando dados adicionais...');
        
        // ✅ CORREÇÃO: Carregar sinais vitais PRIMEIRO e em paralelo
        await Promise.all([
            carregarSinaisVitais(usuarioId, pacienteId),  // ✅ AGORA ESTÁ SENDO CHAMADA
            carregarAtividades(usuarioId, pacienteId),
            carregarAlertas(usuarioId, pacienteId),
            carregarMedicamentos(usuarioId, pacienteId)
        ]);
        
        console.log('✅ Todos os dados adicionais carregados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao carregar dados adicionais:', error);
    }
}

// ✅ FUNÇÃO CORRIGIDA: Configurar atualização automática
function configurarAtualizacaoAutomatica() {
    console.log('⏰ Configurando atualização automática...');
    
    // ✅ CORREÇÃO: Primeira sincronização após 2 segundos
    setTimeout(() => {
        console.log('🔄 Primeira sincronização automática...');
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        if (usuarioId && pacienteId) {
            carregarSinaisVitais(usuarioId, pacienteId);
        }
    }, 2000);
    
    // ✅ CORREÇÃO: Sincronizar a cada 30 segundos
    setInterval(() => {
        console.log('🔄 Sincronização automática periódica...');
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        if (usuarioId && pacienteId) {
            carregarSinaisVitais(usuarioId, pacienteId);
        }
    }, 30000);

    // ✅ CORREÇÃO: Sincronizar quando a página ganha foco
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            console.log('📱 Página visível, sincronizando dados...');
            setTimeout(() => {
                const usuarioId = localStorage.getItem('usuarioId');
                const pacienteId = localStorage.getItem('pacienteSelecionadoId');
                if (usuarioId && pacienteId) {
                    carregarSinaisVitais(usuarioId, pacienteId);
                }
            }, 1000);
        }
    });

    console.log('✅ Sincronização automática configurada (30 segundos)');
}

// ✅ FUNÇÃO PARA VERIFICAR CARREGAMENTO INICIAL
function verificarCarregamentoInicial() {
    console.log('🔍 VERIFICANDO CARREGAMENTO INICIAL...');
    
    const usuarioId = localStorage.getItem('usuarioId');
    const pacienteId = localStorage.getItem('pacienteSelecionadoId');
    
    console.log('👤 Usuário ID:', usuarioId);
    console.log('🎯 Paciente ID:', pacienteId);
    console.log('📊 currentPatient:', currentPatient);
    
    if (usuarioId && pacienteId) {
        console.log('✅ Dados disponíveis, carregando sinais vitais...');
        carregarSinaisVitais(usuarioId, pacienteId);
    } else {
        console.log('❌ Dados insuficientes para carregar sinais vitais');
    }
}

// ✅ TORNAR DISPONÍVEL NO CONSOLE
window.verificarCarregamento = verificarCarregamentoInicial;



// Função para sincronizar atividades concluídas
async function sincronizarAtividadesConcluidas() {
    try {
        const pacienteId = localStorage.getItem('selectedPatientId') || sessionStorage.getItem('selectedPatientId');

        if (!pacienteId) {
            console.log('❌ Nenhum paciente selecionado');
            return;
        }

        const response = await fetch(`/api/atividades/concluidas/${pacienteId}`);
        const atividadesConcluidas = await response.json();

        // Remover atividades concluídas da visualização
        atividadesConcluidas.forEach(atividadeId => {
            const elemento = document.querySelector(`[data-activity-id="${atividadeId}"]`);
            if (elemento) {
                elemento.remove();
            }
        });

    } catch (error) {
        console.error('❌ Erro ao sincronizar atividades concluídas:', error);
    }
}

// Executar sincronização a cada 30 segundos
setInterval(sincronizarAtividadesConcluidas, 30000);

// ===== SINCronIZAÇÃO EM TEMPO REAL - PARA SUPERVISOR/FAMILIAR =====

// Função para sincronização em tempo real
async function sincronizarDadosTempoReal() {
    try {
        const pacienteId = localStorage.getItem('selectedPatientId') || sessionStorage.getItem('selectedPatientId');

        if (!pacienteId) {
            console.log('🔄 Aguardando seleção de paciente...');
            return;
        }

        console.log('🔄 Sincronizando dados do paciente:', pacienteId);

        const response = await fetch(`/api/sincronizar/${pacienteId}`);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const dadosSincronizados = await response.json();
        console.log('✅ Dados sincronizados:', dadosSincronizados);

        // Atualizar sinais vitais
        if (dadosSincronizados.sinais_vitais) {
            atualizarSinaisVitais(dadosSincronizados.sinais_vitais);
        }

        // Atualizar atividades
        if (dadosSincronizados.atividades) {
            atualizarAtividades(dadosSincronizados.atividades);
        }

        // Atualizar medicamentos
        if (dadosSincronizados.medicamentos) {
            atualizarMedicamentos(dadosSincronizados.medicamentos);
        }

        // Atualizar alertas
        if (dadosSincronizados.alertas) {
            atualizarAlertas(dadosSincronizados.alertas);
        }

    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
    }
}




// ✅ FUNÇÃO CORRIGIDA PARA A ESTRUTURA REAL DOS DADOS
function atualizarSinaisVitais(sinais) {
    console.log('📊 Atualizando sinais vitais na interface:', sinais);

    // ✅ CORREÇÃO: Verificar se há sinais
    if (!sinais || sinais.length === 0) {
        console.log('📋 Nenhum sinal vital disponível');
        return;
    }

    // ✅ CORREÇÃO: Ordenar por data (mais recente primeiro)
    const sinaisOrdenados = sinais.sort((a, b) => 
        new Date(b.data_registro) - new Date(a.data_registro)
    );

    console.log('📅 Sinais ordenados (mais recente primeiro):', sinaisOrdenados);

    // ✅ CORREÇÃO: Buscar por tipos específicos da sua base de dados
    const pressao = sinaisOrdenados.find(s => s.tipo === 'pressao_arterial');
    const glicemia = sinaisOrdenados.find(s => s.tipo === 'glicemia');
    const temperatura = sinaisOrdenados.find(s => s.tipo === 'temperatura');
    const batimentos = sinaisOrdenados.find(s => s.tipo === 'batimentos_cardiacos');

    console.log('🔍 Sinais encontrados:', { 
        pressao: pressao ? `${pressao.valor_principal}/${pressao.valor_secundario}` : 'não encontrado',
        glicemia: glicemia ? glicemia.valor_principal : 'não encontrado',
        temperatura: temperatura ? temperatura.valor_principal : 'não encontrado',
        batimentos: batimentos ? batimentos.valor_principal : 'não encontrado'
    });

    // ✅ CORREÇÃO: Atualizar pressão arterial (usa valor_principal e valor_secundario)
    if (pressao) {
        const valor = `${pressao.valor_principal}/${pressao.valor_secundario || '--'}`;
        const elementoValor = document.getElementById("pressaoMedia");
        const elementoStatus = document.getElementById("pressaoStatus");
        
        if (elementoValor) {
            elementoValor.textContent = valor;
            console.log('✅ Pressão atualizada:', valor);
        }
        if (elementoStatus) {
            const status = avaliarPressao(valor);
            elementoStatus.textContent = status;
            elementoStatus.className = `badge ${getStatusClass(status)}`;
            console.log('✅ Status pressão:', status);
        }
    }

    // ✅ CORREÇÃO: Atualizar glicemia
    if (glicemia) {
        const valor = glicemia.valor_principal;
        const elementoValor = document.getElementById("glicemiaMedia");
        const elementoStatus = document.getElementById("glicemiaStatus");
        
        if (elementoValor) {
            elementoValor.textContent = valor;
            console.log('✅ Glicemia atualizada:', valor);
        }
        if (elementoStatus) {
            const status = avaliarGlicemia(parseFloat(valor));
            elementoStatus.textContent = status;
            elementoStatus.className = `badge ${getStatusClass(status)}`;
            console.log('✅ Status glicemia:', status);
        }
    }

    // ✅ CORREÇÃO: Atualizar temperatura
    if (temperatura) {
        const valor = temperatura.valor_principal;
        const elementoValor = document.getElementById("temperaturaMedia");
        const elementoStatus = document.getElementById("temperaturaStatus");
        
        if (elementoValor) {
            elementoValor.textContent = valor + '°C';
            console.log('✅ Temperatura atualizada:', valor);
        }
        if (elementoStatus) {
            const status = avaliarTemperatura(parseFloat(valor));
            elementoStatus.textContent = status;
            elementoStatus.className = `badge ${getStatusClass(status)}`;
            console.log('✅ Status temperatura:', status);
        }
    }

    // ✅ CORREÇÃO: Atualizar batimentos cardíacos
    if (batimentos) {
        const valor = batimentos.valor_principal;
        const elementoValor = document.getElementById("heartRate");
        const elementoStatus = document.getElementById("hrStatus");
        
        if (elementoValor) {
            elementoValor.textContent = valor;
            console.log('✅ Batimentos atualizados:', valor);
        }
        if (elementoStatus) {
            const status = avaliarBatimentos(parseFloat(valor));
            elementoStatus.textContent = status;
            elementoStatus.className = `badge ${getStatusClass(status)}`;
            console.log('✅ Status batimentos:', status);
        }
    }

    // ✅ CORREÇÃO: Atualizar timestamp com o registro mais recente
    if (sinaisOrdenados.length > 0) {
        const ultimo = sinaisOrdenados[0];
        const data = new Date(ultimo.data_registro);
        const timestampElement = document.getElementById("ultimaAtualizacao");
        if (timestampElement) {
            timestampElement.textContent = `Última atualização: ${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR')}`;
            console.log('✅ Timestamp atualizado:', timestampElement.textContent);
        }
    }

    console.log('🎯 Atualização de sinais vitais concluída!');
}

function atualizarAtividades(atividades) {
    console.log('📋 Atualizando atividades:', atividades);

    const atividadesContainer = document.getElementById('atividadesContainer');
    if (!atividadesContainer) return;

    // Filtrar apenas atividades não concluídas
    const atividadesPendentes = atividades.filter(ativ => !ativ.concluida);

    if (atividadesPendentes.length === 0) {
        atividadesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>Nenhuma atividade pendente</p>
            </div>
        `;
        return;
    }

    // Atualizar a lista de atividades
    atividadesContainer.innerHTML = atividadesPendentes.map(atividade => `
        <div class="activity-card" data-activity-id="${atividade.id}">
            <div class="activity-content">
                <h4>${atividade.titulo}</h4>
                <p>${atividade.descricao}</p>
                <div class="activity-meta">
                    <span class="activity-time">
                        <i class="fas fa-clock"></i>
                        ${atividade.horario}
                    </span>
                    <span class="activity-status ${atividade.status}">
                        ${atividade.status === 'pendente' ? '🟡 Pendente' :
            atividade.status === 'atrasado' ? '🔴 Atrasado' : '🟢 Concluído'}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

function atualizarMedicamentos(medicamentos) {
    console.log('💊 Atualizando medicamentos:', medicamentos);
    // Implementar lógica de atualização de medicamentos
}

function atualizarAlertas(alertas) {
    console.log('🚨 Atualizando alertas:', alertas);
    // Implementar lógica de atualização de alertas
}

// ====================== SINCRONIZAÇÃO EM TEMPO REAL - SIMPLES ====================== //

// ✅ FUNÇÃO PARA ATUALIZAR SINAIS VITAIS NO SUPERVISOR
async function atualizarSinaisVitaisSupervisor() {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');

        if (!usuarioId || !pacienteId) {
            console.log('❌ Dados insuficientes para atualizar sinais vitais');
            return;
        }

        console.log('🔄 Atualizando sinais vitais no supervisor...');

        // Buscar sinais vitais recentes
        const response = await fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/sinais-vitais`);

        if (!response.ok) {
            throw new Error('Erro ao buscar sinais vitais');
        }

        const sinais = await response.json();
        console.log('✅ Sinais vitais recebidos no supervisor:', sinais);

        // Atualizar a interface
        atualizarSinaisVitais(sinais);

        // Atualizar timestamp
        const ultimaAtualizacao = document.getElementById('ultimaAtualizacao');
        if (ultimaAtualizacao) {
            ultimaAtualizacao.textContent = `Última atualização: ${new Date().toLocaleTimeString('pt-BR')}`;
        }

    } catch (error) {
        console.error('❌ Erro ao atualizar sinais vitais no supervisor:', error);
    }
}

// ✅ FUNÇÃO PARA ATUALIZAR ATIVIDADES NO SUPERVISOR
async function atualizarAtividadesSupervisor() {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');

        if (!usuarioId || !pacienteId) return;

        console.log('🔄 Atualizando atividades no supervisor...');

        const response = await fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/atividades`);

        if (response.ok) {
            const atividades = await response.json();
            console.log('✅ Atividades recebidas no supervisor:', atividades);
            exibirAtividades(atividades);
        }

    } catch (error) {
        console.error('❌ Erro ao atualizar atividades no supervisor:', error);
    }
}

// ✅ FUNÇÃO DE SINCRONIZAÇÃO SIMPLES
async function sincronizarDadosSupervisor() {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');

        if (!usuarioId || !pacienteId) return;

        console.log('🔄 Sincronizando dados...');
        await carregarSinaisVitais(usuarioId, pacienteId);
        
    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
    }
}


// ✅ FUNÇÃO PARA FORÇAR ATUALIZAÇÃO MANUAL (OPCIONAL)
window.forcarAtualizacao = function () {
    console.log('🔄 Forçando atualização manual...');
    sincronizarDadosSupervisor();
};

// ✅ FUNÇÕES DE DEBUG (OPCIONAL)
window.debugSinaisVitais = async function() {
    const usuarioId = localStorage.getItem('usuarioId');
    const pacienteId = localStorage.getItem('pacienteSelecionadoId');
    console.log('🐛 DEBUG - Testando sinais vitais...');
    await carregarSinaisVitais(usuarioId, pacienteId);
};

window.forcarAtualizacao = function() {
    console.log('🔄 Forçando atualização manual...');
    sincronizarDadosSupervisor();
};