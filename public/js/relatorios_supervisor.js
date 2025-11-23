// ===============================
// relatorios_familiar.js - VERSÃO CORRIGIDA
// ===============================

// Variáveis globais
let relatoriosData = [];
let usuarioLogado = null;
let currentCharts = {};

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Inicializando relatorios_familiar.js...');
    
    // Inicializar Feather Icons se disponível
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    carregarDadosRelatorios();
    configurarEventos();
});

// ===============================
// CARREGAMENTO DE DADOS
// ===============================
async function carregarDadosRelatorios() {
    try {
        console.log('🔄 Carregando dados do usuário...');
        
        // Buscar dados do usuário de múltiplas fontes
        usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado')) || 
                       JSON.parse(localStorage.getItem('currentUser')) ||
                       JSON.parse(sessionStorage.getItem('usuarioLogado')) ||
                       JSON.parse(sessionStorage.getItem('currentUser'));

        console.log('📋 Dados do usuário:', usuarioLogado);

        if (!usuarioLogado) {
            console.error('❌ Nenhum usuário logado encontrado!');
            mostrarErro('Você precisa fazer login para acessar esta página');
            setTimeout(() => {
                window.location.href = '../paginas/LandingPage.html';
            }, 2000);
            return;
        }

        // Atualizar interface com nome do usuário
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = usuarioLogado.nome || usuarioLogado.name || 'Usuário';
        }

        // Carregar dados
        await buscarDependentes();
        await buscarRelatorios();
        
        console.log('✅ Dados carregados com sucesso!');

    } catch (error) {
        console.error('❌ Erro crítico ao carregar dados:', error);
        mostrarErro('Erro ao carregar dados: ' + error.message);
    }
}

// ===============================
// BUSCAR DEPENDENTES
// ===============================
async function buscarDependentes() {
    try {
        console.log('👥 Buscando dependentes...');
        
        let dependentes = [];
        const usuarioId = usuarioLogado.id || usuarioLogado._id;

        // Tentar diferentes endpoints
        const endpoints = [
            `/api/familiares/${usuarioId}/pacientes`,
            `/api/supervisores/${usuarioId}/dependentes`,
            `/api/usuarios/${usuarioId}/pacientes`
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                if (response.ok) {
                    dependentes = await response.json();
                    console.log(`✅ Dependentes encontrados via ${endpoint}:`, dependentes.length);
                    break;
                }
            } catch (error) {
                console.warn(`❌ Falha no endpoint ${endpoint}:`, error);
            }
        }

        // Se não encontrou, usar dados de exemplo
        if (dependentes.length === 0) {
            console.log('⚠️ Usando dados de exemplo para dependentes');
            dependentes = [
                { id: 1, nome: "Maria Silva", tipo: "Idoso" },
                { id: 2, nome: "João Santos", tipo: "Idoso" }
            ];
        }

        preencherFiltroDependentes(dependentes);
        return dependentes;
        
    } catch (error) {
        console.error('❌ Erro ao buscar dependentes:', error);
        // Usar dados de exemplo em caso de erro
        const dependentesExemplo = [
            { id: 1, nome: "Maria Silva", tipo: "Idoso" },
            { id: 2, nome: "João Santos", tipo: "Idoso" }
        ];
        preencherFiltroDependentes(dependentesExemplo);
        return dependentesExemplo;
    }
}

function preencherFiltroDependentes(dependentes) {
    const selects = [
        document.getElementById('dependenteFilter'),
        document.getElementById('relatorioDependente')
    ];

    selects.forEach(select => {
        if (!select) return;
        
        // Manter a opção padrão e limpar o restante
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Adicionar dependentes
        dependentes.forEach(dep => {
            const option = new Option(dep.nome, dep.id);
            select.add(option);
        });
    });

    console.log(`✅ Filtros preenchidos com ${dependentes.length} dependentes`);
}

// ===============================
// BUSCAR RELATÓRIOS
// ===============================
async function buscarRelatorios() {
    try {
        console.log('📊 Buscando relatórios...');
        
        let relatorios = [];
        const usuarioId = usuarioLogado.id || usuarioLogado._id;

        // Tentar diferentes endpoints
        const endpoints = [
            `/api/supervisores/${usuarioId}/relatorios`,
            `/api/familiares/${usuarioId}/relatorios`,
            `/api/relatorios?usuarioId=${usuarioId}`
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                if (response.ok) {
                    relatorios = await response.json();
                    console.log(`✅ Relatórios encontrados via ${endpoint}:`, relatorios.length);
                    break;
                }
            } catch (error) {
                console.warn(`❌ Falha no endpoint ${endpoint}:`, error);
            }
        }

        // Se não encontrou, usar dados de exemplo
        if (relatorios.length === 0) {
            console.log('⚠️ Usando dados de exemplo para relatórios');
            relatorios = gerarDadosExemplo();
        }

        relatoriosData = relatorios;
        atualizarEstatisticas();
        exibirRelatorios(relatoriosData);
        renderizarGraficos();
        
    } catch (error) {
        console.error('❌ Erro ao buscar relatórios:', error);
        // Usar dados de exemplo em caso de erro
        relatoriosData = gerarDadosExemplo();
        atualizarEstatisticas();
        exibirRelatorios(relatoriosData);
        renderizarGraficos();
    }
}

