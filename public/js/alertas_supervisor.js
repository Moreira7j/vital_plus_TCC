// ✅ SISTEMA COMPLETO - API SIMULADA COM localStorage
class AlertasAPI {
    constructor() {
        this.storageKey = 'vitalplus_alertas_db';
        this.initDatabase();
    }

    // ✅ INICIALIZAR BANCO DE DADOS NO localStorage
    initDatabase() {
        if (!localStorage.getItem(this.storageKey)) {
            const initialData = {
                alertas: [],
                proximoId: 1
            };
            localStorage.setItem(this.storageKey, JSON.stringify(initialData));
            console.log('✅ Banco de dados inicializado no localStorage');
        }
    }

    // ✅ OBTER DADOS DO BANCO
    getDatabase() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || { alertas: [], proximoId: 1 };
    }

    // ✅ SALVAR DADOS NO BANCO
    saveDatabase(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    // ✅ BUSCAR ALERTAS DO SUPERVISOR
    async getAlertasBySupervisor(supervisorId) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const db = this.getDatabase();
                // Filtrar alertas relevantes para o supervisor
                const alertas = db.alertas.filter(alerta => 
                    alerta.criado_por_id === supervisorId || 
                    alerta.supervisor_id === supervisorId
                );
                console.log(`📊 Alertas carregados para supervisor ${supervisorId}:`, alertas.length);
                resolve(alertas);
            }, 500); // Simular delay de rede
        });
    }

    // ✅ CRIAR NOVO ALERTA
    async createAlerta(alertaData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const db = this.getDatabase();
                    const novoAlerta = {
                        id: db.proximoId++,
                        ...alertaData,
                        data_criacao: new Date().toISOString(),
                        data_atualizacao: new Date().toISOString()
                    };

                    db.alertas.unshift(novoAlerta); // Adicionar no início
                    this.saveDatabase(db);

                    console.log('✅ Alerta criado:', novoAlerta);
                    resolve(novoAlerta);
                } catch (error) {
                    reject(new Error('Erro ao criar alerta: ' + error.message));
                }
            }, 300);
        });
    }

    // ✅ ATUALIZAR ALERTA
    async updateAlerta(id, updates) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const db = this.getDatabase();
                    const index = db.alertas.findIndex(a => a.id === id);
                    
                    if (index === -1) {
                        reject(new Error('Alerta não encontrado'));
                        return;
                    }

                    db.alertas[index] = {
                        ...db.alertas[index],
                        ...updates,
                        data_atualizacao: new Date().toISOString()
                    };

                    this.saveDatabase(db);
                    console.log('✅ Alerta atualizado:', db.alertas[index]);
                    resolve(db.alertas[index]);
                } catch (error) {
                    reject(new Error('Erro ao atualizar alerta: ' + error.message));
                }
            }, 300);
        });
    }

    // ✅ EXCLUIR ALERTA
    async deleteAlerta(id) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const db = this.getDatabase();
                    const initialLength = db.alertas.length;
                    db.alertas = db.alertas.filter(a => a.id !== id);
                    
                    if (db.alertas.length === initialLength) {
                        reject(new Error('Alerta não encontrado'));
                        return;
                    }

                    this.saveDatabase(db);
                    console.log('✅ Alerta excluído:', id);
                    resolve(true);
                } catch (error) {
                    reject(new Error('Erro ao excluir alerta: ' + error.message));
                }
            }, 300);
        });
    }

    // ✅ BUSCAR TODOS OS ALERTAS (para gráficos)
    async getAllAlertas() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const db = this.getDatabase();
                resolve(db.alertas);
            }, 200);
        });
    }
}

// ✅ INSTÂNCIA GLOBAL DA API
const alertasAPI = new AlertasAPI();

// ✅ CONFIGURAÇÃO DO SISTEMA
let alertas = [];
let filtrosAtivos = {
    status: 'todos',
    prioridade: 'todos',
    tipo: 'todos',
    data: '',
    busca: ''
};

// ✅ INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando sistema de alertas...');
    feather.replace();
    inicializarEventListeners();
    carregarAlertas();
    carregarDependentes();
});

