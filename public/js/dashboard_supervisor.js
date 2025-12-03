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

// ✅ ATUALIZE A FUNÇÃO DE INICIALIZAÇÃO
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

    // ✅ ADICIONAR ESTILOS DOS ALERTAS
    adicionarEstilosAlertasDashboard();

    // Inicializar header
    inicializarHeader();

    // ✅ CARREGAR DADOS DO DEPENDENTE
    carregarDadosDependente().then(() => {
        console.log('✅ Dados do dependente carregados');
        
        // Configurar eventos
        configurarEventos();
        
        // Configurar sincronização automática
        configurarAtualizacaoAutomatica();
        
        console.log('🎯 Dashboard supervisor inicializado!');
        
        // ✅ FORÇAR CARREGAMENTO DE ALERTAS APÓS 1 SEGUNDO
        setTimeout(() => {
            console.log('🔄 Forçando carregamento de alertas...');
            const usuarioId = localStorage.getItem('usuarioId');
            const pacienteId = localStorage.getItem('pacienteSelecionadoId');
            
            if (usuarioId && pacienteId) {
                carregarAlertasDashboard();
            }
        }, 1000);
        
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
// ✅ FUNÇÕES DE CLASSIFICAÇÃO DE SINAIS VITAIS (IGUAIS AO CUIDADOR)
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
// Adicione esta função se não existir
function getStatusClass(status) {
    const statusMap = {
        "Normal": "bg-success",
        "Baixo": "bg-warning",
        "Alto": "bg-danger",
        "Baixa": "bg-warning",
        "Alta": "bg-danger",
        "Ótima": "bg-success",
        "Limítrofe": "bg-warning",
        "Muito Alta": "bg-danger",
        "Muito Baixa": "bg-danger",
        "Crítica": "bg-danger",
        "Febril": "bg-warning",
        "Febre Alta": "bg-danger",
        "Alterada": "bg-warning"
    };
    return statusMap[status] || "bg-secondary";
}

// E a função de avaliação de batimentos:
function avaliarBatimentos(valor) {
    if (!valor || isNaN(valor)) return "Normal";
    
    const bpm = Number(valor);
    if (bpm < 60) return "Baixo";
    if (bpm <= 100) return "Normal";
    return "Alto";
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

// ✅ FUNÇÃO ATUALIZADA: Inclui batimentos cardíacos
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

    // ✅ ATUALIZADO: Batimentos Cardíacos (agora em vez de heartRate, usa vitalBatimentos)
    if (estatisticas.batimentos) {
        const elementoBatimentos = document.getElementById('vitalBatimentos');
        const elementoBatimentosStatus = document.getElementById('vitalBatimentosStatus');
        
        if (elementoBatimentos) {
            elementoBatimentos.textContent = estatisticas.batimentos.media + ' bpm';
        }
        if (elementoBatimentosStatus && estatisticas.batimentos.classificacao) {
            elementoBatimentosStatus.textContent = estatisticas.batimentos.classificacao;
        }
    }

    // Atualizar último registro
    const ultimaAtualizacao = document.getElementById('ultimaAtualizacaoSinais');
    if (ultimaAtualizacao) {
        ultimaAtualizacao.textContent = `Última atualização: ${new Date().toLocaleTimeString('pt-BR')}`;
    }
}

// ✅ FUNÇÃO ATUALIZADA: Substitui adesão por batimentos
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

        // ✅ REMOVIDO: Adesão a Medicamentos
        // ✅ ADICIONADO: Batimentos Cardíacos
        const batimentosElement = document.getElementById('vitalBatimentos');
        const batimentosStatusElement = document.getElementById('vitalBatimentosStatus');
        
        if (batimentosElement && dados.batimentos !== undefined) {
            batimentosElement.textContent = `${dados.batimentos} bpm`;
            
            // Classificar os batimentos
            if (batimentosStatusElement) {
                const status = avaliarBatimentos(dados.batimentos);
                batimentosStatusElement.textContent = status;
                batimentosStatusElement.className = `badge ${getStatusClass(status)}`;
            }
        } else if (batimentosElement) {
            // Tentar obter dos dados de sinais vitais
            const usuarioId = localStorage.getItem('usuarioId');
            const pacienteId = localStorage.getItem('pacienteSelecionadoId');
            if (usuarioId && pacienteId) {
                carregarBatimentosCardiacos(usuarioId, pacienteId);
            }
        }

    } catch (error) {
        console.error('❌ Erro ao atualizar dashboard tempo real:', error);
    }
}

