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

        console.log('Buscando atividades para cuidador ID:', usuarioLogado.id);

        // Tentar primeiro o endpoint geral de atividades
        let response;
        try {
            response = await fetch(`${API_BASE_URL}/atividades`);
            if (response.ok) {
                const todasAtividades = await response.json();
                // Filtrar atividades do cuidador logado
                atividades = todasAtividades.filter(ativ => ativ.cuidadorId === usuarioLogado.id);
                console.log('Atividades carregadas via endpoint geral:', atividades);
            } else {
                throw new Error('Endpoint geral não disponível');
            }
        } catch (erroGeral) {
            console.log('Tentando endpoint específico do cuidador:', erroGeral);
            
            // Tentar endpoint específico do cuidador
            response = await fetch(`${API_BASE_URL}/cuidadores/${usuarioLogado.id}/atividades`);
            
            if (response.ok) {
                atividades = await response.json();
                console.log('Atividades carregadas via endpoint específico:', atividades);
            } else {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
        }
        
        renderizarAtividades();
        atualizarEstatisticas();
        
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        // Usar dados de exemplo em caso de erro
        atividades = obterAtividadesExemplo();
        renderizarAtividades();
        atualizarEstatisticas();
        mostrarMensagem('API indisponível. Usando dados de demonstração.', 'info');
    } finally {
        mostrarLoading(false);
    }
}

// Dados de exemplo (para quando a API não está disponível)
function obterAtividadesExemplo() {
    const hoje = new Date().toISOString().split('T')[0];
    
    return [
        {
            id: 1,
            titulo: "Caminhada Matinal",
            tipo: "exercicio",
            descricao: "Caminhada leve no parque por 30 minutos",
            horario: "08:00",
            status: "concluida",
            observacoes: "Paciente se sentiu bem durante a atividade",
            data: hoje,
            cuidadorId: obterUsuarioLogado()?.id || 13
        },
        {
            id: 2,
            titulo: "Café da Manhã",
            tipo: "alimentacao",
            descricao: "Refeição balanceada com frutas e pão integral",
            horario: "08:30",
            status: "concluida",
            observacoes: "Bom apetite",
            data: hoje,
            cuidadorId: obterUsuarioLogado()?.id || 13
        },
        {
            id: 3,
            titulo: "Banho e Higiene",
            tipo: "higiene",
            descricao: "Banho completo e cuidados de higiene pessoal",
            horario: "10:00",
            status: "pendente",
            data: hoje,
            cuidadorId: obterUsuarioLogado()?.id || 13
        },
        {
            id: 4,
            titulo: "Sessão de Fisioterapia",
            tipo: "exercicio",
            descricao: "Exercícios de fortalecimento muscular",
            horario: "14:00",
            status: "pendente",
            data: hoje,
            cuidadorId: obterUsuarioLogado()?.id || 13
        },
        {
            id: 5,
            titulo: "Lanche da Tarde",
            tipo: "alimentacao",
            descricao: "Iogurte natural com granola",
            horario: "16:00",
            status: "pendente",
            data: hoje,
            cuidadorId: obterUsuarioLogado()?.id || 13
        },
        {
            id: 6,
            titulo: "Medicação - Antibiótico",
            tipo: "medicacao",
            descricao: "Tomar antibiótico conforme prescrição médica",
            horario: "19:00",
            status: "pendente",
            data: hoje,
            cuidadorId: obterUsuarioLogado()?.id || 13
        }
    ];
}