// ✅ CARREGAR DEPENDENTES COM DEBUG COMPLETO
async function carregarDependentes() {
    console.log('🔄 INICIANDO carregarDependentes()');
    
    try {
        // 1. Obter usuário logado
        const usuarioLogadoRaw = localStorage.getItem('usuarioLogado');
        console.log('📄 Raw usuarioLogado do localStorage:', usuarioLogadoRaw);
        
        const usuarioLogado = JSON.parse(usuarioLogadoRaw || '{}');
        console.log('👤 Usuário logado (parsed):', usuarioLogado);
        console.log('📌 ID do usuário:', usuarioLogado.id);
        console.log('📌 Nome do usuário:', usuarioLogado.nome);
        
        // 2. Listar TODAS as chaves do localStorage para debug
        console.log('🗝️ TODAS as chaves do localStorage:');
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            console.log(`   ${i}: ${chave}`);
        }
        
        // 3. Tentar diferentes fontes de dependentes
        let dependentes = [];
        const fontes = [];
        
        // Fonte 1: Dados específicos do usuário
        const chaveEspecifica = `vitalplus_dependentes_${usuarioLogado.id}`;
        console.log(`🔍 Buscando na chave específica: ${chaveEspecifica}`);
        const dadosEspecificos = localStorage.getItem(chaveEspecifica);
        if (dadosEspecificos) {
            console.log('✅ Encontrado dados na chave específica');
            dependentes = JSON.parse(dadosEspecificos);
            fontes.push(`chave específica (${dependentes.length} dependentes)`);
        } else {
            console.log('❌ Nada encontrado na chave específica');
        }
        
        // Fonte 2: Dados gerais (fallback antigo)
        if (dependentes.length === 0) {
            console.log('🔍 Buscando na chave geral: vitalplus_dependentes');
            const dadosGerais = localStorage.getItem('vitalplus_dependentes');
            if (dadosGerais) {
                console.log('✅ Encontrado dados na chave geral');
                dependentes = JSON.parse(dadosGerais);
                fontes.push(`chave geral (${dependentes.length} dependentes)`);
            } else {
                console.log('❌ Nada encontrado na chave geral');
            }
        }
        
        // Fonte 3: Dependendo de como seu sistema estava funcionando antes
        // Vamos verificar várias chaves possíveis
        const chavesPossiveis = [
            'dependentes',
            'pacientes',
            'meus_dependentes',
            'dependentes_usuario',
            `dependentes_${usuarioLogado.id}`,
            `pacientes_${usuarioLogado.id}`,
            'vitalplus_pacientes'
        ];
        
        for (const chave of chavesPossiveis) {
            if (dependentes.length === 0) {
                console.log(`🔍 Tentando chave alternativa: ${chave}`);
                const dadosAlternativos = localStorage.getItem(chave);
                if (dadosAlternativos) {
                    try {
                        const parsed = JSON.parse(dadosAlternativos);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            console.log(`✅ Encontrado em ${chave}: ${parsed.length} itens`);
                            dependentes = parsed;
                            fontes.push(`chave ${chave}`);
                            break;
                        }
                    } catch (e) {
                        console.log(`❌ Erro ao parsear ${chave}:`, e.message);
                    }
                }
            }
        }
        
        // 4. Se ainda não encontrou, verificar sessionStorage
        if (dependentes.length === 0) {
            console.log('🔍 Buscando no sessionStorage...');
            const sessionDeps = sessionStorage.getItem('dependentesAtivos');
            if (sessionDeps) {
                try {
                    dependentes = JSON.parse(sessionDeps);
                    fontes.push(`sessionStorage (${dependentes.length} dependentes)`);
                    console.log('✅ Encontrado no sessionStorage');
                } catch (e) {
                    console.log('❌ Erro ao parsear sessionStorage:', e.message);
                }
            }
        }
        
        // 5. Log dos resultados
        console.log('📊 RESULTADO DA BUSCA:');
        console.log(`   Fontes encontradas: ${fontes.join(', ') || 'Nenhuma'}`);
        console.log(`   Total de dependentes: ${dependentes.length}`);
        console.log('   Dependentes encontrados:', dependentes);
        
        if (dependentes.length === 0) {
            console.warn('⚠️ NENHUM DEPENDENTE ENCONTRADO!');
            console.log('📝 Criando dados de exemplo para continuar...');
            
            // Criar dados de exemplo baseados no usuário atual
            dependentes = [
                { 
                    id: 1, 
                    nome: 'Maria Silva (Exemplo)', 
                    data_nascimento: '1950-03-15',
                    condicao_principal: 'Hipertensão',
                    genero: 'F',
                    supervisor_id: usuarioLogado.id || 25
                }
            ];
            
            // Salvar para uso futuro
            localStorage.setItem(chaveEspecifica, JSON.stringify(dependentes));
            console.log('✅ Dados de exemplo criados e salvos');
        }
        
        // 6. Preencher o select
        preencherSelectDependentes(dependentes);
        
        return dependentes;
        
    } catch (error) {
        console.error('💥 ERRO CRÍTICO em carregarDependentes:', error);
        console.error('Stack trace:', error.stack);
        
        // Fallback extremo
        const dependentesFallback = [
            { id: 1, nome: 'Paciente Fallback' }
        ];
        preencherSelectDependentes(dependentesFallback);
        
        return dependentesFallback;
    }
}

// ✅ PREENCHER SELECT COM DEBUG
function preencherSelectDependentes(dependentes) {
    console.log('🔄 INICIANDO preencherSelectDependentes()');
    console.log('📋 Dependentes recebidos:', dependentes);
    
    const select = document.getElementById('alertaDependente');
    if (!select) {
        console.error('❌ CRÍTICO: Elemento #alertaDependente não encontrado no DOM!');
        console.log('🔍 Procurando por selects relacionados...');
        
        // Tentar encontrar select por outros meios
        const todosSelects = document.querySelectorAll('select');
        console.log('📋 Todos os selects na página:', todosSelects.length);
        todosSelects.forEach((s, i) => {
            console.log(`   ${i}: ${s.id || s.name || 'sem id'} - ${s.className}`);
        });
        
        return;
    }
    
    console.log('✅ Select encontrado:', select);
    console.log('📝 Estado atual do select:', {
        id: select.id,
        name: select.name,
        options: select.options.length,
        value: select.value
    });
    
    // Salvar valor atual se existir
    const valorAtual = select.value;
    
    // Limpar todas as opções
    while (select.firstChild) {
        select.removeChild(select.firstChild);
    }
    
    console.log('🧹 Select limpo');
    
    // Adicionar opção padrão
    const optionPadrao = document.createElement('option');
    optionPadrao.value = '';
    optionPadrao.textContent = 'Selecione o paciente';
    optionPadrao.disabled = true;
    optionPadrao.selected = true;
    select.appendChild(optionPadrao);
    
    console.log('✅ Opção padrão adicionada');
    
    // Adicionar dependentes
    dependentes.forEach((dep, index) => {
        const option = document.createElement('option');
        option.value = dep.id;
        option.textContent = dep.nome || `Paciente ${dep.id}`;
        option.setAttribute('data-index', index);
        
        // Log detalhado de cada dependente
        console.log(`   👤 Adicionando dependente ${index + 1}:`, {
            id: dep.id,
            nome: dep.nome,
            valor: option.value,
            texto: option.textContent
        });
        
        select.appendChild(option);
    });
    
    // Adicionar opção "Todos" se houver múltiplos pacientes
    if (dependentes.length > 1) {
        const optionTodos = document.createElement('option');
        optionTodos.value = 'todos';
        optionTodos.textContent = 'Todos os Dependentes';
        optionTodos.setAttribute('data-type', 'all');
        select.appendChild(optionTodos);
        console.log('✅ Opção "Todos" adicionada');
    }
    
    // Tentar restaurar valor anterior se aplicável
    if (valorAtual && dependentes.some(dep => dep.id == valorAtual)) {
        select.value = valorAtual;
        console.log(`✅ Valor restaurado: ${valorAtual}`);
    }
    
    console.log(`✅ FINALIZADO: ${dependentes.length} dependentes carregados no select`);
    console.log('📊 Estado final do select:', {
        totalOptions: select.options.length,
        selectedValue: select.value,
        selectedText: select.options[select.selectedIndex]?.textContent
    });
}

