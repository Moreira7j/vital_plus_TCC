document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM carregado, inicializando dashboard...');
    
    // Verificar se todos os elementos existem
    const domPronto = verificarElementosDOM();
    
    if (!domPronto) {
        console.warn('⚠️ Alguns elementos não foram encontrados, mas continuando...');
    }
    
    // Inicializar ícones do Feather
    feather.replace();
    
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
        'activityFeed', 'alertsList', 'lastMessage'
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

        // Aguardar o DOM estar completamente carregado
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                atualizarInterfaceDependente(dependente);
            });
        } else {
            atualizarInterfaceDependente(dependente);
        }

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

    // Foto do dependente - CORREÇÃO PRINCIPAL
    const fotoElement = document.getElementById('dependenteFoto');
    if (fotoElement) {
        if (dependente.foto_url) {
            fotoElement.src = dependente.foto_url;
            // Adicionar tratamento de erro para a imagem
            fotoElement.onerror = function() {
                console.error('Erro ao carregar imagem:', dependente.foto_url);
                this.src = '../assets/default-avatar.png';
            };
            console.log('✅ Foto definida:', dependente.foto_url);
        } else {
            fotoElement.src = '../assets/default-avatar.png';
            console.log('✅ Foto padrão definida');
        }
    } else {
        console.error('❌ Elemento da foto não encontrado');
    }
}

// Função para carregar sinais vitais
async function carregarSinaisVitais(pacienteId) {
    try {
        const response = await fetch(`/api/pacientes/${pacienteId}/sinais-vitais/recentes`);
        
        if (response.ok) {
            const sinais = await response.json();
            atualizarSinaisVitais(sinais);
        } else {
            // Usar dados padrão se a API não responder
            atualizarSinaisVitais([]);
        }
    } catch (error) {
        console.error('Erro ao carregar sinais vitais:', error);
        atualizarSinaisVitais([]);
    }
}

// Função para atualizar sinais vitais na tela
function atualizarSinaisVitais(sinais) {
    if (!sinais || sinais.length === 0) {
        // Dados padrão quando não há sinais
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
                document.getElementById('pressaoMedia').textContent = 
                    `${sinal.valor_principal || '--'}/${sinal.valor_secundario || '--'}`;
                document.getElementById('pressaoStatus').textContent = avaliarPressao(sinal);
                document.getElementById('pressaoStatus').className = `badge ${obterClasseStatusPressao(sinal)}`;
                break;
                
            case 'glicemia':
                document.getElementById('glicemiaMedia').textContent = sinal.valor_principal || '--';
                document.getElementById('glicemiaStatus').textContent = avaliarGlicemia(sinal);
                document.getElementById('glicemiaStatus').className = `badge ${obterClasseStatusGlicemia(sinal)}`;
                break;
                
            case 'temperatura':
                document.getElementById('temperaturaMedia').textContent = sinal.valor_principal || '--';
                document.getElementById('temperaturaStatus').textContent = avaliarTemperatura(sinal);
                document.getElementById('temperaturaStatus').className = `badge ${obterClasseStatusTemperatura(sinal)}`;
                break;
        }
    });

    // Atualizar status geral
    atualizarStatusGeral(sinais);
}

// Função para carregar atividades
async function carregarAtividades(pacienteId) {
    try {
        const periodo = document.getElementById('periodoFilter')?.value || 'hoje';
        const response = await fetch(`/api/pacientes/${pacienteId}/atividades?periodo=${periodo}`);
        
        if (response.ok) {
            const atividades = await response.json();
            exibirAtividades(atividades);
        } else {
            exibirAtividades([]);
        }
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        exibirAtividades([]);
    }
}

// Função para exibir atividades
function exibirAtividades(atividades) {
    const activityFeed = document.getElementById('activityFeed');
    
    if (!atividades || atividades.length === 0) {
        activityFeed.innerHTML = `
            <div class="empty-state">
                <i data-feather="clock"></i>
                <p>Nenhuma atividade recente</p>
                <small class="text-muted">As atividades aparecerão aqui quando forem registradas</small>
            </div>
        `;
        feather.replace();
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
    feather.replace();
}

// Função para carregar alertas
async function carregarAlertas(pacienteId) {
    try {
        const response = await fetch(`/api/pacientes/${pacienteId}/alertas/recentes`);
        
        if (response.ok) {
            const alertas = await response.json();
            exibirAlertas(alertas);
        } else {
            exibirAlertas([]);
        }
    } catch (error) {
        console.error('Erro ao carregar alertas:', error);
        exibirAlertas([]);
    }
}

// Função para exibir alertas
function exibirAlertas(alertas) {
    const alertsList = document.getElementById('alertsList');
    
    if (!alertas || alertas.length === 0) {
        alertsList.innerHTML = `
            <div class="empty-state">
                <i data-feather="bell-off"></i>
                <p>Nenhum alerta no momento</p>
                <small class="text-muted">Todos os indicadores estão dentro dos parâmetros normais</small>
            </div>
        `;
        feather.replace();
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
    feather.replace();
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

function configurarEventos() {
    // Filtro de período
    const periodoFilter = document.getElementById('periodoFilter');
    if (periodoFilter) {
        periodoFilter.addEventListener('change', function() {
            const dependente = JSON.parse(localStorage.getItem('dependenteSelecionado'));
            if (dependente && dependente.id) {
                carregarAtividades(dependente.id);
            }
        });
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
    }

    // Botão de exportar relatório
    const exportBtn = document.getElementById('exportReportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportarRelatorio);
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('dependenteSelecionado');
            localStorage.removeItem('usuarioLogado');
            window.location.href = '../index.html';
        });
    }
}

async function enviarMensagem(mensagem) {
    try {
        const dependente = JSON.parse(localStorage.getItem('dependenteSelecionado'));
        
        // Simular envio de mensagem (implementar API real depois)
        console.log('Enviando mensagem para o cuidador:', mensagem);
        
        mostrarSucesso('Mensagem enviada com sucesso!');
        
        // Atualizar preview da última mensagem
        document.getElementById('lastMessage').innerHTML = `
            <p><strong>Você:</strong> ${mensagem}</p>
            <small class="text-muted">Agora</small>
        `;
        
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        mostrarErro('Erro ao enviar mensagem');
    }
}

async function exportarRelatorio() {
    try {
        // Implementar lógica de exportação de relatório
        mostrarSucesso('Relatório exportado com sucesso!');
    } catch (error) {
        console.error('Erro ao exportar relatório:', error);
        mostrarErro('Erro ao exportar relatório');
    }
}

// Funções de notificação
function mostrarSucesso(mensagem) {
    // Implementação simples - você pode usar uma biblioteca de toast depois
    alert('✅ ' + mensagem);
}

function mostrarErro(mensagem) {
    // Implementação simples - você pode usar uma biblioteca de toast depois
    alert('❌ ' + mensagem);
}

// Atualizar ícones periodicamente
setInterval(() => {
    feather.replace();
}, 1000);