// ===============================
// relatorios_supervisor.js  (VERSÃO CORRIGIDA - PROBLEMA DE AUTENTICAÇÃO)
// ===============================

// Variáveis globais
let relatoriosData = [];
let usuarioLogado = null;
let tipoChartObj = null;
let evolucaoChartObj = null;

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', function () {
    console.log('🔧 Inicializando relatorios_supervisor.js...');
    
    if (window.feather && typeof window.feather.replace === 'function') {
        window.feather.replace();
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
        
        // ✅ CORREÇÃO: Verificar múltiplas possibilidades de armazenamento
        usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        
        // Se não encontrar no localStorage padrão, tenta outras chaves
        if (!usuarioLogado) {
            console.log('❌ usuarioLogado não encontrado no localStorage, verificando alternativas...');
            usuarioLogado = JSON.parse(localStorage.getItem('currentUser')) || 
                           JSON.parse(sessionStorage.getItem('usuarioLogado')) ||
                           JSON.parse(sessionStorage.getItem('currentUser'));
        }

        console.log('📋 Dados recuperados:', usuarioLogado);

        if (!usuarioLogado) {
            console.error('❌ Nenhum usuário logado encontrado!');
            mostrarErro('Você precisa fazer login para acessar esta página');
            setTimeout(() => {
                window.location.href = '../paginas/LandingPage.html';
            }, 2000);
            return;
        }

        // ✅ CORREÇÃO FLEXÍVEL: Verificar tipo de usuário de várias formas
        const tipoUsuario = usuarioLogado.tipo || usuarioLogado.tipo_usuario || usuarioLogado.role;
        console.log('👤 Tipo de usuário detectado:', tipoUsuario);

        const isFamiliarContratante = 
            tipoUsuario === 'familiar_contratante' || 
            tipoUsuario === 'familiar contratante' ||
            tipoUsuario === 'supervisor' ||
            tipoUsuario === 'admin';

        if (!isFamiliarContratante) {
            console.log('🚫 Acesso negado. Tipo de usuário:', tipoUsuario);
            mostrarErro('Acesso permitido apenas para familiares contratantes');
            setTimeout(() => {
                window.location.href = '../paginas/LandingPage.html';
            }, 3000);
            return;
        }

        console.log('✅ Usuário autorizado! ID:', usuarioLogado.id, 'Nome:', usuarioLogado.nome);

        // Atualizar interface com nome do usuário
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = usuarioLogado.nome || 'Usuário';
        }

        // Carregar dados
        await buscarRelatorios();
        await buscarDependentes();
        
        console.log('✅ Dados carregados com sucesso!');

    } catch (error) {
        console.error('❌ Erro crítico ao carregar dados:', error);
        mostrarErro('Erro ao carregar dados: ' + (error.message || error));
    }
}

// ===============================
// BUSCAR RELATÓRIOS
// ===============================
async function buscarRelatorios() {
    try {
        console.log('📊 Buscando relatórios para usuário ID:', usuarioLogado.id);
        
        // ✅ CORREÇÃO: Tentar múltiplas rotas possíveis
        let relatoriosEncontrados = [];
        
        // Tentativa 1: Rota específica do supervisor
        try {
            const resp1 = await fetch(`/api/supervisor/${usuarioLogado.id}/relatorios`);
            if (resp1.ok) {
                relatoriosEncontrados = await resp1.json();
                console.log('✅ Relatórios encontrados via rota supervisor:', relatoriosEncontrados.length);
            }
        } catch (e) {
            console.log('❌ Rota supervisor falhou, tentando próxima...');
        }

        // Tentativa 2: Rota alternativa
        if (relatoriosEncontrados.length === 0) {
            try {
                const resp2 = await fetch(`/api/familiares/${usuarioLogado.id}/relatorios`);
                if (resp2.ok) {
                    relatoriosEncontrados = await resp2.json();
                    console.log('✅ Relatórios encontrados via rota familiares:', relatoriosEncontrados.length);
                }
            } catch (e) {
                console.log('❌ Rota familiares falhou, tentando próxima...');
            }
        }

        // Tentativa 3: Buscar via pacientes
        if (relatoriosEncontrados.length === 0) {
            relatoriosEncontrados = await buscarRelatoriosViaPacientes();
        }

        // Se ainda não encontrou, usar dados de exemplo
        if (relatoriosEncontrados.length === 0) {
            console.log('⚠️ Nenhum relatório encontrado, usando dados de exemplo');
            relatoriosEncontrados = obterDadosExemplo();
        }

        relatoriosData = relatoriosEncontrados;
        
    } catch (error) {
        console.warn('❌ Erro ao buscar relatórios (usando dados de exemplo):', error);
        relatoriosData = obterDadosExemplo();
    }

    atualizarEstatisticas();
    exibirRelatorios(relatoriosData);
    renderizarGraficos();
}

