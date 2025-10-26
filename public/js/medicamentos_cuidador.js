// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';
let medicamentos = [];
let filtrosAtivos = {
    data: '',
    status: 'todos',
    busca: ''
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    inicializarEventListeners();
    carregarMedicamentos();
    inicializarGraficoAdesao();
});

// Event Listeners
function inicializarEventListeners() {
    // Filtros
    document.getElementById('aplicarFiltros').addEventListener('click', aplicarFiltros);
    document.getElementById('filtroData').addEventListener('change', atualizarFiltros);
    document.getElementById('filtroStatus').addEventListener('change', atualizarFiltros);
    document.getElementById('filtroBusca').addEventListener('input', atualizarFiltros);

    // Modal
    document.getElementById('novoMedicamentoBtn').addEventListener('click', abrirModalNovoMedicamento);
    document.getElementById('fecharModal').addEventListener('click', fecharModal);
    document.getElementById('cancelarBtn').addEventListener('click', fecharModal);
    document.getElementById('medicamentoForm').addEventListener('submit', salvarMedicamento);

    // Fechar modal ao clicar fora
    document.getElementById('medicamentoModal').addEventListener('click', function(e) {
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
async function carregarMedicamentos() {
    try {
        mostrarLoading(true);
        
        // Obter cuidador logado
        const usuarioLogado = obterUsuarioLogado();
        if (!usuarioLogado) {
            throw new Error('Usuário não logado');
        }

        // Buscar paciente do cuidador
        const responsePaciente = await fetch(`${API_BASE_URL}/cuidadores/${usuarioLogado.id}/paciente`);
        if (!responsePaciente.ok) {
            throw new Error('Erro ao carregar paciente');
        }

        const paciente = await responsePaciente.json();
        
        // Buscar medicamentos do paciente
        const response = await fetch(`${API_BASE_URL}/pacientes/${paciente.id}/medicamentos/hoje`);
        
        if (!response.ok) {
            // Se a API não responder, usar dados de exemplo
            console.log('API não disponível, usando dados de exemplo');
            medicamentos = obterMedicamentosExemplo();
        } else {
            medicamentos = await response.json();
        }
        
        renderizarMedicamentos();
        atualizarEstatisticas();
    } catch (error) {
        console.error('Erro ao carregar medicamentos:', error);
        // Usar dados de exemplo em caso de erro
        medicamentos = obterMedicamentosExemplo();
        renderizarMedicamentos();
        atualizarEstatisticas();
        mostrarMensagem('Usando dados de demonstração', 'info');
    } finally {
        mostrarLoading(false);
    }
}

// Dados de exemplo (remover quando a API estiver pronta)
function obterMedicamentosExemplo() {
    return [
        {
            id: 1,
            nome_medicamento: "Metformina 850mg",
            dosagem: "1 comprimido",
            horario: "08:00",
            status: "pendente",
            via: "oral",
            instrucoes: "Tomar durante o café da manhã"
        },
        {
            id: 2,
            nome_medicamento: "Insulina NPH",
            dosagem: "20 UI",
            horario: "13:30",
            status: "pendente",
            via: "subcutanea",
            instrucoes: "Aplicar no abdômen"
        },
        {
            id: 3,
            nome_medicamento: "Losartana 50mg",
            dosagem: "1 comprimido",
            horario: "20:00",
            status: "pendente",
            via: "oral",
            instrucoes: "Tomar com água"
        },
        {
            id: 4,
            nome_medicamento: "Omeprazol 20mg",
            dosagem: "1 cápsula",
            horario: "07:30",
            status: "administrado",
            via: "oral",
            instrucoes: "Tomar 30 minutos antes do café"
        }
    ];
}

async function criarMedicamento(medicamentoData) {
    try {
        const response = await fetch(`${API_BASE_URL}/medicamentos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(medicamentoData)
        });

        if (!response.ok) throw new Error('Erro ao criar medicamento');
        
        const novoMedicamento = await response.json();
        medicamentos.unshift(novoMedicamento);
        return novoMedicamento;
    } catch (error) {
        throw error;
    }
}

async function atualizarStatusMedicamento(id, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/medicamentos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) throw new Error('Erro ao atualizar medicamento');
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// Renderização
function renderizarMedicamentos() {
    const container = document.getElementById('medicamentosContainer');
    const medicamentosFiltrados = filtrarMedicamentos();

    if (medicamentosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-feather="inbox"></i>
                <h4>Nenhum medicamento encontrado</h4>
                <p class="text-muted">Tente ajustar os filtros ou adicionar um novo medicamento.</p>
            </div>
        `;
        feather.replace();
        return;
    }

    container.innerHTML = medicamentosFiltrados.map(medicamento => `
        <div class="medicamento-card ${medicamento.status}">
            <div class="medicamento-header">
                <div class="medicamento-info">
                    <span class="status-badge ${medicamento.status}">
                        ${obterTextoStatus(medicamento.status)}
                    </span>
                    <h3>${medicamento.nome_medicamento || medicamento.nome}</h3>
                </div>
                <div class="medicamento-acoes">
                    ${medicamento.status !== 'administrado' ? `
                        <button class="btn btn-primary btn-sm" onclick="marcarComoAdministrado(${medicamento.id})">
                            <i data-feather="check"></i>
                            Administrar
                        </button>
                    ` : ''}
                    <button class="btn-icon" onclick="editarMedicamento(${medicamento.id})" title="Editar">
                        <i data-feather="edit"></i>
                    </button>
                    <button class="btn-icon" onclick="excluirMedicamentoConfirmacao(${medicamento.id})" title="Excluir">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            </div>
            <div class="medicamento-body">
                <p><strong>Dosagem:</strong> ${medicamento.dosagem}</p>
                <p><strong>Horário:</strong> ${medicamento.horario}</p>
                <p><strong>Via:</strong> ${obterTextoVia(medicamento.via)}</p>
                ${medicamento.instrucoes ? `<p><strong>Instruções:</strong> ${medicamento.instrucoes}</p>` : ''}
            </div>
            <div class="medicamento-metadata">
                <span><i data-feather="clock"></i> Próxima dose: ${medicamento.horario}</span>
            </div>
        </div>
    `).join('');

    feather.replace();
}

// Filtros
function aplicarFiltros() {
    renderizarMedicamentos();
    atualizarEstatisticas();
}

function atualizarFiltros() {
    filtrosAtivos = {
        data: document.getElementById('filtroData').value,
        status: document.getElementById('filtroStatus').value,
        busca: document.getElementById('filtroBusca').value.toLowerCase()
    };
}

function filtrarMedicamentos() {
    return medicamentos.filter(medicamento => {
        const matchStatus = filtrosAtivos.status === 'todos' || 
                           medicamento.status === filtrosAtivos.status;
        
        const matchBusca = !filtrosAtivos.busca ||
                          (medicamento.nome_medicamento || medicamento.nome).toLowerCase().includes(filtrosAtivos.busca) ||
                          (medicamento.dosagem && medicamento.dosagem.toLowerCase().includes(filtrosAtivos.busca));

        return matchStatus && matchBusca;
    });
}

// Modal Functions
function abrirModalNovoMedicamento() {
    document.getElementById('modalTitulo').textContent = 'Novo Medicamento';
    document.getElementById('medicamentoForm').reset();
    document.getElementById('medicamentoModal').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('medicamentoModal').style.display = 'none';
}

async function salvarMedicamento(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const medicamentoData = {
        nome: document.getElementById('medicamentoNome').value,
        dosagem: document.getElementById('medicamentoDosagem').value,
        frequencia: document.getElementById('medicamentoFrequencia').value,
        horario: document.getElementById('medicamentoHorario').value,
        via: document.getElementById('medicamentoVia').value,
        instrucoes: document.getElementById('medicamentoInstrucoes').value,
        status: 'pendente'
    };

    try {
        mostrarLoading(true);
        await criarMedicamento(medicamentoData);
        mostrarMensagem('Medicamento criado com sucesso!', 'success');
        fecharModal();
        carregarMedicamentos();
    } catch (error) {
        mostrarMensagem('Erro ao criar medicamento', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Ações dos Medicamentos
async function marcarComoAdministrado(id) {
    try {
        await atualizarStatusMedicamento(id, 'administrado');
        mostrarMensagem('Medicamento marcado como administrado!', 'success');
        carregarMedicamentos();
    } catch (error) {
        mostrarMensagem('Erro ao atualizar medicamento', 'error');
    }
}

function excluirMedicamentoConfirmacao(id) {
    if (confirm('Tem certeza que deseja excluir este medicamento?')) {
        excluirMedicamentoHandler(id);
    }
}

async function excluirMedicamentoHandler(id) {
    try {
        // Simular exclusão - implementar API real depois
        medicamentos = medicamentos.filter(m => m.id !== id);
        mostrarMensagem('Medicamento excluído com sucesso!', 'success');
        renderizarMedicamentos();
        atualizarEstatisticas();
    } catch (error) {
        mostrarMensagem('Erro ao excluir medicamento', 'error');
    }
}

// Estatísticas e Gráfico
function atualizarEstatisticas() {
    const medicamentosFiltrados = filtrarMedicamentos();
    const total = medicamentosFiltrados.length;
    const administrados = medicamentosFiltrados.filter(m => m.status === 'administrado').length;
    const pendentes = medicamentosFiltrados.filter(m => m.status === 'pendente').length;
    
    // Encontrar próximo horário
    const agora = new Date();
    const horariosPendentes = medicamentosFiltrados
        .filter(m => m.status === 'pendente')
        .map(m => {
            const [horas, minutos] = m.horario.split(':');
            const horario = new Date();
            horario.setHours(parseInt(horas), parseInt(minutos), 0, 0);
            return horario;
        })
        .filter(horario => horario > agora)
        .sort((a, b) => a - b);
    
    const proximoHorario = horariosPendentes.length > 0 ? 
        horariosPendentes[0].toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

    document.getElementById('totalMedicamentos').textContent = total;
    document.getElementById('medicamentosAdministrados').textContent = administrados;
    document.getElementById('medicamentosPendentes').textContent = pendentes;
    document.getElementById('proximoHorario').textContent = proximoHorario;
}

function inicializarGraficoAdesao() {
    const ctx = document.getElementById('adesaoChart').getContext('2d');
    
    // Dados de exemplo para o gráfico
    const data = {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        datasets: [
            {
                label: 'Taxa de Adesão (%)',
                data: [85, 92, 78, 95, 88, 90, 82],
                borderColor: '#00B5C2',
                backgroundColor: 'rgba(0, 181, 194, 0.1)',
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
                    display: false
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
function obterTextoStatus(status) {
    const textos = {
        'pendente': 'Pendente',
        'administrado': 'Administrado',
        'atrasado': 'Atrasado'
    };
    return textos[status] || status;
}

function obterTextoVia(via) {
    const textos = {
        'oral': 'Oral',
        'sublingual': 'Sublingual',
        'topica': 'Tópica',
        'inalatoria': 'Inalatória',
        'intramuscular': 'Intramuscular',
        'intravenosa': 'Intravenosa',
        'subcutanea': 'Subcutânea'
    };
    return textos[via] || via;
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
}, 1000);a