// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';
let atividades = [];
let filtrosAtivos = {
    data: '',
    status: 'todos',
    tipo: 'todos'
};

// Variáveis globais para controle
let atividadeEditando = null;
let atividadeParaExcluir = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    verificarDadosUsuario();
    inicializarEventListeners();
    carregarAtividades();
    inicializarGraficoAtividades();
});

// Event Listeners
function inicializarEventListeners() {
    // Filtros
    document.getElementById('aplicarFiltros').addEventListener('click', aplicarFiltros);
    document.getElementById('filtroData').addEventListener('change', atualizarFiltros);
    document.getElementById('filtroStatus').addEventListener('change', atualizarFiltros);
    document.getElementById('filtroTipo').addEventListener('change', atualizarFiltros);

    // Modal
    document.getElementById('novaAtividadeBtn').addEventListener('click', abrirModalNovaAtividade);
    document.getElementById('fecharModal').addEventListener('click', fecharModal);
    document.getElementById('cancelarBtn').addEventListener('click', fecharModal);
    document.getElementById('atividadeForm').addEventListener('submit', salvarAtividade);

    // Modal de Confirmação - EXCLUSÃO
    document.getElementById('confirmarExclusaoBtn').addEventListener('click', confirmarExclusaoAtividade);
    document.getElementById('cancelarExclusaoBtn').addEventListener('click', fecharModalConfirmacaoAtividade);
    document.getElementById('fecharModalConfirmacaoAtividade').addEventListener('click', fecharModalConfirmacaoAtividade);

    // Fechar modais ao clicar fora
    document.getElementById('atividadeModal').addEventListener('click', function(e) {
        if (e.target === this) fecharModal();
    });
    
    document.getElementById('confirmacaoExclusaoAtividadeModal').addEventListener('click', function(e) {
        if (e.target === this) fecharModalConfirmacaoAtividade();
    });

    console.log('✅ Event listeners inicializados');
}

// Modal de Confirmação Personalizado para Atividades
function abrirModalConfirmacaoExclusaoAtividade(id) {
    atividadeParaExcluir = id;
    
    // Encontrar a descrição da atividade para mostrar na confirmação
    const atividade = atividades.find(a => a.id === id);
    const descricaoAtividade = atividade ? atividade.descricao : 'esta atividade';
    
    document.getElementById('textoConfirmacaoExclusaoAtividade').textContent = 
        `Tem certeza que deseja excluir "${descricaoAtividade}"?`;
    
    document.getElementById('confirmacaoExclusaoAtividadeModal').style.display = 'flex';
}

function fecharModalConfirmacaoAtividade() {
    document.getElementById('confirmacaoExclusaoAtividadeModal').style.display = 'none';
    atividadeParaExcluir = null;
}

