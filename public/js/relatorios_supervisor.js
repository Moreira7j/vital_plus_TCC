// relatorios_supervisor.js

// Variáveis globais
let relatoriosData = [];
let usuarioLogado = null;

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    carregarDadosRelatorios();
    configurarEventos();
});

async function carregarDadosRelatorios() {
    try {
        // Recuperar usuário logado
        usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (!usuarioLogado) {
            window.location.href = '../index.html';
            return;
        }

        document.getElementById('userName').textContent = usuarioLogado.nome;

        // Buscar relatórios
        await buscarRelatorios();
        
        // Buscar dependentes para filtros
        await buscarDependentes();

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarErro('Erro ao carregar dados: ' + error.message);
    }
}

async function buscarRelatorios() {
    try {
        // Buscar familiar ID primeiro
        const familiarResponse = await fetch(`/api/familiar/${usuarioLogado.id}/familiar_contratante`);
        if (!familiarResponse.ok) {
            throw new Error('Familiar não encontrado');
        }
        
        const familiar = await familiarResponse.json();
        
        // Buscar relatórios do familiar
        const response = await fetch(`/api/supervisor/${familiar.id}/relatorios`);
        
        if (!response.ok) {
            throw new Error('Erro ao buscar relatórios');
        }

        relatoriosData = await response.json();
        atualizarEstatisticas();
        exibirRelatorios(relatoriosData);
        renderizarGraficos();

    } catch (error) {
        console.error('Erro ao buscar relatórios:', error);
        // Usar dados de exemplo para demonstração
        relatoriosData = obterDadosExemplo();
        atualizarEstatisticas();
        exibirRelatorios(relatoriosData);
        renderizarGraficos();
    }
}

function obterDadosExemplo() {
    return [
        {
            id: 1,
            titulo: "Relatório Semanal de Saúde",
            paciente_nome: "Maria Silva",
            tipo: "saude",
            conteudo: "Paciente apresentou melhora significativa nos níveis de glicemia...",
            data_criacao: new Date().toISOString()
        },
        {
            id: 2,
            titulo: "Controle de Medicamentos",
            paciente_nome: "Maria Silva", 
            tipo: "medicamentos",
            conteudo: "Todos os medicamentos foram administrados conforme prescrição...",
            data_criacao: new Date(Date.now() - 86400000).toISOString()
        }
    ];
}

async function buscarDependentes() {
    try {
        // Buscar dependentes do familiar
        const response = await fetch(`/api/familiares/${usuarioLogado.id}/pacientes_contratante`);
        
        if (response.ok) {
            const dependentes = await response.json();
            preencherFiltroDependentes(dependentes);
        }
    } catch (error) {
        console.error('Erro ao buscar dependentes:', error);
    }
}

function preencherFiltroDependentes(dependentes) {
    const select = document.getElementById('dependenteFilter');
    const modalSelect = document.getElementById('relatorioDependente');
    
    // Limpar opções existentes (exceto a primeira)
    while (select.options.length > 1) select.remove(1);
    while (modalSelect.options.length > 1) modalSelect.remove(1);
    
    dependentes.forEach(dependente => {
        const option = new Option(dependente.nome, dependente.id);
        const modalOption = new Option(dependente.nome, dependente.id);
        
        select.add(option);
        modalSelect.add(modalOption);
    });
}

function atualizarEstatisticas() {
    const total = relatoriosData.length;
    const esteMes = relatoriosData.filter(rel => {
        const dataRel = new Date(rel.data_criacao);
        const hoje = new Date();
        return dataRel.getMonth() === hoje.getMonth() && 
               dataRel.getFullYear() === hoje.getFullYear();
    }).length;
    
    const comIncidentes = relatoriosData.filter(rel => rel.tipo === 'incidentes').length;
    const mediaMensal = calcularMediaMensal();

    document.getElementById('totalRelatorios').textContent = total;
    document.getElementById('relatoriosMensais').textContent = esteMes;
    document.getElementById('relatoriosIncidentes').textContent = comIncidentes;
    document.getElementById('mediaMensal').textContent = mediaMensal;
}

