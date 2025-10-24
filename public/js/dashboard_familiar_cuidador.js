// dashboard_familiar_cuidador.js - DASHBOARD PARA FAMILIAR CUIDADOR

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 DOM carregado, inicializando dashboard familiar cuidador...');

    // DEBUG: Verificar localStorage completo
    console.log('🔍 DEBUG - localStorage completo:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`📦 ${key}:`, value);
    }

    // Inicializar ícones do Feather
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    // Carregar dados do dependente
    carregarDadosDependente();

    // Configurar eventos
    configurarEventos();

    console.log('🎯 Dashboard familiar cuidador inicializado com sucesso!');
});

// Função para carregar dados do dependente
async function carregarDadosDependente() {
    try {
        console.log('🔍 Iniciando carregamento de dados do dependente...');

        // Recuperar dados do usuário
        const usuarioId = localStorage.getItem('usuarioId');
        const usuarioTipo = localStorage.getItem('usuarioTipo');
        
        // Buscar paciente selecionado
        let pacienteSelecionadoId = null;
        const dependenteObj = localStorage.getItem('dependenteSelecionado');
        if (dependenteObj) {
            try {
                const obj = JSON.parse(dependenteObj);
                pacienteSelecionadoId = obj.id || obj.paciente_id;
            } catch (e) {
                console.error('❌ Erro ao parsear dependente selecionado:', e);
            }
        }

        console.log('👤 Usuário:', usuarioId, 'Tipo:', usuarioTipo);
        console.log('🎯 Paciente selecionado ID:', pacienteSelecionadoId);

        if (!usuarioId) {
            console.error('❌ Usuário não logado');
            window.location.href = '/';
            return;
        }

        if (!pacienteSelecionadoId) {
            console.error('❌ Nenhum paciente selecionado encontrado no localStorage');
            mostrarErro('Nenhum paciente selecionado. Por favor, selecione um paciente primeiro.');
            setTimeout(() => {
                window.location.href = 'dependentes.html';
            }, 3000);
            return;
        }

        // ✅ Buscar dados do paciente usando a rota do FAMILIAR CUIDADOR
        console.log('🌐 Buscando dados do paciente via rota familiar cuidador...');
        const response = await fetch(`/api/familiares-cuidadores/${usuarioId}/paciente/${pacienteSelecionadoId}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro na resposta da API:', response.status, errorText);
            
            if (response.status === 404) {
                mostrarErro('Paciente não encontrado. Por favor, selecione outro paciente.');
                setTimeout(() => {
                    window.location.href = 'dependentes.html';
                }, 3000);
                return;
            }
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }
        
        const paciente = await response.json();
        console.log('✅ Dados do paciente recebidos:', paciente);

        // Salvar dados do paciente no localStorage
        localStorage.setItem('pacienteSelecionadoId', paciente.id);
        localStorage.setItem('dependenteSelecionado', JSON.stringify(paciente));

        // Atualizar interface
        atualizarInterfaceDependente(paciente);

        // Carregar dados adicionais
        console.log('🔄 Carregando dados adicionais...');
        await carregarDadosAdicionais(usuarioId, paciente.id);

        console.log('✅ Todos os dados carregados com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao carregar dados do dependente:', error);
        mostrarErro('Erro ao carregar dados: ' + error.message);
    }
}

// Função para carregar dados adicionais
async function carregarDadosAdicionais(usuarioId, pacienteId) {
    try {
        await Promise.all([
            carregarSinaisVitais(usuarioId, pacienteId),
            carregarAtividades(usuarioId, pacienteId),
            carregarAlertas(usuarioId, pacienteId),
            carregarMedicamentos(usuarioId, pacienteId)
        ]);
    } catch (error) {
        console.error('❌ Erro ao carregar dados adicionais:', error);
    }
}

// Função para atualizar a interface
function atualizarInterfaceDependente(paciente) {
    console.log('🎨 Atualizando interface para paciente:', paciente);

    // Elementos principais
    const elementos = {
        'patientFullName': paciente.nome || 'Nome não informado',
        'patientAge': (paciente.idade || calcularIdade(paciente.data_nascimento)) + ' anos',
        'patientCondition': paciente.condicao_principal || 'Condição não informada',
        'healthPlan': paciente.plano_saude || 'Não informado',
        'patientAllergies': paciente.alergias || 'Nenhuma alergia informada'
    };

    // Atualizar elementos textuais
    Object.keys(elementos).forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = elementos[id];
            console.log(`✅ ${id} atualizado:`, elementos[id]);
        }
    });

    // Informações do cuidador (se houver)
    if (paciente.cuidador_nome) {
        const cuidadorNome = document.getElementById('cuidadorNome');
        const cuidadorContato = document.getElementById('cuidadorContato');
        const cuidadorEspecializacao = document.getElementById('cuidadorEspecializacao');
        
        if (cuidadorNome) cuidadorNome.textContent = paciente.cuidador_nome;
        if (cuidadorContato) cuidadorContato.textContent = paciente.cuidador_telefone || 'Contato não informado';
        if (cuidadorEspecializacao) cuidadorEspecializacao.textContent = paciente.cuidador_especializacao || 'Especialização não informada';
    }

    // Foto do dependente
    const fotoElement = document.getElementById('patientAvatar');
    if (fotoElement) {
        let fotoUrl = paciente.foto_url || paciente.foto_perfil;
        
        if (fotoUrl && fotoUrl !== 'null' && fotoUrl !== 'undefined') {
            if (!fotoUrl.startsWith('http') && !fotoUrl.startsWith('/')) {
                fotoUrl = '/' + fotoUrl;
            }
            
            console.log('🖼️ Tentando carregar foto:', fotoUrl);
            fotoElement.src = fotoUrl;

            fotoElement.onerror = function () {
                console.error('❌ Erro ao carregar imagem, usando padrão:', fotoUrl);
                this.src = '../assets/default-avatar.png';
                this.alt = 'Foto não disponível';
            };

            fotoElement.onload = function () {
                console.log('✅ Foto carregada com sucesso:', fotoUrl);
            };
        } else {
            console.log('📸 Usando foto padrão');
            fotoElement.src = '../assets/default-avatar.png';
            fotoElement.alt = 'Foto padrão';
        }
    }

    // Atualizar timestamp
    const ultimaAtualizacao = document.getElementById('lastUpdate');
    if (ultimaAtualizacao) {
        ultimaAtualizacao.textContent = 'Atualizado agora';
    }

    // Atualizar nome do usuário no header
    const userNameElement = document.getElementById('userName');
    const usuarioNome = localStorage.getItem('usuarioNome');
    if (userNameElement && usuarioNome) {
        userNameElement.textContent = usuarioNome;
    }

    // Atualizar nome do paciente no header
    const patientNameElement = document.getElementById('patientName');
    if (patientNameElement && paciente.nome) {
        patientNameElement.textContent = paciente.nome;
    }
}

// Funções para carregar dados adicionais
async function carregarSinaisVitais(usuarioId, pacienteId) {
    try {
        console.log('💓 Carregando sinais vitais...');
        const response = await fetch(`/api/familiares-cuidadores/${usuarioId}/pacientes/${pacienteId}/sinais-vitais`);

        if (response.ok) {
            const sinais = await response.json();
            console.log('✅ Sinais vitais recebidos:', sinais);
            atualizarSinaisVitais(sinais);
        } else {
            console.log('⚠️ API de sinais vitais não respondeu');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar sinais vitais:', error);
    }
}

async function carregarMedicamentos(usuarioId, pacienteId) {
    try {
        console.log('💊 Carregando medicamentos...');
        const response = await fetch(`/api/familiares-cuidadores/${usuarioId}/pacientes/${pacienteId}/medicamentos`);

        if (response.ok) {
            const medicamentos = await response.json();
            console.log('✅ Medicamentos recebidos:', medicamentos.length);
            atualizarMedicamentos(medicamentos);
        } else {
            console.log('⚠️ API de medicamentos não respondeu');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar medicamentos:', error);
    }
}

async function carregarAtividades(usuarioId, pacienteId) {
    try {
        console.log('📅 Carregando atividades...');
        const response = await fetch(`/api/familiares-cuidadores/${usuarioId}/pacientes/${pacienteId}/atividades`);

        if (response.ok) {
            const atividades = await response.json();
            console.log('✅ Atividades recebidas:', atividades.length);
            exibirAtividades(atividades);
        } else {
            console.log('⚠️ API de atividades não respondeu');
            exibirAtividades([]);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar atividades:', error);
        exibirAtividades([]);
    }
}

async function carregarAlertas(usuarioId, pacienteId) {
    try {
        console.log('🚨 Carregando alertas...');
        const response = await fetch(`/api/familiares-cuidadores/${usuarioId}/pacientes/${pacienteId}/alertas`);

        if (response.ok) {
            const alertas = await response.json();
            console.log('✅ Alertas recebidos:', alertas.length);
            exibirAlertas(alertas);
        } else {
            console.log('⚠️ API de alertas não respondeu');
            exibirAlertas([]);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar alertas:', error);
        exibirAlertas([]);
    }
}

// Funções de atualização da interface
function atualizarSinaisVitais(sinais) {
    console.log('📊 Atualizando sinais vitais na interface:', sinais);

    if (!sinais || sinais.length === 0) {
        console.log('📋 Nenhum sinal vital disponível');
        // Definir valores padrão
        atualizarElemento('heartRate', '--');
        atualizarElemento('bloodPressure', '--/--');
        atualizarElemento('temperature', '--°C');
        return;
    }

    // Encontrar os sinais vitais mais recentes de cada tipo
    const sinaisRecentes = {};
    sinais.forEach(sinal => {
        if (!sinal.tipo) return;
        
        const tipo = sinal.tipo.toLowerCase();
        if (!sinaisRecentes[tipo] || new Date(sinal.data_registro) > new Date(sinaisRecentes[tipo].data_registro)) {
            sinaisRecentes[tipo] = sinal;
        }
    });

    // Atualizar interface com os sinais mais recentes
    Object.values(sinaisRecentes).forEach(sinal => {
        switch (sinal.tipo.toLowerCase()) {
            case 'pressao_arterial':
                atualizarElemento('bloodPressure', `${sinal.valor_principal || '--'}/${sinal.valor_secundario || '--'}`);
                break;

            case 'glicemia':
                // Não temos elemento específico para glicemia no HTML fornecido
                break;

            case 'temperatura':
                atualizarElemento('temperature', (sinal.valor_principal || '--') + '°C');
                break;

            case 'batimentos_cardiacos':
                atualizarElemento('heartRate', sinal.valor_principal || '--');
                break;
        }
    });

    // Se não encontrou algum sinal vital, definir como --
    if (!sinaisRecentes['batimentos_cardiacos']) atualizarElemento('heartRate', '--');
    if (!sinaisRecentes['pressao_arterial']) atualizarElemento('bloodPressure', '--/--');
    if (!sinaisRecentes['temperatura']) atualizarElemento('temperature', '--°C');
}

function atualizarMedicamentos(medicamentos) {
    const container = document.getElementById('medsList');
    if (!container) return;

    if (!medicamentos || medicamentos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-feather="calendar"></i>
                <p>Nenhum medicamento cadastrado</p>
            </div>
        `;
        if (typeof feather !== 'undefined') feather.replace();
        return;
    }

    // Atualizar contador
    const medsCount = document.getElementById('medsCount');
    if (medsCount) {
        medsCount.textContent = medicamentos.length;
    }

    container.innerHTML = medicamentos.map(med => `
        <div class="med-item">
            <div class="med-icon">
                <i data-feather="pill"></i>
            </div>
            <div class="med-content">
                <h5>${med.nome_medicamento || 'Medicamento'}</h5>
                <p>${med.dosagem || 'Dosagem não informada'} - ${med.horarios || 'Horário não definido'}</p>
            </div>
            <div class="med-time">
                ${med.horarios || ''}
            </div>
        </div>
    `).join('');

    if (typeof feather !== 'undefined') feather.replace();
}

function exibirAtividades(atividades) {
    const container = document.getElementById('activitiesList');
    if (!container) return;

    if (!atividades || atividades.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-feather="clock"></i>
                <p>Nenhuma atividade recente</p>
            </div>
        `;
        
        // Atualizar contador
        const activitiesCount = document.getElementById('activitiesCount');
        if (activitiesCount) {
            activitiesCount.textContent = '0/0';
        }
        
        if (typeof feather !== 'undefined') feather.replace();
        return;
    }

    // Contar atividades concluídas e totais
    const totalAtividades = atividades.length;
    const concluidas = atividades.filter(a => a.status === 'concluida').length;

    // Atualizar contador
    const activitiesCount = document.getElementById('activitiesCount');
    if (activitiesCount) {
        activitiesCount.textContent = `${concluidas}/${totalAtividades}`;
    }

    const atividadesHTML = atividades.map(atividade => `
        <div class="activity-item">
            <div class="activity-icon ${atividade.tipo || 'default'}">
                <i data-feather="${obterIconeAtividade(atividade.tipo)}"></i>
            </div>
            <div class="activity-content">
                <h5>${atividade.descricao || 'Atividade'}</h5>
                <p>${atividade.observacoes || 'Sem observações'}</p>
                <small class="activity-time">${formatarData(atividade.data_prevista || atividade.data_criacao)}</small>
            </div>
            <span class="badge ${atividade.status === 'concluida' ? 'bg-success' : 'bg-warning'}">
                ${atividade.status === 'concluida' ? 'Concluída' : 'Pendente'}
            </span>
        </div>
    `).join('');

    container.innerHTML = atividadesHTML;
    if (typeof feather !== 'undefined') feather.replace();
}

function exibirAlertas(alertas) {
    const container = document.getElementById('alertsList');
    if (!container) return;

    if (!alertas || alertas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-feather="bell-off"></i>
                <p>Nenhum alerta no momento</p>
            </div>
        `;
        
        // Atualizar contador
        const alertsCount = document.getElementById('alertsCount');
        if (alertsCount) {
            alertsCount.textContent = '0';
        }
        
        if (typeof feather !== 'undefined') feather.replace();
        return;
    }

    // Atualizar contador
    const alertsCount = document.getElementById('alertsCount');
    if (alertsCount) {
        alertsCount.textContent = alertas.length;
    }

    const alertasHTML = alertas.map(alerta => `
        <div class="alert-item ${alerta.severidade || 'media'}">
            <i data-feather="${obterIconeAlerta(alerta.severidade)}" class="alert-icon"></i>
            <div class="alert-content">
                <h5>${alerta.titulo || 'Alerta'}</h5>
                <p>${alerta.descricao || 'Descrição não disponível'}</p>
                <small class="alert-time">${formatarData(alerta.data_criacao)}</small>
            </div>
        </div>
    `).join('');

    container.innerHTML = alertasHTML;
    if (typeof feather !== 'undefined') feather.replace();
}

// FUNÇÃO CONFIGURAR EVENTOS
function configurarEventos() {
    console.log('⚙️ Configurando eventos...');

    // Botão de atualizar
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            carregarDadosDependente();
        });
    }

    // Botão de trocar paciente
    const trocarPacienteBtn = document.querySelector('.btn-profile');
    if (trocarPacienteBtn) {
        trocarPacienteBtn.addEventListener('click', function () {
            window.location.href = 'dependentes.html';
        });
    }

 
    // Ações rápidas
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const action = this.getAttribute('onclick');
            if (action) {
                // Executar a função definida no onclick
                eval(action);
            }
        });
    });
}