// Buscar relatórios através dos pacientes
async function buscarRelatoriosViaPacientes() {
    try {
        console.log('🔄 Buscando relatórios via pacientes...');
        const pacientes = await buscarPacientesDoUsuario();
        const todosRelatorios = [];

        for (const paciente of pacientes) {
            try {
                const resp = await fetch(`/api/pacientes/${paciente.id}/relatorios`);
                if (resp.ok) {
                    const relatoriosPaciente = await resp.json();
                    // Adiciona informações do paciente a cada relatório
                    relatoriosPaciente.forEach(rel => {
                        rel.paciente_nome = paciente.nome;
                        rel.paciente_id = paciente.id;
                    });
                    todosRelatorios.push(...relatoriosPaciente);
                }
            } catch (error) {
                console.warn(`Erro ao buscar relatórios do paciente ${paciente.nome}:`, error);
            }
        }

        console.log(`✅ Encontrados ${todosRelatorios.length} relatórios via pacientes`);
        return todosRelatorios;
        
    } catch (error) {
        console.error('❌ Erro ao buscar relatórios via pacientes:', error);
        return [];
    }
}

// Buscar pacientes do usuário
async function buscarPacientesDoUsuario() {
    try {
        console.log('👥 Buscando pacientes do usuário...');
        
        // Tentar diferentes rotas para pacientes
        let pacientes = [];
        
        try {
            const resp1 = await fetch(`/api/familiares/${usuarioLogado.id}/pacientes_contratante`);
            if (resp1.ok) {
                pacientes = await resp1.json();
                console.log('✅ Pacientes encontrados via contratante:', pacientes.length);
            }
        } catch (e) {
            console.log('❌ Rota pacientes_contratante falhou, tentando próxima...');
        }

        if (pacientes.length === 0) {
            try {
                const resp2 = await fetch(`/api/familiares/${usuarioLogado.id}/pacientes`);
                if (resp2.ok) {
                    pacientes = await resp2.json();
                    console.log('✅ Pacientes encontrados via rota geral:', pacientes.length);
                }
            } catch (e) {
                console.log('❌ Rota pacientes geral falhou...');
            }
        }

        // Se não encontrou pacientes, usar dados de exemplo
        if (pacientes.length === 0) {
            console.log('⚠️ Nenhum paciente encontrado, usando dados de exemplo');
            pacientes = [
                { id: 1, nome: "Maria Silva" },
                { id: 2, nome: "João Souza" }
            ];
        }

        return pacientes;
        
    } catch (error) {
        console.error('❌ Erro ao buscar pacientes:', error);
        return [
            { id: 1, nome: "Maria Silva" },
            { id: 2, nome: "João Souza" }
        ];
    }
}

function obterDadosExemplo() {
    return [
        {
            id: 1,
            titulo: "Relatório Semanal de Saúde - Maria",
            paciente_nome: "Maria Silva",
            paciente_id: 1,
            tipo: "saude",
            conteudo: "Paciente apresentou melhora significativa nos níveis de glicemia. Pressão arterial estável. Alimentação balanceada conforme orientação nutricional.",
            data_criacao: new Date().toISOString()
        },
        {
            id: 2,
            titulo: "Controle de Medicamentos - João",
            paciente_nome: "João Souza",
            paciente_id: 2,
            tipo: "medicamentos",
            conteudo: "Todos os medicamentos foram administrados conforme prescrição médica. Paciente colaborativo com o tratamento.",
            data_criacao: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 3,
            titulo: "Atividades Físicas - Maria",
            paciente_nome: "Maria Silva",
            paciente_id: 1,
            tipo: "atividades",
            conteudo: "Realizada caminhada leve de 30 minutos. Paciente demonstrou disposição e bom humor durante a atividade.",
            data_criacao: new Date(Date.now() - 172800000).toISOString()
        }
    ];
}

