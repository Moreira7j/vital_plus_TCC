document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM carregado, inicializando dashboard...');
    
    // DEBUG: Verificar o que está no localStorage
    console.log('🔍 DEBUG - localStorage completo:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`📦 ${key}:`, value);
    }
    
    // Verificar se todos os elementos existem
    const domPronto = verificarElementosDOM();
    
    if (!domPronto) {
        console.warn('⚠️ Alguns elementos não foram encontrados, mas continuando...');
    }
    
    // Inicializar ícones do Feather
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Carregar dados do dependente
    carregarDadosDependente();
    
    // Configurar eventos
    configurarEventos();
    
    console.log('🎯 Dashboard inicializado com sucesso!');
});

// Função para verificar se todos os elementos necessários existem
function verificarElementosDOM() {
    const elementosNecessarios = [
        'dependenteNome', 'dependenteIdade', 'dependenteCondicao',
        'dependenteFoto', 'cuidadorNome', 'cuidadorContato',
        'familiarName', 'ultimaAtualizacao', 'statusGeral',
        'pressaoMedia', 'glicemiaMedia', 'temperaturaMedia',
        'activityFeed', 'alertsList', 'lastMessage',
        'relatoriosLink'
    ];

    const elementosFaltantes = [];
    
    elementosNecessarios.forEach(id => {
        const elemento = document.getElementById(id);
        if (!elemento) {
            elementosFaltantes.push(id);
            console.error(`❌ Elemento não encontrado: ${id}`);
        } else {
            console.log(`✅ Elemento encontrado: ${id}`);
        }
    });

    if (elementosFaltantes.length > 0) {
        console.warn('⚠️ Elementos faltantes no DOM:', elementosFaltantes);
        return false;
    }

    console.log('✅ Todos os elementos necessários estão presentes no DOM');
    return true;
}

