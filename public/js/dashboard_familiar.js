// dashboard_familiar.js

// ====================== Controle de Acesso ====================== //
document.addEventListener("DOMContentLoaded", function() {
    // Verificar se o usuário está logado e é do tipo correto
    const usuarioTipo = localStorage.getItem("usuarioTipo");
    const usuarioNome = localStorage.getItem("usuarioNome");
    const usuarioId = localStorage.getItem("usuarioId");
    const dependenteSelecionado = JSON.parse(localStorage.getItem("dependenteSelecionado"));

    if (!usuarioId || !usuarioTipo) {
        alert("Você precisa fazer login para acessar esta página.");
        window.location.href = "/";
        return;
    }

    if (usuarioTipo !== "familiar_cuidador") {
        alert("Você não tem permissão para acessar esta página.");
        window.location.href = "/";
        return;
    }

    if (!dependenteSelecionado) {
        alert("Você precisa selecionar um dependente primeiro.");
        window.location.href = "/dependentes";
        return;
    }

    // Inicializar Feather Icons
    feather.replace();

    // Exibir nome do usuário
    const userNameElement = document.getElementById("userName");
    if (userNameElement && usuarioNome) {
        userNameElement.textContent = usuarioNome;
    }

    // Exibir informações do dependente
    exibirInformacoesDependente(dependenteSelecionado);

    // Configurar botões
    configurarBotoes();

    // Carregar dados do dashboard
    carregarDadosDashboard();
});

// ====================== Exibir Informações do Dependente ====================== //
function exibirInformacoesDependente(dependente) {
    const nomeElement = document.getElementById("dependenteNome");
    if (nomeElement) {
        nomeElement.textContent = dependente.nome;
    }

    // Aqui você pode adicionar mais informações do dependente
    // como idade, foto, condição, etc.
}

// ====================== Configurar Botões ====================== //
function configurarBotoes() {
    // Botão de logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function(e) {
            e.preventDefault();
            localStorage.removeItem("dependenteSelecionado");
            localStorage.removeItem("usuarioNome");
            localStorage.removeItem("usuarioId");
            localStorage.removeItem("usuarioTipo");
            window.location.href = "/";
        });
    }

    // Botão de adicionar registro
    const addRecordBtn = document.getElementById("addRecordBtn");
    if (addRecordBtn) {
        addRecordBtn.addEventListener("click", function() {
            abrirModalRegistro();
        });
    }

    // Modal de registro
    const modal = document.getElementById("recordModal");
    const closeBtn = modal ? modal.querySelector(".close") : null;
    
    if (closeBtn) {
        closeBtn.addEventListener("click", function() {
            modal.style.display = "none";
        });
    }

    // Fechar modal ao clicar fora
    window.addEventListener("click", function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Formulário de sinais vitais
    const vitalForm = document.getElementById("vitalForm");
    if (vitalForm) {
        vitalForm.addEventListener("submit", function(e) {
            e.preventDefault();
            salvarSinaisVitais();
        });
    }
}

// ====================== Abrir Modal de Registro ====================== //
function abrirModalRegistro() {
    const modal = document.getElementById("recordModal");
    if (modal) {
        modal.style.display = "block";
        feather.replace();
    }
}

// ====================== Salvar Sinais Vitais ====================== //
async function salvarSinaisVitais() {
    const dependenteSelecionado = JSON.parse(localStorage.getItem("dependenteSelecionado"));
    const usuarioId = localStorage.getItem("usuarioId");

    const sistolica = document.getElementById("modalSistolica").value;
    const diastolica = document.getElementById("modalDiastolica").value;
    const glicemia = document.getElementById("modalGlicemia").value;
    const temperatura = document.getElementById("modalTemperatura").value;
    const observacoes = document.getElementById("modalObservacoes").value;

    // Aqui você implementaria a lógica de salvar os sinais vitais no backend
    console.log("Salvando sinais vitais:", {
        paciente_id: dependenteSelecionado.id,
        usuario_id: usuarioId,
        sistolica,
        diastolica,
        glicemia,
        temperatura,
        observacoes
    });

    alert("Sinais vitais registrados com sucesso!");
    
    // Fechar modal
    const modal = document.getElementById("recordModal");
    if (modal) {
        modal.style.display = "none";
    }

    // Limpar formulário
    document.getElementById("vitalForm").reset();

    // Recarregar dados do dashboard
    carregarDadosDashboard();
}

// ====================== Carregar Dados do Dashboard ====================== //
async function carregarDadosDashboard() {
    const dependenteSelecionado = JSON.parse(localStorage.getItem("dependenteSelecionado"));
    
    // Aqui você implementaria a lógica de carregar os dados do dashboard
    // como sinais vitais recentes, medicamentos, alertas, etc.
    console.log("Carregando dados do dashboard para dependente:", dependenteSelecionado.id);
}