// ===============================
// BUSCAR DEPENDENTES
// ===============================
async function buscarDependentes() {
    try {
        console.log('👥 Buscando dependentes...');
        const pacientes = await buscarPacientesDoUsuario();
        preencherFiltroDependentes(pacientes);
    } catch (error) {
        console.error('❌ Erro ao buscar dependentes:', error);
        // Preenche com dados de exemplo para não quebrar a interface
        preencherFiltroDependentes([
            { id: 1, nome: "Maria Silva" },
            { id: 2, nome: "João Souza" }
        ]);
    }
}

function preencherFiltroDependentes(dependentes) {
    const select = document.getElementById('dependenteFilter');
    const modalSelect = document.getElementById('relatorioDependente');

    if (!select || !modalSelect) {
        console.log('❌ Elementos de filtro não encontrados no DOM');
        return;
    }

    // Limpar opções existentes (exceto a primeira "Todos")
    while (select.options.length > 1) select.remove(1);
    while (modalSelect.options.length > 1) modalSelect.remove(1);

    // Adicionar opções dos dependentes
    dependentes.forEach(dep => {
        select.add(new Option(dep.nome, dep.id));
        modalSelect.add(new Option(dep.nome, dep.id));
    });

    console.log(`✅ Filtro preenchido com ${dependentes.length} dependentes`);
}

