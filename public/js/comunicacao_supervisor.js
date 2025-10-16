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
}

// WebSocket para comunicação em tempo real
function inicializarWebSocket() {
    socket = new WebSocket('ws://localhost:3000/comunicacao');
    
    socket.onopen = function() {
        console.log('Conectado ao servidor de comunicação');
    };
    
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        
        switch (data.tipo) {
            case 'nova_mensagem':
                receberNovaMensagem(data.mensagem);
                break;
            case 'usuario_digitando':
                mostrarIndicadorDigitacao(data.usuarioId);
                break;
            case 'usuario_online':
                atualizarStatusUsuario(data.usuarioId, true);
                break;
            case 'usuario_offline':
                atualizarStatusUsuario(data.usuarioId, false);
                break;
        }
    };
    
    socket.onclose = function() {
        console.log('Conexão WebSocket fechada');
        // Tentar reconectar após 5 segundos
        setTimeout(inicializarWebSocket, 5000);
    };
}

// API Functions
async function carregarConversas() {
    try {
        mostrarLoading(true);
        const response = await fetch(`${API_BASE_URL}/conversas`);
        
        if (!response.ok) throw new Error('Erro ao carregar conversas');
        
        conversas = await response.json();
        renderizarConversas();
        
        // Selecionar primeira conversa se existir
        if (conversas.length > 0 && !conversaAtual) {
            selecionarConversa(conversas[0].id);
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar conversas', 'error');
    } finally {
        mostrarLoading(false);
    }
}

async function carregarMensagens(conversaId) {
    try {
        const response = await fetch(`${API_BASE_URL}/conversas/${conversaId}/mensagens`);
        
        if (!response.ok) throw new Error('Erro ao carregar mensagens');
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}

async function enviarMensagem() {
    const input = document.getElementById('mensagemInput');
    const texto = input.value.trim();
    
    if (!texto || !conversaAtual) return;
    
    const mensagemData = {
        conversaId: conversaAtual.id,
        texto: texto,
        tipo: 'texto',
        remetenteId: 'supervisor', // ID do supervisor
        remetenteNome: 'Supervisor'
    };
    
    try {
        // Adicionar mensagem localmente imediatamente
        const mensagemLocal = {
            ...mensagemData,
            id: Date.now(), // ID temporário
            timestamp: new Date().toISOString(),
            status: 'enviando'
        };
        
        adicionarMensagemNaTela(mensagemLocal);
        input.value = '';
        ajustarAlturaTextarea();
        
        // Enviar para o servidor
        const response = await fetch(`${API_BASE_URL}/mensagens`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mensagemData)
        });
        
        if (!response.ok) throw new Error('Erro ao enviar mensagem');
        
        const mensagemServidor = await response.json();
        
        // Atualizar mensagem local com dados do servidor
        atualizarMensagemLocal(mensagemLocal.id, {
            ...mensagemServidor,
            status: 'enviado'
        });
        
        // Enviar via WebSocket para outros usuários
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                tipo: 'nova_mensagem',
                mensagem: mensagemServidor
            }));
        }
        
    } catch (error) {
        console.error('Erro:', error);
        atualizarMensagemLocal(mensagemLocal.id, {
            status: 'erro'
        });
        mostrarMensagem('Erro ao enviar mensagem', 'error');
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
                <p>Comece uma nova conversa com um dependente</p>
            </div>
        `;
        feather.replace();
        return;
    }
    
    container.innerHTML = conversas.map(conversa => `
        <div class="conversa-item ${conversaAtual?.id === conversa.id ? 'active' : ''}" 
             onclick="selecionarConversa('${conversa.id}')">
            <div class="conversa-avatar">
                ${conversa.dependenteNome.charAt(0).toUpperCase()}
            </div>
            <div class="conversa-info">
                <div class="conversa-nome">
                    <span>${conversa.dependenteNome}</span>
                    <span class="conversa-tempo">${formatarTempoRelativo(conversa.ultimaMensagemTimestamp)}</span>
                </div>
                <div class="conversa-ultima-msg">
                    ${conversa.ultimaMensagem || 'Nenhuma mensagem'}
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
    
    if (mensagens.length === 0) {
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
    const isEnviada = mensagem.remetenteId === 'supervisor';
    
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
    
    if (mensagem.anexo) {
        conteudo = `
            <div class="mensagem-anexo">
                <i data-feather="paperclip" class="anexo-icon"></i>
                <span>${mensagem.anexo.nome}</span>
            </div>
            ${conteudo}
        `;
    }
    
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
        
        const conversa = conversas.find(c => c.id === conversaId);
        if (!conversa) return;
        
        conversaAtual = conversa;
        
        // Atualizar UI
        document.querySelectorAll('.conversa-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.conversa-item[onclick="selecionarConversa('${conversaId}')"]`).classList.add('active');
        
        // Atualizar header do chat
        document.getElementById('chatDependenteNome').textContent = conversa.dependenteNome;
        document.getElementById('chatStatus').textContent = conversa.online ? 'Online' : 'Offline';
        document.getElementById('statusIndicator').className = `status-indicator ${conversa.online ? '' : 'offline'}`;
        
        // Carregar mensagens
        const mensagens = await carregarMensagens(conversaId);
        renderizarMensagens(mensagens);
        
        // Marcar como lida
        await marcarComoLida(conversaId);
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar conversa', 'error');
    } finally {
        mostrarLoading(false);
    }
}

async function marcarComoLida(conversaId) {
    try {
        await fetch(`${API_BASE_URL}/conversas/${conversaId}/ler`, {
            method: 'POST'
        });
        
        // Atualizar localmente
        const conversa = conversas.find(c => c.id === conversaId);
        if (conversa) {
            conversa.mensagensNaoLidas = 0;
            renderizarConversas();
        }
    } catch (error) {
        console.error('Erro ao marcar como lida:', error);
    }
}

// Ações Rápidas
function executarAcaoRapida(acao) {
    const mensagens = {
        'saudacao': 'Olá! Como você está se sentindo hoje?',
        'medicamento': 'Lembre-se de tomar seu medicamento conforme prescrito.',
        'alimentacao': 'Já se alimentou hoje? Está se hidratando bem?',
        'atividade': 'Como está sendo sua atividade física hoje?',
        'emergencia': 'Precisa de ajuda imediata? Estou aqui para ajudar!'
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

// WebSocket Handlers
function receberNovaMensagem(mensagem) {
    if (conversaAtual && mensagem.conversaId === conversaAtual.id) {
        adicionarMensagemNaTela(mensagem);
    }
    
    // Atualizar lista de conversas
    const conversa = conversas.find(c => c.id === mensagem.conversaId);
    if (conversa) {
        conversa.ultimaMensagem = mensagem.texto;
        conversa.ultimaMensagemTimestamp = mensagem.timestamp;
        
        if (!conversaAtual || conversaAtual.id !== mensagem.conversaId) {
            conversa.mensagensNaoLidas = (conversa.mensagensNaoLidas || 0) + 1;
        }
        
        renderizarConversas();
    }
}

function mostrarIndicadorDigitacao(usuarioId) {
    if (conversaAtual && conversaAtual.dependenteId === usuarioId) {
        const container = document.getElementById('chatMessages');
        let indicador = container.querySelector('.typing-indicator');
        
        if (!indicador) {
            indicador = document.createElement('div');
            indicador.className = 'typing-indicator';
            indicador.innerHTML = `
                <span>Digitando</span>
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `;
            container.appendChild(indicador);
        }
        
        container.scrollTop = container.scrollHeight;
        
        // Remover após 3 segundos
        clearTimeout(window.typingTimeout);
        window.typingTimeout = setTimeout(() => {
            indicador.remove();
        }, 3000);
    }
}

function atualizarStatusUsuario(usuarioId, online) {
    conversas.forEach(conversa => {
        if (conversa.dependenteId === usuarioId) {
            conversa.online = online;
        }
    });
    
    if (conversaAtual && conversaAtual.dependenteId === usuarioId) {
        document.getElementById('chatStatus').textContent = online ? 'Online' : 'Offline';
        document.getElementById('statusIndicator').className = `status-indicator ${online ? '' : 'offline'}`;
    }
    
    renderizarConversas();
}

function atualizarMensagemLocal(idAntigo, novaMensagem) {
    const elemento = document.querySelector(`.mensagem[data-id="${idAntigo}"]`);
    if (elemento) {
        elemento.dataset.id = novaMensagem.id;
        const icone = elemento.querySelector('i[data-feather]');
        if (icone) {
            icone.setAttribute('data-feather', novaMensagem.status === 'erro' ? 'x-circle' : 'check');
            feather.replace();
        }
    }
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

// Notificações do Navegador
function solicitarPermissaoNotificacoes() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function mostrarNotificacao(mensagem) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Nova Mensagem - CareWatch', {
            body: mensagem,
            icon: '/icon.png'
        });
    }
}

// Inicializar notificações
solicitarPermissaoNotificacoes();