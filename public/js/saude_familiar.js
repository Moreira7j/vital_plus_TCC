// saude_familiar.js - MONITORAMENTO DE SAÚDE PARA FAMILIAR CUIDADOR

let graficos = {}; // Objeto para armazenar as instâncias dos gráficos

document.addEventListener('DOMContentLoaded', function () {
    console.log('🩺 Inicializando saúde familiar...');
    
    carregarDadosPaciente();
    carregarHistoricoSinaisVitais();
    configurarEventosSaude();
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

async function carregarHistoricoSinaisVitais() {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        
        console.log('💓 Carregando sinais vitais para paciente:', pacienteId);
        
        if (!usuarioId || !pacienteId) {
            console.error('IDs não encontrados');
            mostrarErroHistorico('Nenhum paciente selecionado. Por favor, selecione um paciente primeiro.');
            setTimeout(() => {
                window.location.href = 'dependentes.html';
            }, 3000);
            return;
        }

        // Mostrar loading
        mostrarLoadingHistorico();

        const response = await fetch(`/api/familiares-cuidadores/${usuarioId}/pacientes/${pacienteId}/sinais-vitais`);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${await response.text()}`);
        }
        
        const sinais = await response.json();
        console.log('✅ Sinais vitais carregados:', sinais.length);
        
        // Atualizar cards com últimos registros
        atualizarCardsSinaisAtuais(sinais);
        
        // Inicializar gráficos com dados reais
        inicializarGraficos(sinais);
        
        // Exibir histórico na tabela
        exibirHistoricoSinaisVitais(sinais);

    } catch (error) {
        console.error('❌ Erro ao carregar histórico:', error);
        mostrarErroHistorico('Erro ao carregar sinais vitais: ' + error.message);
    }
}

function mostrarLoadingHistorico() {
    const tableBody = document.getElementById('vitalHistoryTable');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Carregando sinais vitais...</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

function mostrarErroHistorico(mensagem) {
    const tableBody = document.getElementById('vitalHistoryTable');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Erro ao carregar histórico</p>
                        <small>${mensagem}</small>
                        <button class="btn-primary" onclick="carregarHistoricoSinaisVitais()" style="margin-top: 0.5rem;">
                            <i class="fas fa-redo"></i>
                            Tentar Novamente
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
}

function atualizarCardsSinaisAtuais(sinais) {
    if (!sinais || sinais.length === 0) {
        // Definir valores padrão quando não há dados
        document.getElementById('currentHeartRate').textContent = '-- bpm';
        document.getElementById('currentBloodPressure').textContent = '--/-- mmHg';
        document.getElementById('currentTemperature').textContent = '--°C';
        document.getElementById('currentOxygen').textContent = '--%';
        return;
    }

    // Encontrar últimos registros de cada tipo
    const ultimosRegistros = {};
    sinais.forEach(sinal => {
        if (!ultimosRegistros[sinal.tipo] || new Date(sinal.data_registro) > new Date(ultimosRegistros[sinal.tipo].data_registro)) {
            ultimosRegistros[sinal.tipo] = sinal;
        }
    });

    // Atualizar cards com os valores mais recentes
    if (ultimosRegistros['batimentos_cardiacos']) {
        const sinal = ultimosRegistros['batimentos_cardiacos'];
        document.getElementById('currentHeartRate').textContent = `${sinal.valor_principal} bpm`;
        
        // Atualizar status do indicador
        const statusIndicator = document.querySelector('.vital-card:nth-child(1) .status-indicator');
        if (statusIndicator) {
            statusIndicator.className = 'status-indicator ' + obterStatusSinal(sinal);
        }
    }
    
    if (ultimosRegistros['pressao_arterial']) {
        const sinal = ultimosRegistros['pressao_arterial'];
        document.getElementById('currentBloodPressure').textContent = `${sinal.valor_principal}/${sinal.valor_secundario} mmHg`;
        
        const statusIndicator = document.querySelector('.vital-card:nth-child(2) .status-indicator');
        if (statusIndicator) {
            statusIndicator.className = 'status-indicator ' + obterStatusSinal(sinal);
        }
    }
    
    if (ultimosRegistros['temperatura']) {
        const sinal = ultimosRegistros['temperatura'];
        document.getElementById('currentTemperature').textContent = `${sinal.valor_principal}°C`;
        
        const statusIndicator = document.querySelector('.vital-card:nth-child(3) .status-indicator');
        if (statusIndicator) {
            statusIndicator.className = 'status-indicator ' + obterStatusSinal(sinal);
        }
    }
    
    if (ultimosRegistros['saturacao_oxigenio']) {
        const sinal = ultimosRegistros['saturacao_oxigenio'];
        document.getElementById('currentOxygen').textContent = `${sinal.valor_principal}%`;
        
        const statusIndicator = document.querySelector('.vital-card:nth-child(4) .status-indicator');
        if (statusIndicator) {
            statusIndicator.className = 'status-indicator ' + obterStatusSinal(sinal);
        }
    }
}

function inicializarGraficos(sinais) {
    if (!sinais || sinais.length === 0) {
        inicializarGraficosVazios();
        return;
    }

    // Preparar dados para os gráficos
    const dadosGraficos = prepararDadosParaGraficos(sinais);

    // Gráfico de Frequência Cardíaca
    const heartRateCtx = document.getElementById('heartRateChart');
    if (heartRateCtx && graficos.heartRate) {
        graficos.heartRate.destroy();
    }
    if (heartRateCtx) {
        graficos.heartRate = new Chart(heartRateCtx.getContext('2d'), {
            type: 'line',
            data: dadosGraficos.frequenciaCardiaca,
            options: {
                responsive: true,
                plugins: { 
                    legend: { display: false },
                    title: { display: true, text: 'Frequência Cardíaca (bpm)' }
                },
                scales: { 
                    y: { 
                        beginAtZero: false,
                        suggestedMin: 50,
                        suggestedMax: 120
                    } 
                }
            }
        });
    }

    // Gráfico de Pressão Arterial
    const bloodPressureCtx = document.getElementById('bloodPressureChart');
    if (bloodPressureCtx && graficos.bloodPressure) {
        graficos.bloodPressure.destroy();
    }
    if (bloodPressureCtx) {
        graficos.bloodPressure = new Chart(bloodPressureCtx.getContext('2d'), {
            type: 'line',
            data: dadosGraficos.pressaoArterial,
            options: {
                responsive: true,
                plugins: { 
                    title: { display: true, text: 'Pressão Arterial (mmHg)' }
                }
            }
        });
    }

    // Gráfico de Temperatura
    const temperatureCtx = document.getElementById('temperatureChart');
    if (temperatureCtx && graficos.temperature) {
        graficos.temperature.destroy();
    }
    if (temperatureCtx) {
        graficos.temperature = new Chart(temperatureCtx.getContext('2d'), {
            type: 'line',
            data: dadosGraficos.temperatura,
            options: {
                responsive: true,
                plugins: { 
                    legend: { display: false },
                    title: { display: true, text: 'Temperatura (°C)' }
                },
                scales: { 
                    y: { 
                        beginAtZero: false,
                        suggestedMin: 35.5,
                        suggestedMax: 38.0
                    } 
                }
            }
        });
    }

    // Gráfico de Saturação de Oxigênio
    const oxygenCtx = document.getElementById('oxygenChart');
    if (oxygenCtx && graficos.oxygen) {
        graficos.oxygen.destroy();
    }
    if (oxygenCtx) {
        graficos.oxygen = new Chart(oxygenCtx.getContext('2d'), {
            type: 'line',
            data: dadosGraficos.saturacaoOxigenio,
            options: {
                responsive: true,
                plugins: { 
                    legend: { display: false },
                    title: { display: true, text: 'Saturação de Oxigênio (%)' }
                },
                scales: { 
                    y: { 
                        beginAtZero: false,
                        suggestedMin: 90,
                        suggestedMax: 100
                    } 
                }
            }
        });
    }
}

function prepararDadosParaGraficos(sinais) {
    // Agrupar sinais por tipo e data (últimos 7 dias)
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    
    const sinaisFiltrados = sinais.filter(sinal => new Date(sinal.data_registro) >= seteDiasAtras);
    
    // Preparar dados para frequência cardíaca
    const frequenciaCardiaca = sinaisFiltrados
        .filter(s => s.tipo === 'batimentos_cardiacos')
        .sort((a, b) => new Date(a.data_registro) - new Date(b.data_registro))
        .slice(-10); // Últimos 10 registros

    // Preparar dados para pressão arterial
    const pressaoArterial = sinaisFiltrados
        .filter(s => s.tipo === 'pressao_arterial')
        .sort((a, b) => new Date(a.data_registro) - new Date(b.data_registro))
        .slice(-10);

    // Preparar dados para temperatura
    const temperatura = sinaisFiltrados
        .filter(s => s.tipo === 'temperatura')
        .sort((a, b) => new Date(a.data_registro) - new Date(b.data_registro))
        .slice(-10);

    // Preparar dados para saturação de oxigênio
    const saturacaoOxigenio = sinaisFiltrados
        .filter(s => s.tipo === 'saturacao_oxigenio')
        .sort((a, b) => new Date(a.data_registro) - new Date(b.data_registro))
        .slice(-10);

    return {
        frequenciaCardiaca: {
            labels: frequenciaCardiaca.map(s => formatarDataGrafico(s.data_registro)),
            datasets: [{
                label: 'Batimentos por Minuto',
                data: frequenciaCardiaca.map(s => parseFloat(s.valor_principal)),
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        pressaoArterial: {
            labels: pressaoArterial.map(s => formatarDataGrafico(s.data_registro)),
            datasets: [
                {
                    label: 'Sistólica',
                    data: pressaoArterial.map(s => parseFloat(s.valor_principal)),
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Diastólica',
                    data: pressaoArterial.map(s => parseFloat(s.valor_secundario)),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4
                }
            ]
        },
        temperatura: {
            labels: temperatura.map(s => formatarDataGrafico(s.data_registro)),
            datasets: [{
                label: 'Temperatura (°C)',
                data: temperatura.map(s => parseFloat(s.valor_principal)),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        saturacaoOxigenio: {
            labels: saturacaoOxigenio.map(s => formatarDataGrafico(s.data_registro)),
            datasets: [{
                label: 'Saturação O² (%)',
                data: saturacaoOxigenio.map(s => parseFloat(s.valor_principal)),
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                tension: 0.4,
                fill: true
            }]
        }
    };
}

function inicializarGraficosVazios() {
    const dadosVazios = {
        labels: [],
        datasets: [{
            label: 'Sem dados',
            data: [],
            borderColor: '#ccc',
            backgroundColor: 'rgba(204, 204, 204, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };

    const graficosIds = ['heartRateChart', 'bloodPressureChart', 'temperatureChart', 'oxygenChart'];
    
    graficosIds.forEach(id => {
        const ctx = document.getElementById(id);
        if (ctx) {
            if (graficos[id]) {
                graficos[id].destroy();
            }
            graficos[id] = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: dadosVazios,
                options: {
                    responsive: true,
                    plugins: { 
                        legend: { display: false },
                        title: { display: true, text: 'Aguardando dados...' }
                    }
                }
            });
        }
    });
}

function formatarDataGrafico(dataString) {
    try {
        const data = new Date(dataString);
        return data.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return '--:--';
    }
}

function exibirHistoricoSinaisVitais(sinais) {
    const tableBody = document.getElementById('vitalHistoryTable');
    if (!tableBody) return;
    
    if (!sinais || sinais.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-heartbeat"></i>
                        <p>Nenhum registro de sinais vitais encontrado</p>
                        <small>Os registros aparecerão aqui quando forem adicionados.</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Ordenar por data mais recente primeiro
    const sinaisOrdenados = sinais.sort((a, b) => new Date(b.data_registro) - new Date(a.data_registro));

    tableBody.innerHTML = sinaisOrdenados.map(sinal => `
        <tr>
            <td>${formatarDataHora(sinal.data_registro)}</td>
            <td>
                <span class="vital-type ${sinal.tipo}">
                    <i class="fas ${obterIconeSinal(sinal.tipo)}"></i>
                    ${obterNomeSinal(sinal.tipo)}
                </span>
            </td>
            <td>
                <span class="vital-value-display">
                    ${formatarValorSinal(sinal)}
                </span>
            </td>
            <td>
                <span class="status-badge ${obterStatusSinal(sinal)}">
                    ${obterTextoStatusSinal(sinal)}
                </span>
            </td>
            <td>${sinal.observacoes || '-'}</td>
            <td>
                <button class="btn-action" onclick="editarRegistro('${sinal.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action btn-danger" onclick="excluirRegistro('${sinal.id}')" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function configurarEventosSaude() {
    const filterSelect = document.getElementById('vitalTypeFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            // Implementar filtro por tipo de sinal vital
            console.log('Filtrando por:', this.value);
        });
    }

    const chartButtons = document.querySelectorAll('.btn-chart-action');
    chartButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            chartButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Aqui você pode implementar a mudança de período dos gráficos
            const periodo = this.textContent;
            console.log('Mudando período para:', periodo);
        });
    });
}