async function criarAtividade(atividadeData) {
    try {
        const usuarioLogado = obterUsuarioLogado();
        if (!usuarioLogado) {
            throw new Error('Usuário não logado');
        }

        // Adicionar dados do cuidador
        const dadosCompletos = {
            ...atividadeData,
            cuidadorId: usuarioLogado.id,
            data: new Date().toISOString().split('T')[0],
            id: Date.now() // ID temporário para dados locais
        };

        // Tentar salvar na API
        try {
            const response = await fetch(`${API_BASE_URL}/atividades/registrar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosCompletos)
            });

            if (response.ok) {
                const novaAtividade = await response.json();
                atividades.unshift(novaAtividade);
                return novaAtividade;
            } else {
                throw new Error('API não disponível');
            }
        } catch (apiError) {
            console.log('Salvando localmente (API indisponível):', apiError);
            // Salvar localmente se a API falhar
            atividades.unshift(dadosCompletos);
            return dadosCompletos;
        }
        
    } catch (error) {
        console.error('Erro ao criar atividade:', error);
        throw error;
    }
}

async function atualizarStatusAtividade(id, status) {
    try {
        // Tentar atualizar na API
        try {
            const response = await fetch(`${API_BASE_URL}/atividades/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('API não disponível');
            }
        } catch (apiError) {
            console.log('Atualizando localmente (API indisponível):', apiError);
            // Atualizar localmente se a API falhar
            const index = atividades.findIndex(a => a.id === id);
            if (index !== -1) {
                atividades[index].status = status;
                return atividades[index];
            }
            throw new Error('Atividade não encontrada');
        }
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
                <span><i data-feather="calendar"></i> ${formatarData(new Date(atividade.data || new Date()))}</span>
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
    const dataFiltro = filtrosAtivos.data;
    
    return atividades.filter(atividade => {
        const matchData = !dataFiltro || atividade.data === dataFiltro;
        const matchStatus = filtrosAtivos.status === 'todos' || 
                           atividade.status === filtrosAtivos.status;
        const matchTipo = filtrosAtivos.tipo === 'todos' || 
                         atividade.tipo === filtrosAtivos.tipo;

        return matchData && matchStatus && matchTipo;
    });
}

// Modal Functions
function abrirModalNovaAtividade() {
    document.getElementById('modalTitulo').textContent = 'Nova Atividade';
    document.getElementById('atividadeForm').reset();
    
    // Definir horário padrão como próxima hora redonda
    const agora = new Date();
    const proximaHora = new Date(agora.getTime() + 60 * 60 * 1000);
    document.getElementById('atividadeHorario').value = 
        proximaHora.getHours().toString().padStart(2, '0') + ':00';
    
    document.getElementById('atividadeModal').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('atividadeModal').style.display = 'none';
}

async function salvarAtividade(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const atividadeData = {
        titulo: document.getElementById('atividadeTitulo').value.trim(),
        tipo: document.getElementById('atividadeTipo').value,
        horario: document.getElementById('atividadeHorario').value,
        descricao: document.getElementById('atividadeDescricao').value.trim(),
        observacoes: document.getElementById('atividadeObservacoes').value.trim(),
        status: 'pendente'
    };

    // Validação básica
    if (!atividadeData.titulo || !atividadeData.descricao) {
        mostrarMensagem('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    try {
        mostrarLoading(true);
        await criarAtividade(atividadeData);
        mostrarMensagem('Atividade criada com sucesso!', 'success');
        fecharModal();
        carregarAtividades();
    } catch (error) {
        console.error('Erro ao criar atividade:', error);
        mostrarMensagem('Erro ao criar atividade: ' + error.message, 'error');
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
        console.error('Erro ao atualizar atividade:', error);
        mostrarMensagem('Erro ao atualizar atividade: ' + error.message, 'error');
    }
}

function editarAtividade(id) {
    // Implementar edição se necessário
    mostrarMensagem('Funcionalidade de edição em desenvolvimento', 'info');
}

function excluirAtividadeConfirmacao(id) {
    if (confirm('Tem certeza que deseja excluir esta atividade?')) {
        excluirAtividadeHandler(id);
    }
}

async function excluirAtividadeHandler(id) {
    try {
        // Tentar excluir na API
        try {
            const response = await fetch(`${API_BASE_URL}/atividades/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('API não disponível');
            }
        } catch (apiError) {
            console.log('Excluindo localmente (API indisponível):', apiError);
        }

        // Sempre excluir localmente
        atividades = atividades.filter(a => a.id !== id);
        mostrarMensagem('Atividade excluída com sucesso!', 'success');
        renderizarAtividades();
        atualizarEstatisticas();
        
    } catch (error) {
        console.error('Erro ao excluir atividade:', error);
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
    
    // Calcular dados reais das atividades
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

function formatarData(data) {
    return data.toLocaleDateString('pt-BR');
}

function obterUsuarioLogado() {
    // Tentar das chaves separadas primeiro
    const usuarioTipo = localStorage.getItem('usuarioTipo');
    const usuarioId = localStorage.getItem('usuarioId');
    const usuarioNome = localStorage.getItem('usuarioNome');
    
    console.log('Dados do localStorage:', { usuarioTipo, usuarioId, usuarioNome });
    
    if (usuarioTipo && usuarioId) {
        return {
            tipo: usuarioTipo,
            id: parseInt(usuarioId),
            nome: usuarioNome || 'Cuidador'
        };
    }
    
    // Tentar do objeto único
    const chaves = ['usuarioLogado', 'currentUser', 'userData', 'loginData'];
    for (const chave of chaves) {
        const dados = localStorage.getItem(chave);
        if (dados) {
            try {
                const usuario = JSON.parse(dados);
                console.log(`Usuário encontrado em ${chave}:`, usuario);
                return usuario;
            } catch (e) {
                console.log(`Erro ao parsear ${chave}:`, e);
            }
        }
    }
    
    console.log('Nenhum usuário logado encontrado, usando padrão');
    // Retornar um usuário padrão para desenvolvimento
    return {
        tipo: 'cuidador',
        id: 13,
        nome: 'Cuidador Teste'
    };
}

function mostrarMensagem(mensagem, tipo) {
    // Sistema de notificações simples
    const cores = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    console.log(`${tipo.toUpperCase()}: ${mensagem}`);
    
    // Criar notificação temporária
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${cores[tipo] || '#333'};
        color: white;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 300px;
    `;
    notification.textContent = mensagem;
    
    document.body.appendChild(notification);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

function mostrarLoading(mostrar) {
    const loader = document.getElementById('loadingOverlay') || criarLoadingOverlay();
    
    if (mostrar) {
        loader.style.display = 'flex';
        document.body.classList.add('loading');
    } else {
        loader.style.display = 'none';
        document.body.classList.remove('loading');
    }
}

function criarLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255,255,255,0.8);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;
    
    overlay.innerHTML = `
        <div style="text-align: center;">
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite; margin: 0 auto;"></div>
            <p style="margin-top: 15px; color: #333;">Carregando...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    document.body.appendChild(overlay);
    return overlay;
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
// Atualizar ícones periodicamente
setInterval(() => {
    feather.replace();
}, 1000);

// ====================== FUNÇÃO VOLTAR PARA LANDING PAGE ====================== //
function voltarParaLanding() {
    console.log('🏠 Voltando para a landing page...');
    window.location.href = 'landingpage.html';
}

// Exportar funções globais para uso no HTML
window.marcarComoConcluida = marcarComoConcluida;
window.editarAtividade = editarAtividade;
window.excluirAtividadeConfirmacao = excluirAtividadeConfirmacao;