// ✅ FUNÇÃO PARA VERIFICAR DADOS EXISTENTES (execute no console)
function debugDependentes() {
    console.log('🔍 DEBUG MANUAL DE DEPENDENTES');
    console.log('================================');
    
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
    console.log('👤 Usuário logado:', usuarioLogado);
    
    console.log('\n📋 TODOS OS DADOS NO LOCALSTORAGE:');
    console.log('-----------------------------------');
    for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        if (chave.includes('dependent') || chave.includes('pacient') || chave.includes('user')) {
            try {
                const valor = localStorage.getItem(chave);
                const parsed = JSON.parse(valor);
                console.log(`\n🔑 ${chave}:`);
                console.log('   Tipo:', Array.isArray(parsed) ? 'Array' : typeof parsed);
                if (Array.isArray(parsed)) {
                    console.log('   Quantidade:', parsed.length);
                    console.log('   Conteúdo:', parsed);
                } else {
                    console.log('   Conteúdo:', parsed);
                }
            } catch (e) {
                console.log(`\n🔑 ${chave}: (não é JSON)`, localStorage.getItem(chave));
            }
        }
    }
    
    console.log('\n🎯 BUSCANDO DEPENDENTES ESPECÍFICOS:');
    console.log('-------------------------------------');
    
    const chavesTestar = [
        'vitalplus_dependentes',
        'vitalplus_pacientes',
        'dependentes',
        'pacientes',
        `vitalplus_dependentes_${usuarioLogado.id}`,
        `dependentes_${usuarioLogado.id}`
    ];
    
    chavesTestar.forEach(chave => {
        const dados = localStorage.getItem(chave);
        console.log(`${chave}:`, dados ? 'EXISTE' : 'NÃO EXISTE');
        if (dados) {
            try {
                const parsed = JSON.parse(dados);
                console.log('   Tipo:', Array.isArray(parsed) ? `Array[${parsed.length}]` : typeof parsed);
            } catch (e) {
                console.log('   (não é JSON válido)');
            }
        }
    });
}

// ✅ ATUALIZAR A INICIALIZAÇÃO COM MAIS LOGS
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 =================================');
    console.log('🚀 INICIANDO SISTEMA DE ALERTAS');
    console.log('🚀 =================================');
    console.log('🕒 Hora:', new Date().toLocaleTimeString());
    
    feather.replace();
    console.log('✅ Feather icons carregados');
    
    inicializarEventListeners();
    console.log('✅ Event listeners inicializados');
    
    carregarAlertas();
    console.log('✅ Alertas sendo carregados');
    
    carregarDependentes();
    console.log('✅ Dependentes sendo carregados');
    
    // Adicionar botão de debug no console
    console.log('\n🔧 COMANDOS DE DEBUG DISPONÍVEIS:');
    console.log('   debugDependentes() - Ver dados de dependentes');
    console.log('   localStorage.clear() - Limpar tudo (cuidado!)');
    console.log('   carregarDependentes() - Recarregar dependentes');
    console.log('================================\n');
});

// ✅ ADICIONAR FUNÇÃO PARA SIMULAR DADOS DA PÁGINA DE DEPENDENTES
function simularDadosDependentes() {
    console.log('🎭 SIMULANDO DADOS DE DEPENDENTES (como deveriam vir da página de cadastro)');
    
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
    const dadosSimulados = [
        {
            id: 1,
            nome: "Carlos Alberto",
            idade: 72,
            condicao: "Hipertensão + Diabetes",
            cuidador_principal: "Enfermeira Ana",
            ultima_consulta: "2024-01-15"
        },
        {
            id: 2,
            nome: "Maria Oliveira",
            idade: 68,
            condicao: "Artrite Reumatoide",
            cuidador_principal: "Cuidador João",
            ultima_consulta: "2024-01-10"
        }
    ];
    
    // Salvar de várias formas diferentes para testar
    localStorage.setItem('vitalplus_dependentes', JSON.stringify(dadosSimulados));
    localStorage.setItem(`vitalplus_dependentes_${usuarioLogado.id}`, JSON.stringify(dadosSimulados));
    sessionStorage.setItem('dependentesAtivos', JSON.stringify(dadosSimulados));
    
    console.log('✅ Dados simulados salvos! Recarregue a página.');
    alert('Dados simulados salvos! Recarregue a página para ver os dependentes.');
}

// Adicionar ao escopo global para acesso via console
window.debugDependentes = debugDependentes;
window.simularDadosDependentes = simularDadosDependentes;
window.recarregarDependentes = carregarDependentes;

