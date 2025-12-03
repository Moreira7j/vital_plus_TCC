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
                            label: function (context) {
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
                            callback: function (value) {
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

    // ✅ FUNÇÃO CORRIGIDA PARA AVALIAR PRESSÃO ARTERIAL
    function avaliarPressao(valor) {
        if (!valor) return "Normal";

        console.log(`🔍 Avaliando pressão: ${valor}`);

        try {
            // Extrair valores sistólica e diastólica
            const partes = valor.toString().split('/');
            if (partes.length !== 2) {
                console.log('❌ Formato inválido da pressão arterial');
                return "Normal";
            }

            const sistolica = Number(partes[0]);
            const diastolica = Number(partes[1]);

            console.log(`📊 Valores extraídos: ${sistolica}/${diastolica}`);

            if (isNaN(sistolica) || isNaN(diastolica)) {
                console.log('❌ Valores não são números válidos');
                return "Normal";
            }

            // Classificação correta da pressão arterial
            if (sistolica < 90 && diastolica < 60) {
                console.log('✅ Classificação: Muito Baixa');
                return "Muito Baixa";
            }
            if (sistolica < 120 && diastolica < 80) {
                console.log('✅ Classificação: Ótima');
                return "Ótima";
            }
            if (sistolica < 130 && diastolica < 85) {
                console.log('✅ Classificação: Normal');
                return "Normal";
            }
            if (sistolica < 140 && diastolica < 90) {
                console.log('✅ Classificação: Limítrofe');
                return "Limítrofe";
            }
            if (sistolica < 160 && diastolica < 100) {
                console.log('✅ Classificação: Alta (Hipertensão Estágio 1)');
                return "Alta";
            }
            if (sistolica < 180 && diastolica < 110) {
                console.log('✅ Classificação: Muito Alta (Hipertensão Estágio 2)');
                return "Muito Alta";
            }

            console.log('✅ Classificação: Crítica (Hipertensão Estágio 3)');
            return "Crítica";

        } catch (error) {
            console.error('❌ Erro ao avaliar pressão:', error);
            return "Normal";
        }
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
window.debugCardAtividades = async function () {
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
window.atualizarCardAtividades = async function () {
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

// ====================== SISTEMA DE ALERTAS COMPARTILHADOS ====================== //

// ✅ FUNÇÃO PARA CARREGAR ALERTAS COMPARTILHADOS NO CUIDADOR
async function carregarAlertasCompartilhados() {
    try {
        console.log('🔔 Carregando alertas compartilhados para cuidador...');

        const cuidadorId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId') || currentPatient?.id;

        console.log('👤 Dados:', { cuidadorId, pacienteId, currentPatient });

        if (!pacienteId) {
            console.log('❌ Nenhum paciente selecionado');
            return [];
        }

        // ✅ TENTAR API PRIMEIRO
        try {
            const response = await fetch(`/api/alertas/compartilhados/cuidador/${cuidadorId}/paciente/${pacienteId}`);

            if (response.ok) {
                const alertasAPI = await response.json();
                console.log(`✅ ${alertasAPI.length} alertas da API`);

                // Salvar localmente para acesso offline
                salvarAlertasLocalmente(alertasAPI);

                // Marcar como visualizados
                await marcarAlertasComoVisualizados(alertasAPI);

                return alertasAPI;
            }
        } catch (apiError) {
            console.log('⚠️ API offline, usando localStorage...');
        }

        // ✅ FALLBACK: Buscar do localStorage
        const alertasLocal = await buscarAlertasCompartilhadosLocalStorage(pacienteId);
        console.log(`📦 ${alertasLocal.length} alertas do localStorage`);

        return alertasLocal;

    } catch (error) {
        console.error('❌ Erro ao carregar alertas compartilhados:', error);
        return [];
    }
}

// ✅ FUNÇÃO PARA BUSCAR ALERTAS DO LOCALSTORAGE (CUIDADOR)
async function buscarAlertasCompartilhadosLocalStorage(pacienteId) {
    try {
        console.log('📦 Buscando alertas compartilhados no localStorage...');

        // Primeiro tentar a chave nova
        const chaveNova = 'vitalplus_alertas_compartilhados';
        let dados = localStorage.getItem(chaveNova);

        if (!dados) {
            // Fallback: usar chave antiga
            const chaveAntiga = 'vitalplus_alertas_db';
            dados = localStorage.getItem(chaveAntiga);

            if (!dados) {
                console.log('📦 Nenhum alerta encontrado');
                return [];
            }

            // Converter da estrutura antiga
            const db = JSON.parse(dados);
            return converterAlertasAntigos(db.alertas || [], pacienteId);
        }

        const alertas = JSON.parse(dados);

        // Filtrar apenas alertas do paciente atual e ativos
        const alertasFiltrados = alertas.filter(alerta => {
            const mesmoPaciente = alerta.paciente_id == pacienteId;
            const estaAtivo = alerta.status?.toLowerCase() === 'ativo';
            const naoVisualizado = !alerta.visualizado_por_cuidador;

            return mesmoPaciente && estaAtivo && naoVisualizado;
        });

        console.log(`📊 ${alertasFiltrados.length} alertas filtrados`);
        return alertasFiltrados;

    } catch (error) {
        console.error('❌ Erro ao buscar alertas:', error);
        return [];
    }
}

// ✅ FUNÇÃO PARA CONVERTER ALERTAS DA ESTRUTURA ANTIGA
function converterAlertasAntigos(alertasAntigos, pacienteId) {
    return alertasAntigos
        .filter(alerta => alerta.paciente_id == pacienteId && alerta.status === 'ativo')
        .map(alerta => ({
            ...alerta,
            compartilhado: true,
            visualizado_por_cuidador: false,
            visualizado_por_supervisor: true
        }));
}

// ✅ FUNÇÃO PARA SALVAR ALERTAS LOCALMENTE
function salvarAlertasLocalmente(alertas) {
    try {
        const chave = 'vitalplus_alertas_compartilhados_cuidador';
        localStorage.setItem(chave, JSON.stringify(alertas));
        console.log(`💾 ${alertas.length} alertas salvos localmente`);
    } catch (error) {
        console.error('❌ Erro ao salvar alertas localmente:', error);
    }
}

// ✅ FUNÇÃO PARA MARCAR ALERTAS COMO VISUALIZADOS
async function marcarAlertasComoVisualizados(alertas) {
    try {
        const cuidadorId = localStorage.getItem('usuarioId');

        // Atualizar localStorage
        const chave = 'vitalplus_alertas_compartilhados';
        const dados = localStorage.getItem(chave);

        if (dados) {
            const todosAlertas = JSON.parse(dados);

            todosAlertas.forEach(alerta => {
                if (alertas.some(a => a.id === alerta.id)) {
                    alerta.visualizado_por_cuidador = true;
                    alerta.data_visualizacao_cuidador = new Date().toISOString();
                }
            });

            localStorage.setItem(chave, JSON.stringify(todosAlertas));
            console.log('✅ Alertas marcados como visualizados localmente');
        }

        // Tentar atualizar API
        try {
            await fetch('/api/alertas/marcar-visualizados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cuidador_id: cuidadorId,
                    alerta_ids: alertas.map(a => a.id)
                })
            });
        } catch (apiError) {
            console.log('⚠️ API offline para marcar visualizados');
        }

    } catch (error) {
        console.error('❌ Erro ao marcar como visualizados:', error);
    }
}

// ✅ FUNÇÃO PARA ATUALIZAR INTERFACE DE ALERTAS (CUIDADOR)
function atualizarInterfaceAlertasCuidador(alertas) {
    console.log('🎨 Atualizando interface de alertas do cuidador...');

    const container = document.getElementById('alertsContainer');
    const countBadge = document.getElementById('alertsCount');

    if (!container) {
        console.error('❌ Container alertsContainer não encontrado');
        return;
    }

    if (!Array.isArray(alertas)) {
        alertas = [];
    }

    // Atualizar contador
    if (countBadge) {
        countBadge.textContent = alertas.length;

        // Adicionar animação se houver alertas não visualizados
        if (alertas.length > 0) {
            countBadge.classList.add('pulsing');
            countBadge.title = `${alertas.length} alertas não visualizados`;
        } else {
            countBadge.classList.remove('pulsing');
            countBadge.title = 'Nenhum alerta';
        }
    }

    if (alertas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <p>Nenhum alerta no momento</p>
                <small class="text-muted">Os alertas do familiar aparecerão aqui</small>
            </div>
        `;
        return;
    }

    // Ordenar por data (mais recente primeiro)
    const alertasOrdenados = alertas.sort((a, b) =>
        new Date(b.data_criacao) - new Date(a.data_criacao)
    );

    container.innerHTML = alertasOrdenados.map(alerta => {
        const severidade = alerta.severidade?.toLowerCase() || 'media';
        const tipo = alerta.tipo || 'outros';
        const criadoPor = alerta.criado_por_nome || alerta.criado_por || 'Familiar';
        const dataFormatada = formatarDataRelativa(alerta.data_criacao);

        // Estilos baseados na severidade
        const estilos = {
            'critica': { icon: 'fa-exclamation-triangle', color: '#e74c3c', bg: '#ffe6e6' },
            'alta': { icon: 'fa-exclamation-circle', color: '#e67e22', bg: '#fff3e6' },
            'media': { icon: 'fa-info-circle', color: '#f39c12', bg: '#fff9e6' },
            'baixa': { icon: 'fa-info', color: '#3498db', bg: '#e6f7ff' }
        };

        const estilo = estilos[severidade] || estilos['media'];

        return `
            <div class="alerta-item" data-alerta-id="${alerta.id}" style="border-left: 4px solid ${estilo.color}; background: ${estilo.bg};">
                <div class="alerta-icon">
                    <i class="fas ${estilo.icon}" style="color: ${estilo.color};"></i>
                </div>
                <div class="alerta-content">
                    <div class="alerta-header">
                        <h5>${alerta.titulo || 'Alerta'}</h5>
                        <span class="badge-severidade" style="background: ${estilo.color};">${severidade.toUpperCase()}</span>
                    </div>
                    <p class="alerta-descricao">${alerta.descricao || 'Sem descrição detalhada'}</p>
                    <div class="alerta-meta">
                        <span class="meta-item">
                            <i class="fas fa-user"></i>
                            ${criadoPor}
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-clock"></i>
                            ${dataFormatada}
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-tag"></i>
                            ${tipo}
                        </span>
                    </div>
                </div>
                <button class="btn-marcar-lido" onclick="marcarAlertaComoLido(${alerta.id})" title="Marcar como lido">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        `;
    }).join('');

    console.log(`✅ ${alertasOrdenados.length} alertas exibidos`);
}



// ✅ FUNÇÃO AUXILIAR PARA MOSTRAR NOTIFICAÇÃO (se não existir)
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Remover notificações anteriores
    const notificacoesAntigas = document.querySelectorAll('.notificacao-custom');
    notificacoesAntigas.forEach(el => el.remove());

    const notificacao = document.createElement('div');
    notificacao.className = `notificacao-custom notificacao-${tipo}`;

    const cores = {
        'success': '#27ae60',
        'error': '#e74c3c',
        'warning': '#f39c12',
        'info': '#3498db'
    };

    const icones = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };

    notificacao.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas ${icones[tipo] || icones.info}"></i>
            <span>${mensagem}</span>
        </div>
    `;

    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${cores[tipo] || cores.info};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
    `;

    document.body.appendChild(notificacao);

    setTimeout(() => {
        if (notificacao.parentNode) {
            notificacao.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notificacao.remove(), 300);
        }
    }, 3000);
}

// ✅ ADICIONAR ANIMAÇÕES CSS (se não existirem)
function adicionarAnimacoesCSS() {
    if (document.getElementById('animacoes-custom')) return;

    const style = document.createElement('style');
    style.id = 'animacoes-custom';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;

    document.head.appendChild(style);
}

// ✅ INICIALIZAR NA CARGA DA PÁGINA
document.addEventListener('DOMContentLoaded', function () {
    // Adicionar animações CSS
    adicionarAnimacoesCSS();

    // Tornar função global
    window.marcarAlertaComoLido = marcarAlertaComoLido;

    console.log('✅ Função marcarAlertaComoLido corrigida e carregada');
});

// ✅ FUNÇÃO PARA FORMATAR DATA RELATIVA
function formatarDataRelativa(dataString) {
    try {
        if (!dataString) return 'Data não disponível';

        const data = new Date(dataString);
        const agora = new Date();
        const diffMs = agora - data;
        const diffMinutos = Math.floor(diffMs / (1000 * 60));
        const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutos < 1) return 'Agora mesmo';
        if (diffMinutos < 60) return `Há ${diffMinutos} min`;
        if (diffHoras < 24) return `Há ${diffHoras} h`;
        if (diffDias === 1) return 'Ontem';
        if (diffDias < 7) return `Há ${diffDias} dias`;

        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Data desconhecida';
    }
}

// ✅ MODIFICAR A FUNÇÃO loadDashboardData PARA INCLUIR ALERTAS
async function loadDashboardData() {
    if (!currentPatient) return;

    try {
        console.log('📊 Carregando dados do dashboard...');

        // Carregar em paralelo
        await Promise.all([
            loadVitalSigns(),
            loadMedications(),
            loadTasks(),
            updateActivityInfoCard()
        ]);

        // ✅ NOVO: Carregar alertas compartilhados
        await carregarEExibirAlertasCompartilhados();

        console.log('✅ Todos os dados do dashboard carregados');
    } catch (error) {
        console.error('❌ Erro ao carregar dados do dashboard:', error);
    }
}

// ✅ NOVA FUNÇÃO PARA CARREGAR E EXIBIR ALERTAS
async function carregarEExibirAlertasCompartilhados() {
    try {
        const alertas = await carregarAlertasCompartilhados();
        atualizarInterfaceAlertasCuidador(alertas);
    } catch (error) {
        console.error('❌ Erro ao carregar alertas:', error);
        atualizarInterfaceAlertasCuidador([]);
    }
}

// ✅ ADICIONAR CSS PARA OS ALERTAS
function adicionarCSSAlertas() {
    const style = document.createElement('style');
    style.textContent = `
        /* Estilos para alertas no dashboard do cuidador */
        .alerts-list {
            padding: 15px;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .alerta-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px;
            margin-bottom: 10px;
            border-radius: 8px;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .alerta-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .alerta-icon {
            font-size: 20px;
            margin-top: 2px;
            flex-shrink: 0;
        }
        
        .alerta-content {
            flex: 1;
            min-width: 0;
        }
        
        .alerta-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 6px;
        }
        
        .alerta-header h5 {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: #2c3e50;
            line-height: 1.3;
        }
        
        .badge-severidade {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 700;
            color: white;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .alerta-descricao {
            margin: 0 0 8px 0;
            font-size: 13px;
            color: #34495e;
            line-height: 1.4;
        }
        
        .alerta-meta {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            font-size: 11px;
            color: #7f8c8d;
        }
        
        .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .meta-item i {
            font-size: 10px;
        }
        
        .btn-marcar-lido {
            background: none;
            border: none;
            color: #95a5a6;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.2s;
            flex-shrink: 0;
        }
        
        .btn-marcar-lido:hover {
            background: rgba(0,0,0,0.05);
            color: #27ae60;
        }
        
        /* Animação para o badge de contador */
        #alertsCount.pulsing {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        /* Estado vazio */
        .alerts-list .empty-state {
            text-align: center;
            padding: 30px 15px;
            color: #7f8c8d;
        }
        
        .alerts-list .empty-state i {
            font-size: 40px;
            margin-bottom: 15px;
            opacity: 0.3;
        }
        
        .alerts-list .empty-state p {
            margin: 0 0 5px 0;
            font-size: 14px;
        }
        
        .alerts-list .empty-state small {
            font-size: 12px;
        }
    `;

    document.head.appendChild(style);
    console.log('✅ CSS de alertas adicionado');
}

// ✅ INICIALIZAR CSS NA CARGA DA PÁGINA
document.addEventListener('DOMContentLoaded', function () {
    adicionarCSSAlertas();

    // Carregar alertas do cuidador
    setTimeout(() => {
        carregarAlertasCuidador();
    }, 1500);

    // Configurar atualização automática de alertas (a cada 30 segundos)
    setInterval(() => {
        carregarAlertasCuidador();
    }, 30000);

    // Atualizar quando a página ganha foco
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden && currentPatient) {
            setTimeout(() => {
                carregarEExibirAlertasCompartilhados();
            }, 1000);
        }
    });

});

// ✅ FUNÇÃO PARA BUSCAR ALERTAS DA API (CUIDADOR)
async function buscarAlertasParaCuidador() {
    try {
        const pacienteId = localStorage.getItem('pacienteSelecionadoId') || currentPatient?.id;

        if (!pacienteId) {
            console.log('❌ Nenhum paciente selecionado (cuidador)');
            return [];
        }

        console.log(`🔔 Cuidador buscando alertas - Paciente: ${pacienteId}`);

        // ✅ MESMA ROTA QUE O FAMILIAR USA
        const response = await fetch(`/api/pacientes/${pacienteId}/alertas/hoje`);

        if (!response.ok) {
            console.log(`⚠️ API offline, usando localStorage`);
            return buscarAlertasLocalStorageCuidador(pacienteId);
        }

        const alertasAPI = await response.json();
        console.log(`✅ ${alertasAPI.length} alertas recebidos pelo cuidador`);

        return alertasAPI;

    } catch (error) {
        console.error('❌ Erro ao buscar alertas (cuidador):', error);
        return buscarAlertasLocalStorageCuidador();
    }
}

// ✅ FUNÇÃO PARA CUIDADOR BUSCAR DO LOCALSTORAGE
function buscarAlertasLocalStorageCuidador(pacienteId) {
    try {
        // ✅ MESMA CHAVE QUE O FAMILIAR USA
        const chave = 'vitalplus_alertas_compartilhados';
        const dados = localStorage.getItem(chave);

        if (!dados) {
            return [];
        }

        const alertas = JSON.parse(dados);

        if (!pacienteId) {
            pacienteId = localStorage.getItem('pacienteSelecionadoId') || currentPatient?.id;
        }

        // Filtrar apenas alertas do paciente atual
        const alertasFiltrados = alertas.filter(alerta =>
            alerta.paciente_id == pacienteId && alerta.status === 'ativo'
        );

        console.log(`📦 Cuidador: ${alertasFiltrados.length} alertas do localStorage`);
        return alertasFiltrados;

    } catch (error) {
        console.error('❌ Erro ao buscar do localStorage (cuidador):', error);
        return [];
    }
}

// ✅ MODIFICAR A FUNÇÃO loadDashboardData NO CUIDADOR
async function loadDashboardData() {
    if (!currentPatient) return;

    try {
        console.log('📊 Cuidador: Carregando dados do dashboard...');

        // Carregar em paralelo
        await Promise.all([
            loadVitalSigns(),
            loadMedications(),
            loadTasks(),
            updateActivityInfoCard(),
            carregarAlertasCuidador() // ✅ NOVO: Carregar alertas
        ]);

        console.log('✅ Cuidador: Todos os dados carregados');
    } catch (error) {
        console.error('❌ Erro ao carregar dados do dashboard (cuidador):', error);
    }
}



// ✅ FUNÇÃO PARA ATUALIZAR INTERFACE DE ALERTAS (CUIDADOR)
function atualizarInterfaceAlertasCuidador(alertas) {
    console.log('🎨 Cuidador: Atualizando interface de alertas...');

    const container = document.getElementById('alertsContainer');
    const countBadge = document.getElementById('alertsCount');

    if (!container) {
        console.error('❌ Container alertsContainer não encontrado (cuidador)');
        return;
    }

    if (!Array.isArray(alertas)) {
        alertas = [];
    }

    // Atualizar contador
    if (countBadge) {
        countBadge.textContent = alertas.length;

        if (alertas.length > 0) {
            countBadge.classList.add('pulsing');
        } else {
            countBadge.classList.remove('pulsing');
        }
    }

    if (alertas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <p>Nenhum alerta no momento</p>
                <small class="text-muted">Os alertas do familiar aparecerão aqui</small>
            </div>
        `;
        return;
    }

    // Ordenar por data (mais recente primeiro)
    const alertasOrdenados = alertas.sort((a, b) =>
        new Date(b.data_criacao) - new Date(a.data_criacao)
    );

    container.innerHTML = alertasOrdenados.map(alerta => {
        const severidade = alerta.severidade?.toLowerCase() || 'media';
        const tipo = alerta.tipo || 'outros';
        const criadoPor = alerta.usuario_nome || 'Familiar';
        const dataFormatada = new Date(alerta.data_criacao).toLocaleString('pt-BR');

        // Cores baseadas na severidade
        const cores = {
            'critica': '#e74c3c',
            'alta': '#e67e22',
            'media': '#f39c12',
            'baixa': '#3498db'
        };

        const cor = cores[severidade] || '#3498db';

        return `
            <div class="alerta-item" style="border-left: 4px solid ${cor};">
                <div class="alerta-icon">
                    <i class="fas fa-exclamation-circle" style="color: ${cor};"></i>
                </div>
                <div class="alerta-content">
                    <div class="alerta-header">
                        <h5>${alerta.titulo || 'Alerta'}</h5>
                        <span class="badge" style="background: ${cor};">
                            ${severidade.toUpperCase()}
                        </span>
                    </div>
                    <p class="alerta-descricao">${alerta.descricao || 'Sem descrição'}</p>
                    <div class="alerta-meta">
                        <span><i class="fas fa-user"></i> ${criadoPor}</span>
                        <span><i class="fas fa-clock"></i> ${dataFormatada}</span>
                        <span><i class="fas fa-tag"></i> ${tipo}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    console.log(`✅ Cuidador: ${alertasOrdenados.length} alertas exibidos`);
}

// ✅ ADICIONE ESTAS FUNÇÕES AO dashboard_cuidador.js

// ✅ FUNÇÃO PARA CARREGAR ALERTAS DO CUIDADOR (COM DEBUG)
async function carregarAlertasCuidador() {
    try {
        console.log('🚨 ==========================================');
        console.log('🚨 DEBUG: INICIANDO carregarAlertasCuidador()');
        console.log('🚨 ==========================================');

        // 1. DEBUG: Verificar dados do usuário/paciente
        const usuarioId = localStorage.getItem('usuarioId');
        const usuarioTipo = localStorage.getItem('usuarioTipo');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        const pacienteNome = localStorage.getItem('pacienteNome');

        console.log('🔍 DADOS DO USUÁRIO CUIDADOR:');
        console.log('   👤 Usuário ID:', usuarioId);
        console.log('   🏷️ Tipo:', usuarioTipo);
        console.log('   🎯 Paciente ID:', pacienteId);
        console.log('   👨‍⚕️ Paciente Nome:', pacienteNome);

        // 2. DEBUG: Verificar TODAS as chaves no localStorage
        console.log('🗝️ TODAS AS CHAVES NO localStorage:');
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            if (chave.includes('alert') || chave.includes('alerta')) {
                console.log(`   🔑 Chave ${i}: ${chave}`);
                try {
                    const valor = JSON.parse(localStorage.getItem(chave));
                    console.log(`      Tipo: ${Array.isArray(valor) ? 'Array' : typeof valor}`);
                    if (Array.isArray(valor)) {
                        console.log(`      Quantidade: ${valor.length}`);
                        if (valor.length > 0) {
                            console.log(`      Primeiro item:`, valor[0]);
                        }
                    } else if (valor && typeof valor === 'object') {
                        console.log(`      Propriedades:`, Object.keys(valor));
                        if (valor.alertas && Array.isArray(valor.alertas)) {
                            console.log(`      Total de alertas: ${valor.alertas.length}`);
                        }
                    }
                } catch (e) {
                    console.log(`      Valor (não JSON):`, localStorage.getItem(chave).substring(0, 100) + '...');
                }
            }
        }

        // 3. BUSCAR alertas em todas as chaves possíveis
        const chavesParaVerificar = [
            'vitalplus_alertas_compartilhados',
            'vitalplus_alertas_para_cuidador',
            'vitalplus_alertas_db',
            'alertas_supervisor',
            'alertas_compartilhados',
            'alertas_cuidador',
            'vitalplus_alerts'
        ];

        let todosAlertas = [];

        chavesParaVerificar.forEach(chave => {
            const dados = localStorage.getItem(chave);
            if (dados) {
                console.log(`🔍 VERIFICANDO CHAVE: ${chave}`);
                try {
                    const parsed = JSON.parse(dados);
                    let alertasEncontrados = [];

                    if (Array.isArray(parsed)) {
                        console.log(`   ✅ Encontrado array com ${parsed.length} itens`);
                        alertasEncontrados = parsed;
                    } else if (parsed && typeof parsed === 'object') {
                        console.log(`   ✅ Encontrado objeto com propriedades:`, Object.keys(parsed));
                        if (parsed.alertas && Array.isArray(parsed.alertas)) {
                            console.log(`   ✅ Tem array 'alertas' com ${parsed.alertas.length} itens`);
                            alertasEncontrados = parsed.alertas;
                        } else {
                            // Se for objeto direto (sem array alertas)
                            console.log(`   ⚠️ Objeto direto, convertendo para array`);
                            alertasEncontrados = [parsed];
                        }
                    }

                    console.log(`   📊 ${alertasEncontrados.length} alertas extraídos de ${chave}`);

                    // DEBUG detalhado dos alertas encontrados
                    if (alertasEncontrados.length > 0) {
                        console.log(`   📋 Conteúdo dos alertas de ${chave}:`);
                        alertasEncontrados.forEach((alerta, idx) => {
                            console.log(`      Alerta ${idx + 1}:`, {
                                id: alerta.id,
                                titulo: alerta.titulo,
                                paciente_id: alerta.paciente_id,
                                paciente_nome: alerta.paciente_nome,
                                tipo: alerta.tipo,
                                status: alerta.status,
                                criado_por: alerta.criado_por_nome || alerta.criado_por
                            });
                        });
                    }

                    todosAlertas = todosAlertas.concat(alertasEncontrados);

                } catch (error) {
                    console.log(`   ❌ Erro ao parsear ${chave}:`, error.message);
                }
            } else {
                console.log(`   ❌ Chave ${chave} não encontrada`);
            }
        });

        console.log(`📈 TOTAL DE ALERTAS ENCONTRADOS: ${todosAlertas.length}`);

        if (todosAlertas.length === 0) {
            console.log('⚠️ NENHUM ALERTA ENCONTRADO EM NENHUMA CHAVE!');
            console.log('💡 Dicas para debug:');
            console.log('   1. Verifique se o supervisor criou algum alerta');
            console.log('   2. Verifique se o alerta foi salvo no localStorage');
            console.log('   3. Teste criando um alerta manualmente:');
            console.log('      debug.criarAlertaTeste()');

            // Expor função de teste no console
            window.debug = {
                criarAlertaTeste: function () {
                    const alertaTeste = {
                        id: Date.now(),
                        tipo: 'teste',
                        titulo: 'ALERTA DE TESTE PARA CUIDADOR',
                        descricao: 'Este é um alerta de teste criado manualmente',
                        severidade: 'alta',
                        paciente_id: pacienteId,
                        paciente_nome: pacienteNome || 'Paciente Teste',
                        status: 'ativo',
                        data_criacao: new Date().toISOString(),
                        criado_por_nome: 'Supervisor Teste',
                        compartilhado: true,
                        visualizado_por_cuidador: false
                    };

                    // Salvar em múltiplas chaves para testar
                    const chaveCompartilhados = 'vitalplus_alertas_compartilhados';
                    let compartilhados = JSON.parse(localStorage.getItem(chaveCompartilhados)) || [];
                    compartilhados.unshift(alertaTeste);
                    localStorage.setItem(chaveCompartilhados, JSON.stringify(compartilhados));

                    const chaveParaCuidador = 'vitalplus_alertas_para_cuidador';
                    let paraCuidador = JSON.parse(localStorage.getItem(chaveParaCuidador)) || [];
                    paraCuidador.unshift(alertaTeste);
                    localStorage.setItem(chaveParaCuidador, JSON.stringify(paraCuidador));

                    console.log('✅ Alerta de teste criado:', alertaTeste);
                    console.log('🔄 Recarregando alertas...');
                    carregarAlertasCuidador();
                },
                limparAlertas: function () {
                    const chaves = ['vitalplus_alertas_compartilhados', 'vitalplus_alertas_para_cuidador'];
                    chaves.forEach(chave => localStorage.removeItem(chave));
                    console.log('🗑️ Alertas limpos');
                    location.reload();
                },
                verTodosAlertas: function () {
                    console.log('📋 TODOS OS ALERTAS NO localStorage:');
                    for (let i = 0; i < localStorage.length; i++) {
                        const chave = localStorage.key(i);
                        console.log(`\n🔑 ${chave}:`);
                        try {
                            const valor = JSON.parse(localStorage.getItem(chave));
                            console.log(JSON.stringify(valor, null, 2));
                        } catch (e) {
                            console.log(localStorage.getItem(chave));
                        }
                    }
                }
            };

            console.log('🔧 Comandos disponíveis no console:');
            console.log('   debug.criarAlertaTeste() - Criar alerta de teste');
            console.log('   debug.limparAlertas() - Limpar todos os alertas');
            console.log('   debug.verTodosAlertas() - Ver todos os dados');

            exibirAlertasNoDashboardCuidador([]);
            return [];
        }

        // 4. DEBUG: Mostrar todos os alertas encontrados
        console.log('📋 DETALHES DE TODOS OS ALERTAS ENCONTRADOS:');
        todosAlertas.forEach((alerta, index) => {
            console.log(`   Alerta ${index + 1}:`, {
                id: alerta.id,
                titulo: alerta.titulo,
                tipo: alerta.tipo,
                paciente_id: alerta.paciente_id,
                paciente_nome: alerta.paciente_nome,
                status: alerta.status,
                criado_por: alerta.criado_por_nome || alerta.criado_por,
                compartilhado: alerta.compartilhado,
                data_criacao: alerta.data_criacao
            });
        });

        // 5. Filtrar alertas relevantes para o paciente atual
        console.log('🎯 FILTRANDO ALERTAS PARA PACIENTE ATUAL:', pacienteId);

        const alertasFiltrados = todosAlertas.filter(alerta => {
            console.log(`   Analisando alerta ${alerta.id}:`, {
                alerta_paciente_id: alerta.paciente_id,
                atual_paciente_id: pacienteId,
                tipos_paciente_id: typeof alerta.paciente_id,
                string_comparison: String(alerta.paciente_id) === String(pacienteId),
                number_comparison: parseInt(alerta.paciente_id) === parseInt(pacienteId)
            });

            // Mostrar alertas do paciente atual OU alertas gerais
            const matchesPaciente = alerta.paciente_id == pacienteId ||
                alerta.paciente_id === 'todos' ||
                alerta.paciente_id === null ||
                alerta.paciente_id === undefined ||
                alerta.paciente_id === 0 ||
                String(alerta.paciente_id) === String(pacienteId);

            console.log(`   Resultado: ${matchesPaciente ? '✅ ACEITO' : '❌ REJEITADO'}`);
            return matchesPaciente;
        });

        console.log(`📊 ALERTAS FILTRADOS: ${alertasFiltrados.length} de ${todosAlertas.length}`);

        // 6. Remover duplicatas (pelo ID)
        const alertasUnicos = [];
        const idsVistos = new Set();

        alertasFiltrados.forEach(alerta => {
            if (!idsVistos.has(alerta.id)) {
                idsVistos.add(alerta.id);
                alertasUnicos.push(alerta);
            }
        });

        console.log(`🔄 ALERTAS ÚNICOS (sem duplicatas): ${alertasUnicos.length}`);

        // 7. Exibir alertas no dashboard
        console.log('🎯 CHAMANDO exibirAlertasNoDashboardCuidador...');
        exibirAlertasNoDashboardCuidador(alertasUnicos);

        return alertasUnicos;

    } catch (error) {
        console.error('❌ ERRO CRÍTICO em carregarAlertasCuidador:', error);
        console.error('Stack trace:', error.stack);

        // Fallback: exibir mensagem de erro
        const container = document.getElementById('alertsContainer');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Erro ao carregar alertas</strong>
                    <small>${error.message}</small>
                </div>
            `;
        }

        return [];
    }
}


// ✅ FUNÇÃO PARA EXIBIR ALERTAS NO DASHBOARD DO CUIDADOR
// ✅ FUNÇÃO PARA EXIBIR ALERTAS NO DASHBOARD DO CUIDADOR (COM DEBUG)
// ✅ FUNÇÃO COMPLETA E CORRIGIDA PARA EXIBIR ALERTAS
function exibirAlertasNoDashboardCuidador(alertas) {
    const container = document.getElementById('alertsContainer');
    if (!container) {
        console.error('❌ Container de alertas não encontrado');
        return;
    }

    // Garantir que alertas seja um array
    if (!Array.isArray(alertas)) {
        console.error('❌ Alertas não é um array:', typeof alertas);
        alertas = [];
    }

    // Filtrar apenas alertas ativos
    const alertasAtivos = alertas.filter(alerta => {
        const status = alerta.status?.toLowerCase();
        return status !== 'resolvido' &&
            status !== 'finalizado' &&
            status !== 'encerrado' &&
            status !== 'concluido';
    });

    console.log(`🚨 ${alertasAtivos.length} alertas ativos`);

    if (alertasAtivos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash text-success"></i>
                <p>Nenhum alerta no momento</p>
                <small class="text-muted">Todos os indicadores estão normais</small>
            </div>
        `;
        return;
    }

    // Ordenar alertas: não lidos primeiro, depois por severidade
    const alertasOrdenados = alertasAtivos.sort((a, b) => {
        // Não visualizados primeiro
        if (a.visualizado_por_cuidador !== b.visualizado_por_cuidador) {
            return a.visualizado_por_cuidador ? 1 : -1;
        }

        // Severidade: crítica > alta > média > baixa
        const severidades = { 'critica': 0, 'alta': 1, 'media': 2, 'baixa': 3 };
        const severidadeA = severidades[a.severidade] || 4;
        const severidadeB = severidades[b.severidade] || 4;

        if (severidadeA !== severidadeB) {
            return severidadeA - severidadeB;
        }

        // Data mais recente primeiro
        return new Date(b.data_criacao) - new Date(a.data_criacao);
    });

    // Gerar HTML dos alertas
    container.innerHTML = alertasOrdenados.slice(0, 5).map(alerta => {
        const severidade = alerta.severidade?.toLowerCase() || 'media';
        const tipo = alerta.tipo || 'outros';
        const pacienteNome = alerta.paciente_nome || 'Paciente';
        const dataFormatada = formatarDataRelativa(alerta.data_criacao);
        const naoLido = !alerta.visualizado_por_cuidador;

        // Verificar se há resposta do cuidador
        const temResposta = alerta.resposta_cuidador && alerta.resposta_cuidador.trim() !== '';

        return `
            <div class="alert-item alert-item-${severidade} ${naoLido ? 'nao-lido' : ''}">
                <div class="alert-item-content">
                    <div class="alert-item-header">
                        <div class="alert-icon">
                            <i class="${getAlertIcon(severidade)}"></i>
                        </div>
                        <div class="alert-title">
                            <strong>${alerta.titulo || 'Alerta sem título'}</strong>
                            <span class="alert-badge ${getBadgeClass(severidade)}">
                                ${formatarSeveridade(severidade)}
                            </span>
                            ${naoLido ? '<span class="badge-new">NOVO</span>' : ''}
                        </div>
                    </div>
                    <div class="alert-body">
                        <p class="alert-description">${alerta.descricao || 'Sem descrição detalhada'}</p>
                        <div class="alert-meta">
                            <span class="meta-item">
                                <i class="fas fa-user"></i>
                                ${pacienteNome}
                            </span>
                            <span class="meta-item">
                                <i class="fas fa-user-tag"></i>
                                Enviado por: ${alerta.criado_por_nome || 'Supervisor'}
                            </span>
                            <span class="meta-item">
                                <i class="fas fa-clock"></i>
                                ${dataFormatada}
                            </span>
                        </div>
                        
                        <!-- ⬇️ RESPOSTA DO CUIDADOR (SE EXISTIR) ⬇️ -->
                        ${temResposta ? `
                            <div class="resposta-cuidador">
                                <div class="resposta-header">
                                    <span class="resposta-titulo">
                                        <i class="fas fa-check-circle text-success"></i> Sua resposta:
                                    </span>
                                    <span class="resposta-data">${formatarDataRelativa(alerta.data_resposta)}</span>
                                </div>
                                <p class="resposta-texto">${alerta.resposta_cuidador}</p>
                            </div>
                        ` : ''}
                        
                    </div>
                </div>
                <div class="alert-actions">
                    <button class="btn-action btn-marcar-lido" onclick="marcarAlertaComoLido(${Number(alerta.id)})" title="Marcar como lido">

                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-action btn-responder" onclick="abrirModalResponderAlerta(${alerta.id})" title="Responder">
                        <i class="fas fa-reply"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Atualizar contador de alertas
    const alertsCountElement = document.getElementById('alertsCount');
    if (alertsCountElement) {
        const alertasNaoLidos = alertasAtivos.filter(a => !a.visualizado_por_cuidador).length;
        alertsCountElement.textContent = alertasAtivos.length;

        if (alertasNaoLidos > 0) {
            alertsCountElement.className = 'badge bg-danger';
        } else {
            alertsCountElement.className = 'badge bg-warning';
        }
    }
}

// ✅ ADICIONE ESTA FUNÇÃO PARA FORÇAR SINCronIZAÇÃO
window.forcarSincronizacaoAlertas = function () {
    console.log('🔄 Forçando sincronização de alertas...');

    // Simular um alerta de teste se não houver nenhum
    const chaveCompartilhados = 'vitalplus_alertas_compartilhados';
    const alertasExistentes = JSON.parse(localStorage.getItem(chaveCompartilhados)) || [];

    if (alertasExistentes.length === 0) {
        console.log('⚠️ Nenhum alerta encontrado, criando de teste...');

        const alertaTeste = {
            id: Date.now(),
            tipo: 'medicamento',
            titulo: 'ALERTA DE TESTE DO SUPERVISOR',
            descricao: 'Este é um alerta de teste para verificar a sincronização com o cuidador',
            severidade: 'alta',
            paciente_id: localStorage.getItem('pacienteSelecionadoId') || '1',
            paciente_nome: localStorage.getItem('pacienteNome') || 'Paciente Teste',
            status: 'ativo',
            data_criacao: new Date().toISOString(),
            criado_por_nome: 'Familiar Supervisor',
            criado_por_id: localStorage.getItem('usuarioId') || '25',
            compartilhado: true,
            visualizado_por_cuidador: false
        };

        alertasExistentes.unshift(alertaTeste);
        localStorage.setItem(chaveCompartilhados, JSON.stringify(alertasExistentes));

        console.log('✅ Alerta de teste criado:', alertaTeste);
    }

    // Forçar recarregamento
    carregarAlertasCuidador();
};


// ✅ FUNÇÃO PARA RESPONDER ALERTA (CUIDADOR)
function responderAlerta(alertaId) {
    const resposta = prompt('Digite sua resposta ao alerta:');
    if (resposta) {
        console.log(`📤 Cuidador respondendo ao alerta ${alertaId}:`, resposta);

        // Salvar resposta
        const chaveRespostas = 'vitalplus_respostas_alertas';
        const respostas = JSON.parse(localStorage.getItem(chaveRespostas)) || [];

        respostas.push({
            alerta_id: alertaId,
            resposta: resposta,
            respondido_por: 'cuidador',
            data_resposta: new Date().toISOString()
        });

        localStorage.setItem(chaveRespostas, JSON.stringify(respostas));

        // Marcar como respondido
        marcarAlertaComoRespondido(alertaId);

        alert('Resposta enviada ao supervisor!');
    }
}

// ✅ FUNÇÃO AUXILIAR: Marcar alerta como respondido
function marcarAlertaComoRespondido(alertaId) {
    const chaveCompartilhados = 'vitalplus_alertas_compartilhados';
    const alertas = JSON.parse(localStorage.getItem(chaveCompartilhados)) || [];
    const index = alertas.findIndex(a => a.id === alertaId);

    if (index !== -1) {
        alertas[index].respondido = true;
        alertas[index].data_resposta = new Date().toISOString();
        localStorage.setItem(chaveCompartilhados, JSON.stringify(alertas));
    }
}

// ✅ FUNÇÕES DE FORMATAÇÃO (ADICIONE SE NÃO EXISTIREM)
function formatarDataRelativa(dataString) {
    try {
        if (!dataString) return 'Data não disponível';

        const data = new Date(dataString);
        if (isNaN(data.getTime())) return 'Data inválida';

        const agora = new Date();
        const diffMs = agora - data;
        const diffMinutos = Math.floor(diffMs / (1000 * 60));
        const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutos < 1) return 'Agora mesmo';
        if (diffMinutos < 60) return `Há ${diffMinutos} min`;
        if (diffHoras < 24) return `Há ${diffHoras} h`;
        if (diffDias === 1) return 'Ontem';
        if (diffDias < 7) return `Há ${diffDias} dias`;

        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Data desconhecida';
    }
}

function getAlertIcon(severidade) {
    const icones = {
        'critica': 'fas fa-exclamation-triangle',
        'alta': 'fas fa-exclamation-circle',
        'media': 'fas fa-info-circle',
        'baixa': 'fas fa-info'
    };
    return icones[severidade] || 'fas fa-bell';
}

function getBadgeClass(severidade) {
    const classes = {
        'critica': 'badge-critical',
        'alta': 'badge-high',
        'media': 'badge-medium',
        'baixa': 'badge-low'
    };
    return classes[severidade] || 'badge-medium';
}

function formatarSeveridade(severidade) {
    const textos = {
        'critica': 'Crítica',
        'alta': 'Alta',
        'media': 'Média',
        'baixa': 'Baixa'
    };
    return textos[severidade] || 'Média';
}


// ==================== SISTEMA DE RESPOSTAS A ALERTAS ====================

// ✅ VARIÁVEL GLOBAL PARA CONTROLAR O ALERTA ATUAL
let alertaAtualParaResponder = null;

// ✅ FUNÇÃO PARA CRIAR MODAL DE RESPOSTA
function criarModalResposta() {
    const modalHTML = `
        <div class="modal-resposta" id="modalRespostaAlerta">
            <div class="modal-resposta-content">
                <div class="modal-resposta-header">
                    <h3><i class="fas fa-reply"></i> Responder Alerta</h3>
                    <button class="close-modal" onclick="fecharModalResposta()">&times;</button>
                </div>
                <div class="modal-resposta-body">
                    <div class="alert-details">
                        <div class="alert-details-item">
                            <span class="alert-details-label">Título:</span>
                            <span class="alert-details-value" id="alertaTituloDetalhes"></span>
                        </div>
                        <div class="alert-details-item">
                            <span class="alert-details-label">Descrição:</span>
                            <span class="alert-details-value" id="alertaDescricaoDetalhes"></span>
                        </div>
                        <div class="alert-details-item">
                            <span class="alert-details-label">Paciente:</span>
                            <span class="alert-details-value" id="alertaPacienteDetalhes"></span>
                        </div>
                        <div class="alert-details-item">
                            <span class="alert-details-label">Severidade:</span>
                            <span class="alert-details-value" id="alertaSeveridadeDetalhes"></span>
                        </div>
                        <div class="alert-details-item">
                            <span class="alert-details-label">Data:</span>
                            <span class="alert-details-value" id="alertaDataDetalhes"></span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="respostaTexto"><i class="fas fa-comment"></i> Sua Resposta:</label>
                        <textarea id="respostaTexto" placeholder="Digite sua resposta para o supervisor..."></textarea>
                    </div>
                </div>
                <div class="modal-resposta-footer">
                    <button class="btn-cancelar-resposta" onclick="fecharModalResposta()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="btn-enviar-resposta" onclick="enviarRespostaAlerta()">
                        <i class="fas fa-paper-plane"></i> Enviar Resposta
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ✅ FUNÇÃO PARA ABRIR MODAL DE RESPOSTA
function abrirModalResponderAlerta(alertaId) {
    console.log(`📝 Abrindo modal para responder alerta ${alertaId}...`);

    // Buscar dados do alerta
    const chave = 'vitalplus_alertas_compartilhados';
    const dados = localStorage.getItem(chave);

    if (!dados) {
        alert('Erro: não foi possível carregar os dados do alerta');
        return;
    }

    let alertas = JSON.parse(dados);
    let alertasArray = Array.isArray(alertas) ? alertas : (alertas.alertas || []);

    const alerta = alertasArray.find(a => a.id == alertaId);

    if (!alerta) {
        alert('Alerta não encontrado');
        return;
    }

    alertaAtualParaResponder = alerta;

    // Criar modal se não existir
    if (!document.getElementById('modalRespostaAlerta')) {
        criarModalResposta();
    }

    // Preencher detalhes do alerta
    document.getElementById('alertaTituloDetalhes').textContent = alerta.titulo || 'Alerta sem título';
    document.getElementById('alertaDescricaoDetalhes').textContent = alerta.descricao || 'Sem descrição';
    document.getElementById('alertaPacienteDetalhes').textContent = alerta.paciente_nome || 'Paciente';
    document.getElementById('alertaSeveridadeDetalhes').textContent = formatarSeveridade(alerta.severidade);
    document.getElementById('alertaDataDetalhes').textContent = formatarDataCompleta(alerta.data_criacao);

    // Limpar campo de resposta anterior
    document.getElementById('respostaTexto').value = '';

    // Mostrar modal
    document.getElementById('modalRespostaAlerta').style.display = 'flex';
}

// ✅ FUNÇÃO PARA ENVIAR RESPOSTA
function enviarRespostaAlerta() {
    const respostaTexto = document.getElementById('respostaTexto').value.trim();

    if (!respostaTexto) {
        alert('Por favor, digite uma resposta');
        return;
    }

    if (!alertaAtualParaResponder) {
        alert('Erro: alerta não encontrado');
        return;
    }

    console.log(`📤 Enviando resposta para alerta ${alertaAtualParaResponder.id}:`, respostaTexto);

    // Atualizar alerta no localStorage
    const chave = 'vitalplus_alertas_compartilhados';
    const dados = localStorage.getItem(chave);

    if (!dados) {
        alert('Erro ao salvar resposta');
        return;
    }

    let alertas = JSON.parse(dados);
    let alertasArray = Array.isArray(alertas) ? alertas : (alertas.alertas || []);

    const alertaIndex = alertasArray.findIndex(a => a.id == alertaAtualParaResponder.id);

    if (alertaIndex !== -1) {
        // Atualizar alerta com a resposta
        alertasArray[alertaIndex].resposta_cuidador = respostaTexto;
        alertasArray[alertaIndex].data_resposta = new Date().toISOString();
        alertasArray[alertaIndex].respondido_por_cuidador = true;
        alertasArray[alertaIndex].nome_cuidador_respondente = localStorage.getItem('usuarioNome') || 'Cuidador';

        // Marcar como lido automaticamente (opcional)
        alertasArray[alertaIndex].visualizado_por_cuidador = true;
        alertasArray[alertaIndex].data_leitura_cuidador = new Date().toISOString();

        // Salvar de volta
        if (Array.isArray(alertas)) {
            localStorage.setItem(chave, JSON.stringify(alertasArray));
        } else {
            alertas.alertas = alertasArray;
            localStorage.setItem(chave, JSON.stringify(alertas));
        }

        console.log('✅ Resposta salva com sucesso');

        // Fechar modal
        fecharModalResposta();

        // Recarregar alertas para mostrar a resposta
        if (window.carregarAlertasCuidador) {
            window.carregarAlertasCuidador();
        }

        // Mostrar confirmação
        mostrarNotificacao('Resposta enviada com sucesso para o supervisor!', 'success');

    } else {
        alert('Erro: alerta não encontrado para atualizar');
    }
}

// ✅ FUNÇÃO PARA FECHAR MODAL DE RESPOSTA
function fecharModalResposta() {
    document.getElementById('modalRespostaAlerta').style.display = 'none';
    alertaAtualParaResponder = null;
}

// ✅ FUNÇÃO CORRIGIDA PARA MARCAR ALERTA COMO LIDO (VERSÃO ROBUSTA)
async function marcarAlertaComoLido(alertaId) {
    try {
        console.log(`📌 [V2] Marcando alerta ${alertaId} como lido...`);
        console.log(`🔍 Tipo do ID: ${typeof alertaId}, Valor: ${alertaId}`);

        // Converter para número para garantir comparação correta
        const idParaBuscar = Number(alertaId);

        // 1. BUSCAR EM TODAS AS CHAVES POSSÍVEIS
        const chavesParaVerificar = [
            'vitalplus_alertas_compartilhados',
            'vitalplus_alertas_para_cuidador',
            'vitalplus_alertas_db',
            'vitalplus_alertas',
            'alertas_supervisor',
            'alertas_compartilhados',
            'alertas_cuidador',
            'alertas_para_cuidador',
            'vitalplus_alertas_cuidador'
        ];

        console.log(`🔎 Procurando em ${chavesParaVerificar.length} chaves...`);

        let alertaEncontrado = null;
        let chaveEncontrada = null;
        let dadosOriginais = null;
        let estruturaEncontrada = null; // 'array', 'objeto_com_alertas', 'objeto_unico'

        // Função para buscar alerta em uma estrutura
        const buscarAlertaNaEstrutura = (dados, id) => {
            if (!dados) return null;

            // Se for array direto
            if (Array.isArray(dados)) {
                const alerta = dados.find(a => Number(a.id) === id);
                if (alerta) {
                    estruturaEncontrada = 'array';
                    return { alerta, array: dados };
                }
            }

            // Se for objeto com array 'alertas'
            if (dados && typeof dados === 'object' && dados.alertas && Array.isArray(dados.alertas)) {
                const alerta = dados.alertas.find(a => Number(a.id) === id);
                if (alerta) {
                    estruturaEncontrada = 'objeto_com_alertas';
                    return { alerta, array: dados.alertas, objetoPai: dados };
                }
            }

            // Se for objeto único com ID
            if (dados.id && Number(dados.id) === id) {
                estruturaEncontrada = 'objeto_unico';
                return { alerta: dados };
            }

            return null;
        };

        // Percorrer todas as chaves
        for (const chave of chavesParaVerificar) {
            const dadosStr = localStorage.getItem(chave);

            if (dadosStr) {
                try {
                    const dados = JSON.parse(dadosStr);
                    const resultado = buscarAlertaNaEstrutura(dados, idParaBuscar);

                    if (resultado) {
                        alertaEncontrado = resultado.alerta;
                        chaveEncontrada = chave;
                        dadosOriginais = dados;
                        console.log(`✅ Alerta encontrado na chave: "${chave}"`);
                        console.log(`📁 Estrutura: ${estruturaEncontrada}`);
                        break;
                    }
                } catch (error) {
                    console.log(`⚠️ Erro ao parsear "${chave}": ${error.message}`);
                }
            }
        }

        // 2. VERIFICAR SE ENCONTROU
        if (!alertaEncontrado) {
            console.error(`❌ Alerta ID ${alertaId} (numérico: ${idParaBuscar}) não encontrado!`);
            console.log('💡 Dicas:');
            console.log('   1. Execute debugAlertas() para ver onde os alertas estão armazenados');
            console.log('   2. Execute debugAlertas(10) para buscar especificamente o alerta 10');
            console.log('   3. Verifique se o alerta foi criado pelo supervisor');

            // Mostrar notificação
            mostrarNotificacao(`Alerta ${alertaId} não encontrado. Verifique console (F12).`, 'error');
            return;
        }

        console.log(`📋 Alerta encontrado:`, {
            id: alertaEncontrado.id,
            titulo: alertaEncontrado.titulo,
            visualizado_por_cuidador: alertaEncontrado.visualizado_por_cuidador
        });

        // 3. ATUALIZAR O ALERTA
        alertaEncontrado.visualizado_por_cuidador = true;
        alertaEncontrado.data_leitura_cuidador = new Date().toISOString();

        // 4. SALVAR DE VOLTA NO LOCALSTORAGE
        if (chaveEncontrada && dadosOriginais) {
            try {
                // Salvar de acordo com a estrutura encontrada
                localStorage.setItem(chaveEncontrada, JSON.stringify(dadosOriginais));
                console.log(`💾 Atualização salva na chave: "${chaveEncontrada}"`);

                // SINCRONIZAR EM OUTRAS CHAVES POSSÍVEIS (opcional)
                sincronizarAlertaEmOutrasChaves(alertaEncontrado, chaveEncontrada);

            } catch (error) {
                console.error(`❌ Erro ao salvar: ${error.message}`);
            }
        }

        // 5. ATUALIZAR VISUALMENTE
        atualizarInterfaceAlerta(alertaId);

        // 6. MOSTRAR CONFIRMAÇÃO
        mostrarNotificacao(`Alerta "${alertaEncontrado.titulo || '#' + alertaId}" marcado como lido`, 'success');

        // 7. OPÇÃO: NOTIFICAR API
        notificarApiAlertaLido(alertaId);

    } catch (error) {
        console.error('❌ ERRO em marcarAlertaComoLido:', error);
        mostrarNotificacao('Erro ao processar ação', 'error');
    }
}

// ✅ FUNÇÕES AUXILIARES

function sincronizarAlertaEmOutrasChaves(alertaAtualizado, chaveOrigem) {
    const chavesSincronizar = [
        'vitalplus_alertas_compartilhados',
        'vitalplus_alertas_para_cuidador',
        'alertas_cuidador'
    ];

    chavesSincronizar.forEach(chave => {
        if (chave === chaveOrigem) return; // Não sincronizar na origem

        try {
            const dadosStr = localStorage.getItem(chave);
            if (dadosStr) {
                const dados = JSON.parse(dadosStr);
                let atualizado = false;

                // Buscar e atualizar em qualquer estrutura
                if (Array.isArray(dados)) {
                    const index = dados.findIndex(a => Number(a.id) === Number(alertaAtualizado.id));
                    if (index !== -1) {
                        dados[index] = { ...dados[index], ...alertaAtualizado };
                        atualizado = true;
                    }
                } else if (dados && typeof dados === 'object') {
                    if (dados.alertas && Array.isArray(dados.alertas)) {
                        const index = dados.alertas.findIndex(a => Number(a.id) === Number(alertaAtualizado.id));
                        if (index !== -1) {
                            dados.alertas[index] = { ...dados.alertas[index], ...alertaAtualizado };
                            atualizado = true;
                        }
                    } else if (dados.id && Number(dados.id) === Number(alertaAtualizado.id)) {
                        // Se for o objeto direto
                        Object.assign(dados, alertaAtualizado);
                        atualizado = true;
                    }
                }

                if (atualizado) {
                    localStorage.setItem(chave, JSON.stringify(dados));
                    console.log(`   🔄 Sincronizado na chave: "${chave}"`);
                }
            }
        } catch (error) {
            console.log(`   ⚠️ Erro ao sincronizar "${chave}": ${error.message}`);
        }
    });
}

function atualizarInterfaceAlerta(alertaId) {
    // Atualizar elemento específico
    const alertaElement = document.querySelector(`[data-alerta-id="${alertaId}"]`);
    if (alertaElement) {
        // Adicionar classe de visualizado
        alertaElement.classList.add('visualizado');
        alertaElement.style.opacity = '0.7';

        // Remover badge "NOVO"
        const badgeNovo = alertaElement.querySelector('.badge-new');
        if (badgeNovo) badgeNovo.remove();

        // Atualizar ícone
        const icon = alertaElement.querySelector('.alert-icon i');
        if (icon) {
            icon.className = 'fas fa-check-circle text-success';
        }
    }

    // Atualizar contador
    const countElement = document.getElementById('alertsCount');
    if (countElement) {
        const countAtual = parseInt(countElement.textContent) || 0;
        if (countAtual > 0) {
            countElement.textContent = countAtual - 1;

            // Atualizar cor se necessário
            if (countAtual - 1 === 0) {
                countElement.classList.remove('bg-danger');
                countElement.classList.add('bg-secondary');
            }
        }
    }
}

async function notificarApiAlertaLido(alertaId) {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        if (!usuarioId) return;

        const response = await fetch(`/api/alertas/${alertaId}/marcar-lido`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cuidador_id: usuarioId,
                data_leitura: new Date().toISOString()
            })
        });

        if (response.ok) {
            console.log('✅ API notificada sobre leitura do alerta');
        }
    } catch (error) {
        console.log('⚠️ API offline para notificação');
    }
}



// ✅ FUNÇÃO AUXILIAR: Formatar data completa
function formatarDataCompleta(dataString) {
    try {
        if (!dataString) return 'Data não disponível';

        const data = new Date(dataString);
        if (isNaN(data.getTime())) return 'Data inválida';

        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Data desconhecida';
    }
}

// ✅ FUNÇÃO AUXILIAR: Mostrar notificação
function mostrarNotificacao(mensagem, tipo = 'info') {
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao-${tipo}`;
    notificacao.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${mensagem}</span>
        </div>
    `;

    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${tipo === 'success' ? '#27ae60' : '#3498db'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notificacao);

    setTimeout(() => {
        if (notificacao.parentNode) {
            notificacao.remove();
        }
    }, 3000);
}

// ✅ ADICIONE ESTES ESTILOS CSS (se não existirem)
function adicionarEstilosResposta() {
    if (document.getElementById('estilos-resposta-alerta')) return;

    const estilos = `
        <style>
            /* Modal de resposta */
            .modal-resposta {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 10000;
                align-items: center;
                justify-content: center;
            }
            
            .modal-resposta-content {
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .modal-resposta-header {
                padding: 20px;
                border-bottom: 1px solid #ecf0f1;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #f8f9fa;
                border-radius: 12px 12px 0 0;
            }
            
            .modal-resposta-header h3 {
                margin: 0;
                font-size: 1.2rem;
                color: #2c3e50;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .close-modal {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #7f8c8d;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
            }
            
            .close-modal:hover {
                background: #f8f9fa;
                color: #e74c3c;
            }
            
            .modal-resposta-body {
                padding: 20px;
            }
            
            .alert-details {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 20px;
                border-left: 4px solid #3498db;
            }
            
            .alert-details-item {
                margin-bottom: 8px;
                display: flex;
            }
            
            .alert-details-label {
                font-weight: 600;
                min-width: 100px;
                color: #2c3e50;
            }
            
            .alert-details-value {
                color: #34495e;
                flex: 1;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #2c3e50;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .form-group textarea {
                width: 100%;
                min-height: 120px;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-family: 'Inter', sans-serif;
                font-size: 0.9rem;
                resize: vertical;
            }
            
            .form-group textarea:focus {
                outline: none;
                border-color: #3498db;
                box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
            }
            
            .modal-resposta-footer {
                padding: 20px;
                border-top: 1px solid #ecf0f1;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            .btn-enviar-resposta, .btn-cancelar-resposta {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s ease;
            }
            
            .btn-enviar-resposta {
                background: #3498db;
                color: white;
            }
            
            .btn-enviar-resposta:hover {
                background: #2980b9;
                transform: translateY(-1px);
            }
            
            .btn-cancelar-resposta {
                background: #95a5a6;
                color: white;
            }
            
            .btn-cancelar-resposta:hover {
                background: #7f8c8d;
            }
            
            /* Resposta no card do alerta */
            .resposta-cuidador {
                margin-top: 15px;
                padding: 15px;
                background: #e8f4fd;
                border-radius: 8px;
                border-left: 4px solid #3498db;
            }
            
            .resposta-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .resposta-titulo {
                font-weight: 600;
                color: #2c3e50;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .resposta-data {
                font-size: 0.8rem;
                color: #7f8c8d;
            }
            
            .resposta-texto {
                color: #34495e;
                line-height: 1.5;
                margin: 0;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        </style>
    `;

    const styleElement = document.createElement('div');
    styleElement.id = 'estilos-resposta-alerta';
    styleElement.innerHTML = estilos;
    document.head.appendChild(styleElement);
}

// ✅ INICIALIZAR SISTEMA DE RESPOSTAS
document.addEventListener('DOMContentLoaded', function () {
    // Adicionar estilos
    adicionarEstilosResposta();

    // Tornar funções disponíveis globalmente
    window.abrirModalResponderAlerta = abrirModalResponderAlerta;
    window.fecharModalResposta = fecharModalResposta;
    window.enviarRespostaAlerta = enviarRespostaAlerta;
    window.marcarAlertaComoLido = marcarAlertaComoLido;

    console.log('✅ Sistema de respostas de alertas inicializado');
});

window.carregarAlertasCuidador = carregarAlertasCuidador;
window.exibirAlertasNoDashboardCuidador = exibirAlertasNoDashboardCuidador;






// 🔍 ENCONTRAR E REMOVER ALERTA DE TESTE
window.removerAlertaTeste = function () {
    console.log('🗑️ Buscando e removendo alerta de teste...');

    const chavesParaVerificar = [
        'vitalplus_alertas_compartilhados',
        'vitalplus_alertas_para_cuidador',
        'vitalplus_alertas_db',
        'alertas_supervisor',
        'alertas_compartilhados',
        'alertas_cuidador'
    ];

    let removidos = 0;

    chavesParaVerificar.forEach(chave => {
        const dadosStr = localStorage.getItem(chave);
        if (dadosStr) {
            try {
                const dados = JSON.parse(dadosStr);
                let foiAtualizado = false;

                // Função para remover alertas de teste
                const removerAlertasTeste = (array) => {
                    if (!Array.isArray(array)) return array;

                    const originalLength = array.length;
                    const filtrado = array.filter(alerta => {
                        // Critérios para identificar alerta de teste
                        const titulo = (alerta.titulo || '').toLowerCase();
                        const descricao = (alerta.descricao || '').toLowerCase();

                        const ehTeste =
                            titulo.includes('teste') ||
                            titulo.includes('alerta de teste') ||
                            descricao.includes('teste para verificar') ||
                            (alerta.criado_por_nome && alerta.criado_por_nome.includes('Teste'));

                        if (ehTeste) {
                            console.log(`❌ Removendo alerta de teste: "${alerta.titulo}" (ID: ${alerta.id})`);
                            return false;
                        }
                        return true;
                    });

                    if (filtrado.length !== originalLength) {
                        foiAtualizado = true;
                        removidos += (originalLength - filtrado.length);
                    }

                    return filtrado;
                };

                // Verificar diferentes estruturas
                if (Array.isArray(dados)) {
                    const novosDados = removerAlertasTeste(dados);
                    if (foiAtualizado) {
                        localStorage.setItem(chave, JSON.stringify(novosDados));
                        console.log(`✅ Atualizado: "${chave}"`);
                    }
                } else if (dados && typeof dados === 'object') {
                    if (dados.alertas && Array.isArray(dados.alertas)) {
                        const novosAlertas = removerAlertasTeste(dados.alertas);
                        if (foiAtualizado) {
                            dados.alertas = novosAlertas;
                            localStorage.setItem(chave, JSON.stringify(dados));
                            console.log(`✅ Atualizado: "${chave}" (em dados.alertas)`);
                        }
                    }
                }

            } catch (error) {
                console.log(`⚠️ Erro em "${chave}": ${error.message}`);
            }
        }
    });

    if (removidos > 0) {
        console.log(`\n🎉 ${removidos} alerta(s) de teste removido(s) com sucesso!`);
        console.log('🔄 Atualizando a interface...');

        // Recarregar os alertas
        if (typeof carregarAlertasCuidador === 'function') {
            setTimeout(() => {
                carregarAlertasCuidador();
                console.log('✅ Interface atualizada');
            }, 500);
        }
    } else {
        console.log('✅ Nenhum alerta de teste encontrado para remover.');
    }
};

// 🎯 REMOVER APENAS O ALERTA ESPECÍFICO "ALERTA DE TESTE DO SUPERVISOR"
window.removerAlertaEspecifico = function () {
    console.log('🎯 Removendo alerta específico...');

    const chavesParaVerificar = [
        'vitalplus_alertas_compartilhados',
        'vitalplus_alertas_para_cuidador'
    ];

    const textoBusca = 'ALERTA DE TESTE DO SUPERVISOR';
    let removido = false;

    chavesParaVerificar.forEach(chave => {
        const dadosStr = localStorage.getItem(chave);
        if (dadosStr) {
            try {
                const dados = JSON.parse(dadosStr);

                if (Array.isArray(dados)) {
                    const originalLength = dados.length;
                    const filtrado = dados.filter(alerta => {
                        const titulo = alerta.titulo || '';
                        return titulo !== textoBusca;
                    });

                    if (filtrado.length !== originalLength) {
                        localStorage.setItem(chave, JSON.stringify(filtrado));
                        console.log(`✅ Removido de "${chave}"`);
                        removido = true;
                    }
                }

            } catch (error) {
                console.log(`⚠️ Erro em "${chave}": ${error.message}`);
            }
        }
    });

    if (removido) {
        console.log('\n✅ Alerta específico removido com sucesso!');
        console.log('🔄 Recarregando interface...');

        if (typeof carregarAlertasCuidador === 'function') {
            setTimeout(() => {
                carregarAlertasCuidador();
                console.log('✅ Interface atualizada');
            }, 500);
        }
    } else {
        console.log('⚠️ Alerta específico não encontrado.');
        console.log('💡 Dica: Execute buscarAlertasTeste() para ver todos os alertas.');
    }
};


// 🔍 BUSCAR E VER ALERTAS DE TESTE
window.buscarAlertasTeste = function () {
    console.log('🔍 Buscando alertas de teste no sistema...');

    const chavesParaVerificar = [
        'vitalplus_alertas_compartilhados',
        'vitalplus_alertas_para_cuidador',
        'vitalplus_alertas_db',
        'alertas_supervisor',
        'alertas_compartilhados',
        'alertas_cuidador'
    ];

    let totalAlertasTeste = 0;
    const alertasEncontrados = [];

    chavesParaVerificar.forEach(chave => {
        const dadosStr = localStorage.getItem(chave);
        if (dadosStr) {
            try {
                const dados = JSON.parse(dadosStr);

                const encontrarAlertasTeste = (array) => {
                    if (!Array.isArray(array)) return [];

                    return array.filter(alerta => {
                        const titulo = (alerta.titulo || '').toLowerCase();
                        const descricao = (alerta.descricao || '').toLowerCase();

                        return titulo.includes('teste') ||
                            titulo.includes('alerta de teste') ||
                            descricao.includes('teste') ||
                            (alerta.criado_por_nome && alerta.criado_por_nome.includes('Teste'));
                    });
                };

                if (Array.isArray(dados)) {
                    const alertasTeste = encontrarAlertasTeste(dados);
                    if (alertasTeste.length > 0) {
                        console.log(`\n📁 Na chave "${chave}":`);
                        alertasTeste.forEach(alerta => {
                            alertasEncontrados.push(alerta);
                            totalAlertasTeste++;
                            console.log(`   📌 ID: ${alerta.id}, Título: "${alerta.titulo}"`);
                        });
                    }
                } else if (dados && typeof dados === 'object') {
                    if (dados.alertas && Array.isArray(dados.alertas)) {
                        const alertasTeste = encontrarAlertasTeste(dados.alertas);
                        if (alertasTeste.length > 0) {
                            console.log(`\n📁 Na chave "${chave}" (dados.alertas):`);
                            alertasTeste.forEach(alerta => {
                                alertasEncontrados.push(alerta);
                                totalAlertasTeste++;
                                console.log(`   📌 ID: ${alerta.id}, Título: "${alerta.titulo}"`);
                            });
                        }
                    } else if (dados.titulo && dados.titulo.toLowerCase().includes('teste')) {
                        alertasEncontrados.push(dados);
                        totalAlertasTeste++;
                        console.log(`\n📁 Na chave "${chave}" (objeto direto):`);
                        console.log(`   📌 ID: ${dados.id}, Título: "${dados.titulo}"`);
                    }
                }

            } catch (error) {
                console.log(`⚠️ Erro em "${chave}": ${error.message}`);
            }
        }
    });

    console.log(`\n📊 Total de alertas de teste encontrados: ${totalAlertasTeste}`);

    if (totalAlertasTeste > 0) {
        console.log('\n💡 Comandos disponíveis:');
        console.log('   removerAlertaTeste() - Remove TODOS os alertas de teste');
        console.log('   removerAlertaEspecifico() - Remove apenas "ALERTA DE TESTE DO SUPERVISOR"');

        // Mostrar detalhes
        alertasEncontrados.forEach((alerta, index) => {
            console.log(`\n${index + 1}. "${alerta.titulo}"`);
            console.log(`   ID: ${alerta.id}`);
            console.log(`   Descrição: ${alerta.descricao}`);
            console.log(`   Criado por: ${alerta.criado_por_nome || 'N/A'}`);
        });
    } else {
        console.log('✅ Nenhum alerta de teste encontrado.');
    }

    return alertasEncontrados;
};