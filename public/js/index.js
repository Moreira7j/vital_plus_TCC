// Certifique-se de ter incluído no HTML:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

document.addEventListener("DOMContentLoaded", function () {
    const exportarBtn = document.getElementById("btnExportar");

    if (exportarBtn) {
        exportarBtn.addEventListener("click", function () {
            const conteudo = document.getElementById("conteudo");

            if (!conteudo) {
                alert("Não encontrei o conteúdo para exportar!");
                return;
            }

            html2canvas(conteudo, {
                scale: 2, // aumenta a qualidade
                useCORS: true // permite carregar imagens externas (se o servidor local permitir)
            }).then((canvas) => {
                const imgData = canvas.toDataURL("image/png");
                const pdf = new jspdf.jsPDF("p", "mm", "a4");

                // proporção para caber na página
                const imgWidth = 210; // largura A4 em mm
                const pageHeight = 297; // altura A4 em mm
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                let position = 0;

                if (imgHeight > pageHeight) {
                    // caso o conteúdo seja maior que 1 página
                    let heightLeft = imgHeight;

                    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;

                    while (heightLeft > 0) {
                        position = heightLeft - imgHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;
                    }
                } else {
                    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
                }

                pdf.save("relatorio.pdf");
            });
        });
    }
});
