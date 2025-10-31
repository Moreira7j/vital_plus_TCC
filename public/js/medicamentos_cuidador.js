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

// Modificar a função carregarMedicamentos
async function carregarMedicamentos() {
    try {
        mostrarLoading(true);
        
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        if (!pacienteId) {
            throw new Error('Nenhum paciente selecionado');
        }

        console.log(`🎯 Buscando medicamentos para paciente: ${pacienteId}`);

        const response = await fetch(`/api/pacientes/${pacienteId}/medicamentos/hoje`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar medicamentos da API');
        }
        
        medicamentos = await response.json();
        console.log('📦 Medicamentos carregados da API:', medicamentos);
        
        renderizarMedicamentos();
        atualizarEstatisticas();
    } catch (error) {
        console.error('Erro ao carregar medicamentos:', error);
        medicamentos = [];
        renderizarMedicamentos();
        atualizarEstatisticas();
        mostrarMensagem('Erro ao carregar medicamentos: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Função corrigida para marcar como administrado
async function marcarComoAdministrado(id) {
    console.log(`🔄 Tentando marcar medicamento ${id} como administrado`);
    
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        console.log(`👤 ID do usuário: ${usuarioId}`);
        
        const resultado = await atualizarStatusMedicamento(id, 'administrado', usuarioId);
        console.log('✅ Resposta da API:', resultado);
        
        mostrarMensagem('Medicamento marcado como administrado!', 'success');
        
        // Atualizar a interface imediatamente
        const medicamentoIndex = medicamentos.findIndex(m => m.id === id);
        if (medicamentoIndex !== -1) {
            medicamentos[medicamentoIndex].status = 'administrado';
            renderizarMedicamentos();
            atualizarEstatisticas();
        }
        
    } catch (error) {
        console.error('❌ Erro ao marcar como administrado:', error);
        mostrarMensagem('Erro ao administrar medicamento: ' + error.message, 'error');
    }
}

// Função corrigida para atualizar status
async function atualizarStatusMedicamento(id, status, cuidador_id = null) {
    try {
        console.log(`📤 Enviando atualização para medicamento ${id}:`, { status, cuidador_id });
        
        const payload = { status };
        if (cuidador_id) {
            payload.cuidador_id = cuidador_id;
        }

        const response = await fetch(`/api/medicamentos/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        console.log('📥 Resposta do servidor:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro na resposta:', errorText);
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Atualização bem-sucedida:', data);
        return data;
        
    } catch (error) {
        console.error('❌ Erro completo ao atualizar medicamento:', error);
        throw error;
    }
}

// Modificar a função renderizarMedicamentos para tratar campos undefined
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

    container.innerHTML = medicamentosFiltrados.map(medicamento => {
        // Garantir valores padrão para campos undefined
        const nome = medicamento.nome_medicamento || medicamento.nome || 'Medicamento não informado';
        const dosagem = medicamento.dosagem || 'Dosagem não informada';
        const horario = medicamento.horario || 'Horário não informado';
        const via = medicamento.via || 'Via não informada';
        const status = medicamento.status || 'pendente';
        const instrucoes = medicamento.instrucoes || '';

        return `
        <div class="medicamento-card ${status}">
            <div class="medicamento-header">
                <div class="medicamento-info">
                    <span class="status-badge ${status}">
                        ${obterTextoStatus(status)}
                    </span>
                    <h3>${nome}</h3>
                </div>
                <div class="medicamento-acoes">
                    ${status !== 'administrado' ? `
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
                <p><strong>Dosagem:</strong> ${dosagem}</p>
                <p><strong>Horário:</strong> ${horario}</p>
                <p><strong>Via:</strong> ${obterTextoVia(via)}</p>
                ${instrucoes ? `<p><strong>Instruções:</strong> ${instrucoes}</p>` : ''}
            </div>
            <div class="medicamento-metadata">
                <span><i data-feather="clock"></i> Próxima dose: ${horario}</span>
            </div>
        </div>
        `;
    }).join('');

    feather.replace();
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

// Função corrigida para criar medicamento
async function criarMedicamento(medicamentoData) {
    try {
        console.log('📤 Enviando dados do medicamento:', medicamentoData);

        const pacienteId = localStorage.getItem('pacienteSelecionadoId');

        if (!pacienteId) {
            throw new Error('Nenhum paciente selecionado');
        }

        // Preparar dados para a API
        const dadosParaAPI = {
            paciente_id: pacienteId,
            nome: medicamentoData.nome,
            dosagem: medicamentoData.dosagem,
            frequencia: medicamentoData.frequencia,
            horario: medicamentoData.horario,
            via: medicamentoData.via,
            instrucoes: medicamentoData.instrucoes
        };

        console.log('💾 Dados para API:', dadosParaAPI);

        const response = await fetch('/api/medicamentos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosParaAPI)
        });

        console.log('📥 Resposta do servidor:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro na resposta:', errorText);
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Medicamento criado com sucesso:', data);
        return data;

    } catch (error) {
        console.error('❌ Erro ao criar medicamento:', error);
        throw error;
    }
}

async function atualizarStatusMedicamento(id, status) {
    try {
        const response = await fetch(`/api/medicamentos/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar medicamento');
        }
        
        return await response.json();
    } catch (error) {
        console.error('❌ Erro ao atualizar medicamento:', error);
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
        const response = await fetch(`/api/medicamentos/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Erro ao excluir medicamento');
        }

        // Remover da lista local
        medicamentos = medicamentos.filter(m => m.id !== id);
        mostrarMensagem('Medicamento excluído com sucesso!', 'success');
        renderizarMedicamentos();
        atualizarEstatisticas();
    } catch (error) {
        console.error('❌ Erro ao excluir medicamento:', error);
        mostrarMensagem('Erro ao excluir medicamento', 'error');
    }
}

// Estatísticas e Gráfico
// Substitua a função atualizarEstatisticas por esta versão corrigida:
function atualizarEstatisticas() {
    const medicamentosFiltrados = filtrarMedicamentos();
    const total = medicamentosFiltrados.length;
    const administrados = medicamentosFiltrados.filter(m => m.status === 'administrado').length;
    const pendentes = medicamentosFiltrados.filter(m => m.status === 'pendente').length;
    
    // Encontrar próximo horário - CORRIGIDO
    const agora = new Date();
    const horariosPendentes = medicamentosFiltrados
        .filter(m => m.status === 'pendente' && m.horario) // Só processar se horário existe
        .map(m => {
            try {
                // Verificar se o horário está no formato correto
                if (m.horario && typeof m.horario === 'string' && m.horario.includes(':')) {
                    const [horas, minutos] = m.horario.split(':');
                    const horario = new Date();
                    horario.setHours(parseInt(horas), parseInt(minutos), 0, 0);
                    return horario;
                }
                return null;
            } catch (error) {
                console.warn('Horário inválido:', m.horario);
                return null;
            }
        })
        .filter(horario => horario && horario > agora) // Remover nulos e horários passados
        .sort((a, b) => a - b);
    
    const proximoHorario = horariosPendentes.length > 0 ? 
        horariosPendentes[0].toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

    document.getElementById('totalMedicamentos').textContent = total;
    document.getElementById('medicamentosAdministrados').textContent = administrados;
    document.getElementById('medicamentosPendentes').textContent = pendentes;
    document.getElementById('proximoHorario').textContent = proximoHorario;
}

// Adicione esta função para validar dados antes de renderizar
function validarMedicamento(med) {
    return {
        id: med.id || 0,
        nome_medicamento: med.nome_medicamento || med.nome || 'Medicamento não informado',
        nome: med.nome_medicamento || med.nome || 'Medicamento não informado',
        dosagem: med.dosagem || 'Dosagem não informada',
        frequencia: med.frequencia || 'Frequência não informada',
        horario: med.horario || '--:--',
        via: med.via || 'Via não informada',
        instrucoes: med.instrucoes || '',
        status: med.status || 'pendente'
    };
}

// Modifique a função renderizarMedicamentos para usar a validação
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

    container.innerHTML = medicamentosFiltrados.map(medicamento => {
        // Validar e padronizar os dados do medicamento
        const med = validarMedicamento(medicamento);
        
        return `
        <div class="medicamento-card ${med.status}">
            <div class="medicamento-header">
                <div class="medicamento-info">
                    <span class="status-badge ${med.status}">
                        ${obterTextoStatus(med.status)}
                    </span>
                    <h3>${med.nome_medicamento}</h3>
                </div>
                <div class="medicamento-acoes">
                    ${med.status !== 'administrado' ? `
                        <button class="btn btn-primary btn-sm" onclick="marcarComoAdministrado(${med.id})">
                            <i data-feather="check"></i>
                            Administrar
                        </button>
                    ` : ''}
                    <button class="btn-icon" onclick="editarMedicamento(${med.id})" title="Editar">
                        <i data-feather="edit"></i>
                    </button>
                    <button class="btn-icon" onclick="excluirMedicamentoConfirmacao(${med.id})" title="Excluir">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            </div>
            <div class="medicamento-body">
                <p><strong>Dosagem:</strong> ${med.dosagem}</p>
                <p><strong>Horário:</strong> ${med.horario}</p>
                <p><strong>Via:</strong> ${obterTextoVia(med.via)}</p>
                ${med.instrucoes ? `<p><strong>Instruções:</strong> ${med.instrucoes}</p>` : ''}
            </div>
            <div class="medicamento-metadata">
                <span><i data-feather="clock"></i> Próxima dose: ${med.horario}</span>
            </div>
        </div>
        `;
    }).join('');

    feather.replace();
}

// Modifique a função carregarMedicamentos para melhor tratamento de erro
async function carregarMedicamentos() {
    try {
        mostrarLoading(true);
        
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        if (!pacienteId) {
            throw new Error('Nenhum paciente selecionado');
        }

        console.log(`🎯 Buscando medicamentos para paciente: ${pacienteId}`);

        const response = await fetch(`/api/pacientes/${pacienteId}/medicamentos/hoje`);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        // Validar que a resposta é um array
        if (!Array.isArray(data)) {
            console.warn('Resposta da API não é um array:', data);
            medicamentos = [];
        } else {
            medicamentos = data;
        }
        
        console.log('📦 Medicamentos carregados da API:', medicamentos);
        
        renderizarMedicamentos();
        atualizarEstatisticas();
    } catch (error) {
        console.error('Erro ao carregar medicamentos:', error);
        medicamentos = [];
        renderizarMedicamentos();
        atualizarEstatisticas();
        mostrarMensagem('Erro ao carregar medicamentos: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
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

// Função corrigida para criar medicamento
async function criarMedicamento(medicamentoData) {
    try {
        console.log('📤 Enviando dados do medicamento:', medicamentoData);

        const token = localStorage.getItem('token');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');

        if (!pacienteId) {
            throw new Error('Nenhum paciente selecionado');
        }

        const response = await fetch('/api/medicamentos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                ...medicamentoData,
                paciente_id: pacienteId
            })
        });

        console.log('📥 Resposta do servidor:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Medicamento criado com sucesso:', data);
        return data;

    } catch (error) {
        console.error('❌ Erro ao criar medicamento:', error);
        throw error;
    }
}

// Modificar a função salvarMedicamento para debug
async function salvarMedicamento(e) {
    e.preventDefault();
    
    console.log('📝 Iniciando salvamento de medicamento...');
    
    // Coletar dados do formulário de forma explícita
    const medicamentoData = {
        nome: document.getElementById('medicamentoNome').value.trim(),
        dosagem: document.getElementById('medicamentoDosagem').value.trim(),
        frequencia: document.getElementById('medicamentoFrequencia').value,
        horario: document.getElementById('medicamentoHorario').value,
        via: document.getElementById('medicamentoVia').value,
        instrucoes: document.getElementById('medicamentoInstrucoes').value.trim()
    };

    console.log('📋 Dados do formulário:', medicamentoData);

    // Validar campos obrigatórios
    if (!medicamentoData.nome || !medicamentoData.dosagem || !medicamentoData.horario || !medicamentoData.via) {
        mostrarMensagem('Preencha todos os campos obrigatórios!', 'error');
        return;
    }

    try {
        mostrarLoading(true);
        const resultado = await criarMedicamento(medicamentoData);
        console.log('✅ Medicamento criado com sucesso:', resultado);
        mostrarMensagem('Medicamento criado com sucesso!', 'success');
        fecharModal();
        await carregarMedicamentos(); // Recarregar a lista
    } catch (error) {
        console.error('❌ Erro ao criar medicamento:', error);
        mostrarMensagem('Erro ao criar medicamento: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Modificar a função criarMedicamento para melhor debug
async function criarMedicamento(medicamentoData) {
    try {
        console.log('📤 Enviando dados do medicamento para API:', medicamentoData);

        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        if (!pacienteId) {
            throw new Error('Nenhum paciente selecionado');
        }

        // Preparar dados para API
        const dadosParaAPI = {
            paciente_id: parseInt(pacienteId),
            nome: medicamentoData.nome,
            dosagem: medicamentoData.dosagem,
            frequencia: medicamentoData.frequencia,
            horario: medicamentoData.horario,
            via: medicamentoData.via,
            instrucoes: medicamentoData.instrucoes
        };

        console.log('💾 Dados enviados para API:', dadosParaAPI);

        const response = await fetch('/api/medicamentos', {
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
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Resposta da API:', data);
        return data;

    } catch (error) {
        console.error('❌ Erro completo ao criar medicamento:', error);
        throw error;
    }
}

// ====================== FUNÇÃO VOLTAR PARA LANDING PAGE ====================== //
function voltarParaLanding() {
    console.log('🏠 Voltando para a landing page...');
    window.location.href = 'landingpage.html';
}