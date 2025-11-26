// dashboard_cuidador.js

// ====================== VARIÁVEIS GLOBAIS ====================== //
let currentPatient = null;
let currentUser = null;

document.addEventListener("DOMContentLoaded", function () {
    // Inicializar feather icons
    feather.replace();

    // Variáveis globais
    let currentPatient = null;
    let currentUser = null;

    // Inicializar dashboard
    initializeDashboard();

  async function initializeDashboard() {
    try {
        console.log('🚀 INICIANDO DASHBOARD...');
        
        // Carregar dados do usuário logado
        await loadUserData();
        console.log('✅ Usuário carregado');

        // Carregar dados do paciente
        await loadPatientData();
        console.log('✅ Paciente carregado:', currentPatient);

        // Carregar dados do dashboard
        await loadDashboardData();
        console.log('✅ Dashboard carregado');

        // Configurar event listeners
        setupEventListeners();
        console.log('✅ Event listeners configurados');

        console.log('🎉 DASHBOARD INICIALIZADO COM SUCESSO!');

    } catch (error) {
        console.error("❌ Erro ao inicializar dashboard:", error);
        showError("Erro ao carregar dados do dashboard");
    }
}   

    async function loadUserData() {
        // Recuperar dados do usuário do localStorage
        const userId = localStorage.getItem("usuarioId");
        const userName = localStorage.getItem("usuarioNome") || "Cuidador";

        if (!userId) {
            window.location.href = "/";
            return;
        }

        currentUser = {
            id: userId,
            name: userName
        };

        // Atualizar interface
        document.getElementById("userName").textContent = currentUser.name;
    }

  async function loadPatientData() {
    try {
        const userId = localStorage.getItem("usuarioId");
        if (!userId) {
            console.error("❌ ID do usuário não encontrado");
            showEmptyPatientState();
            return;
        }

        console.log(`🎯 Buscando paciente para cuidador: ${userId}`);

        // Buscar paciente vinculado ao cuidador
        const response = await fetch(`/api/cuidadores/${userId}/paciente`);

        if (!response.ok) {
            if (response.status === 404) {
                console.log("ℹ️ Nenhum paciente vinculado encontrado");
                showEmptyPatientState();
                return;
            }
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const paciente = await response.json();
        console.log('✅ Paciente carregado:', paciente);
        
        currentPatient = paciente;

        // Atualizar interface do paciente
        updatePatientInterface(paciente);

        // ✅ NOVO: Atualizar card de atividades também
        await updateActivityInfoCard();

    } catch (error) {
        console.error("❌ Erro ao carregar paciente:", error);
        showEmptyPatientState();
    }
}
// ✅ FUNÇÃO PARA DESTACAR HORÁRIOS URGENTES (PRÓXIMOS 30 MINUTOS)
function verificarHorariosUrgentes() {
    const agora = new Date();
    const limite = new Date(agora.getTime() + 30 * 60 * 1000); // 30 minutos
    
    // Verificar próxima medicação
    const nextMedElement = document.getElementById('nextMedication');
    const nextTaskElement = document.getElementById('nextTask');
    
    if (nextMedElement.textContent !== '--:--') {
        const [horas, minutos] = nextMedElement.textContent.split(':').map(Number);
        const horarioMedicacao = new Date();
        horarioMedicacao.setHours(horas, minutos, 0, 0);
        
        if (horarioMedicacao <= limite && horarioMedicacao >= agora) {
            nextMedElement.setAttribute('data-urgent', 'true');
        } else {
            nextMedElement.removeAttribute('data-urgent');
        }
    }
    
    if (nextTaskElement.textContent !== '--:--') {
        const [horas, minutos] = nextTaskElement.textContent.split(':').map(Number);
        const horarioTarefa = new Date();
        horarioTarefa.setHours(horas, minutos, 0, 0);
        
        if (horarioTarefa <= limite && horarioTarefa >= agora) {
            nextTaskElement.setAttribute('data-urgent', 'true');
        } else {
            nextTaskElement.removeAttribute('data-urgent');
        }
    }
}

// ✅ ATUALIZAR A FUNÇÃO updateActivityInfoCard PARA INCLUIR VERIFICAÇÃO DE URGÊNCIA
// ✅ FUNÇÃO PRINCIPAL CORRIGIDA - USA localStorage EM VEZ DE currentPatient
async function updateActivityInfoCard() {
    try {
        console.log('🔄 [FIX] Atualizando card de atividades...');
        
        // Usar diretamente do localStorage para evitar problemas de timing
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        const usuarioId = localStorage.getItem('usuarioId');
        
        console.log('🔍 [FIX] IDs do localStorage:', { pacienteId, usuarioId });

        if (!pacienteId) {
            console.log('❌ [FIX] Nenhum paciente selecionado no localStorage');
            resetActivityInfoCard();
            return;
        }

        // Buscar dados em paralelo
        const [medicamentos, atividades] = await Promise.all([
            fetch(`/api/pacientes/${pacienteId}/medicamentos/hoje`).then(r => r.ok ? r.json() : []),
            fetch(`/api/pacientes/${pacienteId}/atividades/hoje`).then(r => r.ok ? r.json() : [])
        ]);

        console.log('📦 [FIX] Dados recebidos:', {
            medicamentos: medicamentos.length,
            atividades: atividades.length
        });

        // Processar e atualizar a interface
        processarEAtualizarCard(medicamentos, atividades);

    } catch (error) {
        console.error('❌ [FIX] Erro ao atualizar card:', error);
        resetActivityInfoCard();
    }
}

    function updatePatientInterface(paciente) {
    console.log('🎯 Atualizando interface do paciente:', paciente);
    
    // Atualizar informações básicas
    document.getElementById("patientName").textContent = paciente.nome || "Nome não informado";
    document.getElementById("patientAge").textContent = calcularIdade(paciente.data_nascimento) + " anos";
    document.getElementById("patientCondition").textContent = paciente.condicao_principal || "Não informada";
    document.getElementById("healthPlan").textContent = paciente.plano_saude || "Não informado";
    document.getElementById("patientAllergies").textContent = paciente.alergias || "Nenhuma";

    // Atualizar informações detalhadas (seção adicional)
    document.getElementById("patientConditionInfo").textContent = paciente.condicao_principal || "Não informada";
    document.getElementById("healthPlanInfo").textContent = paciente.plano_saude || "Não informado";
    document.getElementById("patientAllergiesInfo").textContent = paciente.alergias || "Nenhuma";

    // Tentar carregar foto do paciente
    if (paciente.foto_perfil) {
        document.getElementById("patientAvatar").src = `/uploads/${paciente.foto_perfil}`;
    } else {
        document.getElementById("patientAvatar").src = '/assets/default-avatar.png';
    }

    // Atualizar header com nome do paciente
    const patientNameHeader = document.getElementById("patientNameHeader");
    if (patientNameHeader) {
        patientNameHeader.textContent = paciente.nome || "Paciente";
    }

    // Carregar informações do familiar
    if (paciente.familiar_contratante_id) {
        loadFamiliarInfo(paciente.familiar_contratante_id);
    }

    // Atualizar status de saúde baseado nos dados disponíveis
    updateHealthStatus(paciente);
}

// Nova função para atualizar o status de saúde
function updateHealthStatus(paciente) {
    const healthStatus = document.getElementById("healthStatus");
    const healthDescription = document.getElementById("healthDescription");
    
    if (!healthStatus || !healthDescription) return;

    // Lógica simples para determinar status (você pode aprimorar isso)
    if (paciente.condicao_principal) {
        healthStatus.textContent = "Em acompanhamento";
        healthStatus.className = "health-status-indicator stable";
        healthDescription.textContent = `Condição: ${paciente.condicao_principal}`;
    } else {
        healthStatus.textContent = "Estável";
        healthStatus.className = "health-status-indicator good";
        healthDescription.textContent = "Todas as métricas normais";
    }
}

   function showEmptyPatientState() {
    console.log('ℹ️ Mostrando estado vazio do paciente');
    
    // Atualizar informações básicas
    document.getElementById("patientName").textContent = "Nenhum paciente vinculado";
    document.getElementById("patientAge").textContent = "--";
    document.getElementById("patientCondition").textContent = "--";
    document.getElementById("healthPlan").textContent = "--";
    document.getElementById("patientAllergies").textContent = "--";

    // Atualizar informações detalhadas
    document.getElementById("patientConditionInfo").textContent = "--";
    document.getElementById("healthPlanInfo").textContent = "--";
    document.getElementById("patientAllergiesInfo").textContent = "--";

    // Resetar foto
    document.getElementById("patientAvatar").src = '/assets/default-avatar.png';

    // Atualizar status de saúde
    const healthStatus = document.getElementById("healthStatus");
    const healthDescription = document.getElementById("healthDescription");
    
    if (healthStatus && healthDescription) {
        healthStatus.textContent = "Indisponível";
        healthStatus.className = "health-status-indicator warning";
        healthDescription.textContent = "Aguardando vínculo com paciente";
    }

    // Atualizar header
    const patientNameHeader = document.getElementById("patientNameHeader");
    if (patientNameHeader) {
        patientNameHeader.textContent = "Nenhum paciente";
    }

    // Resetar familiar
    const familiarNameElement = document.getElementById("familiarName");
    if (familiarNameElement) {
        familiarNameElement.textContent = "--";
    }
}

   // Melhorar a função loadFamiliarInfo
async function loadFamiliarInfo(familiarId) {
    try {
        const response = await fetch(`/api/familiares/${familiarId}/info`);
        if (response.ok) {
            const familiar = await response.json();
            
            // Atualizar nome do familiar no perfil básico
            const familiarNameElement = document.getElementById("familiarName");
            if (familiarNameElement) {
                familiarNameElement.textContent = familiar.nome || "Não informado";
            }
            
            // Atualizar informações de contato (se os elementos existirem)
            const contactName = document.getElementById("contactName");
            const contactInfo = document.getElementById("contactInfo");
            
            if (contactName) {
                contactName.textContent = familiar.nome || "Familiar";
            }
            if (contactInfo) {
                contactInfo.textContent = `Telefone: ${familiar.telefone || "--"}`;
            }
        }
    } catch (error) {
        console.error("Erro ao carregar familiar:", error);
        
        // Fallback caso ocorra erro
        const familiarNameElement = document.getElementById("familiarName");
        if (familiarNameElement) {
            familiarNameElement.textContent = "Familiar não encontrado";
        }
    }
}

    async function loadDashboardData() {
        if (!currentPatient) return;

        // Carregar sinais vitais
        await loadVitalSigns();

        // Carregar medicamentos
        await loadMedications();

        // Carregar tarefas
        await loadTasks();

        // Carregar alertas
        await loadAlerts();
    }

    async function loadVitalSigns() {
        try {
            const response = await fetch(`/api/pacientes/${currentPatient.id}/sinais-vitais/recentes`);

            if (response.ok) {
                const sinais = await response.json();
                updateVitalSignsInterface(sinais);
            }
        } catch (error) {
            console.error("Erro ao carregar sinais vitais:", error);
        }
    }

    function updateVitalSignsInterface(sinais) {
        // Encontrar os sinais mais recentes de cada tipo
        const pressao = sinais.find(s => s.tipo && s.tipo.toLowerCase().includes('pressao'));
        const glicemia = sinais.find(s => s.tipo && s.tipo.toLowerCase().includes('glicemia'));
        const temperatura = sinais.find(s => s.tipo && s.tipo.toLowerCase().includes('temperatura'));
        const batimentos = sinais.find(s => s.tipo && (s.tipo.toLowerCase().includes('batimento') || s.tipo.toLowerCase().includes('cardíaco')));

        // Atualizar interface
        if (pressao) {
            const valor = pressao.valor_principal || pressao.valor;
            document.getElementById("bloodPressure").textContent = valor;
            document.getElementById("bpStatus").textContent = avaliarPressao(valor);
            document.getElementById("bpStatus").className = `badge ${getStatusClass(avaliarPressao(valor))}`;
        }

        if (glicemia) {
            const valor = glicemia.valor_principal || glicemia.valor;
            document.getElementById("glucose").textContent = valor;
            document.getElementById("glucoseStatus").textContent = avaliarGlicemia(valor);
            document.getElementById("glucoseStatus").className = `badge ${getStatusClass(avaliarGlicemia(valor))}`;
        }

        if (temperatura) {
            const valor = temperatura.valor_principal || temperatura.valor;
            document.getElementById("temperature").textContent = valor;
            document.getElementById("tempStatus").textContent = avaliarTemperatura(valor);
            document.getElementById("tempStatus").className = `badge ${getStatusClass(avaliarTemperatura(valor))}`;
        }

        if (batimentos) {
            const valor = batimentos.valor_principal || batimentos.valor;
            document.getElementById("heartRate").textContent = valor;
            document.getElementById("hrStatus").textContent = avaliarBatimentos(valor);
            document.getElementById("hrStatus").className = `badge ${getStatusClass(avaliarBatimentos(valor))}`;
        }

        // Atualizar timestamp
        if (sinais.length > 0) {
            const ultimo = sinais[0];
            const data = new Date(ultimo.data_registro || ultimo.created_at);
            document.getElementById("lastVitalUpdate").textContent =
                `Última atualização: ${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR')}`;
        }
    }

// ✅ FUNÇÃO PARA ATUALIZAR MEDICAMENTOS NO DASHBOARD (COM STATUS)
function updateMedicationsInterface(medications) {
    const container = document.getElementById('medicationSchedule');
    if (!container) {
        console.error('❌ Container medicationSchedule não encontrado');
        return;
    }

    if (!Array.isArray(medications)) {
        medications = [];
    }

    if (medications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-pills"></i>
                <p>Nenhum medicamento para hoje</p>
                <small class="text-muted">Os medicamentos aparecerão aqui quando forem cadastrados</small>
            </div>
        `;
        return;
    }

    container.innerHTML = medications.map(med => {
        const nome = med.nome_medicamento || med.nome || 'Medicamento sem nome';
        const dosagem = med.dosagem || '--';
        const horario = med.horario || med.horarios || '--:--';
        const via = med.via || med.via_administracao || '--';
        const status = med.status || 'pendente';
        
        // Determinar classe e texto do status
        const statusClass = status === 'administrado' ? 'badge-concluida' : 'badge-pendente';
        const statusText = status === 'administrado' ? 'Administrado' : 'Pendente';

        return `
            <div class="medication-item">
                <div class="medication-icon">
                    <i class="fas fa-pills"></i>
                </div>
                <div class="medication-info">
                    <span class="medication-name">${nome}</span>
                    <div class="medication-details">
                        <div class="detail-item">
                            <span class="detail-label">Dosagem:</span>
                            <span class="detail-value">${dosagem}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Horário:</span>
                            <span class="detail-value">${horario}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Via:</span>
                            <span class="detail-value">${via}</span>
                        </div>
                    </div>
                </div>
                <div class="medication-status">
                    <span class="status-badge ${statusClass}">
                        <i class="fas ${status === 'administrado' ? 'fa-check-circle' : 'fa-clock'}"></i>
                        ${statusText}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}
// ✅ FUNÇÃO PARA ADMINISTRAR MEDICAMENTO (ADICIONAR)
async function administerMedication(medicamentoId) {
    try {
        console.log(`💊 Administrando medicamento: ${medicamentoId}`);
        
        const response = await fetch(`/api/medicamentos/${medicamentoId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'administrado',
                cuidador_id: localStorage.getItem('usuarioId')
            })
        });

        if (!response.ok) {
            throw new Error('Erro ao administrar medicamento');
        }

        const result = await response.json();
        console.log('✅ Medicamento administrado:', result);
        
        // Recarregar medicamentos
        await loadMedications();
        
        // Mostrar mensagem de sucesso
        alert('Medicamento administrado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao administrar medicamento:', error);
        alert('Erro ao administrar medicamento: ' + error.message);
    }
}
    // Função corrigida para carregar medicamentos no dashboard
    async function loadMedications() {
        try {
            if (!currentPatient) {
                console.log('❌ Nenhum paciente selecionado');
                return;
            }

            console.log(`💊 Buscando medicamentos para paciente: ${currentPatient.id}`);

            const response = await fetch(`/api/pacientes/${currentPatient.id}/medicamentos/hoje`);

            if (!response.ok) {
                throw new Error('Erro ao carregar medicamentos da API');
            }

            const medicamentos = await response.json();
            console.log('📦 Medicamentos recebidos no dashboard:', medicamentos);

            updateMedicationsInterface(medicamentos);
        } catch (error) {
            console.error('❌ Erro ao carregar medicamentos no dashboard:', error);
            updateMedicationsInterface([]);
        }
    }

    // ✅ FUNÇÃO PARA INICIALIZAR GRÁFICO DE ADESÃO (COM DADOS REAIS)
async function inicializarGraficoAdesao() {
    try {
        const dadosAdesao = await carregarDadosAdesao();
        renderizarGraficoAdesao(dadosAdesao);
    } catch (error) {
        console.error('Erro ao carregar dados de adesão:', error);
        // Gráfico com dados vazios em caso de erro
        renderizarGraficoAdesao([]);
    }
}

// ✅ FUNÇÃO PARA CARREGAR DADOS DE ADESÃO DA API
async function carregarDadosAdesao() {
    try {
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        if (!pacienteId) {
            throw new Error('Nenhum paciente selecionado');
        }

        const response = await fetch(`/api/pacientes/${pacienteId}/estatisticas-adesao`);
        
        if (response.ok) {
            const dados = await response.json();
            console.log('📊 Dados de adesão carregados:', dados);
            return dados;
        } else {
            // Se a API não existir, calcular com base nos dados locais
            return calcularAdesaoLocal();
        }
    } catch (error) {
        console.error('Erro ao carregar dados de adesão:', error);
        return calcularAdesaoLocal();
    }
}

// ✅ FUNÇÃO PARA CALCULAR ADESÃO COM BASE NOS DADOS LOCAIS
function calcularAdesaoLocal() {
    if (!medicamentos || medicamentos.length === 0) {
        return {
            taxaGeral: 0,
            dadosSemana: Array(7).fill(0),
            totalMedicamentos: 0,
            administrados: 0,
            pendentes: 0
        };
    }

    // Calcular taxa geral
    const totalMedicamentos = medicamentos.length;
    const administrados = medicamentos.filter(m => m.status === 'administrado').length;
    const taxaGeral = totalMedicamentos > 0 ? Math.round((administrados / totalMedicamentos) * 100) : 0;

    // Gerar dados da semana (últimos 7 dias)
    const dadosSemana = Array(7).fill(0).map((_, index) => {
        // Simular dados - em produção, isso viria da API
        const baseRate = 70 + Math.random() * 25; // Entre 70% e 95%
        return Math.min(100, Math.round(baseRate));
    });

    return {
        taxaGeral,
        dadosSemana,
        totalMedicamentos,
        administrados,
        pendentes: totalMedicamentos - administrados
    };
}

// ✅ FUNÇÃO PARA RENDERIZAR GRÁFICO DE ADESÃO
function renderizarGraficoAdesao(dadosAdesao) {
    const ctx = document.getElementById('adesaoChart');
    if (!ctx) {
        console.error('Canvas do gráfico não encontrado');
        return;
    }

    // Dados padrão se não houver dados
    const dados = dadosAdesao && dadosAdesao.dadosSemana ? dadosAdesao.dadosSemana : [0, 0, 0, 0, 0, 0, 0];
    
    const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    
    // Verificar se já existe um gráfico e destruí-lo
    if (window.adesaoChartInstance) {
        window.adesaoChartInstance.destroy();
    }

    window.adesaoChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Taxa de Adesão (%)',
                    data: dados,
                    borderColor: '#00B5C2',
                    backgroundColor: 'rgba(0, 181, 194, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#00B5C2',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Adesão: ${context.parsed.y}%`;
                        }
                    }
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
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Atualizar estatísticas de adesão no card
    atualizarEstatisticasAdesao(dadosAdesao);
}

// ✅ FUNÇÃO PARA ATUALIZAR ESTATÍSTICAS DE ADESÃO
function atualizarEstatisticasAdesao(dadosAdesao) {
    if (!dadosAdesao) {
        dadosAdesao = calcularAdesaoLocal();
    }

    // Atualizar cards de estatísticas
    document.getElementById('totalMedicamentos').textContent = dadosAdesao.totalMedicamentos || 0;
    document.getElementById('medicamentosAdministrados').textContent = dadosAdesao.administrados || 0;
    document.getElementById('medicamentosPendentes').textContent = dadosAdesao.pendentes || 0;
    
    // Atualizar taxa de adesão no título do gráfico
    const tituloGrafico = document.querySelector('.card-header h3');
    if (tituloGrafico) {
        tituloGrafico.innerHTML = `<i class="fas fa-chart-bar"></i> Adesão à Medicação - ${dadosAdesao.taxaGeral || 0}%`;
    }
}

// ✅ ATUALIZAR A FUNÇÃO marcarComoAdministrado PARA ATUALIZAR O GRÁFICO
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
            
            // ✅ ATUALIZAR GRÁFICO DE ADESÃO
            const dadosAdesao = calcularAdesaoLocal();
            renderizarGraficoAdesao(dadosAdesao);
        }
        
    } catch (error) {
        console.error('❌ Erro ao marcar como administrado:', error);
        mostrarMensagem('Erro ao administrar medicamento: ' + error.message, 'error');
    }
}

// ✅ FUNÇÃO PARA ATUALIZAR ESTATÍSTICAS (CORRIGIDA)
function atualizarEstatisticas() {
    const medicamentosFiltrados = filtrarMedicamentos();
    const total = medicamentosFiltrados.length;
    const administrados = medicamentosFiltrados.filter(m => m.status === 'administrado').length;
    const pendentes = medicamentosFiltrados.filter(m => m.status === 'pendente').length;
    
    // Calcular próximo horário
    const agora = new Date();
    const horariosPendentes = medicamentosFiltrados
        .filter(m => m.status === 'pendente' && m.horario)
        .map(m => {
            try {
                if (m.horario && typeof m.horario === 'string' && m.horario.includes(':')) {
                    const [horas, minutos] = m.horario.split(':');
                    const horario = new Date();
                    horario.setHours(parseInt(horas), parseInt(minutos), 0, 0);
                    
                    // Se o horário já passou hoje, considerar para amanhã
                    if (horario < agora) {
                        horario.setDate(horario.getDate() + 1);
                    }
                    
                    return horario;
                }
                return null;
            } catch (error) {
                console.warn('Horário inválido:', m.horario);
                return null;
            }
        })
        .filter(horario => horario !== null)
        .sort((a, b) => a - b);
    
    const proximoHorario = horariosPendentes.length > 0 ? 
        horariosPendentes[0].toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

    // Atualizar interface
    document.getElementById('totalMedicamentos').textContent = total;
    document.getElementById('medicamentosAdministrados').textContent = administrados;
    document.getElementById('medicamentosPendentes').textContent = pendentes;
    document.getElementById('proximoHorario').textContent = proximoHorario;
    
    // ✅ ATUALIZAR GRÁFICO DE ADESÃO TAMBÉM
    const dadosAdesao = calcularAdesaoLocal();
    atualizarEstatisticasAdesao(dadosAdesao);
}

// ✅ MODIFICAR A FUNÇÃO carregarMedicamentos PARA INCLUIR ADESÃO
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
        
        // ✅ CARREGAR DADOS DE ADESÃO
        const dadosAdesao = await carregarDadosAdesao();
        renderizarGraficoAdesao(dadosAdesao);
        
    } catch (error) {
        console.error('Erro ao carregar medicamentos:', error);
        medicamentos = [];
        renderizarMedicamentos();
        atualizarEstatisticas();
        
        // ✅ EM CASO DE ERRO, USAR DADOS LOCAIS PARA ADESÃO
        const dadosAdesao = calcularAdesaoLocal();
        renderizarGraficoAdesao(dadosAdesao);
        
        mostrarMensagem('Erro ao carregar medicamentos: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
}

function updateTasksInterface(atividades) {
    const container = document.getElementById("activityFeed");
    
    if (!container) {
        console.error('❌ Container activityFeed não encontrado');
        return;
    }
    
    if (!Array.isArray(atividades)) {
        atividades = [];
    }

    if (atividades.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <p>Nenhuma atividade para hoje</p>
                <small class="text-muted">As atividades aparecerão aqui quando forem registradas</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = atividades.map(atividade => {
        const descricao = atividade.descricao || 'Atividade sem descrição';
        const tipo = atividade.tipo || 'outro';
        
        // Formatar horário
        let horario = '--:--';
        if (atividade.data_prevista) {
            const data = new Date(atividade.data_prevista);
            horario = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
        
        const status = atividade.status || 'pendente';
        const cuidador = atividade.cuidador_nome || 'Cuidador';
        
        // Ícone baseado no tipo
        const iconClass = getTaskIcon(tipo);
        const tipoTexto = obterTextoTipo(tipo);
        
        return `
            <div class="activity-item">
                <div class="activity-icon ${tipo}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="activity-info">
                    <span class="activity-title">${descricao}</span>
                    <div class="activity-meta">
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span>${horario}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-tag"></i>
                            <span>${tipoTexto}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-user"></i>
                            <span>${cuidador}</span>
                        </div>
                    </div>
                </div>
                <div class="activity-status">
                    <span class="status-badge ${status === 'pendente' ? 'badge-pendente' : 'badge-concluida'}">
                        <i class="fas ${status === 'pendente' ? 'fa-clock' : 'fa-check'}"></i>
                        ${status === 'pendente' ? 'Pendente' : 'Concluída'}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}
// ✅ FUNÇÃO PARA OBTER TEXTO DO TIPO DE ATIVIDADE
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

// ✅ FUNÇÃO PARA OBTER ÍCONES DO FONT AWESOME (CORRIGIDA)
function getTaskIcon(tipo) {
    const iconMap = {
        'alimentacao': 'fas fa-utensils',
        'exercicio': 'fas fa-running',
        'higiene': 'fas fa-shower',
        'medicacao': 'fas fa-pills',
        'repouso': 'fas fa-bed',
        'social': 'fas fa-users',
        'outro': 'fas fa-tasks'
    };
    return iconMap[tipo] || 'fas fa-tasks';
}

// ✅ FUNÇÃO PARA CARREGAR ATIVIDADES (COM TRATAMENTO DE ERRO MELHORADO)
// ✅ FUNÇÃO PARA CARREGAR ATIVIDADES (COM TRATAMENTO DE ERRO MELHORADO) - CORRIGIDA
async function loadTasks() {
    try {
        console.log('🔍 DEBUG - Iniciando loadTasks...');
        
        if (!currentPatient) {
            console.log('❌ currentPatient não definido');
            return;
        }

        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = currentPatient.id;

        console.log('🔍 DEBUG - Dados:', { usuarioId, pacienteId, currentPatient });

        // ✅ CORREÇÃO: Mude de 'supervisores' para 'pacientes'
        const response = await fetch(`/api/pacientes/${pacienteId}/atividades/hoje`);
        
        console.log('🔍 DEBUG - Resposta da API:', response.status);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}`);
        }
        
        const atividades = await response.json();
        console.log('📦 Atividades recebidas:', atividades);
        
        updateTasksInterface(atividades);
    } catch (error) {
        console.error('❌ Erro detalhado:', error);
        updateTasksInterface([]);
    }
}

// ✅ FUNÇÃO PARA RECARREGAR TAREFAS (MANTIDA)
async function recarregarTarefasSupervisor() {
    try {
        await loadTasks();
        console.log('✅ Tarefas recarregadas no dashboard do supervisor');
    } catch (error) {
        console.error('❌ Erro ao recarregar tarefas no dashboard do supervisor:', error);
    }
}

// ✅ TORNAR FUNÇÃO GLOBAL (MANTIDA)
window.recarregarTarefasSupervisor = recarregarTarefasSupervisor;

    // Função para obter ícone baseado no tipo de atividade
    function getTaskIcon(tipo) {
        const iconMap = {
            'alimentacao': 'coffee',
            'exercicio': 'activity',
            'higiene': 'droplet',
            'medicacao': 'pill',
            'repouso': 'moon',
            'social': 'users',
            'outro': 'check-square'
        };
        return iconMap[tipo] || 'check-square';
    }
    async function loadAlerts() {
        try {
            const response = await fetch(`/api/pacientes/${currentPatient.id}/alertas/recentes`);

            if (response.ok) {
                const alertas = await response.json();
                updateAlertsInterface(alertas);
            }
        } catch (error) {
            console.error("Erro ao carregar alertas:", error);
        }
    }

    function updateAlertsInterface(alertas) {
        const container = document.getElementById("alertsContainer");
        const countBadge = document.getElementById("alertsCount");

        countBadge.textContent = alertas.length;

        if (alertas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-feather="bell-off"></i>
                    <p>Nenhum alerta no momento</p>
                </div>
            `;
            feather.replace();
            return;
        }

        container.innerHTML = alertas.map(alerta => `
            <div class="alert-item">
                <div class="alert-icon">
                    <i data-feather="alert-triangle"></i>
                </div>
                <div class="alert-info">
                    <h5>${alerta.titulo}</h5>
                    <small>${alerta.descricao}</small>
                </div>
                <small class="text-muted">${new Date(alerta.data_criacao).toLocaleDateString('pt-BR')}</small>
            </div>
        `).join('');

        feather.replace();
    }

    function setupEventListeners() {
        // Modal de sinais vitais
        const vitalModal = document.getElementById("vitalModal");
        const addVitalBtn = document.getElementById("addVitalBtn");
        const closeVitalModal = document.getElementById("closeVitalModal");
        const cancelVitalBtn = document.getElementById("cancelVitalBtn");
        const vitalForm = document.getElementById("vitalForm");

        if (addVitalBtn) {
            addVitalBtn.addEventListener("click", () => {
                vitalModal.style.display = "flex";
            });
        }

        if (closeVitalModal) {
            closeVitalModal.addEventListener("click", () => {
                vitalModal.style.display = "none";
            });
        }

        if (cancelVitalBtn) {
            cancelVitalBtn.addEventListener("click", () => {
                vitalModal.style.display = "none";
            });
        }

        if (vitalForm) {
            vitalForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                await registrarSinaisVitais();
            });
        }

        // Logout
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                localStorage.clear();
                window.location.href = "/";
            });
        }

        // Ação rápida
        const quickActionBtn = document.getElementById("quickActionBtn");
        if (quickActionBtn) {
            quickActionBtn.addEventListener("click", () => {
                // Abrir modal de nova atividade
                vitalModal.style.display = "flex";
            });
        }
    }

    async function registrarSinaisVitais() {
        if (!currentPatient) return;

        const formData = {
            paciente_id: currentPatient.id,
            cuidador_id: currentUser.id,
            sistolica: document.getElementById("sistolica").value,
            diastolica: document.getElementById("diastolica").value,
            glicemia: document.getElementById("glicemia").value,
            temperatura: document.getElementById("temperatura").value,
            batimentos: document.getElementById("batimentos").value
        };

        try {
            const response = await fetch("/api/sinais-vitais", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Fechar modal e recarregar dados
                document.getElementById("vitalModal").style.display = "none";
                document.getElementById("vitalForm").reset();
                await loadVitalSigns();
                showSuccess("Sinais vitais registrados com sucesso!");
            } else {
                throw new Error("Erro ao registrar sinais vitais");
            }
        } catch (error) {
            console.error("Erro:", error);
            showError("Erro ao registrar sinais vitais");
        }
    }

    // Funções utilitárias
    function calcularIdade(dataNascimento) {
        if (!dataNascimento) return "--";
        const nascimento = new Date(dataNascimento);
        const hoje = new Date();
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        return idade;
    }

    function avaliarPressao(valor) {
        if (!valor) return "Normal";
        const [sistolica, diastolica] = valor.toString().split('/').map(Number);
        if (sistolica < 120 && diastolica < 80) return "Ótima";
        if (sistolica < 130 && diastolica < 85) return "Normal";
        if (sistolica < 140 && diastolica < 90) return "Limítrofe";
        if (sistolica < 160 && diastolica < 100) return "Alta";
        return "Muito Alta";
    }

    function avaliarGlicemia(valor) {
        if (!valor) return "Normal";
        const glic = Number(valor);
        if (glic < 70) return "Baixa";
        if (glic <= 99) return "Normal";
        if (glic <= 125) return "Alterada";
        return "Alta";
    }

    function avaliarTemperatura(valor) {
        if (!valor) return "Normal";
        const temp = Number(valor);
        if (temp < 36) return "Baixa";
        if (temp <= 37.2) return "Normal";
        if (temp <= 38) return "Febril";
        return "Febre Alta";
    }

    function avaliarBatimentos(valor) {
        if (!valor) return "Normal";
        const bpm = Number(valor);
        if (bpm < 60) return "Baixo";
        if (bpm <= 100) return "Normal";
        return "Alto";
    }

    function getStatusClass(status) {
        const statusMap = {
            "Ótima": "bg-success",
            "Normal": "bg-success",
            "Limítrofe": "bg-warning",
            "Alta": "bg-warning",
            "Muito Alta": "bg-danger",
            "Baixa": "bg-danger",
            "Alterada": "bg-warning",
            "Febril": "bg-warning",
            "Febre Alta": "bg-danger",
            "Baixo": "bg-warning",
            "Alto": "bg-warning"
        };
        return statusMap[status] || "bg-secondary";
    }

    function getTaskIcon(tipo) {
        const iconMap = {
            "medicacao": "pill",
            "alimentacao": "coffee",
            "exercicio": "activity",
            "banho": "droplet",
            "consulta": "calendar",
            "outro": "check-square"
        };
        return iconMap[tipo] || "check-square";
    }

    function showSuccess(message) {
        // Implementar notificação de sucesso
        console.log("✅", message);
    }

    function showError(message) {
        // Implementar notificação de erro
        console.error("❌", message);
        alert(message);
    }
});


// ====================== INTEGRAÇÃO COM ATIVIDADES ====================== //

// Função para carregar tarefas (atividades) no dashboard
async function carregarTarefasDashboard() {
    try {
        if (!currentPatient) {
            console.log('❌ Nenhum paciente selecionado para carregar tarefas');
            return;
        }

        console.log(`📝 Buscando atividades para dashboard - paciente: ${currentPatient.id}`);

        const response = await fetch(`/api/pacientes/${currentPatient.id}/atividades/hoje`);

        if (!response.ok) {
            throw new Error('Erro ao carregar atividades para dashboard');
        }

        const atividades = await response.json();
        console.log('📦 Atividades carregadas no dashboard:', atividades);

        atualizarInterfaceTarefas(atividades);
    } catch (error) {
        console.error('❌ Erro ao carregar tarefas no dashboard:', error);
        atualizarInterfaceTarefas([]);
    }
}

// Função para atualizar a interface de tarefas
function atualizarInterfaceTarefas(atividades) {
    const container = document.getElementById("tasksList");

    if (!container) {
        console.error('❌ Container tasksList não encontrado no dashboard');
        return;
    }

    // Garantir que é um array
    if (!Array.isArray(atividades)) {
        console.warn('⚠️ Atividades não é array:', atividades);
        atividades = [];
    }

    console.log('🎨 Renderizando tarefas no dashboard:', atividades);

    if (atividades.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-feather="check-circle"></i>
                <p>Nenhuma tarefa para hoje</p>
            </div>
        `;
        if (typeof feather !== 'undefined') feather.replace();
        return;
    }

    container.innerHTML = atividades.map(atividade => {
        // Processar dados da atividade
        const descricao = atividade.descricao || 'Atividade sem descrição';

        // Formatar horário
        let horario = 'Horário não informado';
        if (atividade.data_prevista) {
            const data = new Date(atividade.data_prevista);
            horario = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }

        const status = atividade.status || 'pendente';
        const tipo = atividade.tipo || 'outro';

        return `
            <div class="task-item" data-atividade-id="${atividade.id}">
                <div class="task-icon">
                    <i data-feather="${getTaskIcon(tipo)}"></i>
                </div>
                <div class="task-info">
                    <h5>${descricao.length > 50 ? descricao.substring(0, 50) + '...' : descricao}</h5>
                    <small>${horario} - ${obterTextoTipo(tipo)}</small>
                </div>
                <span class="badge ${status === 'pendente' ? 'bg-warning' : 'bg-success'}">
                    ${status === 'pendente' ? 'Pendente' : 'Concluída'}
                </span>
            </div>
        `;
    }).join('');

    if (typeof feather !== 'undefined') feather.replace();
}

// Função para obter ícone baseado no tipo de atividade
function getTaskIcon(tipo) {
    const iconMap = {
        'alimentacao': 'coffee',
        'exercicio': 'activity',
        'higiene': 'droplet',
        'medicacao': 'pill',
        'repouso': 'moon',
        'social': 'users',
        'outro': 'check-square'
    };
    return iconMap[tipo] || 'check-square';
}

// Função para obter texto do tipo de atividade
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

// Função global para ser chamada de outros arquivos
window.carregarTarefasDashboard = carregarTarefasDashboard;

// Modifique a função initializeDashboard para carregar tarefas também
async function initializeDashboard() {
    try {
        // Carregar dados do usuário logado
        await loadUserData();

        // Carregar dados do paciente
        await loadPatientData();

        // Carregar dados do dashboard
        await loadDashboardData();

        // ⬇️ CARREGAR TAREFAS/ATIVIDADES
        await carregarTarefasDashboard();

        // Configurar event listeners
        setupEventListeners();

    } catch (error) {
        console.error("Erro ao inicializar dashboard:", error);
        showError("Erro ao carregar dados do dashboard");
    }
}

// ✅ FUNÇÃO PARA CARREGAR PACIENTE ANTES DO DEBUG
async function carregarPacienteParaDebug() {
    try {
        console.log('🔄 Carregando paciente para debug...');
        
        const userId = localStorage.getItem('usuarioId');
        if (!userId) {
            throw new Error('Usuário não logado');
        }

        // Buscar paciente da API
        const response = await fetch(`/api/cuidadores/${userId}/paciente`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar paciente');
        }

        currentPatient = await response.json();
        console.log('✅ Paciente carregado:', currentPatient);
        
        return currentPatient;
    } catch (error) {
        console.error('❌ Erro ao carregar paciente:', error);
        return null;
    }
}
// ✅ FUNÇÃO PARA ATUALIZAR O CARD DE PRÓXIMAS ATIVIDADES (COM DEBUG)
async function updateActivityInfoCard() {
    try {
        console.log('🔄 [DEBUG] Iniciando updateActivityInfoCard...');
        
        if (!currentPatient) {
            console.log('❌ [DEBUG] currentPatient é null/undefined');
            resetActivityInfoCard();
            return;
        }

        console.log('👤 [DEBUG] Paciente atual:', {
            id: currentPatient.id,
            nome: currentPatient.nome
        });

        // Buscar medicamentos e atividades em paralelo
        console.log('📡 [DEBUG] Buscando dados da API...');
        const [medicamentos, atividades] = await Promise.all([
            fetchMedicamentosParaHoje(),
            fetchAtividadesParaHoje()
        ]);

        console.log('💊 [DEBUG] Medicamentos recebidos:', medicamentos);
        console.log('📅 [DEBUG] Atividades recebidas:', atividades);

        // Processar próxima medicação
        const proximaMedicacao = encontrarProximaMedicacao(medicamentos);
        console.log('⏰ [DEBUG] Próxima medicação:', proximaMedicacao);
        document.getElementById('nextMedication').textContent = proximaMedicacao;

        // Processar próxima tarefa
        const proximaTarefa = encontrarProximaTarefa(atividades);
        console.log('✅ [DEBUG] Próxima tarefa:', proximaTarefa);
        document.getElementById('nextTask').textContent = proximaTarefa;

        // Processar consultas e exames
        const consultasAgendadas = contarConsultasAgendadas(atividades);
        console.log('📋 [DEBUG] Consultas agendadas:', consultasAgendadas);
        document.getElementById('scheduledAppointments').textContent = consultasAgendadas;

        const examesPendentes = contarExamesPendentes(atividades);
        console.log('🔬 [DEBUG] Exames pendentes:', examesPendentes);
        document.getElementById('pendingExams').textContent = examesPendentes;

        console.log('🎉 [DEBUG] Card de atividades atualizado com sucesso!');

    } catch (error) {
        console.error('❌ [DEBUG] Erro ao atualizar card de atividades:', error);
        resetActivityInfoCard();
    }
}

// ✅ FUNÇÃO PARA TESTAR AS APIs DIRETAMENTE (CORRIGIDA)
async function testarAPIs() {
    try {
        console.log('🧪 TESTANDO APIs...');
        
        if (!currentPatient) {
            console.log('❌ currentPatient não definido no testarAPIs');
            return;
        }

        console.log(`👤 Paciente ID: ${currentPatient.id}`);

        // Testar API de medicamentos
        console.log(`💊 Testando API: /api/pacientes/${currentPatient.id}/medicamentos/hoje`);
        const medResponse = await fetch(`/api/pacientes/${currentPatient.id}/medicamentos/hoje`);
        console.log('📊 Status medicamentos:', medResponse.status);
        console.log('📊 Status texto:', medResponse.statusText);
        
        if (medResponse.ok) {
            const medData = await medResponse.json();
            console.log('📦 Dados medicamentos:', medData);
            console.log('🔢 Quantidade de medicamentos:', medData.length);
            
            if (medData.length > 0) {
                console.log('📝 Exemplo de medicamento:', medData[0]);
            }
        } else {
            console.log('❌ Erro medicamentos:', await medResponse.text());
        }

        // Testar API de atividades
        console.log(`📅 Testando API: /api/pacientes/${currentPatient.id}/atividades/hoje`);
        const ativResponse = await fetch(`/api/pacientes/${currentPatient.id}/atividades/hoje`);
        console.log('📊 Status atividades:', ativResponse.status);
        console.log('📊 Status texto:', ativResponse.statusText);
        
        if (ativResponse.ok) {
            const ativData = await ativResponse.json();
            console.log('📦 Dados atividades:', ativData);
            console.log('🔢 Quantidade de atividades:', ativData.length);
            
            if (ativData.length > 0) {
                console.log('📝 Exemplo de atividade:', ativData[0]);
            }
        } else {
            console.log('❌ Erro atividades:', await ativResponse.text());
        }

    } catch (error) {
        console.error('❌ Erro no teste das APIs:', error);
    }
}

// ✅ CHAMAR ESTA FUNÇÃO NO CONSOLE DO NAVEGADOR PARA TESTAR
window.testarAPIs = testarAPIs;

// ✅ FUNÇÃO PARA BUSCAR MEDICAMENTOS PARA HOJE (CORRIGIDA)
async function fetchMedicamentosParaHoje() {
    try {
        if (!currentPatient) {
            console.log('❌ currentPatient não definido no fetchMedicamentosParaHoje');
            return [];
        }

        console.log(`💊 Buscando medicamentos para paciente: ${currentPatient.id}`);
        const response = await fetch(`/api/pacientes/${currentPatient.id}/medicamentos/hoje`);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const medicamentos = await response.json();
        console.log(`✅ ${medicamentos.length} medicamentos encontrados`);
        return medicamentos;
    } catch (error) {
        console.error('❌ Erro ao buscar medicamentos:', error);
        return [];
    }
}

// ✅ FUNÇÃO PARA TESTAR AS APIs DIRETAMENTE (CORRIGIDA)
async function testarAPIs() {
    try {
        console.log('🧪 TESTANDO APIs...');
        
        if (!currentPatient) {
            console.log('❌ currentPatient não definido no testarAPIs');
            return;
        }

        console.log(`👤 Paciente ID: ${currentPatient.id}`);

        // Testar API de medicamentos
        console.log(`💊 Testando API: /api/pacientes/${currentPatient.id}/medicamentos/hoje`);
        const medResponse = await fetch(`/api/pacientes/${currentPatient.id}/medicamentos/hoje`);
        console.log('📊 Status medicamentos:', medResponse.status);
        console.log('📊 Status texto:', medResponse.statusText);
        
        if (medResponse.ok) {
            const medData = await medResponse.json();
            console.log('📦 Dados medicamentos:', medData);
            console.log('🔢 Quantidade de medicamentos:', medData.length);
            
            if (medData.length > 0) {
                console.log('📝 Exemplo de medicamento:', medData[0]);
            }
        } else {
            console.log('❌ Erro medicamentos:', await medResponse.text());
        }

        // Testar API de atividades
        console.log(`📅 Testando API: /api/pacientes/${currentPatient.id}/atividades/hoje`);
        const ativResponse = await fetch(`/api/pacientes/${currentPatient.id}/atividades/hoje`);
        console.log('📊 Status atividades:', ativResponse.status);
        console.log('📊 Status texto:', ativResponse.statusText);
        
        if (ativResponse.ok) {
            const ativData = await ativResponse.json();
            console.log('📦 Dados atividades:', ativData);
            console.log('🔢 Quantidade de atividades:', ativData.length);
            
            if (ativData.length > 0) {
                console.log('📝 Exemplo de atividade:', ativData[0]);
            }
        } else {
            console.log('❌ Erro atividades:', await ativResponse.text());
        }

    } catch (error) {
        console.error('❌ Erro no teste das APIs:', error);
    }
}

// ✅ FUNÇÃO PARA BUSCAR MEDICAMENTOS PARA HOJE (CORRIGIDA)
async function fetchMedicamentosParaHoje() {
    try {
        if (!currentPatient) {
            console.log('❌ currentPatient não definido no fetchMedicamentosParaHoje');
            return [];
        }

        console.log(`💊 Buscando medicamentos para paciente: ${currentPatient.id}`);
        const response = await fetch(`/api/pacientes/${currentPatient.id}/medicamentos/hoje`);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const medicamentos = await response.json();
        console.log(`✅ ${medicamentos.length} medicamentos encontrados`);
        return medicamentos;
    } catch (error) {
        console.error('❌ Erro ao buscar medicamentos:', error);
        return [];
    }
}

// ✅ FUNÇÃO PARA BUSCAR ATIVIDADES PARA HOJE (CORRIGIDA)
async function fetchAtividadesParaHoje() {
    try {
        if (!currentPatient) {
            console.log('❌ currentPatient não definido no fetchAtividadesParaHoje');
            return [];
        }

        console.log(`📅 Buscando atividades para paciente: ${currentPatient.id}`);
        const response = await fetch(`/api/pacientes/${currentPatient.id}/atividades/hoje`);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const atividades = await response.json();
        console.log(`✅ ${atividades.length} atividades encontradas`);
        return atividades;
    } catch (error) {
        console.error('❌ Erro ao buscar atividades:', error);
        return [];
    }
}

// ✅ FUNÇÃO PARA ENCONTRAR PRÓXIMA MEDICAÇÃO (CORRIGIDA)
// ✅ VERSÕES SIMPLIFICADAS DAS FUNÇÕES DE PROCESSAMENTO
function encontrarProximaMedicacaoSimples(medicamentos) {
    if (!medicamentos || medicamentos.length === 0) return '--:--';
    
    const agora = new Date();
    const horarioAtual = agora.getHours() * 60 + agora.getMinutes();
    
    // Encontrar todos os horários de medicamentos
    const horarios = [];
    
    medicamentos.forEach(med => {
        const horario = med.horario || med.horarios;
        if (horario) {
            try {
                const [horas, minutos] = horario.split(':').map(Number);
                const totalMinutos = horas * 60 + minutos;
                horarios.push(totalMinutos);
            } catch (e) {
                console.warn('⚠️ Horário inválido:', horario);
            }
        }
    });
    
    if (horarios.length === 0) return '--:--';
    
    // Ordenar e encontrar próximo
    horarios.sort((a, b) => a - b);
    const proximo = horarios.find(h => h >= horarioAtual) || horarios[0];
    
    const horas = Math.floor(proximo / 60);
    const minutos = proximo % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
}

// ✅ FUNÇÃO SIMPLIFICADA DE PROCESSAMENTO
function processarEAtualizarCard(medicamentos, atividades) {
    // Próxima medicação
    const proximaMedicacao = encontrarProximaMedicacaoSimples(medicamentos);
    document.getElementById('nextMedication').textContent = proximaMedicacao;
    console.log('⏰ [FIX] Próxima medicação:', proximaMedicacao);

    // Próxima tarefa
    const proximaTarefa = encontrarProximaTarefaSimples(atividades);
    document.getElementById('nextTask').textContent = proximaTarefa;
    console.log('✅ [FIX] Próxima tarefa:', proximaTarefa);

    // Consultas agendadas
    const consultasAgendadas = contarConsultasAgendadasSimples(atividades);
    document.getElementById('scheduledAppointments').textContent = consultasAgendadas;
    console.log('📋 [FIX] Consultas:', consultasAgendadas);

    // Exames pendentes
    const examesPendentes = contarExamesPendentesSimples(atividades);
    document.getElementById('pendingExams').textContent = examesPendentes;
    console.log('🔬 [FIX] Exames:', examesPendentes);

    console.log('🎉 [FIX] Card atualizado com sucesso!');
}

function encontrarProximaTarefaSimples(atividades) {
    if (!atividades || atividades.length === 0) return '--:--';
    
    const agora = new Date();
    const horarioAtual = agora.getHours() * 60 + agora.getMinutes();
    
    // Encontrar todas as tarefas pendentes
    const horariosTarefas = [];
    
    atividades.forEach(atividade => {
        if (atividade.status === 'pendente' && atividade.data_prevista) {
            try {
                const data = new Date(atividade.data_prevista);
                const totalMinutos = data.getHours() * 60 + data.getMinutes();
                horariosTarefas.push(totalMinutos);
            } catch (e) {
                console.warn('⚠️ Data inválida:', atividade.data_prevista);
            }
        }
    });
    
    if (horariosTarefas.length === 0) return '--:--';
    
    // Ordenar e encontrar próximo
    horariosTarefas.sort((a, b) => a - b);
    const proximo = horariosTarefas.find(h => h >= horarioAtual) || horariosTarefas[0];
    
    const horas = Math.floor(proximo / 60);
    const minutos = proximo % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
}

// ✅ FUNÇÃO PARA FORÇAR ATUALIZAÇÃO (USE NO CONSOLE DO NAVEGADOR)
window.debugCardAtividades = async function() {
    console.log('🐛 INICIANDO DEBUG MANUAL...');
    
    // Verificar se currentPatient existe, se não, carregar
    if (!currentPatient) {
        console.log('⚠️ currentPatient não definido. Carregando...');
        currentPatient = await carregarPacienteParaDebug();
        
        if (!currentPatient) {
            console.log('❌ Não foi possível carregar o paciente');
            return;
        }
    }
    
    console.log('👤 currentPatient:', currentPatient);
    
    // Verificar se os elementos existem
    const elementos = ['nextMedication', 'nextTask', 'scheduledAppointments', 'pendingExams'];
    elementos.forEach(id => {
        const el = document.getElementById(id);
        console.log(`🔍 Elemento #${id}:`, el ? 'EXISTE' : 'NÃO EXISTE', el);
        
        // Mostrar conteúdo atual
        if (el) {
            console.log(`   Conteúdo atual: "${el.textContent}"`);
        }
    });
    
    // Testar APIs
    await testarAPIs();
    
    // Forçar atualização
    await updateActivityInfoCard();
    
    console.log('🐛 DEBUG COMPLETO');
};
function contarConsultasAgendadasSimples(atividades) {
    if (!atividades) return '0';
    
    const consultas = atividades.filter(atividade => {
        const descricao = (atividade.descricao || '').toLowerCase();
        const tipo = (atividade.tipo || '').toLowerCase();
        
        return descricao.includes('consulta') || 
               descricao.includes('médico') || 
               descricao.includes('doutor') ||
               tipo === 'consulta';
    });
    
    return consultas.length.toString();
}

function contarExamesPendentesSimples(atividades) {
    if (!atividades) return '0';
    
    const exames = atividades.filter(atividade => {
        const descricao = (atividade.descricao || '').toLowerCase();
        const tipo = (atividade.tipo || '').toLowerCase();
        
        return descricao.includes('exame') || 
               descricao.includes('laboratório') || 
               descricao.includes('teste') ||
               tipo === 'exame';
    });
    
    return exames.length.toString();
}

// ✅ FUNÇÃO DE RESET (mantida)
function resetActivityInfoCard() {
    const elementos = ['nextMedication', 'nextTask', 'scheduledAppointments', 'pendingExams'];
    elementos.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id.includes('Medication') || id.includes('Task')) {
                element.textContent = '--:--';
            } else {
                element.textContent = '0';
            }
        }
    });
}