// ✅ NOVA FUNÇÃO PARA CARREGAR BATIMENTOS ESPECÍFICOS
async function carregarBatimentosCardiacos(usuarioId, pacienteId) {
    try {
        const response = await fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/sinais-vitais`);
        
        if (response.ok) {
            const sinais = await response.json();
            const batimentos = sinais.find(s => s.tipo === 'batimentos_cardiacos');
            
            if (batimentos) {
                const valor = batimentos.valor_principal;
                const elementoValor = document.getElementById('vitalBatimentos');
                const elementoStatus = document.getElementById('vitalBatimentosStatus');
                
                if (elementoValor) {
                    elementoValor.textContent = `${valor} bpm`;
                }
                if (elementoStatus) {
                    const status = avaliarBatimentos(parseFloat(valor));
                    elementoStatus.textContent = status;
                    elementoStatus.className = `badge ${getStatusClass(status)}`;
                }
            }
        }
    } catch (error) {
        console.error('❌ Erro ao carregar batimentos cardíacos:', error);
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





// ✅ FUNÇÕES DE CLASSIFICAÇÃO DE SINAIS VITAIS (IGUAIS AO CUIDADOR)
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

// ✅ FUNÇÃO PRINCIPAL CORRIGIDA - SUBSTITUA APENAS ESTA
function atualizarSinaisVitais(sinais) {
    console.log('📊 Atualizando sinais vitais na interface:', sinais);

    if (!sinais || sinais.length === 0) {
        console.log('📋 Nenhum sinal vital disponível');
        return;
    }

    // Ordenar por data (mais recente primeiro)
    const sinaisOrdenados = sinais.sort((a, b) => 
        new Date(b.data_registro) - new Date(a.data_registro)
    );

    // Buscar por tipos específicos
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

    // Atualizar pressão arterial
    if (pressao) {
        const valor = `${pressao.valor_principal}/${pressao.valor_secundario || '--'}`;
        const elementoValor = document.getElementById("pressaoMedia");
        const elementoStatus = document.getElementById("pressaoStatus");
        
        if (elementoValor) {
            elementoValor.textContent = valor;
        }
        if (elementoStatus) {
            const status = avaliarPressao(valor);
            elementoStatus.textContent = status;
            elementoStatus.className = `badge ${getStatusClass(status)}`;
        }
    }

    // Atualizar glicemia
    if (glicemia) {
        const valor = glicemia.valor_principal;
        const elementoValor = document.getElementById("glicemiaMedia");
        const elementoStatus = document.getElementById("glicemiaStatus");
        
        if (elementoValor) {
            elementoValor.textContent = valor;
        }
        if (elementoStatus) {
            const status = avaliarGlicemia(parseFloat(valor));
            elementoStatus.textContent = status;
            elementoStatus.className = `badge ${getStatusClass(status)}`;
        }
    }

    // Atualizar temperatura
    if (temperatura) {
        const valor = temperatura.valor_principal;
        const elementoValor = document.getElementById("temperaturaMedia");
        const elementoStatus = document.getElementById("temperaturaStatus");
        
        if (elementoValor) {
            elementoValor.textContent = valor + '°C';
        }
        if (elementoStatus) {
            const status = avaliarTemperatura(parseFloat(valor));
            elementoStatus.textContent = status;
            elementoStatus.className = `badge ${getStatusClass(status)}`;
        }
    }

    // Atualizar batimentos cardíacos
    if (batimentos) {
        const valor = batimentos.valor_principal;
        const elementoValor = document.getElementById("heartRate");
        const elementoStatus = document.getElementById("hrStatus");
        
        if (elementoValor) {
            elementoValor.textContent = valor;
        }
        if (elementoStatus) {
            const status = avaliarBatimentos(parseFloat(valor));
            elementoStatus.textContent = status;
            elementoStatus.className = `badge ${getStatusClass(status)}`;
        }
    }

    // Atualizar timestamp
    if (sinaisOrdenados.length > 0) {
        const ultimo = sinaisOrdenados[0];
        const data = new Date(ultimo.data_registro);
        const timestampElement = document.getElementById("ultimaAtualizacao");
        if (timestampElement) {
            timestampElement.textContent = `Última atualização: ${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR')}`;
        }
    }

    console.log('✅ Sinais vitais classificados e exibidos!');
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

function atualizarCardBatimentos(batimentosData) {
    const valorElement = document.getElementById('batimentosValor');
    const statusElement = document.getElementById('batimentosStatus');
    
    if (!valorElement || !statusElement) return;
    
    if (batimentosData && batimentosData.valor) {
        // Formatar o valor (adicionar "bpm" se não tiver)
        let valor = batimentosData.valor;
        if (!valor.toString().includes('bpm')) {
            valor = `${valor} bpm`;
        }
        
        valorElement.textContent = valor;
        
        // Classificar os batimentos
        const status = avaliarBatimentos(parseFloat(batimentosData.valor));
        statusElement.textContent = status;
        
        // Aplicar classe CSS correta
        statusElement.className = 'vital-status';
        statusElement.classList.add(getStatusClass(status).replace('bg-', 'status-'));
    } else {
        valorElement.textContent = '--';
        statusElement.textContent = 'Normal';
        statusElement.className = 'vital-status';
    }
}

// Adicione esta função ao seu carregamento de dados
function carregarDadosBatimentos() {
    const usuarioId = localStorage.getItem('usuarioId');
    const pacienteId = localStorage.getItem('pacienteSelecionadoId');
    
    if (!usuarioId || !pacienteId) return;
    
    // Buscar sinais vitais
    fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/sinais-vitais`)
        .then(response => response.json())
        .then(sinais => {
            const batimentos = sinais.find(s => 
                s.tipo === 'batimentos_cardiacos' || 
                s.tipo === 'batimentos' ||
                s.tipo?.toLowerCase().includes('batimento')
            );
            
            if (batimentos) {
                atualizarCardBatimentos({
                    valor: batimentos.valor_principal || batimentos.valor
                });
            }
        })
        .catch(error => {
            console.error('Erro ao carregar batimentos:', error);
        });
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

// ✅ VERSÃO SIMPLES E EFETIVA - Sem API, só localStorage
async function carregarAlertasDashboard() {
    console.log('🚨 CARREGANDO ALERTAS (VERSÃO SIMPLES)');
    
    try {
        // 1. Verificar se temos dados no localStorage
        const chaveAlertas = 'vitalplus_alertas_db';
        const dadosAlertas = localStorage.getItem(chaveAlertas);
        
        if (!dadosAlertas) {
            console.log('📦 Nenhum alerta no localStorage');
            exibirAlertasDashboard([]);
            return [];
        }

        // 2. Parsear dados
        const db = JSON.parse(dadosAlertas);
        const todosAlertas = db.alertas || [];
        console.log(`📊 ${todosAlertas.length} alertas no banco`);
        
        // 3. Filtrar alertas ativos
        const alertasAtivos = todosAlertas.filter(alerta => {
            const status = alerta.status?.toLowerCase();
            return status !== 'resolvido' && status !== 'finalizado' && status !== 'encerrado';
        });
        
        console.log(`🚨 ${alertasAtivos.length} alertas ativos`);
        
        // 4. Exibir
        exibirAlertasDashboard(alertasAtivos);
        return alertasAtivos;
        
    } catch (error) {
        console.error('❌ Erro:', error);
        exibirAlertasDashboard([]);
        return [];
    }
}

// ✅ FUNÇÃO CORRIGIDA PARA BUSCAR ALERTAS DO LOCALSTORAGE
async function buscarAlertasLocalStorage(usuarioId, pacienteId) {
    try {
        console.log('🔍 BUSCANDO ALERTAS NO LOCALSTORAGE...');
        console.log('👤 Usuário ID:', usuarioId);
        console.log('🎯 Paciente ID:', pacienteId);
        
        // Chave usada pelo sistema de alertas
        const chaveAlertas = 'vitalplus_alertas_db';
        const dadosAlertas = localStorage.getItem(chaveAlertas);
        
        if (!dadosAlertas) {
            console.log('📦 Nenhum dado encontrado no localStorage');
            return [];
        }

        const db = JSON.parse(dadosAlertas);
        const alertasTodos = db.alertas || [];
        console.log(`📊 Total de alertas no banco: ${alertasTodos.length}`);
        console.log('📋 Todos os alertas:', alertasTodos);

        // Filtrar alertas do supervisor atual para o paciente atual
        const alertasFiltrados = alertasTodos.filter(alerta => {
            console.log(`🔍 Analisando alerta ${alerta.id}:`, {
                criado_por_id: alerta.criado_por_id,
                supervisor_id: alerta.supervisor_id,
                paciente_id: alerta.paciente_id,
                status: alerta.status,
                usuarioId: usuarioId,
                pacienteId: pacienteId
            });

            // Verificar se o alerta é do supervisor atual (OU é compartilhado)
            const criadoPorSupervisor = alerta.criado_por_id == usuarioId || 
                                       alerta.supervisor_id == usuarioId ||
                                       alerta.criado_por_id === undefined ||  // Se não tem criador, é compartilhado
                                       alerta.supervisor_id === undefined;   // Se não tem supervisor, é compartilhado
            
            // Verificar se o alerta é do paciente atual ou é geral
            const doPacienteAtual = alerta.paciente_id == pacienteId || 
                                   alerta.paciente_id === null || 
                                   alerta.paciente_id === undefined ||
                                   alerta.paciente_id === 0;
            
            // Manter apenas alertas ativos (não resolvidos)
            const status = alerta.status?.toLowerCase();
            const estaAtivo = status !== 'resolvido' && 
                             status !== 'finalizado' &&
                             status !== 'encerrado' &&
                             status !== 'concluido';
            
            const deveMostrar = criadoPorSupervisor && doPacienteAtual && estaAtivo;
            
            if (deveMostrar) {
                console.log(`✅ Alerta ${alerta.id} ACEITO:`, {
                    titulo: alerta.titulo,
                    paciente: alerta.paciente_id,
                    status: alerta.status
                });
            } else {
                console.log(`❌ Alerta ${alerta.id} REJEITADO:`, {
                    motivo: !criadoPorSupervisor ? 'Não é do supervisor' : 
                            !doPacienteAtual ? 'Não é do paciente' : 
                            !estaAtivo ? 'Não está ativo' : 'Outro motivo',
                    criadoPorSupervisor,
                    doPacienteAtual,
                    estaAtivo
                });
            }
            
            return deveMostrar;
        });

        console.log(`📈 RESULTADO: ${alertasFiltrados.length} alertas filtrados de ${alertasTodos.length}`);
        console.log('📋 Alertas filtrados:', alertasFiltrados);
        
        return alertasFiltrados;

    } catch (error) {
        console.error('❌ Erro ao buscar alertas do localStorage:', error);
        return [];
    }
}

// ✅ FUNÇÃO PARA EXIBIR ALERTAS NO DASHBOARD
// ✅ FUNÇÃO CORRIGIDA PARA EXIBIR ALERTAS NO DASHBOARD
// ✅ FUNÇÃO PRINCIPAL PARA EXIBIR ALERTAS NO DASHBOARD
function exibirAlertasDashboard(alertas) {
    console.log('🎨 EXIBIR ALERTAS - Iniciando...');
    
    // Encontrar o container de alertas
    let container = document.getElementById('alertsList');
    
    if (!container) {
        console.error('❌ Container #alertsList não encontrado!');
        
        // Tentar encontrar alternativas
        container = document.querySelector('.alerts-list') || 
                   document.querySelector('[data-alerts]') ||
                   document.querySelector('.status-card.alerts-card .card-body');
        
        if (container) {
            console.log('✅ Container alternativo encontrado:', container);
        } else {
            console.error('❌ Nenhum container de alertas encontrado no DOM');
            
            // Criar container de emergência
            const alertsCard = document.querySelector('.alerts-card');
            if (alertsCard) {
                const newContainer = document.createElement('div');
                newContainer.id = 'alertsList';
                newContainer.className = 'alerts-list';
                alertsCard.appendChild(newContainer);
                container = newContainer;
                console.log('🛠️ Container de alertas criado dinamicamente');
            } else {
                return;
            }
        }
    }

    console.log(`📋 Alertas recebidos para exibição:`, alertas);
    console.log(`📊 Total de alertas: ${alertas ? alertas.length : 0}`);

    // Garantir que alertas seja um array
    if (!Array.isArray(alertas)) {
        console.error('❌ Alertas não é um array:', typeof alertas, alertas);
        alertas = [];
    }

    // Filtrar apenas alertas ativos
    const alertasAtivos = alertas.filter(alerta => {
        const status = alerta.status?.toLowerCase();
        return status !== 'resolvido' && status !== 'finalizado' && status !== 'encerrado';
    });

    console.log(`🚨 Alertas ativos: ${alertasAtivos.length}`);

    if (alertasAtivos.length === 0) {
        container.innerHTML = `
            <div class="alert alert-success text-center mb-0" style="border: none; background: transparent;">
                <div class="empty-state">
                    <i class="fas fa-bell-slash text-success" style="font-size: 2rem;"></i>
                    <p class="mt-2 mb-1 fw-semibold">Nenhum alerta ativo</p>
                    <small class="text-muted">Todos os indicadores estão normais</small>
                </div>
            </div>
        `;
        console.log('✅ Nenhum alerta ativo - interface atualizada');
        return;
    }

    // Ordenar alertas: críticos primeiro, depois por data
    const alertasOrdenados = alertasAtivos.sort((a, b) => {
        // Ordem de severidade: crítica > alta > média > baixa
        const severidades = { 'critica': 0, 'alta': 1, 'media': 2, 'baixa': 3 };
        const severidadeA = severidades[a.severidade] || 4;
        const severidadeB = severidades[b.severidade] || 4;
        
        if (severidadeA !== severidadeB) {
            return severidadeA - severidadeB;
        }
        
        // Ordenar por data (mais recente primeiro)
        const dataA = new Date(a.data_criacao || a.created_at || Date.now());
        const dataB = new Date(b.data_criacao || b.created_at || Date.now());
        return dataB - dataA;
    }).slice(0, 3); // Mostrar no máximo 3 alertas no dashboard

    console.log('📊 Alertas ordenados para exibição:', alertasOrdenados);

    // Gerar HTML dos alertas
    container.innerHTML = alertasOrdenados.map(alerta => {
        const severidade = alerta.severidade?.toLowerCase() || 'media';
        const tipo = alerta.tipo || 'outros';
        const pacienteNome = alerta.paciente_nome || currentPatient?.nome || 'Paciente';
        const dataFormatada = formatarDataRelativa(alerta.data_criacao || alerta.created_at);
        const { icon, color } = getAlertIcon(severidade);
        const badgeClass = getBadgeClass(severidade);

        return `
            <div class="alert-item alert-item-${severidade} animate__animated animate__fadeIn">
                <div class="alert-item-content">
                    <div class="alert-item-header">
                        <div class="alert-icon">
                            <i class="${icon}"></i>
                        </div>
                        <div class="alert-title">
                            <strong>${alerta.titulo || 'Alerta sem título'}</strong>
                            <span class="alert-badge ${badgeClass}">${formatarSeveridade(severidade)}</span>
                        </div>
                    </div>
                    <div class="alert-body">
                        <p class="alert-description mb-2">${alerta.descricao || 'Sem descrição detalhada'}</p>
                        <div class="alert-meta">
                            <span class="meta-item">
                                <i class="fas fa-user"></i>
                                ${pacienteNome}
                            </span>
                            <span class="meta-item">
                                <i class="fas fa-clock"></i>
                                ${dataFormatada}
                            </span>
                            <span class="meta-item">
                                <i class="fas fa-tag"></i>
                                ${formatarTipo(tipo)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Adicionar link para ver todos se houver mais alertas
    if (alertasAtivos.length > 3) {
        container.innerHTML += `
            <div class="text-center mt-3">
                <a href="alertas_supervisor.html" class="btn btn-sm btn-outline-primary btn-see-all">
                    <i class="fas fa-external-link-alt me-1"></i>
                    Ver todos os ${alertasAtivos.length} alertas
                </a>
            </div>
        `;
    }

    // Adicionar animações
    container.querySelectorAll('.alert-item').forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
    });

    console.log(`✅ ${alertasOrdenados.length} alertas exibidos no dashboard`);
    
    // Atualizar badge de notificações
    atualizarBadgeNotificacoes(alertasAtivos.length);
}

