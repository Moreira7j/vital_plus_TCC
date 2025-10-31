// medicamentos_familiar.js - GESTÃO DE MEDICAMENTOS PARA FAMILIAR CUIDADOR

document.addEventListener('DOMContentLoaded', function () {
    console.log('💊 Inicializando medicamentos familiar...');
    
    carregarDadosPaciente();
    carregarMedicamentos();
    configurarEventosMedicamentos();
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

async function carregarMedicamentos() {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        
        console.log('💊 Carregando medicamentos para paciente:', pacienteId);
        
        if (!usuarioId || !pacienteId) {
            console.error('IDs não encontrados');
            mostrarErroMedicamentos('Nenhum paciente selecionado. Por favor, selecione um paciente primeiro.');
            setTimeout(() => {
                window.location.href = 'dependentes.html';
            }, 3000);
            return;
        }

        // Mostrar loading
        mostrarLoadingMedicamentos();

        const response = await fetch(`/api/familiares-cuidadores/${usuarioId}/pacientes/${pacienteId}/medicamentos`);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${await response.text()}`);
        }
        
        const medicamentos = await response.json();
        console.log('✅ Medicamentos carregados:', medicamentos.length);
        
        // Atualizar estatísticas
        atualizarEstatisticas(medicamentos);
        
        // Exibir lista de medicamentos
        exibirMedicamentos(medicamentos);
        
        // Atualizar agenda
        atualizarAgendaMedicamentos(medicamentos);
        
        // Carregar histórico
        carregarHistoricoAdministracao();

    } catch (error) {
        console.error('❌ Erro ao carregar medicamentos:', error);
        mostrarErroMedicamentos('Erro ao carregar medicamentos: ' + error.message);
    }
}

function mostrarLoadingMedicamentos() {
    const container = document.getElementById('medicationsList');
    if (container) {
        container.innerHTML = `
            <div class="empty-medications">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Carregando medicamentos...</p>
            </div>
        `;
    }
}

function mostrarErroMedicamentos(mensagem) {
    const container = document.getElementById('medicationsList');
    if (container) {
        container.innerHTML = `
            <div class="empty-medications">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar medicamentos</p>
                <small>${mensagem}</small>
                <button class="btn-primary" onclick="carregarMedicamentos()" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i>
                    Tentar Novamente
                </button>
            </div>
        `;
    }
    
    // Zerar estatísticas em caso de erro
    atualizarEstatisticas([]);
}

function atualizarEstatisticas(medicamentos) {
    const totalMeds = medicamentos.length;
    const activeMeds = medicamentos.filter(m => m.ativo).length;
    const pendingMeds = medicamentos.filter(m => temDosePendente(m)).length;
    const criticalMeds = medicamentos.filter(m => m.urgente || estaAtrasado(m)).length;

    document.getElementById('totalMedsCount').textContent = totalMeds;
    document.getElementById('activeMedsCount').textContent = activeMeds;
    document.getElementById('pendingMedsCount').textContent = pendingMeds;
    document.getElementById('criticalMedsCount').textContent = criticalMeds;
}

function temDosePendente(medicamento) {
    // Lógica para verificar se há doses pendentes para hoje
    const hoje = new Date().toDateString();
    return medicamento.horarios && medicamento.horarios.some(horario => {
        return !horario.administrado && new Date(horario.data).toDateString() === hoje;
    });
}

function estaAtrasado(medicamento) {
    // Lógica para verificar se há doses atrasadas
    const agora = new Date();
    return medicamento.horarios && medicamento.horarios.some(horario => {
        if (horario.administrado) return false;
        const horarioMed = new Date(horario.data);
        return horarioMed < agora;
    });
}

function exibirMedicamentos(medicamentos) {
    const container = document.getElementById('medicationsList');
    if (!container) return;
    
    if (!medicamentos || medicamentos.length === 0) {
        container.innerHTML = `
            <div class="empty-medications">
                <i class="fas fa-pills"></i>
                <p>Nenhum medicamento cadastrado</p>
                <small>Clique em "Novo Medicamento" para adicionar o primeiro.</small>
            </div>
        `;
        return;
    }

    container.innerHTML = medicamentos.map(medicamento => `
        <div class="medication-item ${obterClasseStatus(medicamento)}">
            <div class="medication-checkbox">
                <input type="checkbox" ${medicamento.administrado ? 'checked' : ''} 
                       onchange="alternarStatusAdministracao('${medicamento.id}', this.checked)">
            </div>
            <div class="medication-icon">
                <i class="fas ${obterIconeMedicamento(medicamento.tipo)}"></i>
            </div>
            <div class="medication-content">
                <div class="medication-header">
                    <h3 class="medication-title">${medicamento.nome || 'Medicamento'}</h3>
                    <span class="medication-time">${formatarProximaDose(medicamento)}</span>
                </div>
                <p class="medication-description">${medicamento.descricao || 'Sem descrição'}</p>
                <div class="medication-meta">
                    <span class="medication-dosage">
                        <i class="fas fa-syringe"></i>
                        ${medicamento.dosagem || 'Dosagem não informada'}
                    </span>
                    <span class="medication-frequency">
                        <i class="fas fa-redo"></i>
                        ${obterFrequenciaTexto(medicamento.frequencia)}
                    </span>
                    <span class="medication-type">
                        <i class="fas ${obterIconeTipo(medicamento.tipo)}"></i>
                        ${obterNomeTipo(medicamento.tipo)}
                    </span>
                    <span class="medication-status ${obterClasseStatus(medicamento)}">
                        ${obterTextoStatus(medicamento)}
                    </span>
                </div>
            </div>
            <div class="medication-actions">
                <button class="btn-medication-action btn-edit" onclick="editarMedicamento('${medicamento.id}')">
                    <i class="fas fa-edit"></i>
                    Editar
                </button>
                <button class="btn-medication-action btn-administer" onclick="administrarMedicamento('${medicamento.id}')">
                    <i class="fas fa-check"></i>
                    Administrar
                </button>
                <button class="btn-medication-action btn-delete" onclick="excluirMedicamento('${medicamento.id}')">
                    <i class="fas fa-trash"></i>
                    Excluir
                </button>
            </div>
        </div>
    `).join('');
}

function atualizarAgendaMedicamentos(medicamentos) {
    const periodos = ['morning', 'afternoon', 'evening', 'night'];
    
    periodos.forEach(periodo => {
        const container = document.getElementById(periodo + 'Meds');
        if (container) {
            const medicamentosPeriodo = filtrarMedicamentosPorPeriodo(medicamentos, periodo);
            
            if (medicamentosPeriodo.length === 0) {
                container.innerHTML = `
                    <div class="empty-schedule">
                        <i class="fas fa-check-circle"></i>
                        <p>Nenhum medicamento</p>
                    </div>
                `;
            } else {
                container.innerHTML = medicamentosPeriodo.map(med => `
                    <div class="med-time-item ${med.administrado ? 'completed' : ''}">
                        <div class="med-time-icon">
                            <i class="fas ${obterIconeMedicamento(med.tipo)}"></i>
                        </div>
                        <div class="med-time-content">
                            <div class="med-time-name">${med.nome}</div>
                            <div class="med-time-dosage">${med.dosagem} • ${formatarHorario(med.horario)}</div>
                        </div>
                        <div class="med-time-actions">
                            <button class="btn-time-action" onclick="marcarComoAdministrado('${med.id}')" title="Marcar como administrado">
                                <i class="fas fa-check"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }
    });
}

