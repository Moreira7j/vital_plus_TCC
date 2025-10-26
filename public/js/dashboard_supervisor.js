// dashboard_supervisor.js - CORRIGIDO (header e paciente selecionado)
const token = localStorage.getItem("token");
const headersAutenticacao = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`
};

// ✅ NOVO: Inicializar header primeiro
function inicializarHeader() {
    console.log('🔧 Inicializando header...');
    
    // Tentar carregar dados básicos do header mesmo antes da API
    const usuarioNome = localStorage.getItem('usuarioNome');
    const userNameElement = document.getElementById('userName');
    
    if (userNameElement && usuarioNome) {
        userNameElement.textContent = usuarioNome;
        console.log('✅ Header inicializado com:', usuarioNome);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 DOM carregado, inicializando dashboard supervisor...');

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

    // ✅ NOVO: Inicializar header primeiro
    inicializarHeader();

    // Carregar dados do dependente
    carregarDadosDependente();

    // Configurar eventos
    configurarEventos();

    console.log('🎯 Dashboard supervisor inicializado com sucesso!');
});

// ✅ NOVO: FUNÇÃO PARA ATUALIZAR O HEADER DO SUPERVISOR
function atualizarHeaderSupervisor(paciente) {
    console.log('🎯 Atualizando header do supervisor...');
    
    // Elementos do header
    const userNameElement = document.getElementById('userName');
    const patientNameElement = document.getElementById('patientName');
    
    // Obter nome do usuário logado do localStorage
    const usuarioNome = localStorage.getItem('usuarioNome') || 'Familiar Supervisor';
    
    // Atualizar elementos
    if (userNameElement) {
        userNameElement.textContent = usuarioNome;
        console.log('✅ Nome do usuário atualizado:', usuarioNome);
    }
    
    if (patientNameElement && paciente) {
        patientNameElement.textContent = paciente.nome || 'Paciente não informado';
        console.log('✅ Nome do paciente atualizado:', paciente.nome);
    }
}

// Função para carregar dados do dependente - CORREÇÃO COMPLETA
async function carregarDadosDependente() {
    try {
        console.log('🔍 Iniciando carregamento de dados do dependente...');

        // Recuperar dados do usuário
        const usuarioId = localStorage.getItem('usuarioId');
        const usuarioTipo = localStorage.getItem('usuarioTipo');
        
        // ✅ CORREÇÃO COMPLETA: Buscar paciente selecionado de TODAS as formas
        let pacienteSelecionadoId = null;
        let pacienteSelecionadoObj = null;

        // 1. Tentar buscar por pacienteSelecionadoId (chave direta)
        pacienteSelecionadoId = localStorage.getItem('pacienteSelecionadoId');
        
        // 2. Se não encontrou, tentar extrair de dependenteSelecionado (JSON)
        if (!pacienteSelecionadoId) {
            const dependenteObjStr = localStorage.getItem('dependenteSelecionado');
            if (dependenteObjStr) {
                try {
                    pacienteSelecionadoObj = JSON.parse(dependenteObjStr);
                    pacienteSelecionadoId = pacienteSelecionadoObj.id || pacienteSelecionadoObj.paciente_id;
                    console.log('✅ Paciente encontrado em dependenteSelecionado:', pacienteSelecionadoId);
                } catch (e) {
                    console.error('❌ Erro ao parsear dependenteSelecionado:', e);
                }
            }
        }

        // 3. Se ainda não encontrou, tentar outras chaves possíveis
        if (!pacienteSelecionadoId) {
            pacienteSelecionadoId = localStorage.getItem('dependenteSelecionadoId') || 
                                   localStorage.getItem('pacienteId') ||
                                   localStorage.getItem('selectedPatientId');
        }

        console.log('👤 Usuário:', usuarioId, 'Tipo:', usuarioTipo);
        console.log('🎯 Paciente selecionado ID final:', pacienteSelecionadoId);

        if (!usuarioId) {
            console.error('❌ Usuário não logado');
            window.location.href = '/';
            return;
        }

        // ✅ CORREÇÃO: Se não tem paciente selecionado, redirecionar SILENCIOSAMENTE
        if (!pacienteSelecionadoId) {
            console.log('🔁 Nenhum paciente selecionado, redirecionando para dependentes...');
            window.location.href = 'dependentes.html';
            return;
        }

        // ✅ CORREÇÃO: Garantir que o ID está salvo em todas as chaves para compatibilidade futura
        localStorage.setItem('pacienteSelecionadoId', pacienteSelecionadoId);
        if (pacienteSelecionadoObj) {
            localStorage.setItem('dependenteSelecionado', JSON.stringify(pacienteSelecionadoObj));
        }

        // ✅ CORREÇÃO: Buscar dados do paciente baseado no tipo de usuário
        let paciente;
        let apiUrl;

        if (usuarioTipo === 'familiar_contratante') {
            // Familiar contratante usa rota de supervisor
            apiUrl = `/api/supervisores/${usuarioId}/paciente/${pacienteSelecionadoId}`;
            console.log('🌐 Buscando via rota supervisor (familiar_contratante):', apiUrl);
            
        } else if (usuarioTipo === 'familiar_cuidador') {
            // Familiar cuidador usa rota específica
            apiUrl = `/api/familiares-cuidadores/${usuarioId}/paciente/${pacienteSelecionadoId}`;
            console.log('🌐 Buscando via rota familiar cuidador:', apiUrl);
            
        } else if (usuarioTipo === 'cuidador_profissional') {
            // Cuidador profissional usa rota de cuidador
            apiUrl = `/api/cuidadores/${usuarioId}/paciente`;
            console.log('🌐 Buscando via rota cuidador profissional:', apiUrl);
        } else {
            // Para outros tipos, usar rota genérica
            apiUrl = `/api/dependentes/${pacienteSelecionadoId}`;
            console.log('🌐 Buscando via rota genérica:', apiUrl);
        }

        // Fazer a requisição
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro na resposta da API:', response.status, errorText);
            
            if (response.status === 404) {
                console.log('🔁 Paciente não encontrado, redirecionando para dependentes...');
                window.location.href = 'dependentes.html';
                return;
            }
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }
        
        paciente = await response.json();
        console.log('✅ Dados do paciente recebidos:', paciente);

        // ✅ CORREÇÃO: Garantir que o paciente está salvo em TODOS os formatos
        localStorage.setItem('pacienteSelecionadoId', paciente.id || pacienteSelecionadoId);
        localStorage.setItem('dependenteSelecionado', JSON.stringify(paciente));

        // Atualizar interface
        atualizarInterfaceDependente(paciente);

        // Carregar dados adicionais
        console.log('🔄 Carregando dados adicionais...');
        await carregarDadosAdicionais(usuarioId, paciente.id || pacienteSelecionadoId);

        console.log('✅ Todos os dados carregados com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao carregar dados do dependente:', error);
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

// Função para atualizar a interface - ATUALIZADA
function atualizarInterfaceDependente(paciente) {
    console.log('🎨 Atualizando interface para paciente:', paciente);

    // ✅ NOVO: Atualizar header primeiro
    atualizarHeaderSupervisor(paciente);

    // Elementos principais
    const elementos = {
        'dependenteNome': paciente.nome || 'Nome não informado',
        'dependenteIdade': (paciente.idade || calcularIdade(paciente.data_nascimento)) + ' anos',
        'dependenteCondicao': paciente.condicao_principal || 'Condição não informada',
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

    // Informações do cuidador
    if (paciente.cuidador_nome) {
        const cuidadorNome = document.getElementById('cuidadorNome');
        const cuidadorContato = document.getElementById('cuidadorContato');
        const cuidadorEspecializacao = document.getElementById('cuidadorEspecializacao');
        const cuidadorNomeCompleto = document.getElementById('cuidadorNomeCompleto');
        const cuidadorTelefone = document.getElementById('cuidadorTelefone');
        const cuidadorEmail = document.getElementById('cuidadorEmail');
        
        if (cuidadorNome) cuidadorNome.textContent = paciente.cuidador_nome;
        if (cuidadorContato) cuidadorContato.textContent = paciente.cuidador_telefone || 'Contato não informado';
        if (cuidadorEspecializacao) cuidadorEspecializacao.textContent = paciente.cuidador_especializacao || 'Especialização não informada';
        if (cuidadorNomeCompleto) cuidadorNomeCompleto.textContent = paciente.cuidador_nome;
        if (cuidadorTelefone) cuidadorTelefone.textContent = paciente.cuidador_telefone || '--';
        if (cuidadorEmail) cuidadorEmail.textContent = paciente.cuidador_email || '--';
    }

    // Informações do familiar
    const familiarName = document.getElementById('familiarName');
    if (familiarName && paciente.familiar_nome) {
        familiarName.textContent = paciente.familiar_nome;
    }

    // Foto do dependente
    const fotoElement = document.getElementById('dependenteFoto') || document.getElementById('patientAvatar');
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
    const ultimaAtualizacao = document.getElementById('ultimaAtualizacao');
    if (ultimaAtualizacao) {
        ultimaAtualizacao.textContent = new Date().toLocaleString('pt-BR');
    }
}

// Funções para carregar dados adicionais - MANTIDAS (já estão corretas)
async function carregarSinaisVitais(usuarioId, pacienteId) {
    try {
        console.log('💓 Carregando sinais vitais...');
        const response = await fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/sinais-vitais`);

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
        const response = await fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/medicamentos`);

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
        const response = await fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/atividades`);

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
        const response = await fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/alertas`);

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

// Funções de atualização da interface - MANTIDAS (já estão corretas)
function atualizarSinaisVitais(sinais) {
    console.log('📊 Atualizando sinais vitais na interface:', sinais);

    if (!sinais || sinais.length === 0) {
        console.log('📋 Nenhum sinal vital disponível');
        return;
    }

    sinais.forEach(sinal => {
        if (!sinal.tipo) return;

        switch (sinal.tipo.toLowerCase()) {
            case 'pressao_arterial':
                atualizarElemento('pressaoMedia', `${sinal.valor_principal || '--'}/${sinal.valor_secundario || '--'}`);
                atualizarStatus('pressaoStatus', avaliarPressao(sinal));
                break;

            case 'glicemia':
                atualizarElemento('glicemiaMedia', sinal.valor_principal || '--');
                atualizarStatus('glicemiaStatus', avaliarGlicemia(sinal));
                break;

            case 'temperatura':
                atualizarElemento('temperaturaMedia', sinal.valor_principal || '--');
                atualizarStatus('temperaturaStatus', avaliarTemperatura(sinal));
                break;

            case 'batimentos_cardiacos':
                atualizarElemento('heartRate', sinal.valor_principal || '--');
                atualizarStatus('hrStatus', avaliarBatimentos(sinal));
                break;
        }
    });

    atualizarStatusGeral(sinais);
}

function atualizarMedicamentos(medicamentos) {
    const container = document.getElementById('medicationSchedule');
    if (!container) return;

    if (!medicamentos || medicamentos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-feather="calendar"></i>
                <p>Nenhum medicamento cadastrado</p>
            </div>
        `;
        feather.replace();
        return;
    }

    container.innerHTML = medicamentos.map(med => `
        <div class="medication-item">
            <div class="medication-icon">
                <i data-feather="pill"></i>
            </div>
            <div class="medication-info">
                <h5>${med.nome_medicamento}</h5>
                <small>${med.dosagem} - ${med.horarios || 'Horário não definido'}</small>
            </div>
        </div>
    `).join('');

    feather.replace();
}

