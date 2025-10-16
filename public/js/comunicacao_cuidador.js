// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';
let conversas = [];
let conversaAtual = null;
let socket = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    inicializarEventListeners();
    carregarConversas();
    inicializarWebSocket();
});

// Event Listeners
function inicializarEventListeners() {
    // Envio de mensagens
    document.getElementById('mensagemInput').addEventListener('input', ajustarAlturaTextarea);
    document.getElementById('mensagemInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMensagem();
        }
    });
    
    document.getElementById('enviarMensagemBtn').addEventListener('click', enviarMensagem);
    
    // Ações rápidas
    document.querySelectorAll('.btn-acao-rapida').forEach(btn => {
        btn.addEventListener('click', function() {
            const acao = this.dataset.acao;
            executarAcaoRapida(acao);
        });
    });
    
    // Pesquisa
    document.getElementById('pesquisaConversas').addEventListener('input', filtrarConversas);

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../paginas/index.html';
        });
    }
}

// WebSocket para comunicação em tempo real
function inicializarWebSocket() {
    // Simular WebSocket - implementar real depois
    console.log('WebSocket simulado para comunicação');
}

// API Functions
async function carregarConversas() {
    try {
        mostrarLoading(true);
        
        // Obter cuidador logado
        const usuarioLogado = obterUsuarioLogado();
        if (!usuarioLogado) {
            throw new Error('Usuário não logado');
        }

        // Buscar comunicação do cuidador
        const response = await fetch(`${API_BASE_URL}/cuidadores/${usuarioLogado.id}/comunicacao`);
        
        if (!response.ok) {
            // Se a API não responder, usar dados de exemplo
            console.log('API não disponível, usando dados de exemplo');
            conversas = obterConversasExemplo();
        } else {
            const mensagens = await response.json();
            conversas = agruparConversas(mensagens);
        }
        
        renderizarConversas();
        
        // Selecionar primeira conversa se existir
        if (conversas.length > 0 && !conversaAtual) {
            selecionarConversa(conversas[0].id);
        }
    } catch (error) {
        console.error('Erro ao carregar conversas:', error);
        // Usar dados de exemplo em caso de erro
        conversas = obterConversasExemplo();
        renderizarConversas();
        mostrarMensagem('Usando dados de demonstração', 'info');
    } finally {
        mostrarLoading(false);
    }
}

// Dados de exemplo (remover quando a API estiver pronta)
function obterConversasExemplo() {
    return [
        {
            id: 1,
            nome: 'Maria Silva (Familiar)',
            ultimaMensagem: 'Como está a pressão arterial hoje?',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutos atrás
            online: true,
            mensagensNaoLidas: 2,
            tipo: 'familiar'
        },
        {
            id: 2,
            nome: 'Dr. Carlos Santos',
            ultimaMensagem: 'Precisamos ajustar a dosagem da medicação',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
            online: false,
            mensagensNaoLidas: 0,
            tipo: 'medico'
        },
        {
            id: 3,
            nome: 'Enfermeira Ana',
            ultimaMensagem: 'Lembrar de verificar a glicemia após o almoço',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 horas atrás
            online: true,
            mensagensNaoLidas: 1,
            tipo: 'enfermeiro'
        }
    ];
}

function agruparConversas(mensagens) {
    // Simular agrupamento de mensagens em conversas
    return obterConversasExemplo();
}

async function enviarMensagem() {
    const input = document.getElementById('mensagemInput');
    const texto = input.value.trim();
    
    if (!texto || !conversaAtual) return;
    
    const mensagemData = {
        conversaId: conversaAtual.id,
        texto: texto,
        tipo: 'texto',
        remetenteId: 'cuidador'
    };
    
    try {
        // Adicionar mensagem localmente imediatamente
        const mensagemLocal = {
            ...mensagemData,
            id: Date.now(),
            timestamp: new Date().toISOString(),
            status: 'enviando',
            remetenteNome: 'Você'
        };
        
        adicionarMensagemNaTela(mensagemLocal);
        input.value = '';
        ajustarAlturaTextarea();
        
        // Simular envio para API
        setTimeout(() => {
            atualizarMensagemLocal(mensagemLocal.id, {
                ...mensagemLocal,
                status: 'enviado'
            });
            
            // Simular resposta
            setTimeout(() => {
                const resposta = {
                    id: Date.now() + 1,
                    texto: obterRespostaAutomatica(texto),
                    timestamp: new Date().toISOString(),
                    remetenteNome: conversaAtual.nome,
                    status: 'recebida'
                };
                adicionarMensagemNaTela(resposta);
            }, 1000 + Math.random() * 2000);
            
        }, 500);
        
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        atualizarMensagemLocal(mensagemLocal.id, {
            status: 'erro'
        });
        mostrarMensagem('Erro ao enviar mensagem', 'error');
    }
}

