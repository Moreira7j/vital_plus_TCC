// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';
let alertas = [];
let filtrosAtivos = {
    status: 'todos',
    prioridade: 'todos',
    data: '',
    busca: ''
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    inicializarEventListeners();
    carregarAlertas();
    inicializarGrafico();
});

// Event Listeners
function inicializarEventListeners() {
    // Filtros
    document.getElementById('aplicarFiltros').addEventListener('click', aplicarFiltros);
    document.getElementById('filtroStatus').addEventListener('change', atualizarFiltros);
    document.getElementById('filtroPrioridade').addEventListener('change', atualizarFiltros);
    document.getElementById('filtroData').addEventListener('change', atualizarFiltros);
    document.getElementById('filtroBusca').addEventListener('input', atualizarFiltros);

    // Modal
    document.getElementById('novoAlertaBtn').addEventListener('click', abrirModalNovoAlerta);
    document.getElementById('fecharModal').addEventListener('click', fecharModal);
    document.getElementById('cancelarBtn').addEventListener('click', fecharModal);
    document.getElementById('alertaForm').addEventListener('submit', salvarAlerta);

    // Fechar modal ao clicar fora
    document.getElementById('alertaModal').addEventListener('click', function(e) {
        if (e.target === this) fecharModal();
    });
}

// API Functions
async function carregarAlertas() {
    try {
        mostrarLoading(true);
        const response = await fetch(`${API_BASE_URL}/alertas`);
        
        if (!response.ok) throw new Error('Erro ao carregar alertas');
        
        alertas = await response.json();
        renderizarAlertas();
        atualizarEstatisticas();
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar alertas', 'error');
    } finally {
        mostrarLoading(false);
    }
}

async function criarAlerta(alertaData) {
    try {
        const response = await fetch(`${API_BASE_URL}/alertas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(alertaData)
        });

        if (!response.ok) throw new Error('Erro ao criar alerta');
        
        const novoAlerta = await response.json();
        alertas.unshift(novoAlerta);
        return novoAlerta;
    } catch (error) {
        throw error;
    }
}

async function atualizarAlerta(id, dadosAtualizados) {
    try {
        const response = await fetch(`${API_BASE_URL}/alertas/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosAtualizados)
        });

        if (!response.ok) throw new Error('Erro ao atualizar alerta');
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}

async function excluirAlerta(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/alertas/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Erro ao excluir alerta');
        
        return true;
    } catch (error) {
        throw error;
    }
}

