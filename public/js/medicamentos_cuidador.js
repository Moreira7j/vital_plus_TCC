// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';
let medicamentos = [];
let filtrosAtivos = {
    data: '',
    status: 'todos',
    busca: ''
};

// Variáveis globais para controle
let medicamentoEditando = null;
let medicamentoParaExcluir = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
    feather.replace();
    inicializarEventListeners();
    carregarMedicamentos();
    inicializarGraficoAdesao();
});

function inicializarEventListeners() {
    // Filtros
    document.getElementById('aplicarFiltros').addEventListener('click', aplicarFiltros);
    document.getElementById('filtroData').addEventListener('change', atualizarFiltros);
    document.getElementById('filtroStatus').addEventListener('change', atualizarFiltros);
    document.getElementById('filtroBusca').addEventListener('input', atualizarFiltros);

    // Modal - NOVO MEDICAMENTO
    document.getElementById('novoMedicamentoBtn').addEventListener('click', abrirModalNovoMedicamento);

    // Modal - FECHAR/CANCELAR
    document.getElementById('fecharModal').addEventListener('click', fecharModal);
    document.getElementById('cancelarBtn').addEventListener('click', fecharModal);

    // Modal - SALVAR (tanto criar quanto editar)
    document.getElementById('medicamentoForm').addEventListener('submit', salvarMedicamento);

    // Modal de Confirmação - EXCLUSÃO
    document.getElementById('confirmarExclusaoBtn').addEventListener('click', confirmarExclusao);
    document.getElementById('cancelarExclusaoBtn').addEventListener('click', fecharModalConfirmacao);
    document.getElementById('fecharModalConfirmacao').addEventListener('click', fecharModalConfirmacao);

    // Fechar modais ao clicar fora
    document.getElementById('medicamentoModal').addEventListener('click', function (e) {
        if (e.target === this) fecharModal();
    });
    
    document.getElementById('confirmacaoModal').addEventListener('click', function (e) {
        if (e.target === this) fecharModalConfirmacao();
    });

    console.log('✅ Event listeners inicializados');
}

// Modal de Confirmação Personalizado
function abrirModalConfirmacaoExclusao(id) {
    medicamentoParaExcluir = id;
    
    // Encontrar o nome do medicamento para mostrar na confirmação
    const medicamento = medicamentos.find(m => m.id === id);
    const nomeMedicamento = medicamento ? (medicamento.nome_medicamento || medicamento.nome) : 'este medicamento';
    
    document.getElementById('textoConfirmacaoExclusao').textContent = 
        `Tem certeza que deseja excluir "${nomeMedicamento}"?`;
    
    document.getElementById('confirmacaoModal').style.display = 'flex';
}

function fecharModalConfirmacao() {
    document.getElementById('confirmacaoModal').style.display = 'none';
    medicamentoParaExcluir = null;
}