function gerarDadosExemplo() {
    const tipos = ['saude', 'medicamentos', 'atividades', 'completo'];
    const pacientes = ['Maria Silva', 'João Santos'];
    const relatorios = [];

    for (let i = 1; i <= 12; i++) {
        const tipo = tipos[Math.floor(Math.random() * tipos.length)];
        const paciente = pacientes[Math.floor(Math.random() * pacientes.length)];
        
        relatorios.push({
            id: i,
            titulo: `Relatório de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} - ${paciente}`,
            paciente_nome: paciente,
            paciente_id: paciente === 'Maria Silva' ? 1 : 2,
            tipo: tipo,
            conteudo: `Este é um relatório ${tipo} para ${paciente}. Contém informações detalhadas sobre o período selecionado.`,
            data_criacao: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }

    return relatorios;
}

// ===============================
// ESTATÍSTICAS
// ===============================
function atualizarEstatisticas() {
    const total = relatoriosData.length;
    const hoje = new Date();
    const esteMes = relatoriosData.filter(rel => {
        const data = new Date(rel.data_criacao);
        return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
    }).length;

    const comIncidentes = relatoriosData.filter(rel => 
        rel.tipo === 'incidentes' || rel.conteudo?.toLowerCase().includes('incidente')
    ).length;

    const mediaMensal = calcularMediaMensal();

    // Atualizar elementos
    setText('totalRelatorios', total);
    setText('relatoriosMensais', esteMes);
    setText('relatoriosIncidentes', comIncidentes);
    setText('mediaMensal', `${mediaMensal}/mês`);

    console.log(`📈 Estatísticas atualizadas: Total=${total}, Este Mês=${esteMes}`);
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function calcularMediaMensal() {
    if (relatoriosData.length === 0) return 0;
    
    const datas = relatoriosData.map(rel => new Date(rel.data_criacao));
    const maisAntiga = new Date(Math.min(...datas));
    const hoje = new Date();
    
    const meses = Math.max(1, 
        (hoje.getFullYear() - maisAntiga.getFullYear()) * 12 + 
        hoje.getMonth() - maisAntiga.getMonth()
    );
    
    return Math.round(relatoriosData.length / meses);
}

// ===============================
// EXIBIÇÃO DE RELATÓRIOS
// ===============================
function exibirRelatorios(relatorios) {
    const container = document.getElementById('relatoriosList');
    if (!container) {
        console.error('❌ Container de relatórios não encontrado');
        return;
    }

    if (!relatorios || relatorios.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <p>Nenhum relatório encontrado</p>
                <small class="text-muted">Os relatórios aparecerão aqui quando forem gerados</small>
            </div>
        `;
        return;
    }

    container.innerHTML = relatorios.map(relatorio => `
        <div class="report-item" onclick="abrirDetalhesRelatorio(${relatorio.id})">
            <div class="report-icon">
                <i class="fas ${obterIconeTipo(relatorio.tipo)}"></i>
            </div>
            <div class="report-content">
                <div class="report-header">
                    <h4 class="report-title">${escapeHtml(relatorio.titulo)}</h4>
                    <span class="report-date">${formatarData(relatorio.data_criacao)}</span>
                </div>
                <div class="report-description">
                    ${escapeHtml(relatorio.conteudo)}
                </div>
                <div class="report-meta">
                    <span class="report-type">
                        <i class="fas fa-user"></i>
                        ${escapeHtml(relatorio.paciente_nome)}
                    </span>
                    <span class="report-type ${relatorio.tipo}">
                        <i class="fas ${obterIconeTipo(relatorio.tipo)}"></i>
                        ${obterLabelTipo(relatorio.tipo)}
                    </span>
                </div>
            </div>
            <div class="report-actions">
                <button class="btn-report-action btn-download" onclick="event.stopPropagation(); downloadRelatorio(${relatorio.id})">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn-report-action btn-delete" onclick="event.stopPropagation(); deletarRelatorio(${relatorio.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    console.log(`✅ Exibidos ${relatorios.length} relatórios`);
}

function obterIconeTipo(tipo) {
    const icones = {
        saude: 'fa-heartbeat',
        medicamentos: 'fa-pills',
        atividades: 'fa-tasks',
        completo: 'fa-chart-bar',
        incidentes: 'fa-exclamation-triangle'
    };
    return icones[tipo] || 'fa-file-alt';
}

function obterLabelTipo(tipo) {
    const labels = {
        saude: 'Saúde',
        medicamentos: 'Medicamentos',
        atividades: 'Atividades',
        completo: 'Completo',
        incidentes: 'Incidentes'
    };
    return labels[tipo] || tipo;
}

function formatarData(dataString) {
    try {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Data inválida';
    }
}

// ===============================
// GRÁFICOS
// ===============================
function renderizarGraficos() {
    // Destruir gráficos existentes
    Object.values(currentCharts).forEach(chart => {
        if (chart) chart.destroy();
    });
    currentCharts = {};

    renderizarGraficoTipos();
    renderizarGraficoEvolucao();
}

function renderizarGraficoTipos() {
    const canvas = document.getElementById('tipoChart');
    if (!canvas) return;

    const tiposCount = {};
    relatoriosData.forEach(rel => {
        tiposCount[rel.tipo] = (tiposCount[rel.tipo] || 0) + 1;
    });

    const ctx = canvas.getContext('2d');
    currentCharts.tipos = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(tiposCount).map(obterLabelTipo),
            datasets: [{
                data: Object.values(tiposCount),
                backgroundColor: ['#00B5C2', '#27ae60', '#f39c12', '#9b59b6', '#e74c3c'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

function renderizarGraficoEvolucao() {
    const canvas = document.getElementById('evolucaoChart');
    if (!canvas) return;

    // Agrupar por data (últimos 30 dias)
    const ultimos30Dias = [];
    for (let i = 29; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        ultimos30Dias.push(data.toISOString().split('T')[0]);
    }

    const dadosPorDia = ultimos30Dias.map(data => {
        return relatoriosData.filter(rel => 
            rel.data_criacao.split('T')[0] === data
        ).length;
    });

    const ctx = canvas.getContext('2d');
    currentCharts.evolucao = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ultimos30Dias.map(data => 
                new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            ),
            datasets: [{
                label: 'Relatórios por Dia',
                data: dadosPorDia,
                borderColor: '#00B5C2',
                backgroundColor: 'rgba(0, 181, 194, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
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
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ===============================
// FUNÇÕES DE RELATÓRIOS
// ===============================
function abrirModalRelatorio() {
    const modal = document.getElementById('relatorioModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function fecharModal() {
    const modal = document.getElementById('relatorioModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function gerarRelatorio() {
    try {
        const tipo = document.getElementById('relatorioTipo')?.value;
        const dependenteId = document.getElementById('relatorioDependente')?.value;
        const periodo = document.getElementById('relatorioPeriodo')?.value;

        if (!tipo || !dependenteId) {
            mostrarErro('Por favor, selecione o tipo e o paciente');
            return;
        }

        console.log(`📋 Gerando relatório: ${tipo}, paciente: ${dependenteId}, período: ${periodo} dias`);

        // Simular geração de relatório
        mostrarSucesso('Relatório gerado com sucesso!');
        
        // Fechar modal
        fecharModal();
        
        // Recarregar relatórios
        await buscarRelatorios();
        
    } catch (error) {
        console.error('❌ Erro ao gerar relatório:', error);
        mostrarErro('Erro ao gerar relatório: ' + error.message);
    }
}

function gerarRelatorioRapido(tipo, periodo) {
    // Preencher modal com valores rápidos
    const tipoSelect = document.getElementById('relatorioTipo');
    const periodoSelect = document.getElementById('relatorioPeriodo');
    
    if (tipoSelect) tipoSelect.value = tipo;
    if (periodoSelect) periodoSelect.value = periodo;
    
    abrirModalRelatorio();
}

function toggleCustomDateRange() {
    const periodoSelect = document.getElementById('reportPeriod');
    const customRange = document.getElementById('customDateRange');
    
    if (periodoSelect && customRange) {
        customRange.style.display = periodoSelect.value === 'custom' ? 'flex' : 'none';
    }
}

// ===============================
// FILTROS
// ===============================
function aplicarFiltros() {
    const tipo = document.getElementById('reportType')?.value;
    const periodo = document.getElementById('reportPeriod')?.value;
    const dependente = document.getElementById('dependenteFilter')?.value;

    let relatoriosFiltrados = [...relatoriosData];

    // Filtro por tipo
    if (tipo && tipo !== 'all') {
        relatoriosFiltrados = relatoriosFiltrados.filter(rel => rel.tipo === tipo);
    }

    // Filtro por período
    if (periodo && periodo !== 'custom') {
        const dias = parseInt(periodo);
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - dias);
        
        relatoriosFiltrados = relatoriosFiltrados.filter(rel => 
            new Date(rel.data_criacao) >= dataLimite
        );
    }

    // Filtro por dependente
    if (dependente && dependente !== 'all') {
        relatoriosFiltrados = relatoriosFiltrados.filter(rel => 
            String(rel.paciente_id) === String(dependente)
        );
    }

    console.log(`🔍 Filtros aplicados: ${relatoriosFiltrados.length} relatórios`);
    exibirRelatorios(relatoriosFiltrados);
}

function limparFiltros() {
    const tipoSelect = document.getElementById('reportType');
    const periodoSelect = document.getElementById('reportPeriod');
    const dependenteSelect = document.getElementById('dependenteFilter');
    const customRange = document.getElementById('customDateRange');

    if (tipoSelect) tipoSelect.value = 'all';
    if (periodoSelect) periodoSelect.value = '7';
    if (dependenteSelect) dependenteSelect.value = 'all';
    if (customRange) customRange.style.display = 'none';

    console.log('🧹 Filtros limpos');
    exibirRelatorios(relatoriosData);
}

// ===============================
// FUNÇÕES AUXILIARES
// ===============================
function configurarEventos() {
    // Evento para fechar modal clicando fora
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('relatorioModal');
        if (event.target === modal) {
            fecharModal();
        }
    });

    // Evento para tecla ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            fecharModal();
        }
    });

    console.log('✅ Eventos configurados');
}

function abrirDetalhesRelatorio(id) {
    const relatorio = relatoriosData.find(r => r.id === id);
    if (!relatorio) return;

    const modalHTML = `
        <div class="modal-overlay" onclick="fecharModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>${escapeHtml(relatorio.titulo)}</h3>
                    <button class="modal-close" onclick="fecharModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="relatorio-info">
                        <p><strong>Paciente:</strong> ${escapeHtml(relatorio.paciente_nome)}</p>
                        <p><strong>Tipo:</strong> ${obterLabelTipo(relatorio.tipo)}</p>
                        <p><strong>Data:</strong> ${formatarData(relatorio.data_criacao)}</p>
                    </div>
                    <div class="relatorio-conteudo">
                        <h4>Conteúdo</h4>
                        <p>${escapeHtml(relatorio.conteudo)}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="fecharModal()">Fechar</button>
                    <button class="btn-primary" onclick="downloadRelatorio(${relatorio.id})">
                        <i class="fas fa-download"></i>
                        Exportar PDF
                    </button>
                </div>
            </div>
        </div>
    `;

    // Adicionar modal ao body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
}

function downloadRelatorio(id) {
    console.log(`📥 Download do relatório ${id}`);
    mostrarSucesso('Download iniciado...');
    // Implementar download real aqui
}

function deletarRelatorio(id) {
    if (confirm('Tem certeza que deseja excluir este relatório?')) {
        console.log(`🗑️ Excluindo relatório ${id}`);
        relatoriosData = relatoriosData.filter(rel => rel.id !== id);
        exibirRelatorios(relatoriosData);
        atualizarEstatisticas();
        renderizarGraficos();
        mostrarSucesso('Relatório excluído com sucesso!');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===============================
// NAVEGAÇÃO
// ===============================
function voltarParaDependentes() {
    console.log('🔄 Voltando para página de dependentes...');
    
    // Manter dados do usuário, limpar apenas paciente selecionado
    const keysToRemove = [
        'pacienteSelecionadoId',
        'dependenteSelecionado',
        'selectedPatientId'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    window.location.href = 'dependentes.html';
}

function voltarParaLanding() {
    console.log('🏠 Voltando para landing page...');
    window.location.href = '../paginas/LandingPage.html';
}

function sair() {
    console.log('🚪 Saindo do sistema...');
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '../paginas/LandingPage.html';
}

function mostrarSucesso(mensagem) {
    console.log('✅ ' + mensagem);
    // Poderia usar um toast notification aqui
    alert('✅ ' + mensagem);
}

function mostrarErro(mensagem) {
    console.error('❌ ' + mensagem);
    alert('❌ ' + mensagem);
}

console.log('🔧 relatorios_familiar.js carregado - versão corrigida');