function formatarSeveridade(severidade) {
    const textos = {
        'critica': 'Crítica',
        'alta': 'Alta',
        'media': 'Média',
        'baixa': 'Baixa'
    };
    return textos[severidade] || 'Média';
}

function formatarTipo(tipo) {
    const textos = {
        'medicamento': 'Medicamento',
        'consulta': 'Consulta',
        'exame': 'Exame',
        'observacao': 'Observação',
        'comportamento': 'Comportamento',
        'sintoma': 'Sintoma',
        'outros': 'Outros'
    };
    return textos[tipo] || tipo;
}

function formatarDataRelativa(dataString) {
    try {
        if (!dataString) return 'Data não disponível';
        
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return 'Data inválida';
        
        const agora = new Date();
        const diffMs = agora - data;
        const diffMinutos = Math.floor(diffMs / (1000 * 60));
        const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMinutos < 1) return 'Agora mesmo';
        if (diffMinutos < 60) return `Há ${diffMinutos} min`;
        if (diffHoras < 24) return `Há ${diffHoras} h`;
        if (diffDias === 1) return 'Ontem';
        if (diffDias < 7) return `Há ${diffDias} dias`;
        
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        });
    } catch (error) {
        console.error('❌ Erro ao formatar data:', error);
        return 'Data desconhecida';
    }
}


