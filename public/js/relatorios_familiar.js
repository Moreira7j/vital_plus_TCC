// relatorios_familiar.js - RELATÓRIOS E ANÁLISES PARA FAMILIAR CUIDADOR

document.addEventListener('DOMContentLoaded', function () {
    console.log('📊 Inicializando relatórios familiar...');
    
    carregarDadosPaciente();
    configurarEventosRelatorios();
    carregarEstatisticas();
    inicializarGraficos();
    carregarRelatoriosGerados();
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

function configurarEventosRelatorios() {
    // Mostrar/ocultar datas personalizadas
    const periodSelect = document.getElementById('reportPeriod');
    if (periodSelect) {
        periodSelect.addEventListener('change', function() {
            const customRange = document.getElementById('customDateRange');
            if (customRange) {
                customRange.style.display = this.value === 'custom' ? 'flex' : 'none';
            }
        });
    }

    // Botões de período dos gráficos
    const chartButtons = document.querySelectorAll('.btn-chart-action');
    chartButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            chartButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            atualizarGraficos(this.textContent);
        });
    });
}

async function carregarEstatisticas() {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        
        console.log('📊 Carregando estatísticas para paciente:', pacienteId);
        
        if (!usuarioId || !pacienteId) {
            console.error('IDs não encontrados');
            mostrarErroEstatisticas();
            return;
        }

        const response = await fetch(`/api/familiares-cuidadores/${usuarioId}/pacientes/${pacienteId}/estatisticas`);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}`);
        }
        
        const estatisticas = await response.json();
        console.log('✅ Estatísticas carregadas:', estatisticas);
        atualizarEstatisticas(estatisticas);

    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas:', error);
        mostrarErroEstatisticas();
    }
}

function mostrarErroEstatisticas() {
    const elementos = {
        'healthRecordsCount': '--',
        'medicationsCount': '--', 
        'activitiesCount': '--',
        'alertsCount': '--'
    };

    Object.keys(elementos).forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = elementos[id];
        }
    });
}

function atualizarEstatisticas(estatisticas) {
    if (!estatisticas) return;

    const elementos = {
        'healthRecordsCount': estatisticas.registrosSaude || '--',
        'medicationsCount': estatisticas.medicamentos || '--',
        'activitiesCount': estatisticas.atividades || '--',
        'alertsCount': estatisticas.alertas || '--'
    };

    Object.keys(elementos).forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = elementos[id];
        }
    });
}

function inicializarGraficos() {
    // Gráfico de Evolução da Saúde
    const healthEvolutionCtx = document.getElementById('healthEvolutionChart');
    if (healthEvolutionCtx) {
        // Inicializar gráfico vazio - dados serão carregados dinamicamente
        new Chart(healthEvolutionCtx.getContext('2d'), {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                plugins: { legend: { display: true } },
                scales: { y: { beginAtZero: false } }
            }
        });
    }

    // Gráfico de Adesão a Medicamentos
    const medicationAdherenceCtx = document.getElementById('medicationAdherenceChart');
    if (medicationAdherenceCtx) {
        new Chart(medicationAdherenceCtx.getContext('2d'), {
            type: 'doughnut',
            data: { labels: [], datasets: [] },
            options: { responsive: true }
        });
    }

    // Gráfico de Conclusão de Atividades
    const activitiesCompletionCtx = document.getElementById('activitiesCompletionChart');
    if (activitiesCompletionCtx) {
        new Chart(activitiesCompletionCtx.getContext('2d'), {
            type: 'bar',
            data: { labels: [], datasets: [] },
            options: { responsive: true }
        });
    }

    // Gráfico de Distribuição de Alertas
    const alertsDistributionCtx = document.getElementById('alertsDistributionChart');
    if (alertsDistributionCtx) {
        new Chart(alertsDistributionCtx.getContext('2d'), {
            type: 'pie',
            data: { labels: [], datasets: [] },
            options: { responsive: true }
        });
    }

    // Gráfico de Tipos de Atividades
    const activitiesTypesCtx = document.getElementById('activitiesTypesChart');
    if (activitiesTypesCtx) {
        new Chart(activitiesTypesCtx.getContext('2d'), {
            type: 'polarArea',
            data: { labels: [], datasets: [] },
            options: { responsive: true }
        });
    }
}

async function atualizarGraficos(periodo) {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        
        if (!usuarioId || !pacienteId) return;

        const response = await fetch(`/api/familiares-cuidadores/${usuarioId}/pacientes/${pacienteId}/graficos?periodo=${periodo}`);
        
        if (response.ok) {
            const dadosGraficos = await response.json();
            // Aqui você atualizaria os gráficos com os dados recebidos
            console.log('Dados dos gráficos recebidos:', dadosGraficos);
        }
    } catch (error) {
        console.error('Erro ao atualizar gráficos:', error);
    }
}

async function carregarRelatoriosGerados() {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        
        if (!usuarioId || !pacienteId) {
            exibirRelatorios([]);
            return;
        }

        const response = await fetch(`/api/familiares-cuidadores/${usuarioId}/pacientes/${pacienteId}/relatorios`);
        
        if (response.ok) {
            const relatorios = await response.json();
            exibirRelatorios(relatorios);
        } else {
            exibirRelatorios([]);
        }
    } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
        exibirRelatorios([]);
    }
}

function exibirRelatorios(relatorios) {
    const container = document.getElementById('reportsList');
    if (!container) return;
    
    if (!relatorios || relatorios.length === 0) {
        container.innerHTML = `
            <div class="empty-reports">
                <i class="fas fa-chart-bar"></i>
                <p>Nenhum relatório gerado</p>
                <small>Use o botão "Gerar Relatório" para criar o primeiro relatório.</small>
            </div>
        `;
        return;
    }

    container.innerHTML = relatorios.map(relatorio => `
        <div class="report-item">
            <div class="report-icon">
                <i class="fas ${obterIconeRelatorio(relatorio.tipo)}"></i>
            </div>
            <div class="report-content">
                <div class="report-header">
                    <h3 class="report-title">${relatorio.titulo || 'Relatório'}</h3>
                    <span class="report-date">${formatarData(relatorio.data_geracao)}</span>
                </div>
                <p class="report-description">${relatorio.descricao || 'Sem descrição'}</p>
                <div class="report-meta">
                    <span class="report-type">
                        <i class="fas ${obterIconeTipoRelatorio(relatorio.tipo)}"></i>
                        ${obterNomeTipoRelatorio(relatorio.tipo)}
                    </span>
                    <span>Tamanho: ${relatorio.tamanho || 'N/A'}</span>
                    <span>Período: ${relatorio.periodo || 'N/A'}</span>
                </div>
            </div>
            <div class="report-actions">
                <button class="btn-report-action btn-download" onclick="baixarRelatorio('${relatorio.id}')">
                    <i class="fas fa-download"></i>
                    Baixar
                </button>
                <button class="btn-report-action btn-delete" onclick="excluirRelatorio('${relatorio.id}')">
                    <i class="fas fa-trash"></i>
                    Excluir
                </button>
            </div>
        </div>
    `).join('');
}

// Funções auxiliares
function obterIconeRelatorio(tipo) {
    const icones = {
        'health': 'heartbeat',
        'medications': 'pills',
        'activities': 'tasks',
        'comprehensive': 'chart-bar',
        'default': 'file-alt'
    };
    return icones[tipo] || icones.default;
}

function obterIconeTipoRelatorio(tipo) {
    return obterIconeRelatorio(tipo);
}

function obterNomeTipoRelatorio(tipo) {
    const nomes = {
        'health': 'Saúde',
        'medications': 'Medicamentos',
        'activities': 'Atividades',
        'comprehensive': 'Completo',
        'default': 'Relatório'
    };
    return nomes[tipo] || tipo;
}

function formatarData(dataString) {
    try {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    } catch (error) {
        return 'Data inválida';
    }
}

// Funções de ação
function gerarRelatorio() {
    const tipo = document.getElementById('reportType').value;
    const periodo = document.getElementById('reportPeriod').value;
    
    let dataInicio, dataFim;
    
    if (periodo === 'custom') {
        dataInicio = document.getElementById('startDate').value;
        dataFim = document.getElementById('endDate').value;
    } else {
        // Calcular datas baseadas no período selecionado
        const dias = parseInt(periodo);
        const dataFim = new Date();
        const dataInicio = new Date();
        dataInicio.setDate(dataInicio.getDate() - dias);
    }

    console.log('Gerando relatório:', { tipo, periodo, dataInicio, dataFim });
    // Implementar geração de relatório
}

function exportarRelatorio() {
    console.log('Exportando relatório atual');
    // Implementar exportação
}

function baixarRelatorio(relatorioId) {
    console.log('Baixando relatório:', relatorioId);
    // Implementar download
}

function excluirRelatorio(relatorioId) {
    if (confirm('Tem certeza que deseja excluir este relatório?')) {
        console.log('Excluindo relatório:', relatorioId);
        // Implementar exclusão
    }
}

function voltarParaDependentes() {
    window.location.href = 'dependentes.html';
}

function sair() {
    localStorage.clear();
    window.location.href = '/';
}

// ====================== FUNÇÃO VOLTAR PARA LANDING PAGE ====================== //
function voltarParaLanding() {
    console.log('🏠 Voltando para a landing page...');
    window.location.href = 'landingpage.html';
}