// ✅ BUSCAR DEPENDENTES DO CADASTRO
async function buscarDependentesDoCadastro(usuarioId) {
    try {
        // Tenta buscar do localStorage de pacientes
        const pacientes = JSON.parse(localStorage.getItem('vitalplus_pacientes') || '[]');
        
        // Filtra pacientes associados ao usuário
        const dependentes = pacientes.filter(paciente => 
            paciente.supervisor_id === usuarioId || 
            paciente.familiar_id === usuarioId ||
            paciente.criado_por === usuarioId
        );
        
        if (dependentes.length > 0) {
            // Salva no localStorage específico do usuário
            const chave = `vitalplus_dependentes_${usuarioId}`;
            localStorage.setItem(chave, JSON.stringify(dependentes));
            console.log('✅ Dependentes salvos no localStorage:', dependentes);
        }
        
        return dependentes;
        
    } catch (error) {
        console.error('Erro ao buscar dependentes do cadastro:', error);
        return [];
    }
}

// ✅ SINCRONIZAR COM CADASTRO DE DEPENDENTES
function sincronizarDependentes() {
    try {
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
        
        // 1. Busca da página de dependentes (se existir)
        const dependentesAtivos = JSON.parse(sessionStorage.getItem('dependentesAtivos') || '[]');
        
        if (dependentesAtivos.length > 0) {
            const chave = `vitalplus_dependentes_${usuarioLogado.id || 'default'}`;
            localStorage.setItem(chave, JSON.stringify(dependentesAtivos));
            console.log('✅ Dependentes sincronizados da sessão:', dependentesAtivos);
            return dependentesAtivos;
        }
        
        // 2. Busca do localStorage geral
        const dependentesGeral = JSON.parse(localStorage.getItem('vitalplus_dependentes') || '[]');
        
        if (dependentesGeral.length > 0) {
            const chave = `vitalplus_dependentes_${usuarioLogado.id || 'default'}`;
            localStorage.setItem(chave, JSON.stringify(dependentesGeral));
            console.log('✅ Dependentes sincronizados do geral:', dependentesGeral);
            return dependentesGeral;
        }
        
        return [];
        
    } catch (error) {
        console.error('Erro ao sincronizar dependentes:', error);
        return [];
    }
}

// ✅ PREENCHER SELECT COM DEPENDENTES
function preencherSelectDependentes(dependentes) {
    const select = document.getElementById('alertaDependente');
    if (!select) {
        console.error('❌ Select de dependentes não encontrado!');
        return;
    }

    // Limpar todas as opções
    select.innerHTML = '';
    
    // Adicionar opção padrão
    const optionPadrao = document.createElement('option');
    optionPadrao.value = '';
    optionPadrao.textContent = 'Selecione o paciente';
    optionPadrao.disabled = true;
    optionPadrao.selected = true;
    select.appendChild(optionPadrao);
    
    // Adicionar dependentes
    dependentes.forEach(dep => {
        const option = document.createElement('option');
        option.value = dep.id;
        option.textContent = dep.nome || `Paciente ${dep.id}`;
        select.appendChild(option);
    });
    
    // Adicionar opção "Todos" se houver múltiplos pacientes
    if (dependentes.length > 1) {
        const optionTodos = document.createElement('option');
        optionTodos.value = 'todos';
        optionTodos.textContent = 'Todos os Dependentes';
        select.appendChild(optionTodos);
    }

    console.log(`✅ ${dependentes.length} dependentes carregados no select`);
}

// ✅ ATUALIZAR A INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando sistema de alertas...');
    feather.replace();
    inicializarEventListeners();
    
    // Sincronizar dependentes primeiro
    const dependentesSincronizados = sincronizarDependentes();
    if (dependentesSincronizados.length > 0) {
        preencherSelectDependentes(dependentesSincronizados);
    }
    
    carregarAlertas();
    carregarDependentes(); // Carrega novamente para garantir
});

function preencherSelectDependentes(dependentes) {
    const select = document.getElementById('alertaDependente');
    if (!select) return;

    // Limpar opções exceto a primeira
    while (select.options.length > 1) {
        select.remove(1);
    }

    // Adicionar dependentes
    dependentes.forEach(dep => {
        const option = document.createElement('option');
        option.value = dep.id;
        option.textContent = dep.nome;
        select.appendChild(option);
    });

    // Adicionar opção "Todos" se houver múltiplos pacientes
    if (dependentes.length > 1) {
        const optionTodos = document.createElement('option');
        optionTodos.value = 'todos';
        optionTodos.textContent = 'Todos os Dependentes';
        select.appendChild(optionTodos);
    }

    console.log(`✅ ${dependentes.length} dependentes carregados`);
}

// ✅ EVENT LISTENERS
function inicializarEventListeners() {
    // Filtros
    const aplicarFiltrosBtn = document.getElementById('aplicarFiltros');
    const filtroStatus = document.getElementById('filtroStatus');
    const filtroPrioridade = document.getElementById('filtroPrioridade');
    const filtroTipo = document.getElementById('filtroTipo');
    const filtroData = document.getElementById('filtroData');
    const filtroBusca = document.getElementById('filtroBusca');

    if (aplicarFiltrosBtn) aplicarFiltrosBtn.addEventListener('click', aplicarFiltros);
    if (filtroStatus) filtroStatus.addEventListener('change', atualizarFiltros);
    if (filtroPrioridade) filtroStatus.addEventListener('change', atualizarFiltros);
    if (filtroTipo) filtroTipo.addEventListener('change', atualizarFiltros);
    if (filtroData) filtroData.addEventListener('change', atualizarFiltros);
    if (filtroBusca) filtroBusca.addEventListener('input', atualizarFiltros);

    // Modal
    const novoAlertaBtn = document.getElementById('novoAlertaBtn');
    const fecharModalBtn = document.getElementById('fecharModal');
    const cancelarBtn = document.getElementById('cancelarBtn');
    const alertaForm = document.getElementById('alertaForm');

    if (novoAlertaBtn) novoAlertaBtn.addEventListener('click', abrirModalNovoAlerta);
    if (fecharModalBtn) fecharModalBtn.addEventListener('click', fecharModal);
    if (cancelarBtn) cancelarBtn.addEventListener('click', fecharModal);
    if (alertaForm) alertaForm.addEventListener('submit', salvarAlerta);

    // Fechar modal ao clicar fora
    const alertaModal = document.getElementById('alertaModal');
    if (alertaModal) {
        alertaModal.addEventListener('click', function(e) {
            if (e.target === this) fecharModal();
        });
    }

    console.log('✅ Event listeners inicializados');
}