function obterRespostaAutomatica(mensagem) {
    const mensagemLower = mensagem.toLowerCase();
    
    if (mensagemLower.includes('pressão') || mensagemLower.includes('pressao')) {
        return 'A pressão arterial está controlada hoje. Última medida: 125/80 mmHg';
    } else if (mensagemLower.includes('glicemia') || mensagemLower.includes('açúcar') || mensagemLower.includes('acucar')) {
        return 'A glicemia está estável. Última medição: 98 mg/dL';
    } else if (mensagemLower.includes('medicamento') || mensagemLower.includes('remédio') || mensagemLower.includes('remedio')) {
        return 'Todas as medicações foram administradas no horário correto hoje';
    } else if (mensagemLower.includes('alimentação') || mensagemLower.includes('alimentacao') || mensagemLower.includes('comida')) {
        return 'O paciente se alimentou bem hoje, com boa aceitação das refeições';
    } else {
        const respostas = [
            'Obrigado pela mensagem. Como posso ajudar?',
            'Entendi. Vou verificar e te retorno.',
            'O paciente está bem hoje, obrigado por perguntar.',
            'Preciso de mais informações para poder ajudar melhor.'
        ];
        return respostas[Math.floor(Math.random() * respostas.length)];
    }
}

// Renderização
function renderizarConversas() {
    const container = document.getElementById('conversasLista');
    
    if (conversas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-feather="message-circle"></i>
                <h4>Nenhuma conversa</h4>
                <p>Comece uma nova conversa com um familiar ou profissional</p>
            </div>
        `;
        feather.replace();
        return;
    }
    
    container.innerHTML = conversas.map(conversa => `
        <div class="conversa-item ${conversaAtual?.id === conversa.id ? 'active' : ''}" 
             onclick="selecionarConversa('${conversa.id}')">
            <div class="conversa-avatar">
                ${conversa.nome.charAt(0).toUpperCase()}
            </div>
            <div class="conversa-info">
                <div class="conversa-nome">
                    <span>${conversa.nome}</span>
                    <span class="conversa-tempo">${formatarTempoRelativo(conversa.timestamp)}</span>
                </div>
                <div class="conversa-ultima-msg">
                    ${conversa.ultimaMensagem}
                </div>
            </div>
            ${conversa.mensagensNaoLidas > 0 ? `
                <div class="conversa-badge">${conversa.mensagensNaoLidas}</div>
            ` : ''}
        </div>
    `).join('');
    
    feather.replace();
}

function renderizarMensagens(mensagens) {
    const container = document.getElementById('chatMessages');
    container.innerHTML = '';
    
    if (!mensagens || mensagens.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-feather="message-square"></i>
                <h4>Nenhuma mensagem</h4>
                <p>Envie a primeira mensagem para iniciar a conversa</p>
            </div>
        `;
        feather.replace();
        return;
    }
    
    mensagens.forEach(mensagem => {
        adicionarMensagemNaTela(mensagem);
    });
    
    // Rolagem para baixo
    container.scrollTop = container.scrollHeight;
}

function adicionarMensagemNaTela(mensagem) {
    const container = document.getElementById('chatMessages');
    const isEnviada = mensagem.remetenteId === 'cuidador' || mensagem.remetenteNome === 'Você';
    
    // Remover empty state se existir
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    const mensagemElement = document.createElement('div');
    mensagemElement.className = `mensagem ${isEnviada ? 'enviada' : 'recebida'}`;
    mensagemElement.dataset.id = mensagem.id;
    
    let conteudo = `
        <div class="mensagem-texto">${formatarTextoMensagem(mensagem.texto)}</div>
        <div class="mensagem-hora">
            ${formatarHora(mensagem.timestamp)}
            ${isEnviada ? `<i data-feather="${mensagem.status === 'enviando' ? 'clock' : mensagem.status === 'erro' ? 'x-circle' : 'check'}"></i>` : ''}
        </div>
    `;
    
    mensagemElement.innerHTML = conteudo;
    container.appendChild(mensagemElement);
    
    // Rolagem para baixo
    container.scrollTop = container.scrollHeight;
    feather.replace();
}