async function confirmarExclusaoAtividade() {
    if (!atividadeParaExcluir) return;
    
    try {
        mostrarLoading(true);
        await excluirAtividadeHandler(atividadeParaExcluir);
        fecharModalConfirmacaoAtividade();
        mostrarMensagem('Atividade excluída com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao excluir atividade:', error);
        mostrarMensagem('Erro ao excluir atividade', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Função para debug - verificar dados do usuário
function verificarDadosUsuario() {
    const usuarioId = localStorage.getItem('usuarioId');
    const pacienteId = localStorage.getItem('pacienteSelecionadoId');
    
    console.log('🔍 DEBUG - Dados do localStorage:', {
        usuarioId,
        pacienteId,
        usuarioTipo: localStorage.getItem('usuarioTipo'),
        usuarioNome: localStorage.getItem('usuarioNome')
    });
    
    return { usuarioId, pacienteId };
}

// Carregar atividades
async function carregarAtividades() {
    try {
        mostrarLoading(true);
        
        const { usuarioId, pacienteId } = verificarDadosUsuario();
        
        if (!pacienteId) {
            throw new Error('Nenhum paciente selecionado');
        }

        console.log(`📅 Buscando atividades para paciente: ${pacienteId}`);

        const response = await fetch(`/api/pacientes/${pacienteId}/atividades/hoje`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar atividades da API');
        }
        
        atividades = await response.json();
        
        // ✅ DEBUG: Verificar estrutura dos dados recebidos
        console.log('🔍 ESTRUTURA DOS DADOS RECEBIDOS:');
        if (atividades.length > 0) {
            console.log('Primeira atividade:', atividades[0]);
            console.log('Campos disponíveis:', Object.keys(atividades[0]));
        }
        
        console.log('📦 Atividades carregadas:', atividades);
        
        renderizarAtividades();
        atualizarEstatisticas();
        inicializarGraficoAtividades();
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        atividades = obterAtividadesExemplo();
        renderizarAtividades();
        atualizarEstatisticas();
        mostrarMensagem('Erro ao carregar atividades: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Dados de exemplo (fallback)
function obterAtividadesExemplo() {
    const hoje = new Date().toISOString().split('T')[0];
    
    return [
        {
            id: 1,
            tipo: "alimentacao",
            descricao: "Café da manhã balanceado",
            data_prevista: `${hoje} 08:00:00`,
            status: "concluida",
            observacoes: "Paciente com bom apetite"
        },
        {
            id: 2,
            tipo: "exercicio",
            descricao: "Caminhada no parque",
            data_prevista: `${hoje} 10:00:00`,
            status: "pendente",
            observacoes: "Leve, 30 minutos"
        },
        {
            id: 3,
            tipo: "medicacao",
            descricao: "Administrar medicamentos",
            data_prevista: `${hoje} 12:00:00`,
            status: "pendente",
            observacoes: "Antibiótico e vitaminas"
        }
    ];
}

// Criar atividade
async function criarAtividade(atividadeData) {
    try {
        console.log('📤 Iniciando criação de atividade...');
        
        const { usuarioId, pacienteId } = verificarDadosUsuario();

        if (!pacienteId) {
            throw new Error('Nenhum paciente selecionado');
        }

        if (!usuarioId) {
            throw new Error('Usuário não identificado');
        }

        // ✅ CORREÇÃO: Criar data corretamente para HOJE com o horário selecionado
        const hoje = new Date();
        const [horas, minutos] = atividadeData.horario.split(':');
        
        // Usar a data de HOJE com o horário selecionado
        const dataAtividade = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), parseInt(horas), parseInt(minutos), 0);
        
        // Formatar para o formato MySQL
        const dataPrevistaFormatada = dataAtividade.toISOString().slice(0, 19).replace('T', ' ');

        console.log('📅 Data da atividade:', {
            dataOriginal: dataAtividade,
            dataFormatada: dataPrevistaFormatada,
            horarioSelecionado: atividadeData.horario
        });

        const dadosParaAPI = {
            paciente_id: parseInt(pacienteId),
            usuario_id: parseInt(usuarioId),
            tipo: atividadeData.tipo,
            descricao: atividadeData.descricao,
            data_prevista: dataPrevistaFormatada,
            observacoes: atividadeData.observacoes || ''
        };

        console.log('💾 Dados que serão enviados para API:', dadosParaAPI);

        const response = await fetch('/api/atividades', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosParaAPI)
        });

        console.log('📥 Status da resposta:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro na resposta:', errorText);
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Atividade criada com sucesso:', data);
        return data;

    } catch (error) {
        console.error('❌ Erro completo ao criar atividade:', error);
        throw error;
    }
}

// Atualizar atividade
async function atualizarAtividade(id, atividadeData) {
    try {
        console.log('📤 Atualizando atividade:', { id, ...atividadeData });

        // Formatar data_prevista
        const dataAtividade = new Date();
        const [horas, minutos] = atividadeData.horario.split(':');
        dataAtividade.setHours(parseInt(horas), parseInt(minutos), 0, 0);

        const dadosParaAPI = {
            tipo: atividadeData.tipo,
            descricao: atividadeData.descricao,
            data_prevista: dataAtividade.toISOString().slice(0, 19).replace('T', ' '),
            observacoes: atividadeData.observacoes || ''
        };

        const response = await fetch(`/api/atividades/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosParaAPI)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Atividade atualizada com sucesso:', data);
        return data;

    } catch (error) {
        console.error('❌ Erro ao atualizar atividade:', error);
        throw error;
    }
}

// Marcar como concluída
async function marcarComoConcluidaHandler(id) {
    try {
        console.log(`🔄 Executando marcarComoConcluidaHandler para ID: ${id}`);
        
        const resultado = await concluirAtividade(id);
        console.log('✅ Resultado da conclusão:', resultado);
        
        // Atualizar a lista local
        const index = atividades.findIndex(a => a.id === id);
        if (index !== -1) {
            atividades[index].status = 'concluida';
            renderizarAtividades();
            atualizarEstatisticas();
        }
        
        mostrarMensagem('Atividade marcada como concluída!', 'success');
        
        // Atualizar dashboard
        if (typeof window.recarregarTarefasDashboard === 'function') {
            window.recarregarTarefasDashboard();
        }
        
    } catch (error) {
        console.error('❌ Erro no handler:', error);
        mostrarMensagem('Erro ao concluir atividade: ' + error.message, 'error');
    }
}

function renderizarAtividades() {
    const container = document.getElementById('atividadesContainer');
    const atividadesFiltradas = filtrarAtividades();

    if (atividadesFiltradas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-feather="inbox"></i>
                <h4>Nenhuma atividade encontrada</h4>
                <p class="text-muted">Tente ajustar os filtros ou adicionar uma nova atividade.</p>
            </div>
        `;
        feather.replace();
        return;
    }

    container.innerHTML = atividadesFiltradas.map(atividade => {
        // Garantir valores padrão
        const dataPrevista = new Date(atividade.data_prevista);
        const horario = dataPrevista.toTimeString().slice(0, 5);
        
        return `
        <div class="atividade-card ${atividade.status}" data-atividade-id="${atividade.id}">
            <div class="atividade-header">
                <div class="atividade-info">
                    <span class="tipo-badge ${atividade.tipo}">
                        ${obterTextoTipo(atividade.tipo)}
                    </span>
                    <span class="status-badge ${atividade.status}">
                        ${obterTextoStatus(atividade.status)}
                    </span>
                    <h3>${atividade.descricao}</h3>
                </div>
                <div class="atividade-acoes">
                    ${atividade.status !== 'concluida' ? `
                        <button class="btn btn-primary btn-sm" onclick="marcarComoConcluidaHandler(${atividade.id})">
                            <i data-feather="check"></i>
                            Concluir
                        </button>
                    ` : `
                        <button class="btn btn-success btn-sm" disabled>
                            <i data-feather="check-circle"></i>
                            Concluída
                        </button>
                    `}
                    <button class="btn-icon btn-edit" onclick="editarAtividade(${atividade.id})" title="Editar">
                        <i data-feather="edit-2"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="abrirModalConfirmacaoExclusaoAtividade(${atividade.id})" title="Excluir">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            </div>
            <div class="atividade-body">
                <p><strong>Tipo:</strong> ${obterTextoTipo(atividade.tipo)}</p>
                <p><strong>Horário:</strong> ${horario}</p>
                ${atividade.observacoes ? `<p><strong>Observações:</strong> ${atividade.observacoes}</p>` : ''}
            </div>
            <div class="atividade-metadata">
                <span><i data-feather="clock"></i> Agendada para: ${horario}</span>
            </div>
        </div>
        `;
    }).join('');

    feather.replace();
}

// Filtros
function aplicarFiltros() {
    renderizarAtividades();
    atualizarEstatisticas();
}

function atualizarFiltros() {
    filtrosAtivos = {
        data: document.getElementById('filtroData').value,
        status: document.getElementById('filtroStatus').value,
        tipo: document.getElementById('filtroTipo').value
    };
}

function filtrarAtividades() {
    return atividades.filter(atividade => {
        const matchStatus = filtrosAtivos.status === 'todos' || 
                           atividade.status === filtrosAtivos.status;
        
        const matchTipo = filtrosAtivos.tipo === 'todos' || 
                         atividade.tipo === filtrosAtivos.tipo;

        // Filtro por data
        let matchData = true;
        if (filtrosAtivos.data) {
            const atividadeData = new Date(atividade.data_prevista).toISOString().split('T')[0];
            matchData = atividadeData === filtrosAtivos.data;
        }

        return matchStatus && matchTipo && matchData;
    });
}

// Modal Functions
function abrirModalNovaAtividade() {
    document.getElementById('modalTitulo').textContent = 'Nova Atividade';
    atividadeEditando = null;
    document.getElementById('atividadeForm').reset();
    
    // Definir horário padrão como próxima hora
    const agora = new Date();
    const proximaHora = new Date(agora.getTime() + 60 * 60 * 1000);
    document.getElementById('atividadeHorario').value = 
        proximaHora.getHours().toString().padStart(2, '0') + ':00';
    
    document.getElementById('atividadeModal').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('atividadeModal').style.display = 'none';
    atividadeEditando = null;
    document.getElementById('atividadeForm').reset();
}

// Editar atividade
function editarAtividade(id) {
    console.log(`✏️ Editando atividade ID: ${id}`);
    
    const atividade = atividades.find(a => a.id === id);
    if (!atividade) {
        mostrarMensagem('Atividade não encontrada', 'error');
        return;
    }

    atividadeEditando = id;
    
    // Preencher modal
    document.getElementById('modalTitulo').textContent = 'Editar Atividade';
    document.getElementById('atividadeTipo').value = atividade.tipo || 'alimentacao';
    document.getElementById('atividadeDescricao').value = atividade.descricao || '';
    document.getElementById('atividadeObservacoes').value = atividade.observacoes || '';
    
    // Formatar horário
    const dataPrevista = new Date(atividade.data_prevista);
    const horario = dataPrevista.toTimeString().slice(0, 5);
    document.getElementById('atividadeHorario').value = horario;
    
    document.getElementById('atividadeModal').style.display = 'flex';
}

// Salvar atividade (criação e edição)
async function salvarAtividade(e) {
    e.preventDefault();
    
    const atividadeData = {
        tipo: document.getElementById('atividadeTipo').value,
        descricao: document.getElementById('atividadeDescricao').value.trim(),
        horario: document.getElementById('atividadeHorario').value,
        observacoes: document.getElementById('atividadeObservacoes').value.trim()
    };

    // Validação
    if (!atividadeData.descricao || !atividadeData.horario) {
        mostrarMensagem('Preencha todos os campos obrigatórios!', 'error');
        return;
    }

    try {
        mostrarLoading(true);
        
        let resultado;
        if (atividadeEditando) {
            resultado = await atualizarAtividade(atividadeEditando, atividadeData);
            mostrarMensagem('Atividade atualizada com sucesso!', 'success');
        } else {
            resultado = await criarAtividade(atividadeData);
            mostrarMensagem('Atividade criada com sucesso!', 'success');
        }
        
        fecharModal();
        await carregarAtividades();
        
        // ⬇️ ATUALIZAR DASHBOARD
        if (typeof window.recarregarTarefasDashboard === 'function') {
            window.recarregarTarefasDashboard();
        }
        
    } catch (error) {
        mostrarMensagem('Erro ao salvar atividade: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Concluir atividade
async function concluirAtividade(id) {
    try {
        console.log(`🎯 Concluindo atividade ID: ${id}`);
        
        const response = await fetch(`/api/atividades/${id}/concluir`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('❌ Erro na função concluirAtividade:', error);
        throw error;
    }
}

// Excluir atividade - MODIFICADA para usar modal personalizado
function excluirAtividadeConfirmacao(id) {
    abrirModalConfirmacaoExclusaoAtividade(id);
}

async function excluirAtividadeHandler(id) {
    try {
        const response = await fetch(`/api/atividades/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Erro ao excluir atividade');
        }

        atividades = atividades.filter(a => a.id !== id);
        renderizarAtividades();
        atualizarEstatisticas();
        
        // ⬇️ ATUALIZAR DASHBOARD
        if (typeof window.recarregarTarefasDashboard === 'function') {
            window.recarregarTarefasDashboard();
        }
        
    } catch (error) {
        console.error('❌ Erro ao excluir atividade:', error);
        throw error; // Agora o erro é tratado no confirmarExclusaoAtividade
    }
}

// Estatísticas
function atualizarEstatisticas() {
    const atividadesFiltradas = filtrarAtividades();
    const total = atividadesFiltradas.length;
    const concluidas = atividadesFiltradas.filter(a => a.status === 'concluida').length;
    const pendentes = atividadesFiltradas.filter(a => a.status === 'pendente').length;
    const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    document.getElementById('totalAtividades').textContent = total;
    document.getElementById('atividadesConcluidas').textContent = concluidas;
    document.getElementById('atividadesPendentes').textContent = pendentes;
    document.getElementById('taxaConclusao').textContent = taxaConclusao + '%';
}

// Gráfico
function inicializarGraficoAtividades() {
    const ctx = document.getElementById('atividadesChart').getContext('2d');
    
    // Calcular dados reais
    const tipos = ['alimentacao', 'exercicio', 'higiene', 'medicacao', 'repouso', 'social'];
    const dados = tipos.map(tipo => 
        atividades.filter(ativ => ativ.tipo === tipo).length
    );

    const data = {
        labels: ['Alimentação', 'Exercício', 'Higiene', 'Medicação', 'Repouso', 'Social'],
        datasets: [{
            data: dados,
            backgroundColor: [
                '#ffeaa7',
                '#74b9ff', 
                '#81ecec',
                '#a29bfe',
                '#dfe6e9',
                '#fab1a0'
            ],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };

    // Destruir gráfico anterior se existir
    if (window.atividadesChartInstance) {
        window.atividadesChartInstance.destroy();
    }

    window.atividadesChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

// Utilitários
function obterTextoStatus(status) {
    const textos = {
        'pendente': 'Pendente',
        'concluida': 'Concluída',
        'atrasada': 'Atrasada'
    };
    return textos[status] || status;
}

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

function mostrarMensagem(mensagem, tipo) {
    console.log(`${tipo}: ${mensagem}`);
    
    // Criar notificação mais amigável
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${tipo === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 300px;
        font-family: 'Inter', sans-serif;
    `;
    notification.textContent = mensagem;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 4000);
}

function mostrarLoading(mostrar) {
    // Implementação básica de loading
    if (mostrar) {
        document.body.style.cursor = 'wait';
        document.body.style.opacity = '0.7';
    } else {
        document.body.style.cursor = 'default';
        document.body.style.opacity = '1';
    }
}

// ====================== FUNÇÕES GLOBAIS ====================== //
window.marcarComoConcluidaHandler = marcarComoConcluidaHandler;
window.editarAtividade = editarAtividade;
window.excluirAtividadeConfirmacao = excluirAtividadeConfirmacao;
window.abrirModalConfirmacaoExclusaoAtividade = abrirModalConfirmacaoExclusaoAtividade;

// Função para recarregar tarefas no dashboard
window.recarregarTarefasDashboard = async function() {
    try {
        console.log('🔄 Recarregando tarefas no dashboard...');
        if (typeof window.carregarTarefasDashboard === 'function') {
            await window.carregarTarefasDashboard();
        }
    } catch (error) {
        console.error('❌ Erro ao recarregar tarefas:', error);
    }
};

// Atualizar ícones
setInterval(() => {
    feather.replace();
}, 1000);

// ====================== FUNÇÕES DE NAVEGAÇÃO ====================== //

// FUNÇÃO PARA VOLTAR PARA A PÁGINA DE DEPENDENTES
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
    window.location.href = 'dependentes.html';
}

// FUNÇÃO VOLTAR PARA LANDING PAGE
function voltarParaLanding() {
    console.log('🏠 Voltando para a landing page...');
    window.location.href = 'landingpage.html';
}