// FUNÇÕES AUXILIARES
function atualizarElemento(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
}

function calcularIdade(dataNascimento) {
    if (!dataNascimento) return '--';
    try {
        const nascimento = new Date(dataNascimento);
        const hoje = new Date();
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        return idade;
    } catch (e) {
        return '--';
    }
}

function obterIconeAtividade(tipo) {
    const icones = {
        'medicacao': 'pill',
        'alimentacao': 'coffee',
        'exercicio': 'activity',
        'banho': 'droplet',
        'consulta': 'calendar',
        'default': 'activity'
    };
    return icones[tipo] || icones.default;
}

function obterIconeAlerta(severidade) {
    const icones = {
        'critica': 'alert-triangle',
        'alta': 'alert-octagon',
        'media': 'alert-circle',
        'baixa': 'info',
        'default': 'bell'
    };
    return icones[severidade] || icones.default;
}

function formatarData(dataString) {
    try {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Data não disponível';
    }
}

function mostrarErro(mensagem) {
    console.error('❌ ' + mensagem);
    // Você pode implementar um toast ou modal para mostrar erros
    alert('❌ ' + mensagem);
}

function mostrarSucesso(mensagem) {
    console.log('✅ ' + mensagem);
    // Você pode implementar um toast ou modal para mostrar sucesso
    alert('✅ ' + mensagem);
}