// Renderização
function renderizarAlertas() {
    const container = document.querySelector('.alertas-container');
    const alertasFiltrados = filtrarAlertas();

    if (alertasFiltrados.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i data-feather="inbox" class="text-muted" style="width: 48px; height: 48px;"></i>
                <h4 class="mt-3 text-muted">Nenhum alerta encontrado</h4>
                <p class="text-muted">Tente ajustar os filtros ou criar um novo alerta.</p>
            </div>
        `;
        feather.replace();
        return;
    }

    container.innerHTML = alertasFiltrados.map(alerta => `
        <div class="alerta-card ${alerta.prioridade} ${alerta.status === 'resolvido' ? 'resolvido' : ''}">
            <div class="alerta-header">
                <div class="alerta-titulo">
                    <span class="prioridade-badge ${alerta.prioridade}">
                        ${obterTextoPrioridade(alerta.prioridade)} ${alerta.status === 'resolvido' ? '- Resolvido' : ''}
                    </span>
                    <h3>${alerta.titulo}</h3>
                </div>
                <div class="alerta-acoes">
                    ${alerta.status !== 'resolvido' ? `
                        <button class="btn-icon" onclick="editarAlerta(${alerta.id})" title="Editar">
                            <i data-feather="edit"></i>
                        </button>
                        <button class="btn-icon" onclick="marcarComoResolvido(${alerta.id})" title="Marcar como Resolvido">
                            <i data-feather="check-circle"></i>
                        </button>
                    ` : `
                        <button class="btn-icon" onclick="reabrirAlerta(${alerta.id})" title="Reabrir Alerta">
                            <i data-feather="rotate-ccw"></i>
                        </button>
                    `}
                    <button class="btn-icon" onclick="excluirAlertaConfirmacao(${alerta.id})" title="Excluir">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            </div>
            <div class="alerta-body">
                <p>${alerta.descricao}</p>
                <div class="alerta-metadata">
                    <span><i data-feather="clock"></i> Criado em: ${formatarData(alerta.dataCriacao)}</span>
                    <span><i data-feather="user"></i> Para: ${alerta.dependenteNome}</span>
                    ${alerta.dataResolucao ? `
                        <span><i data-feather="check-circle"></i> Resolvido em: ${formatarData(alerta.dataResolucao)}</span>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');

    feather.replace();
}

// Filtros
function aplicarFiltros() {
    renderizarAlertas();
    atualizarEstatisticas();
}

function atualizarFiltros() {
    filtrosAtivos = {
        status: document.getElementById('filtroStatus').value,
        prioridade: document.getElementById('filtroPrioridade').value,
        data: document.getElementById('filtroData').value,
        busca: document.getElementById('filtroBusca').value.toLowerCase()
    };
}

function filtrarAlertas() {
    return alertas.filter(alerta => {
        const matchStatus = filtrosAtivos.status === 'todos' || 
                           (filtrosAtivos.status === 'ativo' && alerta.status !== 'resolvido') ||
                           (filtrosAtivos.status === 'resolvido' && alerta.status === 'resolvido');
        
        const matchPrioridade = filtrosAtivos.prioridade === 'todos' || 
                               alerta.prioridade === filtrosAtivos.prioridade;
        
        const matchData = !filtrosAtivos.data || 
                         new Date(alerta.dataCriacao).toISOString().split('T')[0] === filtrosAtivos.data;
        
        const matchBusca = !filtrosAtivos.busca ||
                          alerta.titulo.toLowerCase().includes(filtrosAtivos.busca) ||
                          alerta.descricao.toLowerCase().includes(filtrosAtivos.busca);

        return matchStatus && matchPrioridade && matchData && matchBusca;
    });
}

// Modal Functions
function abrirModalNovoAlerta() {
    document.getElementById('modalTitulo').textContent = 'Novo Alerta';
    document.getElementById('alertaForm').reset();
    document.getElementById('alertaData').value = new Date().toISOString().slice(0, 16);
    document.getElementById('alertaModal').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('alertaModal').style.display = 'none';
}

async function salvarAlerta(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const alertaData = {
        titulo: document.getElementById('alertaTitulo').value,
        descricao: document.getElementById('alertaDescricao').value,
        prioridade: document.getElementById('alertaPrioridade').value,
        dependenteId: document.getElementById('alertaDependente').value,
        dependenteNome: document.getElementById('alertaDependente').options[document.getElementById('alertaDependente').selectedIndex].text,
        dataCriacao: document.getElementById('alertaData').value || new Date().toISOString(),
        status: 'ativo'
    };

    try {
        mostrarLoading(true);
        await criarAlerta(alertaData);
        mostrarMensagem('Alerta criado com sucesso!', 'success');
        fecharModal();
        carregarAlertas();
    } catch (error) {
        mostrarMensagem('Erro ao criar alerta', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Ações dos Alertas
async function marcarComoResolvido(id) {
    try {
        const alerta = alertas.find(a => a.id === id);
        const dadosAtualizados = {
            ...alerta,
            status: 'resolvido',
            dataResolucao: new Date().toISOString()
        };

        await atualizarAlerta(id, dadosAtualizados);
        mostrarMensagem('Alerta marcado como resolvido!', 'success');
        carregarAlertas();
    } catch (error) {
        mostrarMensagem('Erro ao atualizar alerta', 'error');
    }
}

async function reabrirAlerta(id) {
    try {
        const alerta = alertas.find(a => a.id === id);
        const dadosAtualizados = {
            ...alerta,
            status: 'ativo',
            dataResolucao: null
        };

        await atualizarAlerta(id, dadosAtualizados);
        mostrarMensagem('Alerta reaberto!', 'success');
        carregarAlertas();
    } catch (error) {
        mostrarMensagem('Erro ao reabrir alerta', 'error');
    }
}

function excluirAlertaConfirmacao(id) {
    if (confirm('Tem certeza que deseja excluir este alerta?')) {
        excluirAlertaHandler(id);
    }
}

async function excluirAlertaHandler(id) {
    try {
        await excluirAlerta(id);
        alertas = alertas.filter(a => a.id !== id);
        mostrarMensagem('Alerta excluído com sucesso!', 'success');
        renderizarAlertas();
        atualizarEstatisticas();
    } catch (error) {
        mostrarMensagem('Erro ao excluir alerta', 'error');
    }
}

// Estatísticas e Gráfico
function atualizarEstatisticas() {
    const alertasFiltrados = filtrarAlertas();
    const total = alertasFiltrados.length;
    const ativos = alertasFiltrados.filter(a => a.status !== 'resolvido').length;
    const resolvidos = alertasFiltrados.filter(a => a.status === 'resolvido').length;
    const alta = alertasFiltrados.filter(a => a.prioridade === 'alta' && a.status !== 'resolvido').length;

    document.getElementById('totalAlertas').textContent = total;
    document.getElementById('alertasAtivos').textContent = ativos;
    document.getElementById('alertasResolvidos').textContent = resolvidos;
    document.getElementById('alertasAlta').textContent = alta;
}

function inicializarGrafico() {
    const ctx = document.getElementById('alertasChart').getContext('2d');
    
    // Simulação de dados do gráfico
    const data = {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        datasets: [
            {
                label: 'Alertas Ativos',
                data: [12, 19, 8, 15, 12, 5, 9],
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: 'Alertas Resolvidos',
                data: [8, 12, 15, 10, 18, 12, 14],
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                tension: 0.4,
                fill: true
            }
        ]
    };

    new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Utilitários
function obterTextoPrioridade(prioridade) {
    const textos = {
        'alta': 'Alta Prioridade',
        'media': 'Média Prioridade',
        'baixa': 'Baixa Prioridade'
    };
    return textos[prioridade] || prioridade;
}

function formatarData(dataString) {
    return new Date(dataString).toLocaleString('pt-BR');
}

function mostrarMensagem(mensagem, tipo) {
    // Implementar sistema de notificações
    console.log(`${tipo}: ${mensagem}`);
}

function mostrarLoading(mostrar) {
    // Implementar indicador de carregamento
    if (mostrar) {
        document.body.classList.add('loading');
    } else {
        document.body.classList.remove('loading');
    }
}

// WebSocket para atualizações em tempo real
function inicializarWebSocket() {
    const ws = new WebSocket('ws://localhost:3000/alertas');
    
    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.tipo === 'novo_alerta') {
            alertas.unshift(data.alerta);
            renderizarAlertas();
            atualizarEstatisticas();
            mostrarNotificacao(`Novo alerta: ${data.alerta.titulo}`);
        }
    };
}

function mostrarNotificacao(mensagem) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Sistema de Alertas', {
            body: mensagem,
            icon: '/icon.png'
        });
    }
}

// Solicitar permissão para notificações
if ('Notification' in window) {
    Notification.requestPermission();
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

// ====================== FUNÇÃO VOLTAR PARA LANDING PAGE ====================== //
function voltarParaLanding() {
    console.log('🏠 Voltando para a landing page...');
    window.location.href = 'landingpage.html';
}