// ✅ FUNÇÃO PARA ATUALIZAR BADGE DE NOTIFICAÇÕES
function atualizarBadgeNotificacoes(count) {
    const badge = document.querySelector('.notification-badge');
    if (!badge) return;
    
    if (count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.style.display = 'flex';
        
        // Adicionar animação se houver alertas críticos
        if (count > 0) {
            badge.classList.add('urgent');
            badge.style.animation = 'pulse 2s infinite';
        }
    } else {
        badge.style.display = 'none';
        badge.classList.remove('urgent');
        badge.style.animation = '';
    }
}
// ✅ FUNÇÕES AUXILIARES PARA FORMATAÇÃO
function getAlertIcon(severidade) {
    const icones = {
        'critica': { icon: 'fas fa-exclamation-triangle', color: '#dc3545' },
        'alta': { icon: 'fas fa-exclamation-circle', color: '#fd7e14' },
        'media': { icon: 'fas fa-info-circle', color: '#ffc107' },
        'baixa': { icon: 'fas fa-info', color: '#0dcaf0' }
    };
    return icones[severidade] || icones['media'];
}


function getBadgeClass(severidade) {
    const classes = {
        'critica': 'badge-critical',
        'alta': 'badge-high',
        'media': 'badge-medium',
        'baixa': 'badge-low'
    };
    return classes[severidade] || 'badge-medium';
}

// ✅ FUNÇÕES AUXILIARES ADICIONAIS
function getAlertStyles(severidade) {
    const styles = {
        'critica': {
            icon: 'fas fa-exclamation-triangle',
            color: '#dc3545',
            bgColor: 'rgba(220, 53, 69, 0.05)'
        },
        'alta': {
            icon: 'fas fa-exclamation-circle',
            color: '#fd7e14',
            bgColor: 'rgba(253, 126, 20, 0.05)'
        },
        'media': {
            icon: 'fas fa-info-circle',
            color: '#ffc107',
            bgColor: 'rgba(255, 193, 7, 0.05)'
        },
        'baixa': {
            icon: 'fas fa-info',
            color: '#0dcaf0',
            bgColor: 'rgba(13, 202, 240, 0.05)'
        }
    };
    
    return styles[severidade] || styles['media'];
}

function getSeverityBadgeClass(severidade) {
    const classes = {
        'critica': 'bg-danger',
        'alta': 'bg-warning',
        'media': 'bg-info',
        'baixa': 'bg-secondary'
    };
    return classes[severidade] || 'bg-secondary';
}

function getSeverityText(severidade) {
    const textos = {
        'critica': 'Crítica',
        'alta': 'Alta',
        'media': 'Média',
        'baixa': 'Baixa'
    };
    return textos[severidade] || severidade;
}

function getTypeText(tipo) {
    const textos = {
        'medicamento': 'Medicamento',
        'consulta': 'Consulta',
        'exame': 'Exame',
        'observacao': 'Observação',
        'comportamento': 'Comportamento',
        'sintoma': 'Sintoma',
        'outros': 'Outros'
    };
    return textos[tipo] || tipo;
}

