// Inicializar feather icons
feather.replace();

// Configuração inicial dos gráficos
document.addEventListener('DOMContentLoaded', function() {
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  // ====== Gráfico de Medicamentos ======
  const medicamentosCtx = document.getElementById('medicamentosChart').getContext('2d');
  new Chart(medicamentosCtx, {
    type: 'bar',
    data: {
      labels: dias,
      datasets: [{
        label: 'Taxa de Adesão (%)',
        data: [85, 90, 78, 92, 88, 95, 75],
        backgroundColor: 'rgba(0, 181, 194, 0.7)',
        borderColor: '#00B5C2',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });

  // ====== Gráfico de Alimentação ======
  const alimentacaoCtx = document.getElementById('alimentacaoChart').getContext('2d');
  new Chart(alimentacaoCtx, {
    type: 'doughnut',
    data: {
      labels: ['Balanceada', 'Parcial', 'Não Balanceada'],
      datasets: [{
        data: [72, 18, 10],
        backgroundColor: [
          'rgba(32, 201, 151, 0.7)',
          'rgba(255, 184, 77, 0.7)',
          'rgba(230, 57, 70, 0.7)'
        ],
        borderColor: ['#20C997','#FFB84D','#E63946'],
        borderWidth: 1
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // ====== Gráfico de Atividade Física ======
  const atividadeCtx = document.getElementById('atividadeChart').getContext('2d');
  new Chart(atividadeCtx, {
    type: 'line',
    data: {
      labels: dias,
      datasets: [{
        label: 'Minutos de Atividade',
        data: [30, 45, 60, 35, 50, 40, 55],
        backgroundColor: 'rgba(75, 0, 130, 0.1)',
        borderColor: '#4B0082',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
  });

  // ====== Gráfico de Qualidade de Sono ======
  const sonoCtx = document.getElementById('sonoChart').getContext('2d');
  new Chart(sonoCtx, {
    type: 'bar',
    data: {
      labels: dias,
      datasets: [{
        label: 'Horas de Sono',
        data: [6.5, 7, 6, 6.5, 7.5, 8, 6],
        backgroundColor: 'rgba(0, 181, 194, 0.5)',
        borderColor: '#00B5C2',
        borderWidth: 1
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
  });

  // ====== Gráfico de Evolução Geral ======
  const evolucaoCtx = document.getElementById('evolucaoChart').getContext('2d');
  new Chart(evolucaoCtx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [{
        label: 'Evolução Geral',
        data: [60, 65, 70, 72, 78, 82],
        backgroundColor: 'rgba(32, 201, 151, 0.1)',
        borderColor: '#20C997',
        borderWidth: 3,
        tension: 0.2,
        fill: true
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // ====== Gráfico Comparativo ======
  const comparativoCtx = document.getElementById('comparativoChart').getContext('2d');
  new Chart(comparativoCtx, {
    type: 'radar',
    data: {
      labels: ['Medicamentos', 'Alimentação', 'Atividade Física', 'Sono', 'Bem-estar'],
      datasets: [
        { label: 'Mês Atual', data: [89, 72, 75, 68, 80], backgroundColor: 'rgba(0, 181, 194, 0.2)', borderColor: '#00B5C2', borderWidth: 2, pointBackgroundColor: '#00B5C2' },
        { label: 'Mês Anterior', data: [75, 65, 60, 62, 70], backgroundColor: 'rgba(75, 0, 130, 0.2)', borderColor: '#4B0082', borderWidth: 2, pointBackgroundColor: '#4B0082' }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { r: { beginAtZero: true, max: 100 } } }
  });

  // ====== Configuração inicial dos filtros ======
  const hoje = new Date();
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(hoje.getDate() - 30);
  document.getElementById('data-inicio').value = trintaDiasAtras.toISOString().split('T')[0];
  document.getElementById('data-fim').value = hoje.toISOString().split('T')[0];

  document.getElementById('aplicar-filtros').addEventListener('click', aplicarFiltros);

  document.querySelectorAll('.export-option').forEach(option => {
    option.addEventListener('click', function(e) {
      e.preventDefault();
      const tipoRelatorio = this.getAttribute('data-type');
      exportarRelatorio(tipoRelatorio);
    });
  });
});

// ====== Função para aplicar filtros ======
function aplicarFiltros() {
  const periodo = document.getElementById('periodo').value;
  const categoria = document.getElementById('categoria').value;
  const dataInicio = document.getElementById('data-inicio').value;
  const dataFim = document.getElementById('data-fim').value;

  const btn = document.getElementById('aplicar-filtros');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<div class="spinner"></div> Aplicando...';

  setTimeout(() => {
    btn.innerHTML = originalText;
    alert('Filtros aplicados com sucesso!');
    console.log('Filtros aplicados:', { periodo, categoria, dataInicio, dataFim });
  }, 1500);
}

// ====== Função para exportar relatório com spinner ======
async function exportarRelatorio(tipo) {
  const { jsPDF } = window.jspdf;
  const btn = document.querySelector('.dropdown button');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<div class="spinner"></div> Exportando...';

  try {
    const pdf = new jsPDF('l', 'mm', 'a4');
    pdf.setFontSize(22);
    pdf.setTextColor(0, 181, 194);
    pdf.text('Relatório Vital+', pdf.internal.pageSize.width / 2, 20, { align: 'center' });

    let tituloRelatorio = '';
    switch(tipo){
      case 'medicamentos': tituloRelatorio='Uso de Medicamentos'; break;
      case 'alimentacao': tituloRelatorio='Alimentação'; break;
      case 'atividade': tituloRelatorio='Atividade Física'; break;
      case 'sono': tituloRelatorio='Qualidade de Sono'; break;
      case 'geral': tituloRelatorio='Melhora em Geral'; break;
      case 'todos': tituloRelatorio='Todos os Relatórios'; break;
    }

    pdf.setFontSize(16);
    pdf.setTextColor(45,45,45);
    pdf.text(tituloRelatorio, pdf.internal.pageSize.width/2,35,{align:'center'});
    pdf.setFontSize(12);
    pdf.setTextColor(108,117,125);
    pdf.text(`Gerado em: ${new Date().toLocaleDateString()}`, pdf.internal.pageSize.width/2,45,{align:'center'});

    // Capturar gráfico
    let chartCanvas;
    if(tipo!=='todos'){
      chartCanvas = document.getElementById(`${tipo}Chart`);
    } else {
      chartCanvas = document.querySelector('.charts-container');
    }

    if(chartCanvas){
      const chartImage = await html2canvas(chartCanvas);
      const imgData = chartImage.toDataURL('image/png');
      const imgWidth = tipo==='todos'? pdf.internal.pageSize.width-40 : 120;
      const imgHeight = (chartImage.height*imgWidth)/chartImage.width;
      pdf.addImage(imgData,'PNG',20,60,imgWidth,imgHeight);
    }

    pdf.save(`relatorio_${tipo}_${new Date().toISOString().slice(0,10)}.pdf`);
    alert(`Relatório de ${tituloRelatorio} exportado com sucesso!`);

  } catch(error){
    console.error('Erro ao exportar relatório:',error);
    alert('Ocorreu um erro ao exportar o relatório.');
  } finally {
    btn.innerHTML = originalText;
  }
}
