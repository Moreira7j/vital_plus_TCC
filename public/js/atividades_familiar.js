// atividades_familiar.js - GESTÃO DE ATIVIDADES PARA FAMILIAR CUIDADOR

document.addEventListener('DOMContentLoaded', function () {
    console.log('📅 Inicializando atividades familiar...');
    
    carregarDadosPaciente();
    carregarAtividades();
    configurarEventosAtividades();
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

async function carregarAtividades() {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        
        console.log('📅 Carregando atividades para paciente:', pacienteId);
        
        if (!usuarioId || !pacienteId) {
            console.error('IDs não encontrados');
            mostrarErroAtividades('Nenhum paciente selecionado');
            return;
        }

        const response = await fetch(`/api/familiares-cuidadores/${usuarioId}/pacientes/${pacienteId}/atividades`);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}`);
        }
        
        const atividades = await response.json();
        console.log('✅ Atividades carregadas:', atividades.length);
        exibirAtividades(atividades);

    } catch (error) {
        console.error('❌ Erro ao carregar atividades:', error);
        mostrarErroAtividades('Erro ao carregar atividades: ' + error.message);
    }
}

function mostrarErroAtividades(mensagem) {
    const container = document.getElementById('activitiesList');
    if (container) {
        container.innerHTML = `
            <div class="empty-activities">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar atividades</p>
                <small>${mensagem}</small>
                <button class="btn-primary" onclick="carregarAtividades()" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i>
                    Tentar Novamente
                </button>
            </div>
        `;
    }
    
    // Zerar estatísticas em caso de erro
    atualizarEstatisticas([]);
}

function exibirAtividades(atividades) {
    const container = document.getElementById('activitiesList');
    if (!container) return;
    
    if (!atividades || atividades.length === 0) {
        container.innerHTML = `
            <div class="empty-activities">
                <i class="fas fa-tasks"></i>
                <p>Nenhuma atividade encontrada</p>
                <small>Clique em "Nova Atividade" para adicionar a primeira atividade.</small>
            </div>
        `;
        atualizarEstatisticas([]);
        return;
    }

    container.innerHTML = atividades.map(atividade => `
        <div class="activity-item ${atividade.status}">
            <div class="activity-checkbox">
                <input type="checkbox" ${atividade.status === 'completed' ? 'checked' : ''} 
                       onchange="alternarStatusAtividade('${atividade.id}', this.checked)">
            </div>
            <div class="activity-icon">
                <i class="fas ${obterIconeAtividade(atividade.tipo)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-header">
                    <h3 class="activity-title">${atividade.titulo || 'Atividade'}</h3>
                    <span class="activity-time">${formatarDataHora(atividade.data_prevista)}</span>
                </div>
                <p class="activity-description">${atividade.descricao || 'Sem descrição'}</p>
                <div class="activity-meta">
                    <span class="activity-type">
                        <i class="fas ${obterIconeTipoAtividade(atividade.tipo)}"></i>
                        ${obterNomeTipoAtividade(atividade.tipo)}
                    </span>
                    <span class="activity-priority priority-${atividade.prioridade || 'medium'}">
                        ${obterNomePrioridade(atividade.prioridade)}
                    </span>
                    ${atividade.duracao ? `<span><i class="fas fa-clock"></i> ${atividade.duracao}</span>` : ''}
                </div>
            </div>
            <div class="activity-actions">
                <button class="btn-activity-action btn-edit" onclick="editarAtividade('${atividade.id}')">
                    <i class="fas fa-edit"></i>
                    Editar
                </button>
                <button class="btn-activity-action btn-delete" onclick="excluirAtividade('${atividade.id}')">
                    <i class="fas fa-trash"></i>
                    Excluir
                </button>
            </div>
        </div>
    `).join('');

    atualizarEstatisticas(atividades);
}

function atualizarEstatisticas(atividades) {
    const completedCount = atividades.filter(a => a.status === 'completed').length;
    const pendingCount = atividades.filter(a => a.status === 'pending').length;
    const overdueCount = atividades.filter(a => a.status === 'overdue').length;
    const todayCount = atividades.filter(a => ehHoje(a.data_prevista)).length;

    document.getElementById('completedCount').textContent = completedCount;
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('overdueCount').textContent = overdueCount;
    document.getElementById('todayCount').textContent = todayCount;
}

function configurarEventosAtividades() {
    const filters = ['statusFilter', 'typeFilter', 'dateFilter'];
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', aplicarFiltros);
        }
    });
}

function aplicarFiltros() {
    carregarAtividades();
}

// Funções auxiliares
function obterIconeAtividade(tipo) {
    const icones = {
        'medicacao': 'pills',
        'alimentacao': 'utensils',
        'exercicio': 'running',
        'fisioterapia': 'heartbeat',
        'consulta': 'user-md',
        'banho': 'shower',
        'descanso': 'bed',
        'social': 'users',
        'default': 'tasks'
    };
    return icones[tipo] || icones.default;
}

function obterIconeTipoAtividade(tipo) {
    return obterIconeAtividade(tipo);
}

function obterNomeTipoAtividade(tipo) {
    const nomes = {
        'medicacao': 'Medicação',
        'alimentacao': 'Alimentação',
        'exercicio': 'Exercício',
        'fisioterapia': 'Fisioterapia',
        'consulta': 'Consulta',
        'banho': 'Higiene',
        'descanso': 'Descanso',
        'social': 'Social',
        'default': 'Atividade'
    };
    return nomes[tipo] || tipo;
}

function obterNomePrioridade(prioridade) {
    const nomes = {
        'high': 'Alta',
        'medium': 'Média',
        'low': 'Baixa',
        'default': 'Média'
    };
    return nomes[prioridade] || nomes.default;
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

function ehHoje(dataString) {
    try {
        const data = new Date(dataString);
        const hoje = new Date();
        return data.toDateString() === hoje.toDateString();
    } catch (error) {
        return false;
    }
}

// Funções de ação
function adicionarAtividade() {
    console.log('Abrindo modal para adicionar atividade');
    // Implementar modal de adição
}

function editarAtividade(atividadeId) {
    console.log('Editando atividade:', atividadeId);
    // Implementar edição
}

function excluirAtividade(atividadeId) {
    if (confirm('Tem certeza que deseja excluir esta atividade?')) {
        console.log('Excluindo atividade:', atividadeId);
        // Implementar exclusão
    }
}

function alternarStatusAtividade(atividadeId, concluida) {
    console.log(`Alternando status da atividade ${atividadeId} para:`, concluida ? 'concluída' : 'pendente');
    // Implementar alteração de status
}

function limparFiltros() {
    const filters = ['statusFilter', 'typeFilter', 'dateFilter'];
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) filter.value = 'all';
    });
    carregarAtividades();
}

function vistaSemana() {
    console.log('Alternando para vista semanal');
    // Implementar vista semanal
}

function vistaMes() {
    console.log('Alternando para vista mensal');
    // Implementar vista mensal
}

function voltarParaDependentes() {
    window.location.href = 'dependentes.html';
}

function sair() {
    localStorage.clear();
    window.location.href = '/';
}

// ====================== FUNÇÃO VOLTAR PARA LANDING PAGE ====================== //
function voltarParaLanding() {
    console.log('🏠 Voltando para a landing page...');
    window.location.href = 'landingpage.html';
}