// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';
let atividades = [];
let filtrosAtivos = {
    data: '',
    status: 'todos',
    tipo: 'todos'
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
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

    // Fechar modal ao clicar fora
    document.getElementById('atividadeModal').addEventListener('click', function(e) {
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
async function carregarAtividades() {
    try {
        mostrarLoading(true);
        
        // Obter cuidador logado
        const usuarioLogado = obterUsuarioLogado();
        if (!usuarioLogado) {
            throw new Error('Usuário não logado');
        }

        // Buscar atividades do cuidador
        const response = await fetch(`${API_BASE_URL}/cuidadores/${usuarioLogado.id}/atividades`);
        
        if (!response.ok) {
            // Se a API não responder, usar dados de exemplo
            console.log('API não disponível, usando dados de exemplo');
            atividades = obterAtividadesExemplo();
        } else {
            atividades = await response.json();
        }
        
        renderizarAtividades();
        atualizarEstatisticas();
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        // Usar dados de exemplo em caso de erro
        atividades = obterAtividadesExemplo();
        renderizarAtividades();
        atualizarEstatisticas();
        mostrarMensagem('Usando dados de demonstração', 'info');
    } finally {
        mostrarLoading(false);
    }
}

// Dados de exemplo (remover quando a API estiver pronta)
function obterAtividadesExemplo() {
    return [
        {
            id: 1,
            titulo: "Caminhada Matinal",
            tipo: "exercicio",
            descricao: "Caminhada leve no parque por 30 minutos",
            horario: "08:00",
            status: "concluida",
            observacoes: "Paciente se sentiu bem durante a atividade"
        },
        {
            id: 2,
            titulo: "Café da Manhã",
            tipo: "alimentacao",
            descricao: "Refeição balanceada com frutas e pão integral",
            horario: "08:30",
            status: "concluida",
            observacoes: "Bom apetite"
        },
        {
            id: 3,
            titulo: "Banho e Higiene",
            tipo: "higiene",
            descricao: "Banho completo e cuidados de higiene pessoal",
            horario: "10:00",
            status: "pendente"
        },
        {
            id: 4,
            titulo: "Sessão de Fisioterapia",
            tipo: "exercicio",
            descricao: "Exercícios de fortalecimento muscular",
            horario: "14:00",
            status: "pendente"
        },
        {
            id: 5,
            titulo: "Lanche da Tarde",
            tipo: "alimentacao",
            descricao: "Iogurte natural com granola",
            horario: "16:00",
            status: "pendente"
        }
    ];
}

async function criarAtividade(atividadeData) {
    try {
        const response = await fetch(`${API_BASE_URL}/atividades/registrar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(atividadeData)
        });

        if (!response.ok) throw new Error('Erro ao criar atividade');
        
        const novaAtividade = await response.json();
        atividades.unshift(novaAtividade);
        return novaAtividade;
    } catch (error) {
        throw error;
    }
}

async function atualizarStatusAtividade(id, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/atividades/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) throw new Error('Erro ao atualizar atividade');
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// Renderização
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

    container.innerHTML = atividadesFiltradas.map(atividade => `
        <div class="atividade-card ${atividade.status}">
            <div class="atividade-header">
                <div class="atividade-info">
                    <span class="tipo-badge ${atividade.tipo}">
                        ${obterTextoTipo(atividade.tipo)}
                    </span>
                    <span class="status-badge ${atividade.status}">
                        ${obterTextoStatus(atividade.status)}
                    </span>
                    <h3>${atividade.titulo}</h3>
                </div>
                <div class="atividade-acoes">
                    ${atividade.status !== 'concluida' ? `
                        <button class="btn btn-primary btn-sm" onclick="marcarComoConcluida(${atividade.id})">
                            <i data-feather="check"></i>
                            Concluir
                        </button>
                    ` : ''}
                    <button class="btn-icon" onclick="editarAtividade(${atividade.id})" title="Editar">
                        <i data-feather="edit"></i>
                    </button>
                    <button class="btn-icon" onclick="excluirAtividadeConfirmacao(${atividade.id})" title="Excluir">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            </div>
            <div class="atividade-body">
                <p>${atividade.descricao}</p>
                ${atividade.observacoes ? `<p><strong>Observações:</strong> ${atividade.observacoes}</p>` : ''}
            </div>
            <div class="atividade-metadata">
                <span><i data-feather="clock"></i> Horário: ${atividade.horario}</span>
                <span><i data-feather="calendar"></i> ${formatarData(new Date())}</span>
            </div>
        </div>
    `).join('');

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

        return matchStatus && matchTipo;
    });
}

// Modal Functions
function abrirModalNovaAtividade() {
    document.getElementById('modalTitulo').textContent = 'Nova Atividade';
    document.getElementById('atividadeForm').reset();
    document.getElementById('atividadeModal').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('atividadeModal').style.display = 'none';
}

async function salvarAtividade(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const atividadeData = {
        titulo: document.getElementById('atividadeTitulo').value,
        tipo: document.getElementById('atividadeTipo').value,
        horario: document.getElementById('atividadeHorario').value,
        descricao: document.getElementById('atividadeDescricao').value,
        observacoes: document.getElementById('atividadeObservacoes').value,
        status: 'pendente'
    };

    try {
        mostrarLoading(true);
        await criarAtividade(atividadeData);
        mostrarMensagem('Atividade criada com sucesso!', 'success');
        fecharModal();
        carregarAtividades();
    } catch (error) {
        mostrarMensagem('Erro ao criar atividade', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Ações das Atividades
async function marcarComoConcluida(id) {
    try {
        await atualizarStatusAtividade(id, 'concluida');
        mostrarMensagem('Atividade marcada como concluída!', 'success');
        carregarAtividades();
    } catch (error) {
        mostrarMensagem('Erro ao atualizar atividade', 'error');
    }
}

function excluirAtividadeConfirmacao(id) {
    if (confirm('Tem certeza que deseja excluir esta atividade?')) {
        excluirAtividadeHandler(id);
    }
}

async function excluirAtividadeHandler(id) {
    try {
        // Simular exclusão - implementar API real depois
        atividades = atividades.filter(a => a.id !== id);
        mostrarMensagem('Atividade excluída com sucesso!', 'success');
        renderizarAtividades();
        atualizarEstatisticas();
    } catch (error) {
        mostrarMensagem('Erro ao excluir atividade', 'error');
    }
}

// Estatísticas e Gráfico
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

function inicializarGraficoAtividades() {
    const ctx = document.getElementById('atividadesChart').getContext('2d');
    
    // Dados de exemplo para o gráfico
    const data = {
        labels: ['Alimentação', 'Exercício', 'Higiene', 'Medicação', 'Repouso', 'Social'],
        datasets: [{
            data: [25, 20, 15, 20, 10, 10],
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

    new Chart(ctx, {
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
        'social': 'Social'
    };
    return textos[tipo] || tipo;
}

function formatarData(data) {
    return data.toLocaleDateString('pt-BR');
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