async function confirmarExclusao() {
    if (!medicamentoParaExcluir) return;
    
    try {
        mostrarLoading(true);
        await excluirMedicamentoHandler(medicamentoParaExcluir);
        fecharModalConfirmacao();
        mostrarMensagem('Medicamento excluído com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao excluir medicamento:', error);
        mostrarMensagem('Erro ao excluir medicamento', 'error');
    } finally {
        mostrarLoading(false);
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

        // ✅ ADICIONAR MENSAGEM DE SUCESSO
        mostrarMensagem('Medicamento administrado com sucesso!', 'success');

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

// Renderização
function renderizarMedicamentos() {
    const container = document.getElementById('medicamentosContainer');

    if (!container) {
        console.error('❌ Container de medicamentos não encontrado');
        return;
    }

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
                    <button class="btn-icon btn-edit" onclick="editarMedicamento(${med.id})" title="Editar Medicamento">
                        <i data-feather="edit-2"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="abrirModalConfirmacaoExclusao(${med.id})" title="Excluir">
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
    medicamentoEditando = null;
    document.getElementById('medicamentoForm').reset();
    document.getElementById('medicamentoModal').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('medicamentoModal').style.display = 'none';
    medicamentoEditando = null;
    document.getElementById('medicamentoForm').reset();
}

// Função corrigida para criar medicamento
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

// Função para atualizar medicamento
async function atualizarMedicamento(id, medicamentoData) {
    try {
        console.log('📤 Enviando atualização do medicamento:', { id, ...medicamentoData });

        const response = await fetch(`/api/medicamentos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(medicamentoData)
        });

        console.log('📥 Status da resposta:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro na resposta:', errorText);
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Medicamento atualizado com sucesso:', data);
        return data;

    } catch (error) {
        console.error('❌ Erro completo ao atualizar medicamento:', error);
        throw error;
    }
}

// Modificar a função salvarMedicamento para lidar com edição
async function salvarMedicamento(e) {
    e.preventDefault();

    console.log('📝 Iniciando salvamento de medicamento...');
    console.log(`🔧 Modo: ${medicamentoEditando ? 'EDIÇÃO' : 'CRIAÇÃO'}`);

    // Coletar dados do formulário
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
    if (!medicamentoData.nome) {
        mostrarMensagem('Nome do medicamento é obrigatório!', 'error');
        document.getElementById('medicamentoNome').focus();
        return;
    }

    if (!medicamentoData.dosagem) {
        mostrarMensagem('Dosagem é obrigatória!', 'error');
        document.getElementById('medicamentoDosagem').focus();
        return;
    }

    if (!medicamentoData.horario) {
        mostrarMensagem('Horário é obrigatório!', 'error');
        document.getElementById('medicamentoHorario').focus();
        return;
    }

    if (!medicamentoData.via) {
        mostrarMensagem('Via de administração é obrigatória!', 'error');
        document.getElementById('medicamentoVia').focus();
        return;
    }

    try {
        mostrarLoading(true);

        let resultado;
        if (medicamentoEditando) {
            // Modo edição
            console.log(`🔄 Atualizando medicamento ID: ${medicamentoEditando}`);
            resultado = await atualizarMedicamento(medicamentoEditando, medicamentoData);
            mostrarMensagem('Medicamento atualizado com sucesso!', 'success');
        } else {
            // Modo criação
            console.log('🆕 Criando novo medicamento');
            resultado = await criarMedicamento(medicamentoData);
            mostrarMensagem('Medicamento criado com sucesso!', 'success');
        }

        console.log('✅ Operação realizada com sucesso:', resultado);
        fecharModal();
        await carregarMedicamentos(); // Recarregar a lista
    } catch (error) {
        console.error('❌ Erro ao salvar medicamento:', error);
        mostrarMensagem('Erro ao salvar medicamento: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
}

function editarMedicamento(id) {
    console.log(`✏️ Editando medicamento ID: ${id}`);
    console.log(`📋 Lista completa de medicamentos:`, medicamentos);

    // Encontrar o medicamento
    const medicamento = medicamentos.find(m => m.id == id);
    if (!medicamento) {
        console.error('❌ Medicamento não encontrado na lista');
        mostrarMensagem('Medicamento não encontrado', 'error');
        return;
    }

    medicamentoEditando = id;
    console.log(`🎯 Medicamento em edição: ${medicamentoEditando}`);

    // Preencher o modal com os dados atuais
    document.getElementById('modalTitulo').textContent = 'Editar Medicamento';

    // Preencher campos do formulário
    document.getElementById('medicamentoNome').value = medicamento.nome_medicamento || medicamento.nome || '';
    document.getElementById('medicamentoDosagem').value = medicamento.dosagem || '';

    // Mapear frequência para valor do select
    const frequenciaMapeada = mapearFrequenciaParaSelect(medicamento.frequencia);
    document.getElementById('medicamentoFrequencia').value = frequenciaMapeada;

    // Formatar horário se necessário (garantir formato HH:MM)
    let horario = medicamento.horario || '';
    if (horario && !horario.includes(':')) {
        // Se o horário veio como "0830", converter para "08:30"
        horario = horario.replace(/(\d{2})(\d{2})/, '$1:$2');
    }
    document.getElementById('medicamentoHorario').value = horario;

    // Mapear via para valor do select
    const viaMapeada = mapearViaParaSelect(medicamento.via);
    document.getElementById('medicamentoVia').value = viaMapeada;

    document.getElementById('medicamentoInstrucoes').value = medicamento.instrucoes || medicamento.observacoes || '';

    console.log('✅ Modal preenchido com:', {
        nome: document.getElementById('medicamentoNome').value,
        dosagem: document.getElementById('medicamentoDosagem').value,
        frequencia: document.getElementById('medicamentoFrequencia').value,
        horario: document.getElementById('medicamentoHorario').value,
        via: document.getElementById('medicamentoVia').value,
        instrucoes: document.getElementById('medicamentoInstrucoes').value
    });

    // Abrir modal
    document.getElementById('medicamentoModal').style.display = 'flex';
    console.log('📱 Modal aberto para edição');
}

// REMOVER a função excluirMedicamentoConfirmacao antiga que usava confirm()
// E substituir por esta nova que usa o modal personalizado:
function excluirMedicamentoConfirmacao(id) {
    abrirModalConfirmacaoExclusao(id);
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
        renderizarMedicamentos();
        atualizarEstatisticas();
    } catch (error) {
        console.error('❌ Erro ao excluir medicamento:', error);
        throw error; // Agora o erro é tratado no confirmarExclusao
    }
}

// Estatísticas e Gráfico
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
                        callback: function (value) {
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

function obterTextoFrequencia(frequencia) {
    const textos = {
        'uma_vez': '1x ao dia',
        'duas_vezes': '2x ao dia',
        'tres_vezes': '3x ao dia',
        'quatro_vezes': '4x ao dia',
        'a_cada_6h': 'A cada 6 horas',
        'a_cada_8h': 'A cada 8 horas',
        'a_cada_12h': 'A cada 12 horas'
    };
    return textos[frequencia] || frequencia;
}

// ✅ FUNÇÃO CORRIGIDA: Popup verde/vermelho igual ao das atividades
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
        font-weight: 500;
        border-left: 4px solid ${tipo === 'success' ? '#1e7e34' : '#c82333'};
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

// ====================== FUNÇÃO VOLTAR PARA LANDING PAGE ====================== //
function voltarParaLanding() {
    console.log('🏠 Voltando para a landing page...');
    window.location.href = 'landingpage.html';
}

// Função para mapear frequência do banco para valor do select
function mapearFrequenciaParaSelect(frequencia) {
    if (!frequencia) return 'uma_vez';

    const mapeamento = {
        'uma_vez': 'uma_vez',
        'duas_vezes': 'duas_vezes',
        'tres_vezes': 'tres_vezes',
        'quatro_vezes': 'quatro_vezes',
        'a_cada_6h': 'a_cada_6h',
        'a_cada_8h': 'a_cada_8h',
        'a_cada_12h': 'a_cada_12h',
        '1x ao dia': 'uma_vez',
        '2x ao dia': 'duas_vezes',
        '3x ao dia': 'tres_vezes',
        '4x ao dia': 'quatro_vezes',
        'A cada 6 horas': 'a_cada_6h',
        'A cada 8 horas': 'a_cada_8h',
        'A cada 12 horas': 'a_cada_12h'
    };

    return mapeamento[frequencia] || 'uma_vez';
}

// Função para mapear via do banco para valor do select
function mapearViaParaSelect(via) {
    if (!via) return 'oral';

    const mapeamento = {
        'oral': 'oral',
        'sublingual': 'sublingual',
        'topica': 'topica',
        'inalatoria': 'inalatoria',
        'intramuscular': 'intramuscular',
        'intravenosa': 'intravenosa',
        'subcutanea': 'subcutanea',
        'Via oral': 'oral',
        'Sublingual': 'sublingual',
        'Tópica': 'topica',
        'Inalatória': 'inalatoria',
        'Intramuscular': 'intramuscular',
        'Intravenosa': 'intravenosa',
        'Subcutânea': 'subcutanea'
    };

    return mapeamento[via] || 'oral';
}

// Atualizar ícones periodicamente
setInterval(() => {
    feather.replace();
}, 1000);

// ====================== FUNÇÕES GLOBAIS PARA HTML ====================== //
window.marcarComoAdministrado = marcarComoAdministrado;
window.editarMedicamento = editarMedicamento;
window.excluirMedicamentoConfirmacao = excluirMedicamentoConfirmacao;
window.abrirModalConfirmacaoExclusao = abrirModalConfirmacaoExclusao;
window.voltarParaDependentes = voltarParaDependentes;
window.voltarParaLanding = voltarParaLanding;