// Funções auxiliares
function obterIconeSinal(tipo) {
    const icones = {
        'pressao_arterial': 'tachometer-alt',
        'batimentos_cardiacos': 'heart',
        'temperatura': 'thermometer-half',
        'glicemia': 'tint',
        'saturacao_oxigenio': 'lungs'
    };
    return icones[tipo] || 'heartbeat';
}

function obterNomeSinal(tipo) {
    const nomes = {
        'pressao_arterial': 'Pressão Arterial',
        'batimentos_cardiacos': 'Frequência Cardíaca',
        'temperatura': 'Temperatura',
        'glicemia': 'Glicemia',
        'saturacao_oxigenio': 'Saturação O²'
    };
    return nomes[tipo] || tipo;
}

function formatarValorSinal(sinal) {
    switch(sinal.tipo) {
        case 'pressao_arterial':
            return `${sinal.valor_principal || '--'}/${sinal.valor_secundario || '--'} mmHg`;
        case 'batimentos_cardiacos':
            return `${sinal.valor_principal || '--'} bpm`;
        case 'temperatura':
            return `${sinal.valor_principal || '--'}°C`;
        case 'glicemia':
            return `${sinal.valor_principal || '--'} mg/dL`;
        case 'saturacao_oxigenio':
            return `${sinal.valor_principal || '--'}%`;
        default:
            return sinal.valor_principal || '--';
    }
}