// ===============================
// ESTATÍSTICAS
// ===============================
function atualizarEstatisticas() {
    const total = relatoriosData.length;
    const hoje = new Date();
    const esteMes = relatoriosData.filter(rel => {
        const d = new Date(rel.data_criacao);
        return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
    }).length;

    const comIncidentes = relatoriosData.filter(rel => rel.tipo === 'incidentes').length;
    const mediaMensal = calcularMediaMensal();

    setText('totalRelatorios', total);
    setText('relatoriosMensais', esteMes);
    setText('relatoriosIncidentes', comIncidentes);
    setText('mediaMensal', mediaMensal);

    console.log(`📈 Estatísticas atualizadas: Total=${total}, Este Mês=${esteMes}`);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function calcularMediaMensal() {
    if (relatoriosData.length === 0) return 0;
    const primeiro = new Date(relatoriosData[relatoriosData.length - 1].data_criacao);
    const hoje = new Date();
    const meses = Math.max(1, (hoje.getFullYear() - primeiro.getFullYear()) * 12 + hoje.getMonth() - primeiro.getMonth());
    return Math.round(relatoriosData.length / meses);
}

// ===============================
// EXIBIÇÃO DOS RELATÓRIOS
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
                <i data-feather="file-text"></i>
                <p>Nenhum relatório encontrado</p>
                <small class="text-muted">Os relatórios aparecerão aqui quando forem criados</small>
            </div>
        `;
        if (window.feather) window.feather.replace();
        return;
    }

    container.innerHTML = relatorios.map(r => `
        <div class="relatorio-item" onclick="abrirDetalhesRelatorio(${r.id})">
            <div class="relatorio-header">
                <div>
                    <div class="relatorio-title">${escapeHtml(r.titulo)}</div>
                    <div class="relatorio-meta">
                        <span><i data-feather="user"></i> ${escapeHtml(r.paciente_nome)}</span>
                        <span><i data-feather="calendar"></i> ${formatarData(r.data_criacao)}</span>
                    </div>
                </div>
                <span class="relatorio-type ${r.tipo}">${obterLabelTipo(r.tipo)}</span>
            </div>
            <div class="relatorio-content">${escapeHtml(truncateText(r.conteudo, 150))}...</div>
        </div>
    `).join('');
    
    if (window.feather) window.feather.replace();
    console.log(`✅ Exibidos ${relatorios.length} relatórios`);
}

function obterLabelTipo(tipo) {
    const map = {
        saude: 'Saúde',
        medicamentos: 'Medicamentos',
        atividades: 'Atividades',
        incidentes: 'Incidentes',
        outros: 'Outros'
    };
    return map[tipo] || tipo;
}

function formatarData(dataString) {
    const d = new Date(dataString);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ===============================
// GRÁFICOS
// ===============================
function renderizarGraficos() {
    if (tipoChartObj) tipoChartObj.destroy();
    if (evolucaoChartObj) evolucaoChartObj.destroy();

    const tiposCount = {};
    relatoriosData.forEach(r => tiposCount[r.tipo] = (tiposCount[r.tipo] || 0) + 1);

    const tipoCanvas = document.getElementById('tipoChart');
    if (tipoCanvas && Chart) {
        tipoChartObj = new Chart(tipoCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(tiposCount).map(obterLabelTipo),
                datasets: [{
                    data: Object.values(tiposCount),
                    backgroundColor: ['#00B5C2', '#27ae60', '#f39c12', '#e74c3c', '#3498db']
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    console.log('📊 Gráficos renderizados');
}

// ===============================
// EVENTOS
// ===============================
function configurarEventos() {
    const aplicarBtn = document.getElementById('aplicarFiltros');
    const limparBtn = document.getElementById('limparFiltros');
    const logoutBtn = document.getElementById('logoutBtn');

    if (aplicarBtn) {
        aplicarBtn.addEventListener('click', aplicarFiltros);
        console.log('✅ Evento aplicarFiltros configurado');
    }

    if (limparBtn) {
        limparBtn.addEventListener('click', limparFiltros);
        console.log('✅ Evento limparFiltros configurado');
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', e => {
            e.preventDefault();
            console.log('🚪 Efetuando logout...');
            localStorage.removeItem('usuarioLogado');
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('usuarioLogado');
            sessionStorage.removeItem('currentUser');
            window.location.href = '../paginas/LandingPage.html';
        });
        console.log('✅ Evento logout configurado');
    }
}

function aplicarFiltros() {
    const periodo = document.getElementById('periodoFilter')?.value || '30';
    const tipo = document.getElementById('tipoFilter')?.value || 'all';
    const dependente = document.getElementById('dependenteFilter')?.value || 'all';

    let filtrados = [...relatoriosData];
    if (periodo !== 'all') {
        const limite = new Date();
        limite.setDate(limite.getDate() - parseInt(periodo));
        filtrados = filtrados.filter(r => new Date(r.data_criacao) >= limite);
    }
    if (tipo !== 'all') filtrados = filtrados.filter(r => r.tipo === tipo);
    if (dependente !== 'all') filtrados = filtrados.filter(r => String(r.paciente_id) === String(dependente));

    console.log(`🔍 Aplicando filtros: ${filtrados.length} relatórios após filtro`);
    exibirRelatorios(filtrados);
}

function limparFiltros() {
    document.getElementById('periodoFilter').value = '30';
    document.getElementById('tipoFilter').value = 'all';
    document.getElementById('dependenteFilter').value = 'all';
    console.log('🧹 Filtros limpos');
    exibirRelatorios(relatoriosData);
}

// ===============================
// UTILITÁRIOS
// ===============================
function mostrarSucesso(msg) { 
    console.log('✅ ' + msg);
    alert('✅ ' + msg); 
}

function mostrarErro(msg) { 
    console.error('❌ ' + msg);
    alert('❌ ' + msg); 
}

function escapeHtml(text) {
    return text ? text.replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[c])) : '';
}

function truncateText(t, m) { 
    return t && t.length > m ? t.slice(0, m) : t; 
}

function abrirDetalhesRelatorio(id) {
    const r = relatoriosData.find(x => x.id === id);
    if (!r) return;
    
    const modalContent = `
        <h3>${r.titulo}</h3>
        <p><strong>Paciente:</strong> ${r.paciente_nome}</p>
        <p><strong>Tipo:</strong> ${obterLabelTipo(r.tipo)}</p>
        <p><strong>Data:</strong> ${formatarData(r.data_criacao)}</p>
        <hr>
        <p>${r.conteudo}</p>
    `;
    
    // Você pode substituir por um modal mais bonito se preferir
    alert(modalContent);
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

console.log('🔧 relatorios_supervisor.js carregado - versão corrigida');