function exibirAtividades(atividades) {
    const activityFeed = document.getElementById('activityFeed');
    if (!activityFeed) return;

    if (!atividades || atividades.length === 0) {
        activityFeed.innerHTML = `
            <div class="empty-state">
                <i data-feather="clock"></i>
                <p>Nenhuma atividade recente</p>
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
                <h5>${atividade.descricao || 'Atividade'}</h5>
                <p>Por: ${atividade.cuidador_nome || 'Cuidador'}</p>
                <small class="activity-time">${formatarData(atividade.data_prevista || atividade.data_criacao)}</small>
                <span class="badge ${atividade.status === 'concluida' ? 'bg-success' : 'bg-warning'}">
                    ${atividade.status === 'concluida' ? 'Concluída' : 'Pendente'}
                </span>
            </div>
        </div>
    `).join('');

    activityFeed.innerHTML = atividadesHTML;
    feather.replace();
}

function exibirAlertas(alertas) {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) return;

    if (!alertas || alertas.length === 0) {
        alertsList.innerHTML = `
            <div class="empty-state">
                <i data-feather="bell-off"></i>
                <p>Nenhum alerta no momento</p>
            </div>
        `;
        feather.replace();
        return;
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

    alertsList.innerHTML = alertasHTML;
    feather.replace();
}