// Gestão de Conversas
async function selecionarConversa(conversaId) {
    try {
        mostrarLoading(true);
        
        const conversa = conversas.find(c => c.id == conversaId);
        if (!conversa) return;
        
        conversaAtual = conversa;
        
        // Atualizar UI
        document.querySelectorAll('.conversa-item').forEach(item => {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        
        // Atualizar header do chat
        document.getElementById('chatContatoNome').textContent = conversa.nome;
        document.getElementById('chatStatus').textContent = conversa.online ? 'Online' : 'Offline';
        document.getElementById('statusIndicator').className = `status-indicator ${conversa.online ? '' : 'offline'}`;
        
        // Habilitar input
        document.getElementById('mensagemInput').disabled = false;
        document.getElementById('enviarMensagemBtn').disabled = false;
        
        // Carregar mensagens da conversa (simulado)
        const mensagens = obterMensagensExemplo(conversaId);
        renderizarMensagens(mensagens);
        
        // Marcar como lida
        conversa.mensagensNaoLidas = 0;
        renderizarConversas();
        
    } catch (error) {
        console.error('Erro ao carregar conversa:', error);
        mostrarMensagem('Erro ao carregar conversa', 'error');
    } finally {
        mostrarLoading(false);
    }
}

function obterMensagensExemplo(conversaId) {
    const mensagensBase = [
        {
            id: 1,
            texto: 'Olá! Como está o paciente hoje?',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            remetenteNome: 'Maria Silva',
            status: 'recebida'
        },
        {
            id: 2,
            texto: 'Está tudo bem! O paciente descansou bem durante a noite.',
            timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
            remetenteNome: 'Você',
            status: 'enviado'
        },
        {
            id: 3,
            texto: 'Que bom! E a pressão arterial está controlada?',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            remetenteNome: 'Maria Silva',
            status: 'recebida'
        }
    ];
    
    return mensagensBase;
}

// Ações Rápidas
function executarAcaoRapida(acao) {
    const mensagens = {
        'saudacao': 'Olá! Como você está?',
        'medicamento': 'As medicações foram administradas conforme prescrito.',
        'alimentacao': 'O paciente se alimentou bem na última refeição.',
        'atividade': 'As atividades do dia foram realizadas conforme planejado.',
        'emergencia': 'Preciso de ajuda urgente! Por favor, entre em contato.'
    };
    
    if (mensagens[acao]) {
        document.getElementById('mensagemInput').value = mensagens[acao];
        ajustarAlturaTextarea();
    }
}

// Utilitários
function ajustarAlturaTextarea() {
    const textarea = document.getElementById('mensagemInput');
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function formatarTextoMensagem(texto) {
    // Substituir quebras de linha por <br>
    return texto.replace(/\n/g, '<br>');
}

function formatarHora(timestamp) {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatarTempoRelativo(timestamp) {
    if (!timestamp) return '';
    
    const agora = new Date();
    const data = new Date(timestamp);
    const diffMs = agora - data;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHora = Math.floor(diffMin / 60);
    const diffDia = Math.floor(diffHora / 24);
    
    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHora < 24) return `${diffHora}h`;
    if (diffDia < 7) return `${diffDia}d`;
    
    return data.toLocaleDateString('pt-BR');
}

function filtrarConversas() {
    const termo = document.getElementById('pesquisaConversas').value.toLowerCase();
    const itens = document.querySelectorAll('.conversa-item');
    
    itens.forEach(item => {
        const texto = item.textContent.toLowerCase();
        item.style.display = texto.includes(termo) ? 'flex' : 'none';
    });
}

function atualizarMensagemLocal(idAntigo, novaMensagem) {
    const elemento = document.querySelector(`.mensagem[data-id="${idAntigo}"]`);
    if (elemento) {
        const icone = elemento.querySelector('i[data-feather]');
        if (icone) {
            icone.setAttribute('data-feather', novaMensagem.status === 'erro' ? 'x-circle' : 'check');
            feather.replace();
        }
    }
}

function obterUsuarioLogado() {
    // Tentar das chaves separadas primeiro
    const usuarioTipo = localStorage.getItem('usuarioTipo');
    const usuarioId = localStorage.getItem('usuarioId');
    const usuarioNome = localStorage.getItem('usuarioNome');
    
    if (usuarioTipo && usuarioId) {
        return {
            tipo: usuarioTipo,
            id: parseInt(usuarioId),
            nome: usuarioNome || 'Usuário'
        };
    }
    
    // Tentar do objeto único
    const chaves = ['usuarioLogado', 'currentUser', 'userData', 'loginData'];
    for (const chave of chaves) {
        const dados = localStorage.getItem(chave);
        if (dados) {
            try {
                return JSON.parse(dados);
            } catch (e) {
                console.log(`Erro ao parsear ${chave}:`, e);
            }
        }
    }
    
    return null;
}

function mostrarMensagem(mensagem, tipo) {
    // Implementar sistema de notificações
    console.log(`${tipo}: ${mensagem}`);
}

function mostrarLoading(mostrar) {
    // Implementar indicador de carregamento
    if (mostrar) {
        document.body.classList.add('loading');
    } else {
        document.body.classList.remove('loading');
    }
}

// Atualizar ícones periodicamente
setInterval(() => {
    feather.replace();
}, 1000);