function filtrarMedicamentosPorPeriodo(medicamentos, periodo) {
    const limitesHorarios = {
        'morning': { inicio: 6, fim: 12 },
        'afternoon': { inicio: 12, fim: 18 },
        'evening': { inicio: 18, fim: 24 },
        'night': { inicio: 0, fim: 6 }
    };
    
    const limite = limitesHorarios[periodo];
    
    return medicamentos.filter(med => {
        if (!med.horario) return false;
        
        const hora = parseInt(med.horario.split(':')[0]);
        return hora >= limite.inicio && hora < limite.fim;
    }).slice(0, 5); // Limitar a 5 medicamentos por período para visualização
}

async function carregarHistoricoAdministracao() {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        
        if (!usuarioId || !pacienteId) return;

        const response = await fetch(`/api/familiares-cuidadores/${usuarioId}/pacientes/${pacienteId}/historico-administracao`);
        
        if (response.ok) {
            const historico = await response.json();
            exibirHistoricoAdministracao(historico);
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
    }
}

function exibirHistoricoAdministracao(historico) {
    const tableBody = document.getElementById('administrationHistoryTable');
    if (!tableBody) return;
    
    if (!historico || historico.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <p>Nenhum registro no histórico</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = historico.map(registro => `
        <tr>
            <td>${formatarDataHora(registro.data_administracao)}</td>
            <td>${registro.nome_medicamento || 'Medicamento'}</td>
            <td>${registro.dosagem || '--'}</td>
            <td>
                <span class="administration-status status-${registro.status}">
                    ${obterTextoStatusAdministracao(registro.status)}
                </span>
            </td>
            <td>${registro.administrado_por || 'Sistema'}</td>
            <td>${registro.observacoes || '-'}</td>
        </tr>
    `).join('');
}

// Funções auxiliares
function obterIconeMedicamento(tipo) {
    const icones = {
        'oral': 'capsules',
        'injectable': 'syringe',
        'topical': 'spray-can',
        'inhalation': 'wind',
        'default': 'pills'
    };
    return icones[tipo] || icones.default;
}

function obterIconeTipo(tipo) {
    return obterIconeMedicamento(tipo);
}

function obterNomeTipo(tipo) {
    const nomes = {
        'oral': 'Oral',
        'injectable': 'Injetável',
        'topical': 'Tópico',
        'inhalation': 'Inalação',
        'default': 'Medicamento'
    };
    return nomes[tipo] || tipo;
}

function obterFrequenciaTexto(frequencia) {
    const frequencias = {
        'daily': 'Diário',
        'bid': '2x ao dia',
        'tid': '3x ao dia',
        'qid': '4x ao dia',
        'weekly': 'Semanal',
        'monthly': 'Mensal',
        'default': 'Conforme necessário'
    };
    return frequencias[frequencia] || frequencia;
}

function obterClasseStatus(medicamento) {
    if (!medicamento.ativo) return 'inactive';
    if (medicamento.urgente || estaAtrasado(medicamento)) return 'critical';
    if (temDosePendente(medicamento)) return 'warning';
    return 'normal';
}

function obterTextoStatus(medicamento) {
    const status = obterClasseStatus(medicamento);
    const textos = {
        'normal': 'Em dia',
        'warning': 'Pendente',
        'critical': 'Urgente',
        'inactive': 'Inativo'
    };
    return textos[status] || status;
}

function obterTextoStatusAdministracao(status) {
    const textos = {
        'administered': 'Administrado',
        'missed': 'Não administrado',
        'pending': 'Pendente',
        'default': 'Indefinido'
    };
    return textos[status] || status;
}

function formatarProximaDose(medicamento) {
    if (!medicamento.proxima_dose) return 'Sem horário';
    
    try {
        const data = new Date(medicamento.proxima_dose);
        return data.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Horário inválido';
    }
}

function formatarHorario(horario) {
    if (!horario) return '--:--';
    
    try {
        const [hora, minuto] = horario.split(':');
        return `${hora.padStart(2, '0')}:${minuto.padStart(2, '0')}`;
    } catch (error) {
        return horario;
    }
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

function configurarEventosMedicamentos() {
    const filters = ['statusFilter', 'timeFilter', 'typeFilter'];
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', aplicarFiltros);
        }
    });
}

