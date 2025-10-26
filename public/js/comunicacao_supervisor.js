// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';
let conversas = [];
let conversaAtual = null;
let usuarioLogado = null;
let intervaloAtualizacao = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    inicializarUsuario();
    inicializarEventListeners();
    carregarConversas();
});

// Obter usuário logado
function inicializarUsuario() {
    usuarioLogado = obterUsuarioLogado();
    if (!usuarioLogado) {
        console.error('Usuário não logado');
        window.location.href = '/';
        return;
    }
    
    console.log('Usuário logado:', usuarioLogado);
    document.getElementById('userName').textContent = usuarioLogado.nome || 'Supervisor';
}

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
            window.location.href = '/';
        });
    }
}

// API Functions
async function carregarConversas() {
    try {
        mostrarLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/supervisores/${usuarioLogado.id}/conversas`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar conversas');
        }
        
        conversas = await response.json();
        renderizarConversas();
        
        // Selecionar primeira conversa se existir
        if (conversas.length > 0 && !conversaAtual) {
            selecionarConversa(conversas[0].usuario_id);
        }
        
        // Iniciar atualização automática
        iniciarAtualizacaoAutomatica();
        
    } catch (error) {
        console.error('Erro ao carregar conversas:', error);
        mostrarMensagem('Erro ao carregar conversas', 'error');
    } finally {
        mostrarLoading(false);
    }
}

async function carregarMensagens(destinatarioId) {
    try {
        const response = await fetch(`${API_BASE_URL}/mensagens/${usuarioLogado.id}/${destinatarioId}`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar mensagens');
        }
        
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
        remetente_id: usuarioLogado.id,
        destinatario_id: conversaAtual.usuario_id,
        mensagem: texto
    };
    
    try {
        // Adicionar mensagem localmente imediatamente
        const mensagemLocal = {
            ...mensagemData,
            id: 'temp-' + Date.now(),
            data_envio: new Date().toISOString(),
            remetente_nome: usuarioLogado.nome,
            remetente_tipo: usuarioLogado.tipo,
            destinatario_nome: conversaAtual.nome,
            destinatario_tipo: conversaAtual.tipo,
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
        atualizarMensagemLocal(mensagemLocal.id, mensagemServidor);
        
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        atualizarMensagemLocal(mensagemLocal.id, {
            ...mensagemLocal,
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
                <p>Você ainda não tem conversas com cuidadores</p>
            </div>
        `;
        feather.replace();
        return;
    }
    
    container.innerHTML = conversas.map(conversa => `
        <div class="conversa-item ${conversaAtual?.usuario_id === conversa.usuario_id ? 'active' : ''}" 
             onclick="selecionarConversa('${conversa.usuario_id}')">
            <div class="conversa-avatar">
                ${conversa.nome.charAt(0).toUpperCase()}
            </div>
            <div class="conversa-info">
                <div class="conversa-nome">
                    <span>${conversa.nome}</span>
                    <span class="conversa-tempo">${formatarTempoRelativo(conversa.ultima_mensagem_timestamp)}</span>
                </div>
                <div class="conversa-ultima-msg">
                    ${conversa.ultima_mensagem || 'Nenhuma mensagem'}
                </div>
            </div>
            ${conversa.mensagens_nao_lidas > 0 ? `
                <div class="conversa-badge">${conversa.mensagens_nao_lidas}</div>
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
    const isEnviada = parseInt(mensagem.remetente_id) === parseInt(usuarioLogado.id);
    
    // Remover empty state se existir
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    const mensagemElement = document.createElement('div');
    mensagemElement.className = `mensagem ${isEnviada ? 'enviada' : 'recebida'}`;
    mensagemElement.dataset.id = mensagem.id;
    
    let conteudo = `
        <div class="mensagem-texto">${formatarTextoMensagem(mensagem.mensagem)}</div>
        <div class="mensagem-hora">
            ${formatarHora(mensagem.data_envio)}
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
async function selecionarConversa(destinatarioId) {
    try {
        mostrarLoading(true);
        
        const conversa = conversas.find(c => c.usuario_id == destinatarioId);
        if (!conversa) return;
        
        conversaAtual = conversa;
        
        // Atualizar UI
        document.querySelectorAll('.conversa-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Encontrar e ativar o item clicado
        const itens = document.querySelectorAll('.conversa-item');
        for (let item of itens) {
            if (item.getAttribute('onclick').includes(destinatarioId)) {
                item.classList.add('active');
                break;
            }
        }
        
        // Atualizar header do chat
        document.getElementById('chatDependenteNome').textContent = conversa.nome;
        document.getElementById('chatStatus').textContent = 'Online';
        document.getElementById('statusIndicator').className = 'status-indicator';
        
        // Habilitar input
        document.getElementById('mensagemInput').disabled = false;
        document.getElementById('enviarMensagemBtn').disabled = false;
        
        // Carregar mensagens
        const mensagens = await carregarMensagens(destinatarioId);
        renderizarMensagens(mensagens);
        
        // Marcar como lida na lista
        const conversaIndex = conversas.findIndex(c => c.usuario_id == destinatarioId);
        if (conversaIndex !== -1) {
            conversas[conversaIndex].mensagens_nao_lidas = 0;
            renderizarConversas();
        }
        
    } catch (error) {
        console.error('Erro ao carregar conversa:', error);
        mostrarMensagem('Erro ao carregar conversa', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Ações Rápidas
function executarAcaoRapida(acao) {
    if (!conversaAtual) {
        mostrarMensagem('Selecione uma conversa primeiro', 'warning');
        return;
    }
    
    const mensagens = {
        'saudacao': 'Olá! Como está o paciente hoje?',
        'medicamento': 'As medicações estão sendo administradas corretamente?',
        'alimentacao': 'Como está a alimentação do paciente?',
        'atividade': 'O paciente está realizando as atividades?',
        'emergencia': 'Preciso de informações urgentes sobre o paciente!'
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
        elemento.dataset.id = novaMensagem.id;
        const icone = elemento.querySelector('i[data-feather]');
        if (icone && novaMensagem.status !== 'enviando') {
            icone.setAttribute('data-feather', novaMensagem.status === 'erro' ? 'x-circle' : 'check');
            feather.replace();
        }
    }
}

function obterUsuarioLogado() {
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
    console.log(`${tipo}: ${mensagem}`);
    // Implementar sistema de notificações mais elaborado se necessário
}

function mostrarLoading(mostrar) {
    if (mostrar) {
        document.body.classList.add('loading');
    } else {
        document.body.classList.remove('loading');
    }
}

// Atualização automática
function iniciarAtualizacaoAutomatica() {
    // Atualizar a cada 5 segundos
    intervaloAtualizacao = setInterval(async () => {
        if (conversaAtual) {
            await atualizarMensagensAtuais();
        }
        await atualizarListaConversas();
    }, 5000);
}

async function atualizarMensagensAtuais() {
    try {
        const mensagens = await carregarMensagens(conversaAtual.usuario_id);
        // Implementar lógica para atualizar apenas mensagens novas
    } catch (error) {
        console.error('Erro ao atualizar mensagens:', error);
    }
}

async function atualizarListaConversas() {
    try {
        const response = await fetch(`${API_BASE_URL}/supervisores/${usuarioLogado.id}/conversas`);
        if (response.ok) {
            const novasConversas = await response.json();
            
            // Atualizar contadores de mensagens não lidas
            conversas.forEach(conversa => {
                const novaConversa = novasConversas.find(c => c.usuario_id === conversa.usuario_id);
                if (novaConversa && novaConversa.mensagens_nao_lidas !== conversa.mensagens_nao_lidas) {
                    conversa.mensagens_nao_lidas = novaConversa.mensagens_nao_lidas;
                }
            });
            
            renderizarConversas();
        }
    } catch (error) {
        console.error('Erro ao atualizar lista de conversas:', error);
    }
}

// Limpar intervalo ao sair da página
window.addEventListener('beforeunload', () => {
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
    }
});

// Atualizar ícones periodicamente
setInterval(() => {
    feather.replace();
}, 1000);

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