// ✅ CARREGAR ALERTAS DA API SIMULADA
async function carregarAlertas() {
    try {
        mostrarLoading(true);
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
        
        console.log('🔍 Buscando alertas para:', usuarioLogado.nome);
        
        // Usar a API simulada
        alertas = await alertasAPI.getAlertasBySupervisor(usuarioLogado.id);
        
        console.log(`✅ ${alertas.length} alertas carregados`);
        renderizarAlertas();
        atualizarEstatisticas();
        inicializarGrafico();
        
    } catch (error) {
        console.error('❌ Erro ao carregar alertas:', error);
        mostrarMensagem('Erro ao carregar alertas: ' + error.message, 'error');
        alertas = [];
        renderizarAlertas();
        atualizarEstatisticas();
    } finally {
        mostrarLoading(false);
    }
}

// ✅ FUNÇÃO PARA CRIAR ALERTA (MESMA LÓGICA DAS ATIVIDADES)
async function criarAlerta(alertaData) {
    try {
        console.log('📝 Criando alerta...');
        
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        const usuarioNome = localStorage.getItem('usuarioNome') || 'Familiar';
        const pacienteNome = localStorage.getItem('pacienteNome') || 'Paciente';

        if (!pacienteId || !usuarioId) {
            throw new Error('Paciente ou usuário não identificado');
        }

        // Dados completos do alerta
        const dadosParaAPI = {
            paciente_id: parseInt(pacienteId),
            paciente_nome: pacienteNome,
            usuario_id: parseInt(usuarioId),
            usuario_nome: usuarioNome,
            usuario_tipo: 'familiar_supervisor',
            tipo: alertaData.tipo,
            titulo: alertaData.titulo,
            descricao: alertaData.descricao,
            severidade: alertaData.severidade,
            status: 'ativo', // Sempre ativo quando criado
            data_criacao: new Date().toISOString()
        };

        console.log('📤 Enviando alerta para API:', dadosParaAPI);

        const response = await fetch('/api/alertas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosParaAPI)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Alerta criado com sucesso:', data);
        
        // ✅ SALVAR TAMBÉM NO LOCALSTORAGE PARA ACESSO IMEDIATO
        salvarAlertaLocalStorage(data);
        
        return data;

    } catch (error) {
        console.error('❌ Erro ao criar alerta:', error);
        throw error;
    }
}

// ✅ FUNÇÃO PARA SALVAR ALERTA NO LOCALSTORAGE
function salvarAlertaLocalStorage(alerta) {
    try {
        const chave = 'vitalplus_alertas_compartilhados';
        let alertasExistentes = JSON.parse(localStorage.getItem(chave)) || [];
        
        // Adicionar novo alerta
        alertasExistentes.unshift(alerta);
        
        // Limitar a 50 alertas
        if (alertasExistentes.length > 50) {
            alertasExistentes = alertasExistentes.slice(0, 50);
        }
        
        localStorage.setItem(chave, JSON.stringify(alertasExistentes));
        console.log(`💾 Alerta salvo no localStorage. Total: ${alertasExistentes.length}`);
        
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
    }
}



// ✅ NOTIFICAR CUIDADORES (Simulado)
function notificarCuidadores(alerta) {
    console.log('🔔 Notificando cuidadores sobre novo alerta:', alerta);
    
    const mensagem = `
    🚨 NOVO ALERTA CRIADO!
    
    Título: ${alerta.titulo}
    Tipo: ${obterTextoTipo(alerta.tipo)}
    Severidade: ${obterTextoSeveridade(alerta.severidade)}
    Paciente: ${alerta.paciente_nome || 'Todos os pacientes'}
    
    ${alerta.descricao}
    `;
    
    console.log(mensagem);
    
    // Simular notificação push
    mostrarMensagem(`Alerta "${alerta.titulo}" criado com sucesso!`, 'success');
}

// ✅ ATUALIZAR ALERTA
async function atualizarAlerta(id, dadosAtualizados) {
    try {
        const alertaAtualizado = await alertasAPI.updateAlerta(id, dadosAtualizados);
        return alertaAtualizado;
    } catch (error) {
        throw error;
    }
}

// ✅ EXCLUIR ALERTA
async function excluirAlerta(id) {
    try {
        await alertasAPI.deleteAlerta(id);
        return true;
    } catch (error) {
        throw error;
    }
}