// FUNÇÃO CONFIGURAR EVENTOS - MANTIDA (já está correta)
function configurarEventos() {
    console.log('⚙️ Configurando eventos...');

    // Filtro de período
    const periodoFilter = document.getElementById('periodoFilter');
    if (periodoFilter) {
        periodoFilter.addEventListener('change', function () {
            const usuarioId = localStorage.getItem('usuarioId');
            const pacienteId = localStorage.getItem('pacienteSelecionadoId');
            if (usuarioId && pacienteId) {
                carregarAtividades(usuarioId, pacienteId);
            }
        });
    }

    // Botão de atualizar
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            carregarDadosDependente();
        });
    }

    // Links de navegação
    const links = {
        'relatoriosLink': 'relatorios_supervisor.html',
        'alertasLink': 'alertas_supervisor.html', 
        'comunicacaoLink': 'comunicacao_supervisor.html'
    };

    Object.keys(links).forEach(linkId => {
        const link = document.getElementById(linkId);
        if (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = links[linkId];
            });
        }
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.clear();
            window.location.href = "/";
        });
    }
}

// FUNÇÕES AUXILIARES - MANTIDAS (já estão corretas)
function atualizarElemento(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
}

function atualizarStatus(id, status) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.textContent = status;
        elemento.className = `badge ${obterClasseStatus(status)}`;
    }
}