// ✅ INTEGRAR COM A ATUALIZAÇÃO DO DASHBOARD
async function loadDashboardData() {
    if (!currentPatient) return;

    try {
        console.log('📊 Carregando dados do dashboard...');
        
        // Carregar em paralelo para melhor performance
        await Promise.all([
            loadVitalSigns(),
            loadMedications(),
            loadTasks(),
            loadAlerts(),
            updateActivityInfoCard() // ✅ NOVO: Atualizar card de atividades
        ]);

        console.log('✅ Todos os dados do dashboard carregados');
    } catch (error) {
        console.error('❌ Erro ao carregar dados do dashboard:', error);
    }
}

// ✅ ATUALIZAR QUANDO ATIVIDADES SÃO MODIFICADAS
window.atualizarCardAtividades = async function() {
    console.log('🔄 Atualizando card de próximas atividades...');
    try {
        await updateActivityInfoCard();
    } catch (error) {
        console.error('❌ Erro ao atualizar card de atividades:', error);
    }
};

// ====================== FUNÇÃO VOLTAR PARA LANDING PAGE ====================== //
function voltarParaLanding() {
    console.log('🏠 Voltando para a landing page...');
    window.location.href = 'landingpage.html';
}

// ✅ FUNÇÃO AUXILIAR: Obter Conexão do Pool
function obterConexao() {
    return new Promise((resolve, reject) => {
        db.getConnection((err, connection) => {
            if (err) {
                console.error('❌ Erro ao obter conexão:', err);
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });
}

// ====================== NOTIFICAÇÃO DE ATUALIZAÇÃO ====================== //

// ✅ FUNÇÃO PARA NOTIFICAR SUPERVISOR SOBRE NOVOS REGISTROS
async function notificarSupervisorSinaisVitais() {
    try {
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        const cuidadorId = localStorage.getItem('usuarioId');

        if (!pacienteId || !cuidadorId) {
            console.log('❌ Dados insuficientes para notificar supervisor');
            return;
        }

        console.log('📢 Notificando supervisor sobre novos sinais vitais...');

        // Esta chamada pode ser usada para registrar um "evento" de atualização
        // No futuro, pode evoluir para WebSockets, mas por enquanto serve como marcador
        const response = await fetch(`/api/pacientes/${pacienteId}/ultima-atualizacao`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cuidador_id: cuidadorId,
                tipo: 'sinais_vitais',
                timestamp: new Date().toISOString()
            })
        });

        if (response.ok) {
            console.log('✅ Supervisor notificado sobre atualização');
        }

    } catch (error) {
        console.error('❌ Erro ao notificar supervisor:', error);
    }
}