function formatarDataDashboard(dataString) {
    try {
        if (!dataString) return 'Data desconhecida';
        
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return 'Data inválida';
        
        const agora = new Date();
        const diffMs = agora - data;
        const diffMinutos = Math.floor(diffMs / (1000 * 60));
        const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMinutos < 1) return 'Agora mesmo';
        if (diffMinutos < 60) return `Há ${diffMinutos} min${diffMinutos !== 1 ? 's' : ''}`;
        if (diffHoras < 24) return `Há ${diffHoras} hora${diffHoras !== 1 ? 's' : ''}`;
        if (diffDias === 1) return 'Ontem';
        if (diffDias < 7) return `Há ${diffDias} dia${diffDias !== 1 ? 's' : ''}`;
        
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('❌ Erro ao formatar data:', error);
        return 'Data desconhecida';
    }
}

// ✅ FUNÇÃO PARA CRIAR CONTAINER DINÂMICO (se necessário)
function criarContainerAlertas() {
    console.log('🛠️ Criando container de alertas dinamicamente...');
    
    // Verificar se já existe um card onde podemos adicionar
    const cards = document.querySelectorAll('.card');
    let cardAlertas = null;
    
    // Procurar card de alertas existente
    cards.forEach(card => {
        const header = card.querySelector('.card-header');
        if (header && header.textContent.includes('Alerta')) {
            cardAlertas = card;
        }
    });
    
    // Se não encontrar, criar novo card
    if (!cardAlertas) {
        // Encontrar a grid ou container principal
        const grid = document.querySelector('.row, .grid, .dashboard-grid, [class*="col-"]').parentElement;
        
        if (grid) {
            const novoCardHTML = `
                <div class="col-lg-6">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-bell text-warning"></i> Alertas Recentes
                            </h3>
                            <a href="alertas_supervisor.html" class="btn btn-sm btn-outline-primary">
                                Ver Todos
                            </a>
                        </div>
                        <div class="card-body">
                            <div id="alertsList" class="alerts-list"></div>
                        </div>
                    </div>
                </div>
            `;
            
            // Inserir no início da grid
            grid.insertAdjacentHTML('afterbegin', novoCardHTML);
            console.log('✅ Card de alertas criado dinamicamente');
        }
    }
}

