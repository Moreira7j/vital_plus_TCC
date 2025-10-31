// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';
let relatorios = [];
let filtrosAtivos = {
    periodo: 'mes',
    dataInicio: '',
    dataFim: ''
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    inicializarEventListeners();
    carregarRelatorios();
    inicializarGraficoEvolucao();
});

// Event Listeners
function inicializarEventListeners() {
    // Filtros
    document.getElementById('aplicarFiltros').addEventListener('click', aplicarFiltros);
    document.getElementById('filtroPeriodo').addEventListener('change', atualizarFiltrosPeriodo);
    document.getElementById('filtroDataInicio').addEventListener('change', atualizarFiltros);
    document.getElementById('filtroDataFim').addEventListener('change', atualizarFiltros);

    // Modal
    document.getElementById('novoRelatorioBtn').addEventListener('click', abrirModalNovoRelatorio);
    document.getElementById('exportarRelatorioBtn').addEventListener('click', exportarRelatorio);
    document.getElementById('fecharModal').addEventListener('click', fecharModal);
    document.getElementById('cancelarBtn').addEventListener('click', fecharModal);
    document.getElementById('relatorioForm').addEventListener('submit', salvarRelatorio);

    // Fechar modal ao clicar fora
    document.getElementById('relatorioModal').addEventListener('click', function(e) {
        if (e.target === this) fecharModal();
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../paginas/index.html';
        });
    }
}

// API Functions
async function carregarRelatorios() {
    try {
        mostrarLoading(true);
        
        // Obter cuidador logado
        const usuarioLogado = obterUsuarioLogado();
        if (!usuarioLogado) {
            throw new Error('Usuário não logado');
        }

        // Buscar relatórios do cuidador
        const response = await fetch(`${API_BASE_URL}/cuidadores/${usuarioLogado.id}/relatorios`);
        
        if (!response.ok) {
            // Se a API não responder, usar dados de exemplo
            console.log('API não disponível, usando dados de exemplo');
            relatorios = obterRelatoriosExemplo();
        } else {
            relatorios = await response.json();
        }
        
        renderizarRelatorios();
        atualizarEstatisticas();
    } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
        // Usar dados de exemplo em caso de erro
        relatorios = obterRelatoriosExemplo();
        renderizarRelatorios();
        atualizarEstatisticas();
        mostrarMensagem('Usando dados de demonstração', 'info');
    } finally {
        mostrarLoading(false);
    }
}

