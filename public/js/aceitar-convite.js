// aceitar-convite.js

let conviteToken = null;
let conviteData = null;

document.addEventListener("DOMContentLoaded", function() {
    initializePage();
});

function initializePage() {
    // Obter token da URL
    const urlParams = new URLSearchParams(window.location.search);
    conviteToken = urlParams.get('token');
    
    if (!conviteToken) {
        showError("Token de convite não encontrado na URL.");
        return;
    }
    
    // Verificar convite
    verificarConvite();
    
    // Configurar máscara de telefone
    setupPhoneMask();
    
    // Configurar formulário
    setupForm();
}

async function verificarConvite() {
    try {
        showLoading();
        
        const response = await fetch(`/api/convites/verificar/${conviteToken}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Erro ao verificar convite");
        }
        
        conviteData = await response.json();
        exibirInformacoesConvite();
        
    } catch (error) {
        console.error("Erro ao verificar convite:", error);
        showError(error.message || "Convite não encontrado, expirado ou já utilizado.");
    }
}

function exibirInformacoesConvite() {
    hideLoading();
    
    // Preencher informações do convite
    document.getElementById('pacienteNome').textContent = conviteData.paciente_nome || 'Não informado';
    document.getElementById('pacienteCondicao').textContent = conviteData.condicao_principal || 'Não informada';
    document.getElementById('familiarNome').textContent = conviteData.familiar_nome || 'Não informado';
    document.getElementById('familiarEmail').textContent = conviteData.familiar_email || 'Não informado';
    document.getElementById('familiarTelefone').textContent = conviteData.familiar_telefone || 'Não informado';
    
    // Formatar data de expiração
    const expiracao = new Date(conviteData.expiracao);
    document.getElementById('expiracao').textContent = expiracao.toLocaleDateString('pt-BR');
    
    // Mostrar card de informações
    document.getElementById('conviteInfo').style.display = 'block';
    document.getElementById('formAceitar').style.display = 'block';
    
    // Preencher email no formulário (readonly)
    document.getElementById('cuidadorNome').value = conviteData.cuidador_email.split('@')[0];
}

function setupForm() {
    const form = document.getElementById('formDadosCuidador');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await aceitarConvite();
    });
}

function setupPhoneMask() {
    const telefoneInput = document.getElementById('cuidadorTelefone');
    
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 10) {
                value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            } else {
                value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
            }
            e.target.value = value;
        });
    }
}

async function aceitarConvite() {
    const form = document.getElementById('formDadosCuidador');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    const cuidadorNome = document.getElementById('cuidadorNome').value.trim();
    const cuidadorTelefone = document.getElementById('cuidadorTelefone').value.trim();
    const cuidadorSenha = document.getElementById('cuidadorSenha').value;
    
    // Validações
    if (!cuidadorNome) {
        alert("Por favor, informe seu nome completo.");
        return;
    }
    
    if (!cuidadorTelefone) {
        alert("Por favor, informe seu telefone.");
        return;
    }
    
    if (!cuidadorSenha || cuidadorSenha.length < 8) {
        alert("A senha deve ter pelo menos 8 caracteres.");
        return;
    }
    
    try {
        // Mostrar loading no botão
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        
        const response = await fetch("/api/convites/aceitar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: conviteToken,
                cuidador_nome: cuidadorNome,
                cuidador_telefone: cuidadorTelefone,
                cuidador_senha: cuidadorSenha
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || "Erro ao aceitar convite");
        }
        
        showSuccess("Convite aceito com sucesso! Você agora é o cuidador responsável por este paciente.", result.usuario_id);
        
    } catch (error) {
        console.error("Erro ao aceitar convite:", error);
        alert("Erro ao aceitar convite: " + error.message);
        
        // Reativar botão
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Aceitar Convite';
    }
}

async function recusarConvite() {
    if (!confirm("Tem certeza que deseja recusar este convite?")) {
        return;
    }
    
    try {
        const response = await fetch("/api/convites/recusar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: conviteToken
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || "Erro ao recusar convite");
        }
        
        showMessage("Convite recusado com sucesso.", "info");
        
    } catch (error) {
        console.error("Erro ao recusar convite:", error);
        alert("Erro ao recusar convite: " + error.message);
    }
}

function showSuccess(mensagem, usuarioId) {
    hideAllCards();
    
    const resultadoCard = document.getElementById('mensagemResultado');
    const resultadoTitulo = document.getElementById('resultadoTitulo');
    const resultadoMensagem = document.getElementById('resultadoMensagem');
    const btnDashboard = document.getElementById('btnDashboard');
    
    resultadoTitulo.textContent = "✅ Convite Aceito!";
    resultadoMensagem.innerHTML = `
        <div class="resultado-mensagem success">
            <i class="fas fa-check-circle"></i>
            <h3>Sucesso!</h3>
            <p>${mensagem}</p>
            <p><strong>Email:</strong> ${conviteData.cuidador_email}</p>
        </div>
    `;
    
    // Mostrar botão do dashboard se temos o ID do usuário
    if (usuarioId) {
        btnDashboard.style.display = 'block';
        // Salvar informações do usuário no localStorage
        localStorage.setItem("usuarioId", usuarioId);
        localStorage.setItem("usuarioTipo", "cuidador_profissional");
        localStorage.setItem("usuarioNome", document.getElementById('cuidadorNome').value.trim());
    }
    
    resultadoCard.style.display = 'block';
}

function showMessage(mensagem, tipo = 'info') {
    hideAllCards();
    
    const resultadoCard = document.getElementById('mensagemResultado');
    const resultadoTitulo = document.getElementById('resultadoTitulo');
    const resultadoMensagem = document.getElementById('resultadoMensagem');
    
    resultadoTitulo.textContent = tipo === 'info' ? "ℹ️ Informação" : "✅ Sucesso";
    resultadoMensagem.innerHTML = `
        <div class="resultado-mensagem ${tipo}">
            <i class="fas ${tipo === 'info' ? 'fa-info-circle' : 'fa-check-circle'}"></i>
            <h3>${tipo === 'info' ? 'Informação' : 'Sucesso'}</h3>
            <p>${mensagem}</p>
        </div>
    `;
    
    resultadoCard.style.display = 'block';
}

function showError(mensagem) {
    hideAllCards();
    
    const erroCard = document.getElementById('erroCard');
    const erroMensagem = document.getElementById('erroMensagem');
    
    erroMensagem.innerHTML = `
        <div class="erro-mensagem">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Erro</h3>
            <p>${mensagem}</p>
        </div>
    `;
    
    erroCard.style.display = 'block';
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
    hideAllCards();
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function hideAllCards() {
    document.getElementById('conviteInfo').style.display = 'none';
    document.getElementById('formAceitar').style.display = 'none';
    document.getElementById('mensagemResultado').style.display = 'none';
    document.getElementById('erroCard').style.display = 'none';
    hideLoading();
}

// Funções globais
window.recusarConvite = recusarConvite;