function obterStatusSinal(sinal) {
    const valor = parseFloat(sinal.valor_principal);
    if (isNaN(valor)) return 'unknown';
    
    switch(sinal.tipo) {
        case 'batimentos_cardiacos':
            if (valor < 60) return 'danger';
            if (valor > 100) return 'warning';
            return 'normal';
        case 'pressao_arterial':
            const sistolica = parseFloat(sinal.valor_principal);
            const diastolica = parseFloat(sinal.valor_secundario);
            if (sistolica > 140 || diastolica > 90) return 'warning';
            if (sistolica < 90 || diastolica < 60) return 'danger';
            return 'normal';
        case 'temperatura':
            if (valor < 36.0 || valor > 37.5) return 'warning';
            return 'normal';
        case 'saturacao_oxigenio':
            if (valor < 95) return 'warning';
            if (valor < 90) return 'danger';
            return 'normal';
        default:
            return 'normal';
    }
}

function obterTextoStatusSinal(sinal) {
    const status = obterStatusSinal(sinal);
    const textos = {
        'normal': 'Normal',
        'warning': 'Atenção',
        'danger': 'Crítico',
        'unknown': 'Indefinido'
    };
    return textos[status] || status;
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

// Funções de ação
function registrarSinaisVitais() {
    alert('Modal de registro de sinais vitais será implementado');
}

function editarRegistro(id) {
    console.log('Editando registro:', id);
}

function excluirRegistro(id) {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
        console.log('Excluindo registro:', id);
        // Aqui você implementaria a chamada API para excluir
        carregarHistoricoSinaisVitais(); // Recarregar dados
    }
}

function voltarParaDependentes() {
    window.location.href = 'dependentes.html';
}

function sair() {
    localStorage.clear();
    window.location.href = '/';
}

// Atualizar dados periodicamente (a cada 30 segundos)
setInterval(() => {
    const now = new Date();
    const lastUpdate = document.querySelector('.last-update');
    if (lastUpdate) {
        lastUpdate.innerHTML = `<i class="fas fa-sync-alt"></i> Atualizado ${now.toLocaleTimeString('pt-BR')}`;
    }
}, 30000);

// Recarregar dados a cada 2 minutos
setInterval(() => {
    carregarHistoricoSinaisVitais();
}, 120000);

// ====================== FUNÇÃO VOLTAR PARA LANDING PAGE ====================== //
function voltarParaLanding() {
    console.log('🏠 Voltando para a landing page...');
    window.location.href = 'landingpage.html';
}