// ✅ FUNÇÃO PARA MARCAR ALERTA COMO LIDO
function marcarAlertaComoLido(alertaId) {
    console.log(`✅ Marcando alerta ${alertaId} como lido`);
    
    try {
        const chaveAlertas = 'vitalplus_alertas_db';
        const dadosAlertas = localStorage.getItem(chaveAlertas);
        
        if (dadosAlertas) {
            const db = JSON.parse(dadosAlertas);
            const alertaIndex = db.alertas.findIndex(a => a.id === alertaId);
            
            if (alertaIndex !== -1) {
                // Marcar como lido (não removemos, apenas atualizamos status)
                db.alertas[alertaIndex].status = 'resolvido';
                db.alertas[alertaIndex].data_resolucao = new Date().toISOString();
                
                localStorage.setItem(chaveAlertas, JSON.stringify(db));
                console.log(`✅ Alerta ${alertaId} marcado como resolvido`);
                
                // Recarregar alertas
                setTimeout(() => carregarAlertasDashboard(), 500);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao marcar alerta como lido:', error);
    }
}

// ✅ FUNÇÃO PARA TESTAR MANUALMENTE A EXIBIÇÃO DE ALERTAS
window.testarAlertasDashboard = async function() {
    console.log('🧪 TESTE: Forçando exibição de alertas...');
    
    // Carregar alertas do localStorage
    const usuarioId = localStorage.getItem('usuarioId');
    const pacienteId = localStorage.getItem('pacienteSelecionadoId');
    
    const alertas = await buscarAlertasLocalStorage(usuarioId, pacienteId);
    console.log('📊 Alertas carregados para teste:', alertas);
    
    // Exibir no dashboard
    exibirAlertasDashboard(alertas);
    
    // Verificar container
    const container = document.getElementById('alertsList');
    console.log('📦 Container encontrado:', !!container, container);
    
    if (container) {
        console.log('📋 Conteúdo do container:', container.innerHTML);
    }
};

// ✅ FUNÇÕES AUXILIARES PARA ALERTAS
function obterIconeAlertaDashboard(severidade) {
    const icones = {
        'critica': 'fas fa-exclamation-triangle',
        'alta': 'fas fa-exclamation-circle',
        'media': 'fas fa-info-circle',
        'baixa': 'fas fa-info'
    };
    return icones[severidade] || 'fas fa-bell';
}

function obterTextoSeveridadeDashboard(severidade) {
    const textos = {
        'critica': 'Crítica',
        'alta': 'Alta',
        'media': 'Média',
        'baixa': 'Baixa'
    };
    return textos[severidade] || severidade;
}

function obterTextoTipoDashboard(tipo) {
    const textos = {
        'medicamento': 'Medicamento',
        'consulta': 'Consulta',
        'exame': 'Exame',
        'observacao': 'Observação',
        'comportamento': 'Comportamento',
        'sintoma': 'Sintoma',
        'outros': 'Outros'
    };
    return textos[tipo] || tipo;
}

function formatarDataDashboard(dataString) {
    try {
        const data = new Date(dataString);
        const agora = new Date();
        const diffHoras = Math.floor((agora - data) / (1000 * 60 * 60));
        
        if (diffHoras < 24) {
            if (diffHoras < 1) {
                const diffMinutos = Math.floor((agora - data) / (1000 * 60));
                return `Há ${diffMinutos} min${diffMinutos !== 1 ? 's' : ''}`;
            }
            return `Há ${diffHoras} hora${diffHoras !== 1 ? 's' : ''}`;
        }
        
        return data.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Data inválida';
    }
}

// ✅ ATUALIZAR A FUNÇÃO carregarDadosAdicionais PARA INCLUIR ALERTAS
// ✅ ATUALIZE A FUNÇÃO carregarDadosAdicionais
async function carregarDadosAdicionais(usuarioId, pacienteId) {
    try {
        console.log('🔄 Carregando dados adicionais...');
        
        // ✅ ADICIONAR ALERTAS AO PARALELISMO
        await Promise.all([
            carregarSinaisVitais(usuarioId, pacienteId),
            carregarAtividades(usuarioId, pacienteId),
            carregarMedicamentos(usuarioId, pacienteId)
        ]);
        
        // ✅ CARREGAR ALERTAS SEPARADAMENTE PARA MELHOR DEBUG
        console.log('🚨 Carregando alertas...');
        const alertas = await carregarAlertasDashboard();
        console.log('✅ Alertas carregados:', alertas.length);
        
        console.log('✅ Todos os dados adicionais carregados!');
    } catch (error) {
        console.error('❌ Erro ao carregar dados adicionais:', error);
    }
}

// ✅ ADICIONE ESTE CSS DINAMICAMENTE
function adicionarEstilosAlertasDashboard() {
    const estilos = `
        <style>
            /* Estilos para alertas no dashboard */
            .alerts-list {
                padding: 1rem;
            }
            
            .alert-item {
                background: white;
                border-radius: 10px;
                margin-bottom: 1rem;
                border-left: 4px solid #3498db;
                box-shadow: 0 3px 10px rgba(0,0,0,0.08);
                overflow: hidden;
                transition: all 0.3s ease;
                animation-duration: 0.5s;
            }
            
            .alert-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            /* Severidade dos alertas */
            .alert-item-critical {
                border-left-color: #e74c3c;
                background: linear-gradient(to right, rgba(231, 76, 60, 0.03), white);
            }
            
            .alert-item-high {
                border-left-color: #e67e22;
                background: linear-gradient(to right, rgba(230, 126, 34, 0.03), white);
            }
            
            .alert-item-medium {
                border-left-color: #f39c12;
                background: linear-gradient(to right, rgba(243, 156, 18, 0.03), white);
            }
            
            .alert-item-low {
                border-left-color: #3498db;
                background: linear-gradient(to right, rgba(52, 152, 219, 0.03), white);
            }
            
            .alert-item-content {
                padding: 1rem;
            }
            
            .alert-item-header {
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                margin-bottom: 0.75rem;
            }
            
            .alert-icon {
                width: 36px;
                height: 36px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
                flex-shrink: 0;
            }
            
            .alert-item-critical .alert-icon {
                background: #e74c3c;
                color: white;
            }
            
            .alert-item-high .alert-icon {
                background: #e67e22;
                color: white;
            }
            
            .alert-item-medium .alert-icon {
                background: #f39c12;
                color: white;
            }
            
            .alert-item-low .alert-icon {
                background: #3498db;
                color: white;
            }
            
            .alert-title {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }
            
            .alert-title strong {
                font-size: 0.95rem;
                color: #2c3e50;
                line-height: 1.3;
            }
            
            .alert-badge {
                align-self: flex-start;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.7rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .badge-critical {
                background: #e74c3c;
                color: white;
            }
            
            .badge-high {
                background: #e67e22;
                color: white;
            }
            
            .badge-medium {
                background: #f39c12;
                color: white;
            }
            
            .badge-low {
                background: #3498db;
                color: white;
            }
            
            .alert-description {
                font-size: 0.85rem;
                color: #34495e;
                line-height: 1.4;
                margin: 0;
            }
            
            .alert-meta {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                margin-top: 0.75rem;
                padding-top: 0.75rem;
                border-top: 1px solid #ecf0f1;
                font-size: 0.75rem;
                color: #7f8c8d;
            }
            
            .meta-item {
                display: flex;
                align-items: center;
                gap: 0.25rem;
            }
            
            .meta-item i {
                font-size: 0.7rem;
            }
            
            .btn-see-all {
                font-size: 0.8rem;
                padding: 0.4rem 0.8rem;
            }
            
            /* Animação de pulso para badge urgente */
            .notification-badge.urgent {
                background: #e74c3c !important;
                animation: pulse 1.5s infinite;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            
            /* Animação para entrada dos alertas */
            .animate__fadeIn {
                animation-name: fadeIn;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            /* Estado vazio */
            .alerts-list .empty-state {
                text-align: center;
                padding: 2rem 1rem;
            }
            
            .alerts-list .empty-state i {
                font-size: 2.5rem;
                margin-bottom: 1rem;
                opacity: 0.3;
            }
            
            .alerts-list .empty-state p {
                font-size: 0.9rem;
                margin-bottom: 0.25rem;
            }
            
            .alerts-list .empty-state small {
                font-size: 0.8rem;
            }
        </style>
    `;
    
    // Adicionar estilos se não existirem
    if (!document.getElementById('estilos-alertas-dashboard')) {
        const styleElement = document.createElement('div');
        styleElement.id = 'estilos-alertas-dashboard';
        styleElement.innerHTML = estilos;
        document.head.appendChild(styleElement);
        console.log('✅ Estilos de alertas adicionados ao dashboard');
    }
}



// ✅ ATUALIZAR A FUNÇÃO configurarAtualizacaoAutomatica PARA INCLUIR ALERTAS
function configurarAtualizacaoAutomatica() {
    console.log('⏰ Configurando atualização automática...');
    
    // ✅ CORREÇÃO: Primeira sincronização após 2 segundos
    setTimeout(() => {
        console.log('🔄 Primeira sincronização automática...');
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        if (usuarioId && pacienteId) {
            carregarSinaisVitais(usuarioId, pacienteId);
            carregarAlertasDashboard(); // ✅ AGORA ATUALIZA ALERTAS TAMBÉM
        }
    }, 2000);
    
    // ✅ CORREÇÃO: Sincronizar a cada 30 segundos
    setInterval(() => {
        console.log('🔄 Sincronização automática periódica...');
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        if (usuarioId && pacienteId) {
            carregarSinaisVitais(usuarioId, pacienteId);
            carregarAlertasDashboard(); // ✅ AGORA ATUALIZA ALERTAS TAMBÉM
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
                    carregarAlertasDashboard(); // ✅ AGORA ATUALIZA ALERTAS TAMBÉM
                }
            }, 1000);
        }
    });

    console.log('✅ Sincronização automática configurada (30 segundos)');
}

// ✅ FUNÇÃO PARA TESTAR MANUALMENTE
window.testarAlertasDashboard = async function() {
    console.log('🧪 TESTE MANUAL: Carregando alertas...');
    
    const usuarioId = localStorage.getItem('usuarioId');
    const pacienteId = localStorage.getItem('pacienteSelecionadoId');
    
    console.log('📊 Dados atuais:', { usuarioId, pacienteId });
    
    // Verificar localStorage
    const dados = localStorage.getItem('vitalplus_alertas_db');
    if (dados) {
        const db = JSON.parse(dados);
        console.log('📦 Banco de alertas:', db);
        console.log(`📊 Total de alertas: ${db.alertas?.length || 0}`);
    }
    
    await carregarAlertasDashboard();
};

