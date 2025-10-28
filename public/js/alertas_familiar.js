// alertas_familiar.js - SISTEMA DE ALERTAS DINÂMICOS PARA FAMILIAR CUIDADOR

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
        
        console.log('🔍 Carregando alertas para paciente:', pacienteId);
        
        if (!usuarioId || !pacienteId) {
            console.error('IDs não encontrados no localStorage');
            mostrarErro('Nenhum paciente selecionado. Por favor, selecione um paciente primeiro.');
            setTimeout(() => {
                window.location.href = 'dependentes.html';
            }, 3000);
            return;
        }

        // Mostrar loading
        mostrarLoadingAlertas();

        const response = await fetch(`/api/familiares-cuidadores/${usuarioId}/pacientes/${pacienteId}/alertas`);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${await response.text()}`);
        }
        
        const alertas = await response.json();
        console.log('✅ Alertas carregados:', alertas.length);
        
        // Aplicar filtros
        const alertasFiltrados = aplicarFiltros(alertas);
        exibirAlertas(alertasFiltrados);

    } catch (error) {
        console.error('❌ Erro ao carregar alertas:', error);
        mostrarErro('Erro ao carregar alertas: ' + error.message);
    }
}

function aplicarFiltros(alertas) {
    const severityFilter = document.getElementById('severityFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const typeFilter = document.getElementById('typeFilter')?.value || 'all';

    return alertas.filter(alerta => {
        // Filtro por severidade
        if (severityFilter !== 'all' && alerta.severidade !== severityFilter) {
            return false;
        }
        
        // Filtro por status
        if (statusFilter !== 'all') {
            if (statusFilter === 'unread' && alerta.lido) return false;
            if (statusFilter === 'read' && !alerta.lido) return false;
            if (statusFilter === 'resolved' && !alerta.resolvido) return false;
        }
        
        // Filtro por tipo
        if (typeFilter !== 'all' && alerta.tipo !== typeFilter) {
            return false;
        }
        
        return true;
    });
}

function mostrarLoadingAlertas() {
    const container = document.getElementById('alertsList');
    if (container) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 3rem;">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Carregando alertas...</p>
            </div>
        `;
    }
}