// Funções para ações rápidas (placeholder)
function registrarSinaisVitais() {
    mostrarSucesso('Função registrar sinais vitais - Em desenvolvimento');
}

function registrarMedicamento() {
    mostrarSucesso('Função registrar medicamento - Em desenvolvimento');
}

function adicionarAtividade() {
    mostrarSucesso('Função adicionar atividade - Em desenvolvimento');
}

function gerarRelatorio() {
    mostrarSucesso('Função gerar relatório - Em desenvolvimento');
}

function configurarAlertas() {
    mostrarSucesso('Função configurar alertas - Em desenvolvimento');
}

// Atualizar ícones periodicamente
setInterval(() => {
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}, 2000);

// Função para voltar para dependentes
function voltarParaDependentes() {
    window.location.href = 'dependentes.html';
}

// Função para sair
function sair() {
    localStorage.clear();
    window.location.href = '/';
}


// ====================== FUNÇÕES DE NAVEGAÇÃO PARA PÁGINAS DO FAMILIAR CUIDADOR ====================== //

// Função para navegar para Alertas
function navegarParaAlertas() {
    console.log('🚨 Navegando para página de Alertas...');
    
    // Salvar dados atuais antes de navegar
    salvarEstadoAtual();
    
    // Navegar para a página de alertas
    window.location.href = 'alertas_familiar.html';
}

