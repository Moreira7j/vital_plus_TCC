// criarContaFamiliarCuidador.js

document.addEventListener("DOMContentLoaded", function() {
    feather.replace();
    setupCPFMasking();
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
    try {
        const getElement = (id) => {
            const element = document.getElementById(id);
            if (!element) {
                console.error(`❌ Elemento não encontrado na validação: ${id}`);
                return null;
            }
            return element;
        };

        const nome = getElement("name")?.value.trim();
        const email = getElement("email")?.value.trim();
        const telefone = getElement("phone")?.value.trim();
        const data_nascimento = getElement("birthDate")?.value;
        const parentesco = getElement("parentesco")?.value;
        const senha = getElement("password")?.value;
        const confirmPassword = getElement("confirmPassword")?.value;
        const terms = getElement("terms")?.checked;

        // Verificar se todos os campos obrigatórios estão preenchidos
        if (!nome || !email || !telefone || !data_nascimento || !parentesco || parentesco === "" || !senha || !confirmPassword) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return false;
        }

        if (senha !== confirmPassword) {
            alert("As senhas não coincidem.");
            return false;
        }

        if (senha.length < 6) {
            alert("A senha deve ter pelo menos 6 caracteres.");
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
        
    } catch (error) {
        console.error("❌ Erro na validação do passo 1:", error);
        alert("Erro na validação dos dados. Por favor, verifique os campos e tente novamente.");
        return false;
    }
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
    try {
        // Obter elementos com verificação de segurança
        const getElement = (id) => {
            const element = document.getElementById(id);
            if (!element) {
                console.error(`❌ Elemento não encontrado: ${id}`);
                return null;
            }
            return element;
        };

        const nameElement = getElement("name");
        const emailElement = getElement("email");
        const phoneElement = getElement("phone");
        const birthDateElement = getElement("birthDate");
        const generoElement = getElement("genero");
        const parentescoElement = getElement("parentesco");
        const enderecoElement = getElement("endereco");
        const passwordElement = getElement("password");

        // Verificar se todos os elementos obrigatórios existem
        const requiredElements = [nameElement, emailElement, phoneElement, birthDateElement, parentescoElement, passwordElement];
        const missingElements = requiredElements.filter(element => !element);
        
        if (missingElements.length > 0) {
            console.error("❌ Elementos obrigatórios não encontrados:", missingElements);
            return;
        }

        const familiarData = {
            nome: nameElement.value.trim(),
            email: emailElement.value.trim(),
            telefone: phoneElement.value.trim(),
            data_nascimento: birthDateElement.value,
            genero: generoElement ? generoElement.value : null,
            parentesco: parentescoElement.value,
            endereco: enderecoElement ? enderecoElement.value.trim() : null,
            senha: passwordElement.value,
            tipo: 'familiar_cuidador'
        };

        console.log("💾 Salvando dados do familiar:", familiarData);
        localStorage.setItem('dadosUsuario', JSON.stringify(familiarData));
        
    } catch (error) {
        console.error("❌ Erro ao salvar dados do familiar:", error);
        alert("Erro ao salvar dados. Por favor, recarregue a página e tente novamente.");
    }
}

function saveDependenteData() {
    try {
        const getElement = (id) => {
            const element = document.getElementById(id);
            if (!element) {
                console.error(`❌ Elemento não encontrado: ${id}`);
                return null;
            }
            return element;
        };

        const nomeDependenteElement = getElement("nomeDependente");
        const dataNascimentoElement = getElement("dataNascimentoDependente");
        const generoDependenteElement = getElement("generoDependente");
        const condicaoPrincipalElement = getElement("condicaoPrincipal");
        const planoSaudeElement = getElement("planoSaude");
        const alergiasElement = getElement("alergias");
        const historicoMedicoElement = getElement("historicoMedico");
        const fotoPerfilElement = getElement("fotoPerfil");

        // Verificar elementos obrigatórios
        if (!nomeDependenteElement || !dataNascimentoElement) {
            console.error("❌ Elementos obrigatórios do dependente não encontrados");
            return;
        }

        const dependenteData = {
            nome: nomeDependenteElement.value.trim(),
            data_nascimento: dataNascimentoElement.value,
            genero: generoDependenteElement ? generoDependenteElement.value : null,
            condicao_principal: condicaoPrincipalElement ? condicaoPrincipalElement.value.trim() : null,
            plano_saude: planoSaudeElement ? planoSaudeElement.value.trim() : null,
            alergias: alergiasElement ? alergiasElement.value.trim() : null,
            historico_medico: historicoMedicoElement ? historicoMedicoElement.value.trim() : null,
            foto_perfil: fotoPerfilElement && fotoPerfilElement.files[0] ? fotoPerfilElement.files[0].name : null
        };

        console.log("💾 Salvando dados do dependente:", dependenteData);
        localStorage.setItem('dadosPaciente', JSON.stringify(dependenteData));
        
    } catch (error) {
        console.error("❌ Erro ao salvar dados do dependente:", error);
        alert("Erro ao salvar dados do dependente. Por favor, recarregue a página e tente novamente.");
    }
}

function displaySummary() {
    try {
        const familiarData = JSON.parse(localStorage.getItem('dadosUsuario'));
        const dependenteData = JSON.parse(localStorage.getItem('dadosPaciente'));

        if (!familiarData || !dependenteData) {
            console.error("❌ Dados não encontrados no localStorage");
            return;
        }

        const familiarSummaryDiv = document.getElementById('familiarSummary');
        const dependenteSummaryDiv = document.getElementById('dependenteSummary');

        if (!familiarSummaryDiv || !dependenteSummaryDiv) {
            console.error("❌ Elementos de summary não encontrados");
            return;
        }

        familiarSummaryDiv.innerHTML = `
            <div class="summary-item"><span class="summary-label">Nome:</span> <span class="summary-value">${familiarData.nome}</span></div>
            <div class="summary-item"><span class="summary-label">Email:</span> <span class="summary-value">${familiarData.email}</span></div>
            <div class="summary-item"><span class="summary-label">Telefone:</span> <span class="summary-value">${familiarData.telefone}</span></div>
            <div class="summary-item"><span class="summary-label">Nascimento:</span> <span class="summary-value">${formatarData(familiarData.data_nascimento)}</span></div>
            <div class="summary-item"><span class="summary-label">Gênero:</span> <span class="summary-value">${formatarGenero(familiarData.genero)}</span></div>
            <div class="summary-item"><span class="summary-label">Parentesco:</span> <span class="summary-value">${formatarParentesco(familiarData.parentesco)}</span></div>
            <div class="summary-item"><span class="summary-label">Endereço:</span> <span class="summary-value">${familiarData.endereco || 'Não informado'}</span></div>
        `;

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
        
    } catch (error) {
        console.error("❌ Erro ao exibir resumo:", error);
        alert("Erro ao carregar resumo. Por favor, recarregue a página.");
    }
}

async function finalizarCadastro() {
    const familiarData = JSON.parse(localStorage.getItem('dadosUsuario'));
    const dependenteData = JSON.parse(localStorage.getItem('dadosPaciente'));
    const fotoPerfilFile = document.getElementById("fotoPerfil").files[0];

    const finalizeBtn = document.getElementById("finalizeBtn");
    finalizeBtn.classList.add("loading");
    finalizeBtn.disabled = true;

    try {
        console.log("📝 Iniciando cadastro do familiar cuidador...");
        console.log("Dados do familiar:", familiarData);

        // 1. Cadastrar o familiar cuidador usando a NOVA ROTA
        const userResponse = await fetch("/api/cadastrar-familiar-cuidador", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(familiarData)
        });

        const userData = await userResponse.json();
        
        if (!userResponse.ok || !userData.success) {
            alert(userData.message || userData.error || "Erro ao cadastrar familiar.");
            finalizeBtn.classList.remove("loading");
            finalizeBtn.disabled = false;
            return;
        }

        const usuarioId = userData.usuario_id; // ID do usuário recém-cadastrado
        const familiarId = userData.familiar_id; // ID do familiar cuidador

        console.log(`✅ Familiar cuidador cadastrado com sucesso!`);
        console.log(`👤 Usuário ID: ${usuarioId}`);
        console.log(`👨‍👩‍👧‍👦 Familiar ID: ${familiarId}`);

        // 2. Cadastrar o dependente (paciente) vinculado ao familiar cuidador
        const formData = new FormData();
        
        // Adicionar dados do dependente
        formData.append('nome', dependenteData.nome);
        formData.append('data_nascimento', dependenteData.data_nascimento);
        formData.append('genero', dependenteData.genero);
        formData.append('condicao_principal', dependenteData.condicao_principal);
        formData.append('plano_saude', dependenteData.plano_saude);
        formData.append('alergias', dependenteData.alergias);
        formData.append('historico_medico', dependenteData.historico_medico);
        formData.append('familiar_cuidador_id', familiarId); // Usar o ID do familiar (não do usuário)

        // Adicionar foto se existir
        if (fotoPerfilFile) {
            formData.append('foto_perfil', fotoPerfilFile);
        }

        console.log("📦 Enviando dados do dependente para /api/pacientes...");
        console.log("Familiar ID usado:", familiarId);

        const pacienteResponse = await fetch("/api/pacientes", {
            method: "POST",
            body: formData
        });

        const pacienteData = await pacienteResponse.json();

        if (!pacienteResponse.ok || !pacienteData.success) {
            alert(pacienteData.message || pacienteData.error || "Erro ao cadastrar dependente.");
            finalizeBtn.classList.remove("loading");
            finalizeBtn.disabled = false;
            return;
        }

        console.log("✅ Dependente cadastrado com sucesso!");

        alert("Cadastro completo! Familiar e dependente registrados com sucesso.");
        
        // Salvar informações do usuário no localStorage antes de limpar
        localStorage.setItem("usuarioNome", familiarData.nome);
        localStorage.setItem("usuarioTipo", "familiar_cuidador");
        localStorage.setItem("usuarioId", usuarioId);
        
        // Limpar dados temporários de cadastro
        localStorage.removeItem('dadosUsuario');
        localStorage.removeItem('dadosPaciente');
        
        // Redirecionar para login (já que você faz login no landingPage.html)
        window.location.href = "/"; // Vai para landingPage.html

    } catch (err) {
        console.error("❌ Erro no cadastro:", err);
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
        } else if (password.length < 6) {
            strength = "Senha fraca";
            strengthValue = 33;
            passwordStrength.style.display = "block";
            passwordStrength.style.color = color;
            strengthBar.style.width = "33%";
            strengthBar.style.backgroundColor = color;
        } else if (password.length < 10) {
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
        
        if (hasNumbers && hasLetters && password.length >= 6) {
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
                    img.style.maxWidth = '150px';
                    img.style.maxHeight = '150px';
                    img.style.borderRadius = '10px';
                    img.style.objectFit = 'cover';
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

function formatarCPF(cpf) {
    if (!cpf) return 'Não informado';
    const cpfLimpo = cpf.replace(/\D/g, '');
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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