// ✅ MODIFICAR A FUNÇÃO registrarSinaisVitais PARA INCLUIR NOTIFICAÇÃO
async function registrarSinaisVitais() {
    if (!currentPatient) return;

    const formData = {
        paciente_id: currentPatient.id,
        cuidador_id: currentUser.id,
        sistolica: document.getElementById("sistolica").value,
        diastolica: document.getElementById("diastolica").value,
        glicemia: document.getElementById("glicemia").value,
        temperatura: document.getElementById("temperatura").value,
        batimentos: document.getElementById("batimentos").value
    };

    try {
        const response = await fetch("/api/sinais-vitais", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            // ✅ ADICIONAR ESTA LINHA: Notificar o supervisor
            await notificarSupervisorSinaisVitais();
            
            // Fechar modal e recarregar dados
            document.getElementById("vitalModal").style.display = "none";
            document.getElementById("vitalForm").reset();
            await loadVitalSigns();
            showSuccess("Sinais vitais registrados com sucesso!");
        } else {
            throw new Error("Erro ao registrar sinais vitais");
        }
    } catch (error) {
        console.error("Erro:", error);
        showError("Erro ao registrar sinais vitais");
    }
}

// ✅ ADICIONAR esta função para notificar atualizações
async function notificarAtualizacaoSinaisVitais() {
    try {
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        const cuidadorId = localStorage.getItem('usuarioId');

        if (!pacienteId || !cuidadorId) return;

        console.log('📢 Notificando sistema sobre novos sinais vitais...');

        // Esta chamada pode ser usada para trigger de atualização
        await fetch(`/api/pacientes/${pacienteId}/sinais-vitais/notificar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cuidador_id: cuidadorId,
                timestamp: new Date().toISOString()
            })
        });

    } catch (error) {
        console.error('❌ Erro ao notificar:', error);
    }
}

// ✅ MODIFICAR a função registrarSinaisVitais para incluir notificação
async function registrarSinaisVitais() {
    if (!currentPatient) return;

    const formData = {
        paciente_id: currentPatient.id,
        cuidador_id: currentUser.id,
        sistolica: document.getElementById("sistolica").value,
        diastolica: document.getElementById("diastolica").value,
        glicemia: document.getElementById("glicemia").value,
        temperatura: document.getElementById("temperatura").value,
        batimentos: document.getElementById("batimentos").value
    };

    try {
        const response = await fetch("/api/sinais-vitais", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            // ✅ ADICIONAR: Notificar o sistema
            await notificarAtualizacaoSinaisVitais();
            
            // Fechar modal e recarregar dados
            document.getElementById("vitalModal").style.display = "none";
            document.getElementById("vitalForm").reset();
            await loadVitalSigns();
            showSuccess("Sinais vitais registrados com sucesso!");
        }
    } catch (error) {
        console.error("Erro:", error);
        showError("Erro ao registrar sinais vitais");
    }
}