// Dados de exemplo (remover quando a API estiver pronta)
function obterRelatoriosExemplo() {
    return [
        {
            id: 1,
            titulo: "Relatório Diário - Estado Geral",
            tipo: "diario",
            conteudo: "Paciente apresentou bom humor durante o dia. Alimentação adequada com boa aceitação das refeições. Realizou todas as medicações no horário correto. Atividades físicas realizadas conforme planejado.",
            observacoes: "Manter acompanhamento da pressão arterial",
            data_criacao: new Date().toISOString()
        },
        {
            id: 2,
            titulo: "Relatório Semanal - Evolução",
            tipo: "semanal",
            conteudo: "Na última semana, observamos melhora significativa na mobilidade do paciente. Adesão à medicação em 95%. Atividades físicas realizadas regularmente. Estado emocional estável.",
            observacoes: "Continuar com exercícios de fortalecimento",
            data_criacao: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 3,
            titulo: "Relatório de Medicação - Controle",
            tipo: "medicamento",
            conteudo: "Controle rigoroso da medicação realizado. Todas as doses administradas no horário correto. Sem efeitos colaterais observados. Paciente colaborativo com o tratamento.",
            observacoes: "Monitorar possíveis efeitos da nova medicação",
            data_criacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
}

async function criarRelatorio(relatorioData) {
    try {
        const response = await fetch(`${API_BASE_URL}/relatorios/criar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(relatorioData)
        });

        if (!response.ok) throw new Error('Erro ao criar relatório');
        
        const novoRelatorio = await response.json();
        relatorios.unshift(novoRelatorio);
        return novoRelatorio;
    } catch (error) {
        throw error;
    }
}

// Renderização
function renderizarRelatorios() {
    const container = document.getElementById('relatoriosContainer');
    const relatoriosFiltrados = filtrarRelatorios();

    if (relatoriosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-feather="inbox"></i>
                <h4>Nenhum relatório encontrado</h4>
                <p class="text-muted">Tente ajustar os filtros ou criar um novo relatório.</p>
            </div>
        `;
        feather.replace();
        return;
    }

    container.innerHTML = relatoriosFiltrados.map(relatorio => `
        <div class="relatorio-card">
            <div class="relatorio-header">
                <div class="relatorio-info">
                    <span class="tipo-relatorio-badge ${relatorio.tipo}">
                        ${obterTextoTipoRelatorio(relatorio.tipo)}
                    </span>
                    <h3>${relatorio.titulo}</h3>
                </div>
                <div class="relatorio-acoes">
                    <button class="btn btn-outline btn-sm" onclick="visualizarRelatorio(${relatorio.id})">
                        <i data-feather="eye"></i>
                        Visualizar
                    </button>
                    <button class="btn-icon" onclick="editarRelatorio(${relatorio.id})" title="Editar">
                        <i data-feather="edit"></i>
                    </button>
                    <button class="btn-icon" onclick="excluirRelatorioConfirmacao(${relatorio.id})" title="Excluir">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            </div>
            <div class="relatorio-body">
                <p>${relatorio.conteudo}</p>
                ${relatorio.observacoes ? `
                    <div class="mt-2">
                        <strong>Observações:</strong> ${relatorio.observacoes}
                    </div>
                ` : ''}
            </div>
            <div class="relatorio-metadata">
                <span><i data-feather="calendar"></i> ${formatarDataCompleta(relatorio.data_criacao)}</span>
                <span><i data-feather="user"></i> Cuidador Responsável</span>
            </div>
        </div>
    `).join('');

    feather.replace();
}

// Filtros
function aplicarFiltros() {
    renderizarRelatorios();
    atualizarEstatisticas();
}

function atualizarFiltrosPeriodo() {
    const periodo = document.getElementById('filtroPeriodo').value;
    const hoje = new Date();
    
    if (periodo === 'hoje') {
        document.getElementById('filtroDataInicio').value = hoje.toISOString().split('T')[0];
        document.getElementById('filtroDataFim').value = hoje.toISOString().split('T')[0];
    } else if (periodo === 'semana') {
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        document.getElementById('filtroDataInicio').value = inicioSemana.toISOString().split('T')[0];
        document.getElementById('filtroDataFim').value = hoje.toISOString().split('T')[0];
    } else if (periodo === 'mes') {
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        document.getElementById('filtroDataInicio').value = inicioMes.toISOString().split('T')[0];
        document.getElementById('filtroDataFim').value = hoje.toISOString().split('T')[0];
    }
    
    atualizarFiltros();
}

function atualizarFiltros() {
    filtrosAtivos = {
        periodo: document.getElementById('filtroPeriodo').value,
        dataInicio: document.getElementById('filtroDataInicio').value,
        dataFim: document.getElementById('filtroDataFim').value
    };
}

function filtrarRelatorios() {
    return relatorios.filter(relatorio => {
        if (!filtrosAtivos.dataInicio || !filtrosAtivos.dataFim) {
            return true;
        }
        
        const dataRelatorio = new Date(relatorio.data_criacao).toISOString().split('T')[0];
        return dataRelatorio >= filtrosAtivos.dataInicio && dataRelatorio <= filtrosAtivos.dataFim;
    });
}

// Modal Functions
function abrirModalNovoRelatorio() {
    document.getElementById('modalTitulo').textContent = 'Novo Relatório';
    document.getElementById('relatorioForm').reset();
    document.getElementById('relatorioModal').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('relatorioModal').style.display = 'none';
}

async function salvarRelatorio(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const relatorioData = {
        titulo: document.getElementById('relatorioTitulo').value,
        tipo: document.getElementById('relatorioTipo').value,
        periodo: document.getElementById('relatorioPeriodo').value,
        conteudo: document.getElementById('relatorioConteudo').value,
        observacoes: document.getElementById('relatorioObservacoes').value
    };

    try {
        mostrarLoading(true);
        await criarRelatorio(relatorioData);
        mostrarMensagem('Relatório criado com sucesso!', 'success');
        fecharModal();
        carregarRelatorios();
    } catch (error) {
        mostrarMensagem('Erro ao criar relatório', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Ações dos Relatórios
function visualizarRelatorio(id) {
    const relatorio = relatorios.find(r => r.id === id);
    if (relatorio) {
        const conteudo = `
            Título: ${relatorio.titulo}
            Tipo: ${obterTextoTipoRelatorio(relatorio.tipo)}
            Data: ${formatarDataCompleta(relatorio.data_criacao)}
            
            CONTEÚDO:
            ${relatorio.conteudo}
            
            ${relatorio.observacoes ? `OBSERVAÇÕES: ${relatorio.observacoes}` : ''}
        `;
        alert(conteudo);
    }
}

function exportarRelatorio() {
    // Simular exportação
    mostrarMensagem('Relatório exportado com sucesso!', 'success');
}

function excluirRelatorioConfirmacao(id) {
    if (confirm('Tem certeza que deseja excluir este relatório?')) {
        excluirRelatorioHandler(id);
    }
}

async function excluirRelatorioHandler(id) {
    try {
        // Simular exclusão - implementar API real depois
        relatorios = relatorios.filter(r => r.id !== id);
        mostrarMensagem('Relatório excluído com sucesso!', 'success');
        renderizarRelatorios();
        atualizarEstatisticas();
    } catch (error) {
        mostrarMensagem('Erro ao excluir relatório', 'error');
    }
}

// Estatísticas e Gráfico
function atualizarEstatisticas() {
    const relatoriosFiltrados = filtrarRelatorios();
    const total = relatoriosFiltrados.length;
    
    // Dados de exemplo para estatísticas
    document.getElementById('totalRelatorios').textContent = total;
    document.getElementById('adesaoMedia').textContent = '92%';
    document.getElementById('atividadesRealizadas').textContent = '28';
    document.getElementById('evolucaoPositiva').textContent = '15';
}

function inicializarGraficoEvolucao() {
    const ctx = document.getElementById('evolucaoChart').getContext('2d');
    
    // Dados de exemplo para o gráfico
    const data = {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [
            {
                label: 'Mobilidade',
                data: [65, 70, 75, 80, 82, 85],
                borderColor: '#00B5C2',
                backgroundColor: 'rgba(0, 181, 194, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: 'Bem-estar',
                data: [70, 75, 78, 82, 85, 88],
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
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

// Utilitários
function obterTextoTipoRelatorio(tipo) {
    const textos = {
        'diario': 'Relatório Diário',
        'semanal': 'Relatório Semanal',
        'mensal': 'Relatório Mensal',
        'medicamento': 'Relatório de Medicação',
        'atividades': 'Relatório de Atividades',
        'incidente': 'Relatório de Incidente'
    };
    return textos[tipo] || tipo;
}

function formatarDataCompleta(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function obterUsuarioLogado() {
    // Tentar das chaves separadas primeiro
    const usuarioTipo = localStorage.getItem('usuarioTipo');
    const usuarioId = localStorage.getItem('usuarioId');
    const usuarioNome = localStorage.getItem('usuarioNome');
    
    if (usuarioTipo && usuarioId) {
        return {
            tipo: usuarioTipo,
            id: parseInt(usuarioId),
            nome: usuarioNome || 'Usuário'
        };
    }
    
    // Tentar do objeto único
    const chaves = ['usuarioLogado', 'currentUser', 'userData', 'loginData'];
    for (const chave of chaves) {
        const dados = localStorage.getItem(chave);
        if (dados) {
            try {
                return JSON.parse(dados);
            } catch (e) {
                console.log(`Erro ao parsear ${chave}:`, e);
            }
        }
    }
    
    return null;
}

function mostrarMensagem(mensagem, tipo) {
    // Implementar sistema de notificações
    console.log(`${tipo}: ${mensagem}`);
    alert(`${tipo === 'success' ? '✅' : '❌'} ${mensagem}`);
}

function mostrarLoading(mostrar) {
    // Implementar indicador de carregamento
    if (mostrar) {
        document.body.classList.add('loading');
    } else {
        document.body.classList.remove('loading');
    }
}

// Atualizar ícones periodicamente
setInterval(() => {
    feather.replace();
}, 1000);