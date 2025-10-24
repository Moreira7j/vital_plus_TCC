// saude_familiar.js - MONITORAMENTO DE SAÚDE PARA FAMILIAR CUIDADOR

document.addEventListener('DOMContentLoaded', function () {
    console.log('🩺 Inicializando saúde familiar...');
    
    carregarDadosPaciente();
    inicializarGraficos();
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

function inicializarGraficos() {
    // Gráfico de Frequência Cardíaca
    const heartRateCtx = document.getElementById('heartRateChart');
    if (heartRateCtx) {
        new Chart(heartRateCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Batimentos por Minuto',
                    data: [72, 75, 70, 68, 74, 76, 72],
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: false, min: 60, max: 100 } }
            }
        });
    }

    // Gráfico de Pressão Arterial
    const bloodPressureCtx = document.getElementById('bloodPressureChart');
    if (bloodPressureCtx) {
        new Chart(bloodPressureCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [
                    {
                        label: 'Sistólica',
                        data: [120, 118, 122, 119, 121, 123, 120],
                        borderColor: '#f39c12',
                        backgroundColor: 'rgba(243, 156, 18, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Diastólica',
                        data: [80, 78, 82, 79, 81, 83, 80],
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: { responsive: true }
        });
    }

    // Gráfico de Temperatura
    const temperatureCtx = document.getElementById('temperatureChart');
    if (temperatureCtx) {
        new Chart(temperatureCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Temperatura (°C)',
                    data: [36.5, 36.6, 36.4, 36.7, 36.5, 36.6, 36.5],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: false, min: 36.0, max: 37.5 } }
            }
        });
    }

    // Gráfico de Saturação de Oxigênio
    const oxygenCtx = document.getElementById('oxygenChart');
    if (oxygenCtx) {
        new Chart(oxygenCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Saturação O² (%)',
                    data: [98, 97, 99, 98, 97, 98, 98],
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: false, min: 90, max: 100 } }
            }
        });
    }
}

async function carregarHistoricoSinaisVitais() {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        
        if (!usuarioId || !pacienteId) {
            console.error('IDs não encontrados');
            return;
        }

        const response = await fetch(`/api/familiares-cuidadores/${usuarioId}/pacientes/${pacienteId}/sinais-vitais`);
        
        if (response.ok) {
            const sinais = await response.json();
            exibirHistoricoSinaisVitais(sinais);
        } else {
            exibirHistoricoSinaisVitais(generateMockSinaisVitais());
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        exibirHistoricoSinaisVitais(generateMockSinaisVitais());
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
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = sinais.map(sinal => `
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
        filterSelect.addEventListener('change', carregarHistoricoSinaisVitais);
    }

    const chartButtons = document.querySelectorAll('.btn-chart-action');
    chartButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            chartButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
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
            return (valor >= 60 && valor <= 100) ? 'normal' : 'alert';
        case 'pressao_arterial':
            const sistolica = parseFloat(sinal.valor_principal);
            const diastolica = parseFloat(sinal.valor_secundario);
            return (sistolica <= 140 && diastolica <= 90) ? 'normal' : 'alert';
        default:
            return 'normal';
    }
}

function obterTextoStatusSinal(sinal) {
    const status = obterStatusSinal(sinal);
    return status === 'normal' ? 'Normal' : 'Atenção';
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
    }
}

function voltarParaDependentes() {
    window.location.href = 'dependentes.html';
}

function sair() {
    localStorage.clear();
    window.location.href = '/';
}

// Dados mock para demonstração
function generateMockSinaisVitais() {
    return [
        {
            id: '1',
            tipo: 'batimentos_cardiacos',
            valor_principal: '72',
            data_registro: new Date().toISOString(),
            observacoes: 'Medição rotineira'
        },
        {
            id: '2',
            tipo: 'pressao_arterial',
            valor_principal: '120',
            valor_secundario: '80',
            data_registro: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            observacoes: 'Após repouso'
        }
    ];
}