// ✅ RENDERIZAR ALERTAS NA TELA
function renderizarAlertas() {
    const container = document.querySelector('.alertas-container');
    const alertasFiltrados = filtrarAlertas();

    if (alertasFiltrados.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i data-feather="inbox" class="text-muted" style="width: 48px; height: 48px;"></i>
                <h4 class="mt-3 text-muted">Nenhum alerta encontrado</h4>
                <p class="text-muted">${alertas.length === 0 ? 'Crie seu primeiro alerta para os cuidadores!' : 'Tente ajustar os filtros'}</p>
            </div>
        `;
        feather.replace();
        return;
    }

    container.innerHTML = alertasFiltrados.map(alerta => `
        <div class="alerta-card ${alerta.severidade} ${alerta.status === 'resolvido' ? 'resolvido' : ''}">
            <div class="alerta-header">
                <div class="alerta-titulo">
                    <div class="alerta-metadata-top">
                        <span class="tipo-badge ${alerta.tipo}">
                            <i class="${obterIconeTipo(alerta.tipo)}"></i>
                            ${obterTextoTipo(alerta.tipo)}
                        </span>
                        <span class="severidade-badge ${alerta.severidade}">
                            ${obterTextoSeveridade(alerta.severidade)}
                        </span>
                        ${alerta.status === 'resolvido' ? '<span class="status-badge resolvido">Resolvido</span>' : ''}
                    </div>
                    <h3>${alerta.titulo}</h3>
                </div>
                <div class="alerta-acoes">
                    ${alerta.status === 'ativo' ? `
                        <button class="btn-icon" onclick="marcarComoResolvido(${alerta.id})" title="Marcar como Resolvido">
                            <i data-feather="check-circle"></i>
                        </button>
                    ` : ''}
                    ${alerta.status === 'resolvido' ? `
                        <button class="btn-icon" onclick="reabrirAlerta(${alerta.id})" title="Reabrir Alerta">
                            <i data-feather="rotate-ccw"></i>
                        </button>
                    ` : ''}
                    <button class="btn-icon btn-danger" onclick="excluirAlertaConfirmacao(${alerta.id})" title="Excluir">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            </div>
            <div class="alerta-body">
                <p>${alerta.descricao || 'Sem descrição'}</p>
                <div class="alerta-metadata">
                    <span><i data-feather="user"></i> Paciente: ${alerta.paciente_nome || 'Todos os pacientes'}</span>
                    <span><i data-feather="clock"></i> Criado: ${formatarData(alerta.data_criacao)}</span>
                    <span><i data-feather="user-check"></i> Por: ${alerta.criado_por || 'Sistema'}</span>
                    ${alerta.data_resolucao ? `
                        <span><i data-feather="check-circle"></i> Resolvido: ${formatarData(alerta.data_resolucao)}</span>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');

    feather.replace();
}

// ✅ FILTROS
function aplicarFiltros() {
    renderizarAlertas();
    atualizarEstatisticas();
}

function atualizarFiltros() {
    filtrosAtivos = {
        status: document.getElementById('filtroStatus').value,
        prioridade: document.getElementById('filtroPrioridade').value,
        tipo: document.getElementById('filtroTipo').value,
        data: document.getElementById('filtroData').value,
        busca: document.getElementById('filtroBusca').value.toLowerCase()
    };
}

function filtrarAlertas() {
    return alertas.filter(alerta => {
        const matchStatus = filtrosAtivos.status === 'todos' || 
                           (filtrosAtivos.status === 'ativo' && alerta.status === 'ativo') ||
                           (filtrosAtivos.status === 'resolvido' && alerta.status === 'resolvido');
        
        const matchPrioridade = filtrosAtivos.prioridade === 'todos' || 
                               alerta.severidade === filtrosAtivos.prioridade;
        
        const matchTipo = filtrosAtivos.tipo === 'todos' || 
                         alerta.tipo === filtrosAtivos.tipo;
        
        const matchData = !filtrosAtivos.data || 
                         new Date(alerta.data_criacao).toISOString().split('T')[0] === filtrosAtivos.data;
        
        const matchBusca = !filtrosAtivos.busca ||
                          alerta.titulo.toLowerCase().includes(filtrosAtivos.busca) ||
                          (alerta.descricao && alerta.descricao.toLowerCase().includes(filtrosAtivos.busca)) ||
                          (alerta.paciente_nome && alerta.paciente_nome.toLowerCase().includes(filtrosAtivos.busca));

        return matchStatus && matchPrioridade && matchTipo && matchData && matchBusca;
    });
}

// ✅ MODAL FUNCTIONS
function abrirModalNovoAlerta() {
    document.getElementById('modalTitulo').textContent = 'Novo Alerta para os Cuidadores';
    document.getElementById('alertaForm').reset();
    document.getElementById('alertaModal').style.display = 'flex';
    
    setTimeout(() => {
        document.getElementById('alertaTitulo').focus();
    }, 100);
}

function fecharModal() {
    document.getElementById('alertaModal').style.display = 'none';
}

// ✅ ATUALIZE A FUNÇÃO salvarAlerta para usar o sistema compartilhado
async function salvarAlerta(e) {
    e.preventDefault();
    
    const titulo = document.getElementById('alertaTitulo').value.trim();
    const descricao = document.getElementById('alertaDescricao').value.trim();
    const tipo = document.getElementById('alertaTipo').value;
    const severidade = document.getElementById('alertaPrioridade').value;
    const dependenteSelect = document.getElementById('alertaDependente');
    const dependenteId = dependenteSelect.value;
    const dependenteNome = dependenteSelect.options[dependenteSelect.selectedIndex].text;

    // Validações
    if (!titulo) {
        mostrarMensagem('Por favor, informe um título para o alerta', 'error');
        return;
    }

    if (!descricao) {
        mostrarMensagem('Por favor, informe uma descrição para o alerta', 'error');
        return;
    }

    if (!dependenteId) {
        mostrarMensagem('Por favor, selecione um paciente', 'error');
        return;
    }

    const alertaData = {
        tipo,
        titulo,
        descricao,
        severidade,
        paciente_id: dependenteId,
        paciente_nome: dependenteNome
    };

    try {
        mostrarLoading(true);
        
        // ✅ USAR A FUNÇÃO DE ALERTA COMPARTILHADO
        const alertaCriado = await criarAlertaCompartilhado(alertaData);
        
        mostrarMensagem('Alerta criado e enviado para os cuidadores!', 'success');
        
        // Notificar cuidadores
        notificarCuidadores(alertaCriado);
        
        fecharModal();
        
        // ✅ RECARREGAR ALERTAS NO DASHBOARD DO SUPERVISOR
        if (window.carregarAlertasDashboard) {
            await window.carregarAlertasDashboard();
        }
        
        // ✅ FORÇAR SINCronIZAÇÃO NO CUIDADOR (se estiver na mesma sessão)
        sincronizarComCuidador(alertaCriado);
        
    } catch (error) {
        mostrarMensagem('Erro ao criar alerta: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
}

// ✅ FUNÇÃO PARA SINCRONIZAR COM O CUIDADOR
function sincronizarComCuidador(alerta) {
    console.log('🔔 Sincronizando alerta com cuidador...', alerta);
    
    // Adicionar flag de não visualizado pelo cuidador
    alerta.visualizado_por_cuidador = false;
    alerta.data_envio_cuidador = new Date().toISOString();
    
    // Salvar em uma chave específica para o cuidador
    const chaveCuidador = 'vitalplus_alertas_para_cuidador';
    let alertasParaCuidador = JSON.parse(localStorage.getItem(chaveCuidador)) || [];
    
    // Adicionar apenas se não existir
    const jaExiste = alertasParaCuidador.some(a => a.id === alerta.id);
    if (!jaExiste) {
        alertasParaCuidador.unshift(alerta);
        localStorage.setItem(chaveCuidador, JSON.stringify(alertasParaCuidador));
        console.log('✅ Alerta disponível para o cuidador:', alertasParaCuidador.length);
    }
}





// ✅ AÇÕES DOS ALERTAS
async function marcarComoResolvido(id) {
    try {
        const dadosAtualizados = {
            status: 'resolvido',
            data_resolucao: new Date().toISOString()
        };

        await atualizarAlerta(id, dadosAtualizados);
        mostrarMensagem('Alerta marcado como resolvido!', 'success');
        await carregarAlertas();
    } catch (error) {
        mostrarMensagem('Erro ao atualizar alerta: ' + error.message, 'error');
    }
}

async function reabrirAlerta(id) {
    try {
        const dadosAtualizados = {
            status: 'ativo',
            data_resolucao: null
        };

        await atualizarAlerta(id, dadosAtualizados);
        mostrarMensagem('Alerta reaberto!', 'success');
        await carregarAlertas();
    } catch (error) {
        mostrarMensagem('Erro ao reabrir alerta: ' + error.message, 'error');
    }
}

function excluirAlertaConfirmacao(id) {
    if (confirm('Tem certeza que deseja excluir este alerta?')) {
        excluirAlertaHandler(id);
    }
}

async function excluirAlertaHandler(id) {
    try {
        await excluirAlerta(id);
        alertas = alertas.filter(a => a.id !== id);
        mostrarMensagem('Alerta excluído com sucesso!', 'success');
        renderizarAlertas();
        atualizarEstatisticas();
    } catch (error) {
        mostrarMensagem('Erro ao excluir alerta: ' + error.message, 'error');
    }
}

// ✅ ESTATÍSTICAS
function atualizarEstatisticas() {
    const alertasFiltrados = filtrarAlertas();
    const total = alertasFiltrados.length;
    const ativos = alertasFiltrados.filter(a => a.status === 'ativo').length;
    const resolvidos = alertasFiltrados.filter(a => a.status === 'resolvido').length;
    const alta = alertasFiltrados.filter(a => a.severidade === 'alta' && a.status === 'ativo').length;

    document.getElementById('totalAlertas').textContent = total;
    document.getElementById('alertasAtivos').textContent = ativos;
    document.getElementById('alertasResolvidos').textContent = resolvidos;
    document.getElementById('alertasAlta').textContent = alta;

    console.log(`📊 Estatísticas: ${total} total, ${ativos} ativos, ${resolvidos} resolvidos, ${alta} alta prioridade`);
}

// ✅ GRÁFICO DINÂMICO
function inicializarGrafico() {
    const ctx = document.getElementById('alertasChart');
    if (!ctx) return;

    // Destruir gráfico anterior se existir
    if (window.alertasChartInstance) {
        window.alertasChartInstance.destroy();
    }

    const alertasUltimaSemana = alertas.filter(a => {
        const umaSemanaAtras = new Date();
        umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
        return new Date(a.data_criacao) >= umaSemanaAtras;
    });

    const dadosPorDia = agruparAlertasPorDia(alertasUltimaSemana);

    const data = {
        labels: Object.keys(dadosPorDia),
        datasets: [
            {
                label: 'Alertas Ativos',
                data: Object.values(dadosPorDia).map(dia => dia.ativos),
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: 'Alertas Resolvidos',
                data: Object.values(dadosPorDia).map(dia => dia.resolvidos),
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                tension: 0.4,
                fill: true
            }
        ]
    };

    window.alertasChartInstance = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
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

function agruparAlertasPorDia(alertas) {
    const dias = {};
    const hoje = new Date();
    
    // Inicializar últimos 7 dias
    for (let i = 6; i >= 0; i--) {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() - i);
        const dataStr = data.toISOString().split('T')[0];
        dias[dataStr] = { ativos: 0, resolvidos: 0 };
    }
    
    // Contar alertas por dia
    alertas.forEach(alerta => {
        const dataAlerta = new Date(alerta.data_criacao).toISOString().split('T')[0];
        if (dias[dataAlerta]) {
            if (alerta.status === 'resolvido') {
                dias[dataAlerta].resolvidos++;
            } else {
                dias[dataAlerta].ativos++;
            }
        }
    });
    
    // Converter para formato legível
    const diasFormatados = {};
    Object.keys(dias).forEach(data => {
        const dataObj = new Date(data);
        const label = dataObj.toLocaleDateString('pt-BR', { weekday: 'short' });
        diasFormatados[label] = dias[data];
    });
    
    return diasFormatados;
}

// ✅ UTILITÁRIOS
function obterTextoSeveridade(severidade) {
    const textos = {
        'alta': 'Alta Prioridade',
        'media': 'Média Prioridade', 
        'baixa': 'Baixa Prioridade',
        'critica': 'Crítica'
    };
    return textos[severidade] || severidade;
}

function obterTextoTipo(tipo) {
    const textos = {
        'medicamento': 'Medicamento',
        'consulta': 'Consulta',
        'exame': 'Exame',
        'observacao': 'Observação',
        'comportamento': 'Comportamento',
        'sintoma': 'Sintoma',
        'outros': 'Outros'
    };
    return textos[tipo] || tipo;
}

function obterIconeTipo(tipo) {
    const icones = {
        'medicamento': 'fas fa-pills',
        'consulta': 'fas fa-hospital',
        'exame': 'fas fa-microscope',
        'observacao': 'fas fa-sticky-note',
        'comportamento': 'fas fa-brain',
        'sintoma': 'fas fa-thermometer-half',
        'outros': 'fas fa-exclamation-triangle'
    };
    return icones[tipo] || 'fas fa-bell';
}

function formatarData(dataString) {
    return new Date(dataString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function mostrarMensagem(mensagem, tipo) {
    // Remover notificações existentes
    const notificacoesExistentes = document.querySelectorAll('.notification');
    notificacoesExistentes.forEach(notif => notif.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${tipo === 'error' ? 'error' : ''}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${tipo === 'success' ? 'check' : tipo === 'info' ? 'info' : 'exclamation'}-circle"></i>
            <span>${mensagem}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function mostrarLoading(mostrar) {
    if (mostrar) {
        let loadingEl = document.getElementById('loadingOverlay');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'loadingOverlay';
            loadingEl.className = 'loading-overlay';
            loadingEl.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Carregando...</p>
                </div>
            `;
            document.body.appendChild(loadingEl);
        }
    } else {
        const loading = document.getElementById('loadingOverlay');
        if (loading) loading.remove();
    }
}