function aplicarFiltros() {
    carregarMedicamentos();
}

// Funções de ação
function adicionarMedicamento() {
    console.log('Abrindo modal para adicionar medicamento');
    // Implementar modal de adição
}

function editarMedicamento(medicamentoId) {
    console.log('Editando medicamento:', medicamentoId);
    // Implementar edição
}

function administrarMedicamento(medicamentoId) {
    console.log('Administrando medicamento:', medicamentoId);
    // Implementar administração
}

function excluirMedicamento(medicamentoId) {
    if (confirm('Tem certeza que deseja excluir este medicamento?')) {
        console.log('Excluindo medicamento:', medicamentoId);
        // Implementar exclusão
    }
}

function alternarStatusAdministracao(medicamentoId, administrado) {
    console.log(`Alternando status do medicamento ${medicamentoId} para:`, administrado ? 'administrado' : 'não administrado');
    // Implementar alteração de status
}

function marcarComoAdministrado(medicamentoId) {
    console.log('Marcando como administrado:', medicamentoId);
    // Implementar marcação como administrado
}

function limparFiltros() {
    const filters = ['statusFilter', 'timeFilter', 'typeFilter'];
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) filter.value = 'all';
    });
    carregarMedicamentos();
}

function exportarMedicamentos() {
    console.log('Exportando lista de medicamentos');
    // Implementar exportação
}

function vistaDia() {
    console.log('Alternando para vista diária');
    // Implementar vista diária
}

function vistaSemana() {
    console.log('Alternando para vista semanal');
    // Implementar vista semanal
}

function carregarHistorico() {
    carregarHistoricoAdministracao();
}

function voltarParaDependentes() {
    window.location.href = 'dependentes.html';
}

function sair() {
    localStorage.clear();
    window.location.href = '/';
}

// Atualizar dados periodicamente (a cada 2 minutos)
setInterval(() => {
    carregarMedicamentos();
}, 120000);

// ====================== FUNÇÃO VOLTAR PARA LANDING PAGE ====================== //
function voltarParaLanding() {
    console.log('🏠 Voltando para a landing page...');
    window.location.href = 'landingpage.html';
}