// Função para navegar para Relatórios
function navegarParaRelatorios() {
    console.log('📊 Navegando para página de Relatórios...');
    
    // Salvar dados atuais antes de navegar
    salvarEstadoAtual();
    
    // Navegar para a página de relatórios
    window.location.href = 'relatorios_familiar.html';
}

// Função para navegar para Saúde
function navegarParaSaude() {
    console.log('💓 Navegando para página de Saúde...');
    
    // Salvar dados atuais antes de navegar
    salvarEstadoAtual();
    
    // Navegar para a página de saúde
    window.location.href = 'saude_familiar.html';
}

// Função para navegar para Atividades
function navegarParaAtividades() {
    console.log('📝 Navegando para página de Atividades...');
    
    // Salvar dados atuais antes de navegar
    salvarEstadoAtual();
    
    // Navegar para a página de atividades
    window.location.href = 'atividades_familiar.html';
}

// Função para voltar ao Dashboard principal
function voltarParaDashboard() {
    console.log('🏠 Voltando para Dashboard principal...');
    window.location.href = 'dashboard_familiar_cuidador.html';
}

// Função para salvar estado atual antes de navegar
function salvarEstadoAtual() {
    console.log('💾 Salvando estado atual...');
    
    // Salvar timestamp da última atualização
    const agora = new Date().toISOString();
    localStorage.setItem('ultimaNavegacao', agora);
    
    // Salvar dados do paciente atual
    const pacienteSelecionado = localStorage.getItem('dependenteSelecionado');
    if (pacienteSelecionado) {
        localStorage.setItem('pacienteBackup', pacienteSelecionado);
    }
}