// ✅ FUNÇÕES DE NAVEGAÇÃO
function voltarParaDependentes() {
    console.log('🔄 Voltando para página de dependentes...');
    window.location.href = 'dependentes.html';
}

function voltarParaLanding() {
    console.log('🏠 Voltando para a landing page...');
    window.location.href = 'landingpage.html';
}

function sair() {
    console.log('🚪 Saindo do sistema...');
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '../paginas/LandingPage.html';
}

// ✅ INICIALIZAR FEATHER ICONS
feather.replace();
console.log('✅ Sistema de alertas carregado e pronto!');

// ✅ FUNÇÃO PARA CRIAR ALERTA COMPARTILHADO
async function criarAlertaCompartilhado(alertaData) {
    try {
        console.log('📝 Criando alerta compartilhado...');
        
        // Dados do usuário atual
        const usuarioId = localStorage.getItem('usuarioId');
        const usuarioTipo = localStorage.getItem('usuarioTipo');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        const pacienteNome = localStorage.getItem('pacienteNome') || 'Paciente';

        // Dados completos do alerta
        const alerta = {
            id: Date.now(), // ID único baseado em timestamp
            ...alertaData,
            status: 'ativo',
            paciente_id: pacienteId,
            paciente_nome: pacienteNome,
            criado_por_id: usuarioId,
            criado_por_tipo: usuarioTipo,
            criado_por_nome: localStorage.getItem('usuarioNome') || 'Familiar',
            data_criacao: new Date().toISOString(),
            data_atualizacao: new Date().toISOString(),
            
            // ✅ NOVO: Flag para indicar que é compartilhado
            compartilhado: true,
            visualizado_por_cuidador: false,
            visualizado_por_supervisor: true // Criador já viu
        };

        console.log('📋 Alerta criado:', alerta);

        // ✅ OPÇÃO 1: Salvar no localStorage (funciona offline)
        salvarAlertaNoLocalStorage(alerta);
        
        // ✅ OPÇÃO 2: Enviar para API (se tiver conexão)
        try {
            await enviarAlertaParaAPI(alerta);
        } catch (apiError) {
            console.log('⚠️ API offline, alerta salvo apenas localmente');
        }

        return alerta;
        
    } catch (error) {
        console.error('❌ Erro ao criar alerta:', error);
        throw error;
    }
}

