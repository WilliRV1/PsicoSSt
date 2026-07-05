import { ScoredResult, Report, Assessment, Worker, Psychologist } from '@/generated/prisma';

interface ReportData {
  assessment: Assessment & { worker: Worker; psychologist: Psychologist };
  scoredResult: ScoredResult;
  report: Report;
  signatureImage?: string; // Base64 image
}

/**
 * Generate HTML content for a psychosocial report
 */
export function generateReportHTML(data: ReportData): string {
  const { assessment, scoredResult, report, signatureImage } = data;
  const { worker, psychologist } = assessment;

  // Extract scores from JSONB
  const totalScores = scoredResult.totalScores as any;
  const dimensionScores = scoredResult.dimensionScores as any;
  const reportDataContent = report.reportData as any;

  const recommendationsAI = report.recommendationsAI || '';
  const overallRiskCategory = scoredResult.overallRiskCategory;

  // Format date
  const dateFormatter = new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const reportDate = dateFormatter.format(new Date());
  const assessmentDate = dateFormatter.format(new Date(assessment.assessmentDate));
  const signedDate = report.signedAt
    ? dateFormatter.format(new Date(report.signedAt))
    : reportDate;

  const submittedTime = new Date(assessment.createdAt).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Informe Psicosocial</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          color: #212121;
          line-height: 1.6;
          background: white;
        }
        .page {
          width: 100%;
          max-width: 8.5in;
          height: 11in;
          padding: 0.5in;
          margin: 0 auto;
          background: white;
          page-break-after: always;
        }
        .header {
          border-bottom: 3px solid #0051BA;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .header-title {
          color: #0051BA;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .header-subtitle {
          color: #666666;
          font-size: 12px;
          margin-bottom: 10px;
        }
        .header-info {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #666666;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          background: #F5F5F5;
          color: #0051BA;
          padding: 8px 10px;
          font-weight: bold;
          font-size: 13px;
          margin-bottom: 10px;
          border-left: 4px solid #0051BA;
        }
        .section-content {
          font-size: 11px;
          line-height: 1.5;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }
        .info-item {
          font-size: 11px;
        }
        .info-label {
          font-weight: bold;
          color: #0051BA;
        }
        .info-value {
          color: #212121;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 10px;
        }
        th {
          background: #1E88E5;
          color: white;
          padding: 6px;
          text-align: left;
          font-weight: bold;
        }
        td {
          padding: 6px;
          border-bottom: 1px solid #E8E8E8;
        }
        tr:nth-child(even) {
          background: #F5F5F5;
        }
        .risk-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 3px;
          font-weight: bold;
          font-size: 10px;
          text-align: center;
          min-width: 80px;
        }
        .risk-sin-riesgo {
          background: #C8E6C9;
          color: #2E7D32;
        }
        .risk-bajo {
          background: #A5D6A7;
          color: #1B5E20;
        }
        .risk-medio {
          background: #FFE082;
          color: #F57F17;
        }
        .risk-alto {
          background: #FFAB91;
          color: #D84315;
        }
        .risk-muy-alto {
          background: #EF9A9A;
          color: #C62828;
        }
        .signature-section {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          min-height: 80px;
        }
        .signature-block {
          text-align: center;
          flex: 1;
        }
        .signature-image {
          max-height: 60px;
          margin-bottom: 5px;
        }
        .signature-line {
          border-top: 1px solid #212121;
          width: 100%;
          margin-bottom: 5px;
        }
        .signature-name {
          font-size: 10px;
          font-weight: bold;
        }
        .signature-title {
          font-size: 9px;
          color: #666666;
        }
        .footer {
          border-top: 1px solid #E8E8E8;
          margin-top: 20px;
          padding-top: 10px;
          font-size: 9px;
          color: #999999;
          text-align: center;
        }
        .risk-summary {
          background: #F5F5F5;
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <!-- HEADER -->
        <div class="header">
          <div class="header-title">INFORME DE EVALUACIÓN PSICOSOCIAL</div>
          <div class="header-subtitle">Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial</div>
          <div class="header-info">
            <span>Fecha de Aplicación: ${assessmentDate}</span>
            <span>Fecha de Elaboración: ${reportDate}</span>
            <span>Hora de Digitación: ${submittedTime}</span>
          </div>
        </div>

        <!-- INFORMACIÓN DEL TRABAJADOR -->
        <div class="section">
          <div class="section-title">DATOS DEMOGRÁFICOS Y OCUPACIONALES</div>
          <div class="section-content">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Nombre:</span>
                <span class="info-value">${worker.fullName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Documento:</span>
                <span class="info-value">${worker.documentType} ${worker.documentId}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Edad:</span>
                <span class="info-value">${worker.birthYear ? (new Date().getFullYear() - worker.birthYear) + ' años' : 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Sexo:</span>
                <span class="info-value">${worker.gender || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Cargo:</span>
                <span class="info-value">${worker.jobTitle || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Departamento/Área:</span>
                <span class="info-value">${worker.departmentArea || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Organización:</span>
                <span class="info-value">${(assessment as any).organization?.name || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- INFORMACIÓN DEL EVALUADOR -->
        <div class="section">
          <div class="section-title">EVALUADOR</div>
          <div class="section-content">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Nombre Completo:</span>
                <span class="info-value">${psychologist.fullName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Tarjeta Profesional:</span>
                <span class="info-value">${psychologist.professionalCard || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Licencia SST:</span>
                <span class="info-value">${psychologist.sstCredential || psychologist.licenseNumber}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Fecha Expedición SST:</span>
                <span class="info-value">${(psychologist as any).sstLicenseDate ? new Date((psychologist as any).sstLicenseDate).toLocaleDateString('es-CO') : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RESULTADOS -->
        <div class="section">
          <div class="section-title">RESULTADOS GENERALES</div>
          <div class="section-content">
            <div class="risk-summary">
              <strong>Categoría de Riesgo General:</strong>
              <div style="margin-top: 5px;">
                <span class="risk-badge risk-${overallRiskCategory.toLowerCase()}">
                  ${overallRiskCategory.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            ${
              totalScores && totalScores.overall
                ? `
              <table>
                <thead>
                  <tr>
                    <th>Dimensión</th>
                    <th>Puntaje (0-100)</th>
                    <th>Categoría</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    Object.entries(totalScores.overall || {})
                      .map(
                        ([key, value]: [string, any]) => `
                    <tr>
                      <td>${key.replace(/_/g, ' ')}</td>
                      <td>${typeof value === 'object' ? (typeof value.score === 'number' ? value.score.toFixed(1) : 0) : value}</td>
                      <td>${typeof value === 'object' ? value.riskCategory || '' : ''}</td>
                    </tr>
                  `
                      )
                      .join('')
                  }
                </tbody>
              </table>
            `
                : ''
            }
          </div>
        </div>

        <!-- RECOMENDACIONES Y PRÓXIMOS PASOS -->
        <div class="section">
          <div class="section-title">RECOMENDACIONES Y PRÓXIMOS PASOS</div>
          <div class="section-content">
            ${
              recommendationsAI
                ? `<div style="background: #E3F2FD; padding: 8px; border-radius: 4px; border-left: 3px solid #0051BA; margin-bottom: 10px;">
                  ${recommendationsAI.replace(/\n/g, '<br>')}
                </div>`
                : '<p><em>Generadas por evaluador / Por generar con IA</em></p>'
            }
          </div>
        </div>

        <!-- FIRMA DIGITAL -->
        <div class="signature-section">
          <div class="signature-block">
            ${
              signatureImage
                ? `<img src="${signatureImage}" alt="Firma" class="signature-image" />`
                : '<div class="signature-line"></div>'
            }
            <div class="signature-name">${psychologist.fullName}</div>
            <div class="signature-title">T.P. ${psychologist.professionalCard || 'N/A'}</div>
            <div class="signature-title">Licencia SST: ${psychologist.sstCredential || psychologist.licenseNumber}</div>
            ${(psychologist as any).sstLicenseDate ? `<div class="signature-title">Fecha Exp: ${new Date((psychologist as any).sstLicenseDate).toLocaleDateString('es-CO')}</div>` : ''}
          </div>
        </div>

        <!-- FOOTER -->
        <div class="footer">
          <p>La información contenida en este informe está sometida a reserva legal según la Ley 1090 de 2006 y la Resolución 2346 de 2007.</p>
          <p>Generado por PsicoSST • ${new Date().toLocaleDateString('es-CO')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate PDF from HTML using html2pdf
 * Note: This requires html2pdf.js library in the browser
 */
export function exportReportToPDF(html: string, filename: string = 'informe_psicosocial.pdf') {
  // This function should be called from the client side
  // It will trigger html2pdf in the browser
  return html; // Return HTML for client-side processing
}