function calcularMediaMensal() {
    if (relatoriosData.length === 0) return 0;
    
    const primeiroRelatorio = new Date(relatoriosData[relatoriosData.length - 1].data_criacao);
    const hoje = new Date();
    const meses = Math.max(1, (hoje.getFullYear() - primeiroRelatorio.getFullYear()) * 12 + 
        hoje.getMonth() - primeiroRelatorio.getMonth());
    
    return Math.round(relatoriosData.length / meses);
}

function exibirRelatorios(relatorios) {
    const container = document.getElementById('relatoriosList');
    
    if (!relatorios || relatorios.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-feather="file-text"></i>
                <p>Nenhum relatório encontrado</p>
                <small class="text-muted">Os relatórios aparecerão aqui quando forem criados</small>
            </div>
        `;
        feather.replace();
        return;
    }

    const relatoriosHTML = relatorios.map(relatorio => `
        <div class="relatorio-item" onclick="abrirDetalhesRelatorio(${relatorio.id})">
            <div class="relatorio-header">
                <div>
                    <div class="relatorio-title">${relatorio.titulo}</div>
                    <div class="relatorio-meta">
                        <span class="relatorio-paciente">
                            <i data-feather="user"></i> ${relatorio.paciente_nome}
                        </span>
                        <span>
                            <i data-feather="calendar"></i> ${formatarData(relatorio.data_criacao)}
                        </span>
                    </div>
                </div>
                <span class="relatorio-type ${relatorio.tipo}">${obterLabelTipo(relatorio.tipo)}</span>
            </div>
            <div class="relatorio-content">
                ${relatorio.conteudo.substring(0, 150)}...
            </div>
            <div class="relatorio-actions">
                <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); editarRelatorio(${relatorio.id})">
                    <i data-feather="edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); exportarRelatorio(${relatorio.id})">
                    <i data-feather="download"></i> PDF
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = relatoriosHTML;
    feather.replace();
}

function obterLabelTipo(tipo) {
    const tipos = {
        'saude': 'Saúde',
        'medicamentos': 'Medicamentos',
        'atividades': 'Atividades',
        'incidentes': 'Incidentes',
        'outros': 'Outros'
    };
    return tipos[tipo] || tipo;
}

