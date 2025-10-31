// Inicializar feather icons
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    
    // Configurar filtros
    document.getElementById('aplicarFiltros').addEventListener('click', aplicarFiltros);
    
    // Configurar modal
    const modal = document.getElementById('alertaModal');
    const novoAlertaBtn = document.getElementById('novoAlertaBtn');
    const fecharModal = document.getElementById('fecharModal');
    const cancelarBtn = document.getElementById('cancelarBtn');
    
    novoAlertaBtn.addEventListener('click', function() {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });
    
    function fecharModalFn() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    fecharModal.addEventListener('click', fecharModalFn);
    cancelarBtn.addEventListener('click', fecharModalFn);
    
    // Fechar modal ao clicar fora dele
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            fecharModalFn();
        }
    });
    
    // Configurar formulário
    document.getElementById('alertaForm').addEventListener('submit', function(e) {
        e.preventDefault();
        criarAlerta();
    });
    
    // Inicializar gráfico de distribuição
    renderAlertasChart();
});

// Função para aplicar filtros
function aplicarFiltros() {
    const status = document.getElementById('filtroStatus').value;
    const prioridade = document.getElementById('filtroPrioridade').value;
    const data = document.getElementById('filtroData').value;
    const busca = document.getElementById('filtroBusca').value;
    
    // Mostrar loading
    const btn = document.getElementById('aplicarFiltros');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-feather="loader" class="spinner"></i> Aplicando...';
    feather.replace();
    
    // Simular uma requisição assíncrona
    setTimeout(() => {
        // Restaurar botão
        btn.innerHTML = originalText;
        feather.replace();
        
        // Mostrar mensagem de sucesso
        showNotification('Filtros aplicados com sucesso!', 'success');
        
        // Filtrar alertas (em uma aplicação real, buscaria novos dados da API)
        filtrarAlertas(status, prioridade, data, busca);
    }, 1500);
}

// Função para filtrar alertas
function filtrarAlertas(status, prioridade, data, busca) {
    const alertas = document.querySelectorAll('.alerta-card');
    
    alertas.forEach(alerta => {
        let exibir = true;
        
        // Filtrar por status
        if (status !== 'todos') {
            const isResolvido = alerta.classList.contains('resolvido');
            if ((status === 'ativo' && isResolvido) || (status === 'resolvido' && !isResolvido)) {
                exibir = false;
            }
        }
        
        // Filtrar por prioridade
        if (prioridade !== 'todos') {
            const hasPriority = alerta.classList.contains(prioridade);
            if (!hasPriority) {
                exibir = false;
            }
        }
        
        // Filtrar por busca (simplificado)
        if (busca) {
            const texto = alerta.textContent.toLowerCase();
            if (!texto.includes(busca.toLowerCase())) {
                exibir = false;
            }
        }
        
        // Aplicar filtro
        alerta.style.display = exibir ? 'block' : 'none';
    });
}

// Função para criar novo alerta
function criarAlerta() {
    const titulo = document.getElementById('alertaTitulo').value;
    const descricao = document.getElementById('alertaDescricao').value;
    const prioridade = document.getElementById('alertaPrioridade').value;
    const dependente = document.getElementById('alertaDependente').value;
    const data = document.getElementById('alertaData').value;
    
    // Validar campos
    if (!titulo || !descricao) {
        showNotification('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    // Simular criação do alerta
    showNotification('Alerta criado com sucesso!', 'success');
    
    // Fechar modal
    document.getElementById('fecharModal').click();
    
    // Limpar formulário
    document.getElementById('alertaForm').reset();
}

// Função para renderizar gráfico de distribuição
function renderAlertasChart() {
    const ctx = document.getElementById('alertasChart').getContext('2d');
    
    // Dados de exemplo
    const data = {
        labels: ['Medicação', 'Sinais Vitais', 'Consultas', 'Alimentação', 'Atividade'],
        datasets: [{
            data: [45, 25, 15, 10, 5],
            backgroundColor: [
                'rgba(0, 181, 194, 0.8)',
                'rgba(231, 76, 60, 0.8)',
                'rgba(243, 156, 18, 0.8)',
                'rgba(39, 174, 96, 0.8)',
                'rgba(52, 152, 219, 0.8)'
            ],
            borderWidth: 1
        }]
    };
    
    // Opções do gráfico
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20
                }
            }
        }
    };
    
    // Criar gráfico
    new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: options
    });
}

// Função para mostrar notificações
function showNotification(mensagem, tipo = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${tipo}`;
    notification.innerHTML = `
        <i data-feather="${getIconByType(tipo)}"></i>
        <span>${mensagem}</span>
    `;
    
    // Adicionar estilos
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 10000;
        border-left: 4px solid ${getColorByType(tipo)};
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    feather.replace();
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Função auxiliar para obter ícone pelo tipo
function getIconByType(tipo) {
    const icons = {
        'success': 'check-circle',
        'error': 'alert-circle',
        'warning': 'alert-triangle',
        'info': 'info'
    };
    return icons[tipo] || 'info';
}

// Função auxiliar para obter cor pelo tipo
function getColorByType(tipo) {
    const colors = {
        'success': '#27ae60',
        'error': '#e74c3c',
        'warning': '#f39c12',
        'info': '#3498db'
    };
    return colors[tipo] || '#3498db';
}

// Adicionar estilos de animação para notificações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .spinner {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);