// Função para carregar estado salvo ao retornar
function carregarEstadoSalvo() {
    console.log('🔄 Carregando estado salvo...');
    
    const ultimaNavegacao = localStorage.getItem('ultimaNavegacao');
    if (ultimaNavegacao) {
        console.log('⏰ Última navegação:', new Date(ultimaNavegacao).toLocaleString());
    }
    
    // Verificar se há backup do paciente
    const pacienteBackup = localStorage.getItem('pacienteBackup');
    if (pacienteBackup && !localStorage.getItem('dependenteSelecionado')) {
        localStorage.setItem('dependenteSelecionado', pacienteBackup);
        console.log('✅ Estado do paciente restaurado do backup');
    }
}

// ====================== CONFIGURAÇÃO DE EVENTOS DE NAVEGAÇÃO ====================== //

function configurarNavegacao() {
    console.log('🧭 Configurando navegação entre páginas...');
    
    // Botões de navegação no dashboard
    const botoesNavegacao = {
        'btnAlertas': navegarParaAlertas,
        'btnRelatorios': navegarParaRelatorios,
        'btnSaude': navegarParaSaude,
        'btnAtividades': navegarParaAtividades,
        'btnVoltarDashboard': voltarParaDashboard
    };
    
    // Configurar event listeners para cada botão
    Object.keys(botoesNavegacao).forEach(botaoId => {
        const botao = document.getElementById(botaoId);
        if (botao) {
            botao.addEventListener('click', botoesNavegacao[botaoId]);
            console.log(`✅ Botão ${botaoId} configurado`);
        }
    });
    
    // Configurar cards clicáveis para navegação
    const cardsNavegaveis = document.querySelectorAll('.card-clickable');
    cardsNavegaveis.forEach(card => {
        card.addEventListener('click', function() {
            const destino = this.getAttribute('data-destino');
            if (destino) {
                switch(destino) {
                    case 'alertas':
                        navegarParaAlertas();
                        break;
                    case 'relatorios':
                        navegarParaRelatorios();
                        break;
                    case 'saude':
                        navegarParaSaude();
                        break;
                    case 'atividades':
                        navegarParaAtividades();
                        break;
                    default:
                        console.log('ℹ️ Destino não reconhecido:', destino);
                }
            }
        });
    });
}