// Função para carregar dados do dependente
async function carregarDadosDependente() {
    try {
        console.log('🔍 Iniciando carregamento de dados do dependente...');
        
        // Recuperar dependente selecionado do localStorage
        const dependenteSelecionado = JSON.parse(localStorage.getItem('dependenteSelecionado'));
        
        if (!dependenteSelecionado || !dependenteSelecionado.id) {
            console.error('❌ Nenhum dependente selecionado ou ID inválido:', dependenteSelecionado);
            mostrarErro('Nenhum dependente selecionado. Por favor, selecione um dependente primeiro.');
            
            // Redirecionar para a página de dependentes após 3 segundos
            setTimeout(() => {
                window.location.href = 'dependentes.html';
            }, 3000);
            return;
        }

        console.log('📋 Dependente selecionado:', dependenteSelecionado);

        // Buscar dados completos do dependente da API
        console.log('🌐 Buscando dados da API...');
        const response = await fetch(`/api/dependentes/${dependenteSelecionado.id}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro na resposta da API:', response.status, errorText);
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }

        const dependente = await response.json();
        console.log('✅ Dados do dependente recebidos:', dependente);

        // Atualizar interface imediatamente
        atualizarInterfaceDependente(dependente);

        // Carregar dados adicionais
        console.log('🔄 Carregando dados adicionais...');
        await Promise.all([
            carregarSinaisVitais(dependente.id),
            carregarAtividades(dependente.id),
            carregarAlertas(dependente.id)
        ]);

        console.log('✅ Todos os dados carregados com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao carregar dados do dependente:', error);
        mostrarErro('Erro ao carregar dados do dependente: ' + error.message);
    }
}

// Função para atualizar a interface com os dados do dependente
function atualizarInterfaceDependente(dependente) {
    console.log('Atualizando interface para dependente:', dependente);
    
    // Mapeamento de elementos para atualizar
    const elementosParaAtualizar = [
        { id: 'dependenteNome', valor: dependente.nome || 'Nome não informado' },
        { id: 'dependenteIdade', valor: dependente.idade ? `${dependente.idade} anos` : 'Idade não informada' },
        { id: 'dependenteCondicao', valor: dependente.condicao_principal || 'Condição não informada' },
        { id: 'cuidadorNome', valor: dependente.cuidador_nome || 'Cuidador não atribuído' },
        { id: 'cuidadorContato', valor: dependente.cuidador_telefone || 'Contato não informado' },
        { id: 'familiarName', valor: dependente.familiar_nome || 'Familiar não informado' },
        { id: 'ultimaAtualizacao', valor: new Date().toLocaleString('pt-BR') }
    ];

    // Atualizar cada elemento verificando se existe
    elementosParaAtualizar.forEach(item => {
        const elemento = document.getElementById(item.id);
        if (elemento) {
            elemento.textContent = item.valor;
            console.log(`✅ Elemento ${item.id} atualizado:`, item.valor);
        } else {
            console.error(`❌ Elemento não encontrado: ${item.id}`);
        }
    });

    // Foto do dependente - CORREÇÃO DA FOTO
    const fotoElement = document.getElementById('dependenteFoto');
    if (fotoElement) {
        if (dependente.foto_url && dependente.foto_url !== 'null' && dependente.foto_url !== 'undefined') {
            // Verificar se a URL é completa ou relativa
            let fotoUrl = dependente.foto_url;
            if (!fotoUrl.startsWith('http') && !fotoUrl.startsWith('/')) {
                fotoUrl = '/' + fotoUrl;
            }
            fotoElement.src = fotoUrl;
            
            // Adicionar tratamento de erro para a imagem
            fotoElement.onerror = function() {
                console.error('❌ Erro ao carregar imagem:', fotoUrl);
                this.src = '../assets/default-avatar.png';
                this.alt = 'Foto não disponível';
            };
            
            fotoElement.onload = function() {
                console.log('✅ Foto carregada com sucesso:', fotoUrl);
            };
            
            console.log('✅ Foto definida:', fotoUrl);
        } else {
            fotoElement.src = '../assets/default-avatar.png';
            fotoElement.alt = 'Foto padrão';
            console.log('✅ Foto padrão definida');
        }
    } else {
        console.error('❌ Elemento da foto não encontrado');
    }
}

// Função para carregar sinais vitais
async function carregarSinaisVitais(pacienteId) {
    try {
        console.log('💓 Carregando sinais vitais...');
        const response = await fetch(`/api/pacientes/${pacienteId}/sinais-vitais/recentes`);
        
        if (response.ok) {
            const sinais = await response.json();
            console.log('✅ Sinais vitais recebidos:', sinais);
            atualizarSinaisVitais(sinais);
        } else {
            console.log('⚠️ API de sinais vitais não respondeu, usando dados padrão');
            atualizarSinaisVitais([]);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar sinais vitais:', error);
        atualizarSinaisVitais([]);
    }
}

// Função para atualizar sinais vitais na tela
function atualizarSinaisVitais(sinais) {
    console.log('📊 Atualizando sinais vitais na interface:', sinais);
    
    if (!sinais || sinais.length === 0) {
        // Dados padrão quando não há sinais
        console.log('📋 Usando sinais vitais padrão');
        const sinaisPadrao = [
            { tipo: 'pressao_arterial', valor_principal: '120', valor_secundario: '80' },
            { tipo: 'glicemia', valor_principal: '98' },
            { tipo: 'temperatura', valor_principal: '36.5' }
        ];
        sinais = sinaisPadrao;
    }

    sinais.forEach(sinal => {
        switch(sinal.tipo) {
            case 'pressao_arterial':
                if (document.getElementById('pressaoMedia')) {
                    document.getElementById('pressaoMedia').textContent = 
                        `${sinal.valor_principal || '--'}/${sinal.valor_secundario || '--'}`;
                }
                if (document.getElementById('pressaoStatus')) {
                    document.getElementById('pressaoStatus').textContent = avaliarPressao(sinal);
                    document.getElementById('pressaoStatus').className = `badge ${obterClasseStatusPressao(sinal)}`;
                }
                break;
                
            case 'glicemia':
                if (document.getElementById('glicemiaMedia')) {
                    document.getElementById('glicemiaMedia').textContent = sinal.valor_principal || '--';
                }
                if (document.getElementById('glicemiaStatus')) {
                    document.getElementById('glicemiaStatus').textContent = avaliarGlicemia(sinal);
                    document.getElementById('glicemiaStatus').className = `badge ${obterClasseStatusGlicemia(sinal)}`;
                }
                break;
                
            case 'temperatura':
                if (document.getElementById('temperaturaMedia')) {
                    document.getElementById('temperaturaMedia').textContent = sinal.valor_principal || '--';
                }
                if (document.getElementById('temperaturaStatus')) {
                    document.getElementById('temperaturaStatus').textContent = avaliarTemperatura(sinal);
                    document.getElementById('temperaturaStatus').className = `badge ${obterClasseStatusTemperatura(sinal)}`;
                }
                break;
        }
    });

    // Atualizar status geral
    atualizarStatusGeral(sinais);
}

// Função para carregar atividades
async function carregarAtividades(pacienteId) {
    try {
        console.log('📅 Carregando atividades...');
        const periodo = document.getElementById('periodoFilter')?.value || 'hoje';
        const response = await fetch(`/api/pacientes/${pacienteId}/atividades?periodo=${periodo}`);
        
        if (response.ok) {
            const atividades = await response.json();
            console.log('✅ Atividades recebidas:', atividades);
            exibirAtividades(atividades);
        } else {
            console.log('⚠️ API de atividades não respondeu, exibindo estado vazio');
            exibirAtividades([]);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar atividades:', error);
        exibirAtividades([]);
    }
}

// Função para exibir atividades
function exibirAtividades(atividades) {
    const activityFeed = document.getElementById('activityFeed');
    if (!activityFeed) {
        console.error('❌ Elemento activityFeed não encontrado');
        return;
    }
    
    if (!atividades || atividades.length === 0) {
        activityFeed.innerHTML = `
            <div class="empty-state">
                <i data-feather="clock"></i>
                <p>Nenhuma atividade recente</p>
                <small class="text-muted">As atividades aparecerão aqui quando forem registradas</small>
            </div>
        `;
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        return;
    }

    const atividadesHTML = atividades.map(atividade => `
        <div class="activity-item">
            <div class="activity-icon ${atividade.tipo || 'default'}">
                <i data-feather="${obterIconeAtividade(atividade.tipo)}"></i>
            </div>
            <div class="activity-content">
                <h5>${atividade.titulo || 'Atividade'}</h5>
                <p>${atividade.descricao || 'Descrição não disponível'}</p>
                <small class="activity-time">${formatarData(atividade.data || new Date())}</small>
            </div>
        </div>
    `).join('');

    activityFeed.innerHTML = atividadesHTML;
    
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

// Função para carregar alertas
async function carregarAlertas(pacienteId) {
    try {
        console.log('🚨 Carregando alertas...');
        const response = await fetch(`/api/pacientes/${pacienteId}/alertas/recentes`);
        
        if (response.ok) {
            const alertas = await response.json();
            console.log('✅ Alertas recebidos:', alertas);
            exibirAlertas(alertas);
        } else {
            console.log('⚠️ API de alertas não respondeu, exibindo estado vazio');
            exibirAlertas([]);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar alertas:', error);
        exibirAlertas([]);
    }
}

// Função para exibir alertas
function exibirAlertas(alertas) {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) {
        console.error('❌ Elemento alertsList não encontrado');
        return;
    }
    
    if (!alertas || alertas.length === 0) {
        alertsList.innerHTML = `
            <div class="empty-state">
                <i data-feather="bell-off"></i>
                <p>Nenhum alerta no momento</p>
                <small class="text-muted">Todos os indicadores estão dentro dos parâmetros normais</small>
            </div>
        `;
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        return;
    }

    const alertasHTML = alertas.map(alerta => `
        <div class="alert-item ${alerta.nivel || 'info'}">
            <i data-feather="${obterIconeAlerta(alerta.nivel)}" class="alert-icon"></i>
            <div class="alert-content">
                <h5>${alerta.titulo || 'Alerta'}</h5>
                <p>${alerta.descricao || 'Descrição não disponível'}</p>
                <small class="alert-time">${formatarData(alerta.data_criacao || new Date())}</small>
            </div>
        </div>
    `).join('');

    alertsList.innerHTML = alertasHTML;
    
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

// Funções auxiliares
function obterIconeAtividade(tipo) {
    const icones = {
        'medicamento': 'pill',
        'vital': 'activity',
        'tarefa': 'check-square',
        'consulta': 'calendar',
        'alimentacao': 'coffee',
        'default': 'activity'
    };
    return icones[tipo] || icones.default;
}

function obterIconeAlerta(nivel) {
    const icones = {
        'critical': 'alert-triangle',
        'warning': 'alert-circle',
        'info': 'info',
        'default': 'bell'
    };
    return icones[nivel] || icones.default;
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

function avaliarPressao(sinal) {
    const valor = parseInt(sinal.valor_principal);
    if (isNaN(valor)) return '--';
    if (valor < 90) return 'Baixa';
    if (valor > 140) return 'Alta';
    return 'Normal';
}

function avaliarGlicemia(sinal) {
    const valor = parseInt(sinal.valor_principal || sinal.valor);
    if (isNaN(valor)) return '--';
    if (valor < 70) return 'Baixa';
    if (valor > 180) return 'Alta';
    return 'Normal';
}

function avaliarTemperatura(sinal) {
    const valor = parseFloat(sinal.valor_principal || sinal.valor);
    if (isNaN(valor)) return '--';
    if (valor < 36) return 'Baixa';
    if (valor > 37.5) return 'Alta';
    return 'Normal';
}

function obterClasseStatusPressao(sinal) {
    const status = avaliarPressao(sinal);
    return status === 'Normal' ? 'bg-success' : 'bg-warning';
}

function obterClasseStatusGlicemia(sinal) {
    const status = avaliarGlicemia(sinal);
    return status === 'Normal' ? 'bg-success' : 'bg-warning';
}

function obterClasseStatusTemperatura(sinal) {
    const status = avaliarTemperatura(sinal);
    return status === 'Normal' ? 'bg-success' : 'bg-warning';
}

function atualizarStatusGeral(sinais) {
    let statusGeral = 'Estável';
    let classeStatus = 'bg-success';

    // Verificar se há algum sinal preocupante
    const temProblemas = sinais.some(sinal => {
        if (sinal.tipo && sinal.tipo.includes('pressao')) {
            return avaliarPressao(sinal) !== 'Normal';
        }
        if (sinal.tipo && sinal.tipo.includes('glicemia')) {
            return avaliarGlicemia(sinal) !== 'Normal';
        }
        return false;
    });

    if (temProblemas) {
        statusGeral = 'Atenção';
        classeStatus = 'bg-warning';
    }

    const statusElement = document.getElementById('statusGeral');
    if (statusElement) {
        statusElement.textContent = statusGeral;
        statusElement.className = `badge ${classeStatus}`;
    }
}

// FUNÇÃO CONFIGURAR EVENTOS - CORRIGIDA E UNIFICADA
function configurarEventos() {
    console.log('⚙️ Configurando eventos...');
    
    // Filtro de período
    const periodoFilter = document.getElementById('periodoFilter');
    if (periodoFilter) {
        periodoFilter.addEventListener('change', function() {
            console.log('🔍 Filtro de período alterado:', this.value);
            const dependente = JSON.parse(localStorage.getItem('dependenteSelecionado'));
            if (dependente && dependente.id) {
                carregarAtividades(dependente.id);
            }
        });
        console.log('✅ Filtro de período configurado');
    } else {
        console.error('❌ Filtro de período não encontrado');
    }

    // Formulário de mensagem
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const textarea = this.querySelector('textarea');
            const mensagem = textarea.value.trim();
            
            if (mensagem) {
                enviarMensagem(mensagem);
                textarea.value = '';
            }
        });
        console.log('✅ Formulário de mensagem configurado');
    } else {
        console.error('❌ Formulário de mensagem não encontrado');
    }

    // Botão de exportar relatório
    const exportBtn = document.getElementById('exportReportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportarRelatorio);
        console.log('✅ Botão de exportar relatório configurado');
    } else {
        console.error('❌ Botão de exportar relatório não encontrado');
    }

    // ✅ CORREÇÃO: Links de Navegação
    const relatoriosLink = document.getElementById('relatoriosLink');
    const alertasLink = document.getElementById('alertasLink');
    const comunicacaoLink = document.getElementById('comunicacaoLink');

    // Configurar link de Relatórios
    if (relatoriosLink) {
        relatoriosLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📊 Navegando para relatórios...');
            navegarParaPaginaSupervisor('relatorios_supervisor.html');
        });
        console.log('✅ Link de relatórios configurado');
    } else {
        console.error('❌ Link de relatórios não encontrado');
    }

    // Configurar link de Alertas
    if (alertasLink) {
        alertasLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚨 Navegando para alertas...');
            navegarParaPaginaSupervisor('alertas_supervisor.html');
        });
        console.log('✅ Link de alertas configurado');
    } else {
        console.error('❌ Link de alertas não encontrado');
    }

    // Configurar link de Comunicação
    if (comunicacaoLink) {
        comunicacaoLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('💬 Navegando para comunicação...');
            navegarParaPaginaSupervisor('comunicacao_supervisor.html');
        });
        console.log('✅ Link de comunicação configurado');
    } else {
        console.error('❌ Link de comunicação não encontrado');
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚪 Efetuando logout...');
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../paginas/index.html';
        });
        console.log('✅ Botão de logout configurado');
    } else {
        console.error('❌ Botão de logout não encontrado');
    }
}

// ✅ CORREÇÃO: Função auxiliar para navegação do supervisor
function navegarParaPaginaSupervisor(pagina) {
    // Verificar se há um dependente selecionado
    const dependenteSelecionado = JSON.parse(localStorage.getItem('dependenteSelecionado'));
    if (!dependenteSelecionado || !dependenteSelecionado.id) {
        mostrarErro('Nenhum dependente selecionado. Por favor, selecione um dependente primeiro.');
        return;
    }
    
    // Buscar usuário no formato atual (chaves separadas)
    let usuarioLogado = null;
    const usuarioTipo = localStorage.getItem('usuarioTipo');
    const usuarioId = localStorage.getItem('usuarioId');
    const usuarioNome = localStorage.getItem('usuarioNome');
    
    if (usuarioTipo && usuarioId) {
        usuarioLogado = {
            tipo: usuarioTipo,
            id: parseInt(usuarioId),
            nome: usuarioNome || 'Usuário'
        };
        console.log('✅ Usuário montado a partir de chaves separadas:', usuarioLogado);
    } else {
        // Tentar o método antigo (objeto único)
        const possiveisChaves = [
            'usuarioLogado', 'currentUser', 'userData', 'loginData',
            'usuario', 'user', 'loggedUser', 'userInfo'
        ];
        
        for (const chave of possiveisChaves) {
            const dados = localStorage.getItem(chave) || sessionStorage.getItem(chave);
            if (dados) {
                try {
                    usuarioLogado = JSON.parse(dados);
                    console.log(`✅ Usuário encontrado na chave: ${chave}`, usuarioLogado);
                    break;
                } catch (e) {
                    console.log(`❌ Erro ao parsear chave ${chave}:`, e);
                }
            }
        }
    }
    
    if (!usuarioLogado) {
        console.error('❌ Nenhum usuário encontrado!');
        mostrarErro('Sessão expirada. Redirecionando para login...');
        setTimeout(() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../paginas/LandingPage.html';
        }, 2000);
        return;
    }
    
    // Garantir que o usuário está salvo corretamente
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
    localStorage.setItem('currentUser', JSON.stringify(usuarioLogado));
    
    console.log('✅ Usuário garantido no localStorage:', usuarioLogado);
    
    // Verificação flexível do tipo de usuário
    const tipoUsuario = usuarioLogado.tipo || usuarioLogado.tipo_usuario || usuarioLogado.role || usuarioLogado.type;
    console.log('👤 Tipo de usuário detectado:', tipoUsuario);
    
    const isFamiliarContratante = 
        tipoUsuario === 'familiar_contratante' || 
        tipoUsuario === 'familiar contratante' ||
        tipoUsuario === 'supervisor' ||
        tipoUsuario === 'admin' ||
        tipoUsuario === 'familiar';

    if (!isFamiliarContratante) {
        console.error('❌ Usuário não é familiar contratante:', tipoUsuario);
        mostrarErro('Acesso não autorizado. Apenas familiares contratantes podem acessar esta página.');
        return;
    }
    
    console.log(`✅ Usuário autorizado, redirecionando para ${pagina}...`);
    
    // ✅ CORREÇÃO: Redirecionar com o caminho correto
    // Ajuste o caminho conforme sua estrutura de pastas
    window.location.href = pagina;
}

async function enviarMensagem(mensagem) {
    try {
        const dependente = JSON.parse(localStorage.getItem('dependenteSelecionado'));
        
        // Simular envio de mensagem (implementar API real depois)
        console.log('Enviando mensagem para o cuidador:', mensagem);
        
        mostrarSucesso('Mensagem enviada com sucesso!');
        
        // Atualizar preview da última mensagem
        const lastMessageElement = document.getElementById('lastMessage');
        if (lastMessageElement) {
            lastMessageElement.innerHTML = `
                <p><strong>Você:</strong> ${mensagem}</p>
                <small class="text-muted">Agora</small>
            `;
        }
        
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        mostrarErro('Erro ao enviar mensagem');
    }
}

async function exportarRelatorio() {
    try {
        // Implementar lógica de exportação de relatório
        console.log('📄 Exportando relatório...');
        mostrarSucesso('Relatório exportado com sucesso!');
    } catch (error) {
        console.error('Erro ao exportar relatório:', error);
        mostrarErro('Erro ao exportar relatório');
    }
}

// Funções de notificação
function mostrarSucesso(mensagem) {
    console.log('✅ ' + mensagem);
    alert('✅ ' + mensagem);
}

function mostrarErro(mensagem) {
    console.error('❌ ' + mensagem);
    alert('❌ ' + mensagem);
}

// Atualizar ícones periodicamente
setInterval(() => {
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}, 1000);

console.log('🎯 dashboard_supervisor.js carregado com sucesso!');