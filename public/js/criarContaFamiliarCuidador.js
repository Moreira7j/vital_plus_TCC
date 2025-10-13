// criarContaFamiliarCuidador.js

document.addEventListener("DOMContentLoaded", function() {
    feather.replace();
});

// ====================== Menu mobile ====================== //

const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        navMenu.classList.toggle("active");
    });

    document.querySelectorAll(".nav-link").forEach(n => n.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
    }));
}

// ====================== Lógica de múltiplos passos do formulário ====================== //

let currentStep = 1;
const totalSteps = 3;

function showStep(step) {
    document.querySelectorAll(".signup-step").forEach((s, index) => {
        s.classList.toggle("active", index + 1 === step);
    });
    
    document.querySelectorAll(".progress-indicator .step").forEach((s, index) => {
        s.classList.toggle("active", index + 1 === step);
        s.classList.toggle("completed", index + 1 < step);
    });
}

function nextStep() {
    if (currentStep === 1) {
        if (!validateStep1()) return;
        saveFamiliarData();
    } else if (currentStep === 2) {
        if (!validateStep2()) return;
        saveDependenteData();
        displaySummary();
    }
    
    if (currentStep < totalSteps) {
        currentStep++;
    }
    showStep(currentStep);
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

function validateStep1() {
    const nome = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefone = document.getElementById("phone").value.trim();
    const data_nascimento = document.getElementById("birthDate").value;
    const parentesco = document.getElementById("parentesco").value;
    const senha = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const terms = document.getElementById("terms").checked;

    if (!nome || !email || !telefone || !data_nascimento || !parentesco || parentesco === "" || !senha || !confirmPassword) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return false;
    }

    if (senha !== confirmPassword) {
        alert("As senhas não coincidem.");
        return false;
    }

    if (senha.length < 8) {
        alert("A senha deve ter pelo menos 8 caracteres.");
        return false;
    }

    const birthDateObj = new Date(data_nascimento);
    const today = new Date();
    const age = today.getFullYear() - birthDateObj.getFullYear();
    
    if (age < 13) {
        alert("Você deve ter pelo menos 13 anos para se cadastrar.");
        return false;
    }

    if (!terms) {
        alert("Você deve aceitar os termos de uso.");
        return false;
    }

    return true;
}

function validateStep2() {
    const nomeDependente = document.getElementById("nomeDependente").value.trim();
    const dataNascimentoDependente = document.getElementById("dataNascimentoDependente").value;

    if (!nomeDependente || !dataNascimentoDependente) {
        alert("Por favor, preencha o nome e a data de nascimento do dependente.");
        return false;
    }

    return true;
}

function saveFamiliarData() {
    const familiarData = {
        nome: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        telefone: document.getElementById("phone").value.trim(),
        data_nascimento: document.getElementById("birthDate").value,
        parentesco: document.getElementById("parentesco").value,
        endereco: document.getElementById("endereco").value.trim(),
        senha: document.getElementById("password").value,
        tipo: 'familiar_cuidador'
    };

    localStorage.setItem('dadosUsuario', JSON.stringify(familiarData));
}

function saveDependenteData() {
    const dependenteData = {
        nome: document.getElementById("nomeDependente").value.trim(),
        data_nascimento: document.getElementById("dataNascimentoDependente").value,
        genero: document.getElementById("generoDependente").value,
        condicao_principal: document.getElementById("condicaoPrincipal").value.trim(),
        plano_saude: document.getElementById("planoSaude").value.trim(),
        alergias: document.getElementById("alergias").value.trim(),
        historico_medico: document.getElementById("historicoMedico").value.trim(),
        foto_perfil: document.getElementById("fotoPerfil").files[0] ? document.getElementById("fotoPerfil").files[0].name : null
    };

    localStorage.setItem('dadosPaciente', JSON.stringify(dependenteData));
}