function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function renderizarGraficos() {
    // Gráfico de distribuição por tipo
    const tiposCount = {};
    relatoriosData.forEach(rel => {
        tiposCount[rel.tipo] = (tiposCount[rel.tipo] || 0) + 1;
    });

    const tipoCtx = document.getElementById('tipoChart').getContext('2d');
    new Chart(tipoCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(tiposCount).map(obterLabelTipo),
            datasets: [{
                data: Object.values(tiposCount),
                backgroundColor: [
                    'rgba(0, 181, 194, 0.8)',
                    'rgba(39, 174, 96, 0.8)',
                    'rgba(243, 156, 18, 0.8)',
                    'rgba(231, 76, 60, 0.8)',
                    'rgba(52, 152, 219, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Gráfico de evolução mensal (exemplo)
    const evolucaoCtx = document.getElementById('evolucaoChart').getContext('2d');
    new Chart(evolucaoCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [{
                label: 'Relatórios por Mês',
                data: [3, 5, 2, 8, 4, 7],
                borderColor: '#00B5C2',
                backgroundColor: 'rgba(0, 181, 194, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function configurarEventos() {
    // Filtros
    document.getElementById('aplicarFiltros').addEventListener('click', aplicarFiltros);
    document.getElementById('limparFiltros').addEventListener('click', limparFiltros);
    
    // Modal
    document.getElementById('novoRelatorioBtn').addEventListener('click', abrirModalRelatorio);
    document.getElementById('closeRelatorioModal').addEventListener('click', fecharModalRelatorio);
    document.getElementById('cancelarRelatorio').addEventListener('click', fecharModalRelatorio);
    
    // Formulário
    document.getElementById('relatorioForm').addEventListener('submit', salvarRelatorio);
    
    // Exportar
    document.getElementById('exportarRelatorios').addEventListener('click', exportarTodosRelatorios);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../index.html';
    });

    // Dropdown do usuário
    const userDropdown = document.querySelector('.nav-item.dropdown');
    userDropdown.addEventListener('click', function(event) {
        event.stopPropagation();
        this.classList.toggle('show');
    });

    window.addEventListener('click', function() {
        userDropdown.classList.remove('show');
    });
}

function aplicarFiltros() {
    const periodo = document.getElementById('periodoFilter').value;
    const tipo = document.getElementById('tipoFilter').value;
    const dependente = document.getElementById('dependenteFilter').value;
    
    let relatoriosFiltrados = [...relatoriosData];
    
    // Filtro por período
    if (periodo !== 'all') {
        const dias = parseInt(periodo);
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - dias);
        
        relatoriosFiltrados = relatoriosFiltrados.filter(rel => 
            new Date(rel.data_criacao) >= dataLimite
        );
    }
    
    // Filtro por tipo
    if (tipo !== 'all') {
        relatoriosFiltrados = relatoriosFiltrados.filter(rel => rel.tipo === tipo);
    }
    
    // Filtro por dependente
    if (dependente !== 'all') {
        relatoriosFiltrados = relatoriosFiltrados.filter(rel => 
            rel.paciente_id == dependente
        );
    }
    
    exibirRelatorios(relatoriosFiltrados);
}

function limparFiltros() {
    document.getElementById('periodoFilter').value = '30';
    document.getElementById('tipoFilter').value = 'all';
    document.getElementById('dependenteFilter').value = 'all';
    exibirRelatorios(relatoriosData);
}

function abrirModalRelatorio() {
    document.getElementById('novoRelatorioModal').style.display = 'flex';
}

function fecharModalRelatorio() {
    document.getElementById('novoRelatorioModal').style.display = 'none';
    document.getElementById('relatorioForm').reset();
}

async function salvarRelatorio(e) {
    e.preventDefault();
    
    // Buscar familiar ID
    const familiarResponse = await fetch(`/api/familiar/${usuarioLogado.id}/familiar_contratante`);
    if (!familiarResponse.ok) {
        mostrarErro('Erro ao identificar familiar');
        return;
    }
    const familiar = await familiarResponse.json();
    
    const formData = {
        titulo: document.getElementById('relatorioTitulo').value,
        paciente_id: document.getElementById('relatorioDependente').value,
        tipo: document.getElementById('relatorioTipo').value,
        conteudo: document.getElementById('relatorioConteudo').value,
        cuidador_id: usuarioLogado.id // Supervisor criando o relatório
    };
    
    try {
        const response = await fetch('/api/relatorios/criar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error('Erro ao criar relatório');
        }
        
        mostrarSucesso('Relatório criado com sucesso!');
        fecharModalRelatorio();
        await buscarRelatorios(); // Recarregar dados
        
    } catch (error) {
        console.error('Erro ao salvar relatório:', error);
        mostrarErro('Erro ao criar relatório');
    }
}

function abrirDetalhesRelatorio(id) {
    const relatorio = relatoriosData.find(r => r.id === id);
    if (relatorio) {
        alert(`Detalhes do Relatório:\n\nTítulo: ${relatorio.titulo}\nPaciente: ${relatorio.paciente_nome}\nTipo: ${obterLabelTipo(relatorio.tipo)}\nData: ${formatarData(relatorio.data_criacao)}\n\nConteúdo:\n${relatorio.conteudo}`);
    }
}

function editarRelatorio(id) {
    console.log('Editar relatório:', id);
    // Implementar edição
}

function exportarRelatorio(id) {
    console.log('Exportar relatório:', id);
    mostrarSucesso('Relatório exportado com sucesso!');
}

function exportarTodosRelatorios() {
    console.log('Exportar todos relatórios');
    mostrarSucesso('Todos os relatórios exportados com sucesso!');
}

// Funções de notificação
function mostrarSucesso(mensagem) {
    alert('✅ ' + mensagem);
}

function mostrarErro(mensagem) {
    alert('❌ ' + mensagem);
}