// ✅ FUNÇÃO PARA ATUALIZAR O BADGE DE NOTIFICAÇÕES COM ALERTAS
async function atualizarBadgeNotificacoes() {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        
        if (!usuarioId || !pacienteId) return;
        
        // Buscar alertas ativos
        const alertas = await buscarAlertasLocalStorage(usuarioId, pacienteId);
        const alertasAtivos = alertas.filter(alerta => alerta.status !== 'resolvido').length;
        
        // Atualizar badge
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            if (alertasAtivos > 0) {
                badge.textContent = alertasAtivos;
                badge.style.display = 'flex';
                
                // Adicionar animação para alertas críticos
                const temAlertasCriticos = alertas.some(alerta => 
                    alerta.status !== 'resolvido' && 
                    (alerta.severidade === 'critica' || alerta.severidade === 'alta')
                );
                
                if (temAlertasCriticos) {
                    badge.classList.add('urgente');
                    badge.style.animation = 'pulse 1s infinite';
                } else {
                    badge.classList.remove('urgente');
                    badge.style.animation = '';
                }
            } else {
                badge.textContent = '0';
                badge.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao atualizar badge:', error);
    }
}

// ✅ ADICIONAR ESTILOS PARA O BADGE
function adicionarEstilosBadge() {
    const estilosBadge = `
        <style>
            .notification-badge.urgente {
                background: #e74c3c !important;
                animation: pulse 1s infinite;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
        </style>
    `;
    
    if (!document.getElementById('estilos-badge')) {
        const styleElement = document.createElement('div');
        styleElement.id = 'estilos-badge';
        styleElement.innerHTML = estilosBadge;
        document.head.appendChild(styleElement);
    }
}

// ✅ ATUALIZAR A FUNÇÃO DE CLIQUE NO BOTÃO DE NOTIFICAÇÕES
function configurarBotaoNotificacoes() {
    const btnNotificacoes = document.querySelector('.btn-notifications');
    if (btnNotificacoes) {
        btnNotificacoes.addEventListener('click', function() {
            // Redirecionar para página de alertas
            window.location.href = 'alertas_supervisor.html';
        });
    }
}

// ✅ CHAMAR NA INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', function() {
    // ... código anterior ...
    
    // Adicionar estilos do badge
    adicionarEstilosBadge();
    
    // Configurar botão de notificações
    configurarBotaoNotificacoes();
    
    // Atualizar badge periodicamente
    setInterval(atualizarBadgeNotificacoes, 10000); // A cada 10 segundos

     // Carregar dados de batimentos
    setTimeout(() => {
        carregarDadosBatimentos();
    }, 1000);
    
    // Atualizar a cada 30 segundos
    setInterval(carregarDadosBatimentos, 30000);
});

// ✅ TORNAR FUNÇÃO DISPONÍVEL PARA TESTE
window.forcarAtualizacaoAlertas = function() {
    console.log('🔄 Forçando atualização de alertas...');
    carregarAlertasDashboard();
    atualizarBadgeNotificacoes();
};

console.log('✅ Sistema de alertas no dashboard configurado!');

// ✅ ADICIONE ESTAS LINHAS NO FINAL DO SEU ARQUIVO JS

// Depuração avançada
console.log('🔍 DEPURAÇÃO DE ALERTAS:');
console.log('1. Verificando localStorage...');
const chave = 'vitalplus_alertas_db';
const dados = localStorage.getItem(chave);
console.log('Chave existe?', !!dados);

if (dados) {
    const db = JSON.parse(dados);
    console.log('Total de alertas no banco:', db.alertas ? db.alertas.length : 0);
    console.log('Alertas atuais:', db.alertas);
}

// Forçar carregamento e exibição
setTimeout(() => {
    console.log('🔄 Forçando carregamento de alertas em 3 segundos...');
    window.testarAlertasDashboard();
}, 3000);

// Expor funções para teste no console
window.debugAlertas = {
    verLocalStorage: () => {
        const dados = localStorage.getItem('vitalplus_alertas_db');
        return dados ? JSON.parse(dados) : null;
    },
    limparAlertas: () => {
        localStorage.removeItem('vitalplus_alertas_db');
        console.log('🗑️ Alertas limpos do localStorage');
        location.reload();
    },
    criarAlertaTeste: () => {
        const db = JSON.parse(localStorage.getItem('vitalplus_alertas_db') || '{"alertas":[]}');
        const novoAlerta = {
            id: Date.now(),
            tipo: 'teste',
            titulo: 'Alerta de Teste',
            descricao: 'Este é um alerta de teste criado via console',
            severidade: 'alta',
            paciente_id: localStorage.getItem('pacienteSelecionadoId'),
            paciente_nome: 'Mikael',
            status: 'ativo',
            data_criacao: new Date().toISOString()
        };
        db.alertas.push(novoAlerta);
        localStorage.setItem('vitalplus_alertas_db', JSON.stringify(db));
        console.log('✅ Alerta de teste criado:', novoAlerta);
        carregarAlertasDashboard();
    }
};
// ✅ FUNÇÃO PARA CRIAR ALERTA COMPARTILHADO
async function criarAlertaCompartilhado(alertaData) {
    try {
        console.log('📝 Criando alerta compartilhado...');
        
        // Dados do usuário atual
        const usuarioId = localStorage.getItem('usuarioId');
        const usuarioTipo = localStorage.getItem('usuarioTipo');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        const pacienteNome = localStorage.getItem('pacienteNome') || 'Paciente';

        // Dados completos do alerta
        const alerta = {
            id: Date.now(), // ID único baseado em timestamp
            ...alertaData,
            status: 'ativo',
            paciente_id: pacienteId,
            paciente_nome: pacienteNome,
            criado_por_id: usuarioId,
            criado_por_tipo: usuarioTipo,
            criado_por_nome: localStorage.getItem('usuarioNome') || 'Familiar',
            data_criacao: new Date().toISOString(),
            data_atualizacao: new Date().toISOString(),
            
            // ✅ NOVO: Flag para indicar que é compartilhado
            compartilhado: true,
            visualizado_por_cuidador: false,
            visualizado_por_supervisor: true // Criador já viu
        };

        console.log('📋 Alerta criado:', alerta);

        // ✅ OPÇÃO 1: Salvar no localStorage (funciona offline)
        salvarAlertaNoLocalStorage(alerta);
        
        // ✅ OPÇÃO 2: Enviar para API (se tiver conexão)
        try {
            await enviarAlertaParaAPI(alerta);
        } catch (apiError) {
            console.log('⚠️ API offline, alerta salvo apenas localmente');
        }

        return alerta;
        
    } catch (error) {
        console.error('❌ Erro ao criar alerta:', error);
        throw error;
    }
}