function displaySummary() {
    const familiarData = JSON.parse(localStorage.getItem('dadosUsuario'));
    const dependenteData = JSON.parse(localStorage.getItem('dadosPaciente'));

    const familiarSummaryDiv = document.getElementById('familiarSummary');
    familiarSummaryDiv.innerHTML = `
        <div class="summary-item"><span class="summary-label">Nome:</span> <span class="summary-value">${familiarData.nome}</span></div>
        <div class="summary-item"><span class="summary-label">Email:</span> <span class="summary-value">${familiarData.email}</span></div>
        <div class="summary-item"><span class="summary-label">Telefone:</span> <span class="summary-value">${familiarData.telefone}</span></div>
        <div class="summary-item"><span class="summary-label">Nascimento:</span> <span class="summary-value">${formatarData(familiarData.data_nascimento)}</span></div>
        <div class="summary-item"><span class="summary-label">Parentesco:</span> <span class="summary-value">${formatarParentesco(familiarData.parentesco)}</span></div>
        <div class="summary-item"><span class="summary-label">Endereço:</span> <span class="summary-value">${familiarData.endereco || 'Não informado'}</span></div>
    `;

    const dependenteSummaryDiv = document.getElementById('dependenteSummary');
    dependenteSummaryDiv.innerHTML = `
        <div class="summary-item"><span class="summary-label">Nome:</span> <span class="summary-value">${dependenteData.nome}</span></div>
        <div class="summary-item"><span class="summary-label">Nascimento:</span> <span class="summary-value">${formatarData(dependenteData.data_nascimento)}</span></div>
        <div class="summary-item"><span class="summary-label">Gênero:</span> <span class="summary-value">${formatarGenero(dependenteData.genero)}</span></div>
        <div class="summary-item"><span class="summary-label">Condição Principal:</span> <span class="summary-value">${dependenteData.condicao_principal || 'Não informado'}</span></div>
        <div class="summary-item"><span class="summary-label">Plano de Saúde:</span> <span class="summary-value">${dependenteData.plano_saude || 'Não informado'}</span></div>
        <div class="summary-item"><span class="summary-label">Alergias:</span> <span class="summary-value">${dependenteData.alergias || 'Não informado'}</span></div>
        <div class="summary-item"><span class="summary-label">Histórico Médico:</span> <span class="summary-value">${dependenteData.historico_medico || 'Não informado'}</span></div>
        ${dependenteData.foto_perfil ? `<div class="summary-item"><span class="summary-label">Foto:</span> <span class="summary-value">${dependenteData.foto_perfil}</span></div>` : ''}
    `;
}

async function finalizarCadastro() {
    const familiarData = JSON.parse(localStorage.getItem('dadosUsuario'));
    const dependenteData = JSON.parse(localStorage.getItem('dadosPaciente'));
    const fotoPerfilFile = document.getElementById("fotoPerfil").files[0];

    const finalizeBtn = document.getElementById("finalizeBtn");
    finalizeBtn.classList.add("loading");
    finalizeBtn.disabled = true;

    try {
        // 1. Cadastrar o familiar
        const userResponse = await fetch("/api/cadastrar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(familiarData)
        });

        const userData = await userResponse.json();
        
        if (!userResponse.ok) {
            alert(userData.error || "Erro ao cadastrar familiar.");
            finalizeBtn.classList.remove("loading");
            finalizeBtn.disabled = false;
            return;
        }

        const usuarioId = userData.id; // ID do usuário recém-cadastrado na tabela \'usuarios\'

        // 2. Obter o ID do familiar cuidador recém-cadastrado da tabela familiares_cuidadores
        const familiarCuidadorResponse = await fetch(`/api/familiar/${usuarioId}/familiar_cuidador`);
        const familiarCuidadorData = await familiarCuidadorResponse.json();

        if (!familiarCuidadorResponse.ok) {
            alert(familiarCuidadorData.error || "Erro ao obter ID do familiar cuidador.");
            finalizeBtn.classList.remove("loading");
            finalizeBtn.disabled = false;
            return;
        }
        const familiarCuidadorRealId = familiarCuidadorData.id;

        // 3. Cadastrar o dependente
        const formData = new FormData();
        
        // Adicionar dados do dependente
        formData.append('nome', dependenteData.nome);
        formData.append('data_nascimento', dependenteData.data_nascimento);
        formData.append('genero', dependenteData.genero);
        formData.append('condicao_principal', dependenteData.condicao_principal);
        formData.append('plano_saude', dependenteData.plano_saude);
        formData.append('alergias', dependenteData.alergias);
        formData.append('historico_medico', dependenteData.historico_medico);
        formData.append('familiar_cuidador_id', familiarCuidadorRealId);

        // Adicionar foto se existir
        if (fotoPerfilFile) {
            formData.append('foto_perfil', fotoPerfilFile);
        }

                console.log("Enviando dados do dependente para /api/pacientes:", Object.fromEntries(formData.entries()));

        const pacienteResponse = await fetch("/api/pacientes", {
            method: "POST",
            body: formData
        });

        const pacienteData = await pacienteResponse.json();

        if (!pacienteResponse.ok) {
            alert(pacienteData.error || "Erro ao cadastrar dependente.");
            finalizeBtn.classList.remove("loading");
            finalizeBtn.disabled = false;
            return;
        }

        alert("Cadastro completo! Familiar e dependente registrados com sucesso.");
        
        // Salvar informações do usuário no localStorage antes de limpar
        localStorage.setItem("usuarioNome", familiarData.nome);
        localStorage.setItem("usuarioTipo", "familiar_cuidador");
        localStorage.setItem("usuarioId", usuarioId);
        
        // Limpar dados temporários de cadastro
        localStorage.removeItem('dadosUsuario');
        localStorage.removeItem('dadosPaciente');
        
        window.location.href = "/dependentes"; // Redireciona para a página de seleção de dependentes

    } catch (err) {
        console.error(err);
        alert("Erro ao conectar com o servidor durante o cadastro.");
    } finally {
        finalizeBtn.classList.remove("loading");
        finalizeBtn.disabled = false;
    }
}