// ====================== INICIALIZAÇÃO DA NAVEGAÇÃO ====================== //

// Adicione esta linha na função principal do DOMContentLoaded
// Dentro do DOMContentLoaded, após configurarEventos(), adicione:
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 DOM carregado, inicializando dashboard familiar cuidador...');

    // DEBUG: Verificar localStorage completo
    console.log('🔍 DEBUG - localStorage completo:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`📦 ${key}:`, value);
    }

    // Inicializar ícones do Feather
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    // Carregar estado salvo (se houver)
    carregarEstadoSalvo();

    // Carregar dados do dependente
    carregarDadosDependente();

    // Configurar eventos
    configurarEventos();

    // Configurar navegação (NOVA LINHA)
    configurarNavegacao();

    console.log('🎯 Dashboard familiar cuidador inicializado com sucesso!');
});

// Função para destacar o item ativo na sidebar
function destacarItemAtivo() {
    const currentPage = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.classList.remove('active');
        const href = item.getAttribute('href');
        if (href === currentPage) {
            item.classList.add('active');
        }
    });
    
    // Se estiver na página inicial, destacar "Visão Geral"
    if (currentPage === '/dashboard_familiar_cuidador') {
        const overviewItem = document.querySelector('a[href="/dashboard_familiar_cuidador"]');
        if (overviewItem) {
            overviewItem.classList.add('active');
        }
    }
}

// Chamar a função quando a página carregar
document.addEventListener('DOMContentLoaded', function () {
    // ... código existente ...
    
    // Destacar item ativo na sidebar (NOVA LINHA)
    destacarItemAtivo();
});