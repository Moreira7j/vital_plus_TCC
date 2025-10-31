// Inicializar feather icons
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    
    // Inicializar gráfico de visão geral
    renderOverviewChart();
    
    // Configurar filtros
    document.getElementById('aplicarFiltros').addEventListener('click', aplicarFiltros);
    
    // Configurar botão de alternar visualização
    document.getElementById('toggleView').addEventListener('click', toggleView);
    
    // Configurar datas padrão para os filtros
    setupDefaultDates();
});

// Função para renderizar o gráfico de visão geral
function renderOverviewChart() {
    const ctx = document.getElementById('overviewChart').getContext('2d');
    
    // Destruir gráfico existente se houver
    if (window.overviewChartInstance) {
        window.overviewChartInstance.destroy();
    }
    
    window.overviewChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Adesão a Medicação (%)',
                data: [75, 78, 82, 80, 85, 78, 90],
                backgroundColor: 'rgba(0, 181, 194, 0.1)',
                borderColor: 'rgba(0, 181, 194, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }, {
                label: 'Atividade Física (min)',
                data: [30, 45, 35, 50, 40, 20, 60],
                backgroundColor: 'rgba(243, 156, 18, 0.1)',
                borderColor: 'rgba(243, 156, 18, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            }
        }
    });
}

// Função para aplicar filtros
function aplicarFiltros() {
    const periodo = document.getElementById('filtroPeriodo').value;
    const categoria = document.getElementById('filtroCategoria').value;
    const dataInicio = document.getElementById('filtroDataInicio').value;
    const dataFim = document.getElementById('filtroDataFim').value;
    
    // Simular carregamento de dados filtrados
    console.log('Aplicando filtros:', { periodo, categoria, dataInicio, dataFim });
    
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
        
        // Atualizar dados (em uma aplicação real, buscaria novos dados da API)
        updateDataWithFilters(periodo, categoria, dataInicio, dataFim);
    }, 1500);
}

// Função para atualizar dados com filtros
function updateDataWithFilters(periodo, categoria, dataInicio, dataFim) {
    // Em uma aplicação real, aqui seria feita uma requisição para buscar dados filtrados
    console.log('Atualizando dados com filtros:', { periodo, categoria, dataInicio, dataFim });
    
    // Atualizar o gráfico com novos dados (simulado)
    if (window.overviewChartInstance) {
        // Gerar dados aleatórios baseados no período
        const newData = Array(7).fill(0).map(() => Math.floor(Math.random() * 30) + 70);
        window.overviewChartInstance.data.datasets[0].data = newData;
        window.overviewChartInstance.update();
    }
}

// Função para alternar visualização
function toggleView() {
    const btn = document.getElementById('toggleView');
    const icon = btn.querySelector('i');
    
    // Alternar entre visualização de lista e gráfico
    if (icon.getAttribute('data-feather') === 'list') {
        // Mudar para visualização de gráfico
        btn.innerHTML = '<i data-feather="bar-chart-2"></i> Alternar Visualização';
        // Aqui você implementaria a lógica para mostrar gráficos
        showNotification('Visualização de gráfico ativada', 'info');
    } else {
        // Mudar para visualização de lista
        btn.innerHTML = '<i data-feather="list"></i> Alternar Visualização';
        // Aqui você implementaria a lógica para mostrar lista
        showNotification('Visualização de lista ativada', 'info');
    }
    
    feather.replace();
}

// Função para configurar datas padrão
function setupDefaultDates() {
    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);
    
    // Formatar datas para input type="date"
    const formatarData = (data) => {
        return data.toISOString().split('T')[0];
    };
    
    document.getElementById('filtroDataInicio').value = formatarData(trintaDiasAtras);
    document.getElementById('filtroDataFim').value = formatarData(hoje);
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