// ====================== Força da senha ====================== //

const passwordInput = document.getElementById("password");
const passwordStrength = document.querySelector(".password-strength");
const strengthBar = document.querySelector(".strength-bar");

if (passwordInput && passwordStrength && strengthBar) {
    passwordInput.addEventListener("input", function() {
        const password = this.value;
        let strength = "";
        let strengthValue = 0;
        let color = "#E63946";

        if (password.length === 0) {
            strength = "";
            passwordStrength.style.display = "none";
            strengthBar.style.width = "0%";
        } else if (password.length < 8) {
            strength = "Senha fraca";
            strengthValue = 33;
            passwordStrength.style.display = "block";
            passwordStrength.style.color = color;
            strengthBar.style.width = "33%";
            strengthBar.style.backgroundColor = color;
        } else if (password.length < 12) {
            strength = "Senha média";
            strengthValue = 66;
            color = "#F39C12";
            passwordStrength.style.display = "block";
            passwordStrength.style.color = color;
            strengthBar.style.width = "66%";
            strengthBar.style.backgroundColor = color;
        } else {
            strength = "Senha forte";
            strengthValue = 100;
            color = "#27AE60";
            passwordStrength.style.display = "block";
            passwordStrength.style.color = color;
            strengthBar.style.width = "100%";
            strengthBar.style.backgroundColor = color;
        }

        const hasNumbers = /\d/.test(password);
        const hasLetters = /[a-zA-Z]/.test(password);
        
        if (hasNumbers && hasLetters && password.length >= 8) {
            strengthValue += 10;
            strengthBar.style.width = Math.min(strengthValue, 100) + "%";
        }

        passwordStrength.textContent = strength;
    });
}

// ====================== Toggle de senha ====================== //

function setupPasswordToggle() {
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }

    if (toggleConfirmPassword && confirmPasswordInput) {
        toggleConfirmPassword.addEventListener('click', function() {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
}

// ====================== Preview de imagem ====================== //

document.addEventListener('DOMContentLoaded', function() {
    const fotoPerfilInput = document.getElementById('fotoPerfil');
    const fotoPreviewDiv = document.getElementById('fotoPreview');

    if (fotoPerfilInput) {
        fotoPerfilInput.addEventListener('change', function() {
            fotoPreviewDiv.innerHTML = ''; // Limpa previews anteriores
            
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    fotoPreviewDiv.appendChild(img);
                };
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    showStep(currentStep);
    setupPasswordToggle();
});

// ====================== Funções auxiliares ====================== //

function formatarData(dataString) {
    if (!dataString) return 'Não informada';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

function formatarParentesco(parentesco) {
    const parentescos = {
        'filho': 'Filho(a)',
        'conjuge': 'Cônjuge',
        'pai': 'Pai/Mãe',
        'irmao': 'Irmão/Irmã',
        'neto': 'Neto(a)',
        'sobrinho': 'Sobrinho(a)',
        'outro': 'Outro'
    };
    return parentescos[parentesco] || parentesco;
}

function formatarGenero(genero) {
    const generos = {
        'masculino': 'Masculino',
        'feminino': 'Feminino',
        'outro': 'Outro'
    };
    return generos[genero] || genero || 'Não informado';
}   