function obterClasseStatus(status) {
    const statusMap = {
        'Normal': 'bg-success',
        'Estável': 'bg-success',
        'Baixa': 'bg-warning', 
        'Alta': 'bg-warning',
        'Crítico': 'bg-danger'
    };
    return statusMap[status] || 'bg-secondary';
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

function avaliarPressao(sinal) {
    const sistolica = parseInt(sinal.valor_principal);
    if (isNaN(sistolica)) return '--';
    if (sistolica < 90) return 'Baixa';
    if (sistolica > 140) return 'Alta';
    return 'Normal';
}

function avaliarGlicemia(sinal) {
    const valor = parseInt(sinal.valor_principal);
    if (isNaN(valor)) return '--';
    if (valor < 70) return 'Baixa';
    if (valor > 180) return 'Alta';
    return 'Normal';
}

function avaliarTemperatura(sinal) {
    const valor = parseFloat(sinal.valor_principal);
    if (isNaN(valor)) return '--';
    if (valor < 36) return 'Baixa';
    if (valor > 37.5) return 'Alta';
    return 'Normal';
}

function avaliarBatimentos(sinal) {
    const valor = parseInt(sinal.valor_principal);
    if (isNaN(valor)) return '--';
    if (valor < 60) return 'Baixo';
    if (valor > 100) return 'Alto';
    return 'Normal';
}

function atualizarStatusGeral(sinais) {
    const statusElement = document.getElementById('statusGeral');
    if (!statusElement) return;

    let status = 'Estável';
    let classe = 'bg-success';

    const problemas = sinais.filter(sinal => {
        const avaliacao = avaliarPressao(sinal) || avaliarGlicemia(sinal) || avaliarTemperatura(sinal);
        return avaliacao === 'Baixa' || avaliacao === 'Alta' || avaliacao === 'Baixo' || avaliacao === 'Alto';
    });

    if (problemas.length > 0) {
        status = 'Atenção';
        classe = 'bg-warning';
    }

    statusElement.textContent = status;
    statusElement.className = `badge ${classe}`;
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
    alert('❌ ' + mensagem);
}

function mostrarSucesso(mensagem) {
    console.log('✅ ' + mensagem);
    alert('✅ ' + mensagem);
}

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

// FUNÇÃO PARA SAIR DO SISTEMA (LOGOUT COMPLETO)
function sair() {
    console.log('🚪 Saindo do sistema...');
    
    // Limpar todo o localStorage
    localStorage.clear();
    
    console.log('✅ Todos os dados removidos. Redirecionando para login.');
    
    // Redirecionar para a página de login
    window.location.href = '/';
}

// Atualizar ícones periodicamente
setInterval(() => {
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}, 2000);