// ✅ FUNÇÃO PARA SALVAR ALERTA NO LOCALSTORAGE (COMPARTILHADO)
function salvarAlertaNoLocalStorage(alerta) {
    try {
        console.log('💾 Salvando alerta no localStorage (compartilhado)...');
        
        const chave = 'vitalplus_alertas_compartilhados';
        let alertasExistentes = JSON.parse(localStorage.getItem(chave)) || [];
        
        // Adicionar novo alerta no início
        alertasExistentes.unshift(alerta);
        
        // Limitar a 100 alertas para não sobrecarregar
        if (alertasExistentes.length > 100) {
            alertasExistentes = alertasExistentes.slice(0, 100);
        }
        
        localStorage.setItem(chave, JSON.stringify(alertasExistentes));
        console.log(`✅ Alerta salvo. Total: ${alertasExistentes.length}`);
        
        return alertasExistentes;
        
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
        
        // Fallback: Usar a chave antiga
        const chaveAntiga = 'vitalplus_alertas_db';
        const dadosAntigos = JSON.parse(localStorage.getItem(chaveAntiga)) || { alertas: [] };
        dadosAntigos.alertas.push(alerta);
        localStorage.setItem(chaveAntiga, JSON.stringify(dadosAntigos));
        
        console.log('✅ Alerta salvo na chave antiga como fallback');
    }
}

// ✅ FUNÇÃO PARA ENVIAR ALERTA PARA API
async function enviarAlertaParaAPI(alerta) {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        
        const response = await fetch('/api/alertas/compartilhados', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...alerta,
                usuario_id: usuarioId,
                paciente_id: pacienteId
            })
        });
        
        if (response.ok) {
            const resultado = await response.json();
            console.log('✅ Alerta enviado para API:', resultado);
            return resultado;
        } else {
            throw new Error(`API retornou status ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Erro ao enviar para API:', error);
        throw error;
    }
}


// ✅ FUNÇÃO ATUALIZADA PARA EXIBIR ALERTAS NO DASHBOARD
function exibirAlertasDashboard(alertas) {
    console.log('🎨 EXIBIR ALERTAS - Iniciando...');
    
    let container = document.getElementById('alertsList');
    
    if (!container) {
        console.error('❌ Container #alertsList não encontrado!');
        return;
    }

    // Garantir que alertas seja um array
    if (!Array.isArray(alertas)) {
        alertas = [];
    }

    // Filtrar apenas alertas ativos
    const alertasAtivos = alertas.filter(alerta => {
        const status = alerta.status?.toLowerCase();
        return status !== 'resolvido' && status !== 'finalizado' && status !== 'encerrado';
    });

    console.log(`🚨 Alertas ativos: ${alertasAtivos.length}`);

    if (alertasAtivos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <p>Nenhum alerta ativo</p>
                <small>Todos os indicadores estão normais</small>
            </div>
        `;
        console.log('✅ Nenhum alerta ativo - interface atualizada');
        return;
    }

    // Ordenar alertas: críticos primeiro
    const alertasOrdenados = alertasAtivos.sort((a, b) => {
        const severidades = { 'critica': 0, 'alta': 1, 'media': 2, 'baixa': 3 };
        const severidadeA = severidades[a.severidade] || 4;
        const severidadeB = severidades[b.severidade] || 4;
        return severidadeA - severidadeB;
    });

    // Mostrar apenas 3 alertas no dashboard
    const alertasParaExibir = alertasOrdenados.slice(0, 3);
    
    // Gerar HTML dos alertas
    const alertasHTML = alertasParaExibir.map(alerta => {
        const severidade = alerta.severidade?.toLowerCase() || 'media';
        const tipo = alerta.tipo || 'outros';
        const pacienteNome = alerta.paciente_nome || currentPatient?.nome || 'Paciente';
        const dataFormatada = formatarDataRelativa(alerta.data_criacao || alerta.created_at);
        
        return `
            <div class="alert-item ${severidade}">
                <div class="alert-icon">
                    <i class="${obterIconeAlertaDashboard(severidade)}"></i>
                </div>
                <div class="alert-item-content">
                    <div class="alert-item-header">
                        <div class="alert-title">
                            <strong>${alerta.titulo || 'Alerta sem título'}</strong>
                            <span class="alert-badge">${formatarSeveridade(severidade)}</span>
                        </div>
                    </div>
                    <div class="alert-body">
                        <p class="alert-description">${alerta.descricao || 'Sem descrição detalhada'}</p>
                        <div class="alert-meta">
                            <span>
                                <i class="fas fa-user"></i>
                                ${pacienteNome}
                            </span>
                            <span>
                                <i class="fas fa-clock"></i>
                                ${dataFormatada}
                            </span>
                            <span>
                                <i class="fas fa-tag"></i>
                                ${formatarTipo(tipo)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Limpar container e adicionar alertas
    container.innerHTML = alertasHTML;

    // Adicionar link para ver todos se houver mais de 3 alertas
    if (alertasAtivos.length > 3) {
        const verTodosBtn = document.createElement('div');
        verTodosBtn.innerHTML = `
            <button class="btn-see-all" onclick="window.location.href='alertas_supervisor.html'">
                <i class="fas fa-external-link-alt"></i>
                Ver todos os ${alertasAtivos.length} alertas
            </button>
        `;
        container.appendChild(verTodosBtn);
    }

    console.log(`✅ ${alertasParaExibir.length} alertas exibidos no dashboard`);
}

// ✅ FUNÇÃO AUXILIAR PARA FORMATAR SEVERIDADE
function formatarSeveridade(severidade) {
    const textos = {
        'critica': 'Crítica',
        'alta': 'Alta',
        'media': 'Média',
        'baixa': 'Baixa'
    };
    return textos[severidade] || 'Média';
}

// ✅ FUNÇÃO AUXILIAR PARA FORMATAR TIPO
function formatarTipo(tipo) {
    const textos = {
        'medicamento': 'Medicamento',
        'consulta': 'Consulta',
        'exame': 'Exame',
        'observacao': 'Observação',
        'comportamento': 'Comportamento',
        'sintoma': 'Sintoma',
        'outros': 'Outros'
    };
    return textos[tipo] || tipo;
}

// ✅ FUNÇÃO AUXILIAR PARA OBTER ÍCONE
function obterIconeAlertaDashboard(severidade) {
    const icones = {
        'critica': 'fas fa-exclamation-triangle',
        'alta': 'fas fa-exclamation-circle',
        'media': 'fas fa-info-circle',
        'baixa': 'fas fa-info'
    };
    return icones[severidade] || 'fas fa-bell';
}