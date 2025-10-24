// alertas_familiar.js - SISTEMA DE ALERTAS PARA FAMILIAR CUIDADOR

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚨 Inicializando alertas familiar...');
    
    carregarDadosPaciente();
    carregarAlertas();
    configurarEventosAlertas();
});

function carregarDadosPaciente() {
    const paciente = JSON.parse(localStorage.getItem('dependenteSelecionado') || '{}');
    const userNameElement = document.getElementById('userName');
    const patientNameElement = document.getElementById('patientName');
    
    if (userNameElement) {
        userNameElement.textContent = localStorage.getItem('usuarioNome') || 'Usuário';
    }
    
    if (patientNameElement && paciente.nome) {
        patientNameElement.textContent = paciente.nome;
    }
}

async function carregarAlertas() {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        
        if (!usuarioId || !pacienteId) {
            console.error('IDs não encontrados');
            exibirAlertas(generateMockAlertas());
            return;
        }

        const response = await fetch(`/api/familiares-cuidadores/${usuarioId}/pacientes/${pacienteId}/alertas`);
        
        if (response.ok) {
            const alertas = await response.json();
            exibirAlertas(alertas);
        } else {
            exibirAlertas(generateMockAlertas());
        }
    } catch (error) {
        console.error('Erro ao carregar alertas:', error);
        exibirAlertas(generateMockAlertas());
    }
}

function exibirAlertas(alertas) {
    const container = document.getElementById('alertsList');
    if (!container) return;
    
    if (!alertas || alertas.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 3rem;">
                <i class="fas fa-bell-slash"></i>
                <p>Nenhum alerta encontrado</p>
                <small>Todos os alertas estão resolvidos ou não há alertas ativos.</small>
            </div>
        `;
        return;
    }

    container.innerHTML = alertas.map(alerta => `
        <div class="alert-item ${alerta.severidade} ${alerta.lido ? '' : 'unread'}">
            <div class="alert-icon">
                <i class="fas ${obterIconeAlerta(alerta.severidade)}"></i>
            </div>
            <div class="alert-content">
                <div class="alert-header">
                    <h3 class="alert-title">${alerta.titulo || 'Alerta'}</h3>
                    <span class="alert-time">${formatarDataHora(alerta.data_criacao)}</span>
                </div>
                <p class="alert-description">${alerta.descricao || 'Descrição não disponível'}</p>
                <div class="alert-meta">
                    <span class="alert-type">
                        <i class="fas ${obterIconeTipoAlerta(alerta.tipo)}"></i>
                        ${obterNomeTipoAlerta(alerta.tipo)}
                    </span>
                    <span class="alert-severity ${alerta.severidade}">
                        ${obterNomeSeveridade(alerta.severidade)}
                    </span>
                </div>
            </div>
            <div class="alert-actions">
                ${!alerta.lido ? `
                    <button class="btn-alert-action btn-mark-read" onclick="marcarComoLido('${alerta.id}')">
                        <i class="fas fa-check"></i>
                        Marcar como Lido
                    </button>
                ` : ''}
                <button class="btn-alert-action btn-resolve" onclick="resolverAlerta('${alerta.id}')">
                    <i class="fas fa-check-double"></i>
                    Resolver
                </button>
            </div>
        </div>
    `).join('');

    atualizarEstatisticas(alertas);
}

function atualizarEstatisticas(alertas) {
    const criticalCount = alertas.filter(a => a.severidade === 'critical' && !a.resolvido).length;
    const warningCount = alertas.filter(a => a.severidade === 'warning' && !a.resolvido).length;
    const infoCount = alertas.filter(a => a.severidade === 'info' && !a.resolvido).length;
    const totalCount = alertas.filter(a => !a.resolvido).length;

    document.getElementById('criticalCount').textContent = criticalCount;
    document.getElementById('warningCount').textContent = warningCount;
    document.getElementById('infoCount').textContent = infoCount;
    document.getElementById('totalCount').textContent = totalCount;
}

function configurarEventosAlertas() {
    const filters = ['severityFilter', 'statusFilter', 'typeFilter'];
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', carregarAlertas);
        }
    });
}

// Funções auxiliares
function obterIconeAlerta(severidade) {
    const icones = {
        'critical': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle',
        'default': 'bell'
    };
    return icones[severidade] || icones.default;
}

function obterIconeTipoAlerta(tipo) {
    const icones = {
        'health': 'heartbeat',
        'medication': 'pills',
        'activity': 'tasks',
        'system': 'cog',
        'default': 'bell'
    };
    return icones[tipo] || icones.default;
}

function obterNomeTipoAlerta(tipo) {
    const nomes = {
        'health': 'Saúde',
        'medication': 'Medicamento',
        'activity': 'Atividade',
        'system': 'Sistema',
        'default': 'Geral'
    };
    return nomes[tipo] || tipo;
}

function obterNomeSeveridade(severidade) {
    const nomes = {
        'critical': 'Crítico',
        'warning': 'Atenção',
        'info': 'Informativo',
        'default': 'Geral'
    };
    return nomes[severidade] || severidade;
}

function formatarDataHora(dataString) {
    try {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Data inválida';
    }
}

// Funções de ação
function marcarComoLido(alertaId) {
    console.log('Marcando alerta como lido:', alertaId);
    // Implementar API call
    carregarAlertas(); // Recarregar para atualizar
}

function resolverAlerta(alertaId) {
    if (confirm('Tem certeza que deseja marcar este alerta como resolvido?')) {
        console.log('Resolvendo alerta:', alertaId);
        // Implementar API call
        carregarAlertas(); // Recarregar para atualizar
    }
}

function marcarTodosComoLidos() {
    if (confirm('Deseja marcar todos os alertas como lidos?')) {
        console.log('Marcando todos os alertas como lidos');
        // Implementar API call
        carregarAlertas(); // Recarregar para atualizar
    }
}

function configurarAlertas() {
    alert('Modal de configuração de alertas será implementado');
}

function adicionarAlertaConfiguravel() {
    alert('Modal para adicionar nova configuração de alerta será implementado');
}

function limparFiltros() {
    const filters = ['severityFilter', 'statusFilter', 'typeFilter'];
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) filter.value = 'all';
    });
    carregarAlertas();
}

function voltarParaDependentes() {
    window.location.href = 'dependentes.html';
}

function sair() {
    localStorage.clear();
    window.location.href = '/';
}

// Dados mock para demonstração
function generateMockAlertas() {
    return [
        {
            id: '1',
            titulo: 'Frequência Cardíaca Elevada',
            descricao: 'Frequência cardíaca medida em 110 bpm, acima do limite configurado.',
            tipo: 'health',
            severidade: 'warning',
            data_criacao: new Date().toISOString(),
            lido: false,
            resolvido: false
        },
        {
            id: '2',
            titulo: 'Medicamento em Atraso',
            descricao: 'Dose do medicamento Losartana está em atraso há 2 horas.',
            tipo: 'medication',
            severidade: 'critical',
            data_criacao: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            lido: false,
            resolvido: false
        },
        {
            id: '3',
            titulo: 'Atividade Pendente',
            descricao: 'Fisioterapia matinal ainda não foi registrada como concluída.',
            tipo: 'activity',
            severidade: 'info',
            data_criacao: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            lido: true,
            resolvido: false
        }
    ];
}