// ✅ FUNÇÃO PARA SALVAR ALERTA NO LOCALSTORAGE
function salvarAlertaNoLocalStorage(alerta) {
    try {
        console.log('💾 Salvando alerta no localStorage...');
        
        const chave = 'vitalplus_alertas_compartilhados';
        let alertasExistentes = JSON.parse(localStorage.getItem(chave)) || [];
        
        // Adicionar novo alerta no início
        alertasExistentes.unshift(alerta);
        
        // Limitar a 100 alertas para não sobrecarregar
        if (alertasExistentes.length > 100) {
            alertasExistentes = alertasExistentes.slice(0, 100);
        }
        
        localStorage.setItem(chave, JSON.stringify(alertasExistentes));
        console.log(`✅ Alerta salvo. Total: ${alertasExistentes.length}`);
        
        return alertasExistentes;
        
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
        
        // Fallback: Usar a chave antiga
        const chaveAntiga = 'vitalplus_alertas_db';
        const dadosAntigos = JSON.parse(localStorage.getItem(chaveAntiga)) || { alertas: [] };
        dadosAntigos.alertas.push(alerta);
        localStorage.setItem(chaveAntiga, JSON.stringify(dadosAntigos));
        
        console.log('✅ Alerta salvo na chave antiga como fallback');
    }
}

// ✅ FUNÇÃO PARA ENVIAR ALERTA PARA API
async function enviarAlertaParaAPI(alerta) {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        const pacienteId = localStorage.getItem('pacienteSelecionadoId');
        
        const response = await fetch('/api/alertas/compartilhados', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...alerta,
                usuario_id: usuarioId,
                paciente_id: pacienteId
            })
        });
        
        if (response.ok) {
            const resultado = await response.json();
            console.log('✅ Alerta enviado para API:', resultado);
            return resultado;
        } else {
            throw new Error(`API retornou status ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Erro ao enviar para API:', error);
        throw error;
    }
}