function mostrarErro(mensagem) {
    const container = document.getElementById('alertsList');
    if (container) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 3rem;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar alertas</p>
                <small>${mensagem}</small>
                <button class="btn-primary" onclick="carregarAlertas()" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i>
                    Tentar Novamente
                </button>
            </div>
        `;
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
                <small>Todos os alertas estão resolvidos ou não há alertas ativos para os filtros selecionados.</small>
            </div>
        `;
        atualizarEstatisticas([]);
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
                    ${alerta.resolvido ? '<span class="alert-resolved"><i class="fas fa-check"></i> Resolvido</span>' : ''}
                </div>
            </div>
            <div class="alert-actions">
                ${!alerta.lido && !alerta.resolvido ? `
                    <button class="btn-alert-action btn-mark-read" onclick="marcarComoLido('${alerta.id}')">
                        <i class="fas fa-check"></i>
                        Marcar como Lido
                    </button>
                ` : ''}
                ${!alerta.resolvido ? `
                    <button class="btn-alert-action btn-resolve" onclick="resolverAlerta('${alerta.id}')">
                        <i class="fas fa-check-double"></i>
                        ${alerta.lido ? 'Resolver' : 'Marcar como Resolvido'}
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');

    atualizarEstatisticas(alertas);
}

function atualizarEstatisticas(alertas) {
    const todosAlertas = alertas; // Já estão filtrados
    
    const criticalCount = todosAlertas.filter(a => a.severidade === 'critical' && !a.resolvido).length;
    const warningCount = todosAlertas.filter(a => a.severidade === 'warning' && !a.resolvido).length;
    const infoCount = todosAlertas.filter(a => a.severidade === 'info' && !a.resolvido).length;
    const totalCount = todosAlertas.filter(a => !a.resolvido).length;

    // Atualizar elementos se existirem
    const criticalElement = document.getElementById('criticalCount');
    const warningElement = document.getElementById('warningCount');
    const infoElement = document.getElementById('infoCount');
    const totalElement = document.getElementById('totalCount');

    if (criticalElement) criticalElement.textContent = criticalCount;
    if (warningElement) warningElement.textContent = warningCount;
    if (infoElement) infoElement.textContent = infoCount;
    if (totalElement) totalElement.textContent = totalCount;
}

function configurarEventosAlertas() {
    const filters = ['severityFilter', 'statusFilter', 'typeFilter'];
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', function() {
                carregarAlertas(); // Recarregar com filtros aplicados
            });
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
        const agora = new Date();
        const diffMs = agora - data;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'Agora mesmo';
        } else if (diffMins < 60) {
            return `Há ${diffMins} min`;
        } else if (diffHours < 24) {
            return `Há ${diffHours} h`;
        } else if (diffDays === 1) {
            return 'Ontem';
        } else if (diffDays < 7) {
            return `Há ${diffDays} dias`;
        } else {
            return data.toLocaleDateString('pt-BR');
        }
    } catch (error) {
        return 'Data inválida';
    }
}

// Funções de ação
async function marcarComoLido(alertaId) {
    try {
        console.log('Marcando alerta como lido:', alertaId);
        
        const response = await fetch(`/api/alertas/${alertaId}/marcar-lido`, {
            method: 'POST'
        });
        
        if (response.ok) {
            console.log('✅ Alerta marcado como lido');
            carregarAlertas(); // Recarregar para atualizar
        } else {
            throw new Error('Erro ao marcar alerta como lido');
        }
    } catch (error) {
        console.error('❌ Erro ao marcar alerta como lido:', error);
        alert('Erro ao marcar alerta como lido: ' + error.message);
    }
}

async function resolverAlerta(alertaId) {
    if (confirm('Tem certeza que deseja marcar este alerta como resolvido?')) {
        try {
            console.log('Resolvendo alerta:', alertaId);
            
            const response = await fetch(`/api/alertas/${alertaId}/resolver`, {
                method: 'POST'
            });
            
            if (response.ok) {
                console.log('✅ Alerta resolvido');
                carregarAlertas(); // Recarregar para atualizar
            } else {
                throw new Error('Erro ao resolver alerta');
            }
        } catch (error) {
            console.error('❌ Erro ao resolver alerta:', error);
            alert('Erro ao resolver alerta: ' + error.message);
        }
    }
}

async function marcarTodosComoLidos() {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        
        if (!usuarioId || !pacienteId) {
            alert('Nenhum paciente selecionado');
            return;
        }

        if (confirm('Deseja marcar todos os alertas como lidos?')) {
            console.log('Marcando todos os alertas como lidos');
            
            const response = await fetch(`/api/familiares-cuidadores/${usuarioId}/pacientes/${pacienteId}/alertas/marcar-todos-lidos`, {
                method: 'POST'
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Alertas marcados como lidos:', result.message);
                carregarAlertas(); // Recarregar para atualizar
            } else {
                throw new Error('Erro ao marcar alertas como lidos');
            }
        }
    } catch (error) {
        console.error('❌ Erro ao marcar alertas como lidos:', error);
        alert('Erro ao marcar alertas como lidos: ' + error.message);
    }
}

function configurarAlertas() {
    alert('Modal de configuração de alertas será implementado');
    // Aqui você pode abrir um modal para configurar alertas automáticos
}

function adicionarAlertaConfiguravel() {
    alert('Modal para adicionar nova configuração de alerta será implementado');
    // Aqui você pode abrir um modal para adicionar configurações personalizadas
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

// Atualizar alertas periodicamente (a cada 1 minuto)
setInterval(() => {
    carregarAlertas();
}, 60000);

// ====================== FUNÇÃO VOLTAR PARA LANDING PAGE ====================== //
function voltarParaLanding() {
    console.log('🏠 Voltando para a landing page...');
    window.location.href = 'landingpage.html';
}