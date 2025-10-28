// dashboard_cuidador.js

document.addEventListener("DOMContentLoaded", function() {
    // Inicializar feather icons
    feather.replace();
    
    // Variáveis globais
    let currentPatient = null;
    let currentUser = null;

    // Inicializar dashboard
    initializeDashboard();

    async function initializeDashboard() {
        try {
            // Carregar dados do usuário logado
            await loadUserData();
            
            // Carregar dados do paciente
            await loadPatientData();
            
            // Carregar dados do dashboard
            await loadDashboardData();
            
            // Configurar event listeners
            setupEventListeners();
            
        } catch (error) {
            console.error("Erro ao inicializar dashboard:", error);
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
            // Buscar paciente vinculado ao cuidador
            const response = await fetch(`/api/cuidadores/${currentUser.id}/paciente`);
            
            if (!response.ok) {
                throw new Error("Paciente não encontrado");
            }
            
            const paciente = await response.json();
            currentPatient = paciente;
            
            // Atualizar interface do paciente
            updatePatientInterface(paciente);
            
        } catch (error) {
            console.error("Erro ao carregar paciente:", error);
            showEmptyPatientState();
        }
    }

    function updatePatientInterface(paciente) {
        // Atualizar informações básicas
        document.getElementById("patientName").textContent = paciente.nome || "Nome não informado";
        document.getElementById("patientAge").textContent = calcularIdade(paciente.data_nascimento) + " anos";
        document.getElementById("patientCondition").textContent = paciente.condicao_principal || "Não informada";
        document.getElementById("healthPlan").textContent = paciente.plano_saude || "Não informado";
        document.getElementById("patientAllergies").textContent = paciente.alergias || "Nenhuma";
        
        // Tentar carregar foto do paciente
        if (paciente.foto_perfil) {
            document.getElementById("patientAvatar").src = `/uploads/${paciente.foto_perfil}`;
        }
        
        // Carregar informações do familiar
        loadFamiliarInfo(paciente.familiar_contratante_id);
    }

    function showEmptyPatientState() {
        document.getElementById("patientName").textContent = "Nenhum paciente vinculado";
        document.getElementById("patientAge").textContent = "--";
        document.getElementById("patientCondition").textContent = "--";
        document.getElementById("healthPlan").textContent = "--";
        document.getElementById("patientAllergies").textContent = "--";
        document.getElementById("healthStatus").textContent = "Indisponível";
        document.getElementById("healthDescription").textContent = "Aguardando vínculo com paciente";
    }

    async function loadFamiliarInfo(familiarId) {
        try {
            const response = await fetch(`/api/familiares/${familiarId}/info`);
            if (response.ok) {
                const familiar = await response.json();
                document.getElementById("familiarName").textContent = familiar.nome || "Não informado";
                document.getElementById("contactName").textContent = familiar.nome || "Familiar";
                document.getElementById("contactInfo").textContent = `Telefone: ${familiar.telefone || "--"}`;
            }
        } catch (error) {
            console.error("Erro ao carregar familiar:", error);
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

    async function loadMedications() {
        try {
            const response = await fetch(`/api/pacientes/${currentPatient.id}/medicamentos/hoje`);
            
            if (response.ok) {
                const medicamentos = await response.json();
                updateMedicationsInterface(medicamentos);
            }
        } catch (error) {
            console.error("Erro ao carregar medicamentos:", error);
        }
    }

    function updateMedicationsInterface(medicamentos) {
        const container = document.getElementById("medicationSchedule");
        
        if (medicamentos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-feather="calendar"></i>
                    <p>Nenhum medicamento para hoje</p>
                </div>
            `;
            feather.replace();
            return;
        }
        
        container.innerHTML = medicamentos.map(med => `
            <div class="medication-item">
                <div class="medication-icon">
                    <i data-feather="pill"></i>
                </div>
                <div class="medication-info">
                    <h5>${med.nome_medicamento}</h5>
                    <small>${med.dosagem} - ${med.horario}</small>
                </div>
                <span class="badge ${med.status === 'pendente' ? 'bg-warning' : 'bg-success'}">
                    ${med.status === 'pendente' ? 'Pendente' : 'Administrado'}
                </span>
            </div>
        `).join('');
        
        feather.replace();
    }

    async function loadTasks() {
        try {
            const response = await fetch(`/api/cuidadores/${currentUser.id}/tarefas/hoje`);
            
            if (response.ok) {
                const tarefas = await response.json();
                updateTasksInterface(tarefas);
            }
        } catch (error) {
            console.error("Erro ao carregar tarefas:", error);
        }
    }

    function updateTasksInterface(tarefas) {
        const container = document.getElementById("tasksList");
        
        if (tarefas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-feather="check-circle"></i>
                    <p>Nenhuma tarefa para hoje</p>
                </div>
            `;
            feather.replace();
            return;
        }
        
        container.innerHTML = tarefas.map(tarefa => `
            <div class="task-item">
                <div class="task-icon">
                    <i data-feather="${getTaskIcon(tarefa.tipo)}"></i>
                </div>
                <div class="task-info">
                    <h5>${tarefa.descricao}</h5>
                    <small>${tarefa.horario_previsto}</small>
                </div>
                <span class="badge ${tarefa.status === 'pendente' ? 'bg-warning' : 'bg-success'}">
                    ${tarefa.status === 'pendente' ? 'Pendente' : 'Concluída'}
                </span>
            </div>
        `).join('');
        
        feather.replace();
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


// ====================== FUNÇÃO VOLTAR PARA LANDING PAGE ====================== //
function voltarParaLanding() {
    console.log('🏠 Voltando para a landing page...');
    window.location.href = 'landingpage.html';
}