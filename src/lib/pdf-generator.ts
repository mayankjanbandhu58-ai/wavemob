import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { SimulatedReport } from "@/lib/dataset";

export function generateReportPdf(report: SimulatedReport, imageBase64?: string): Blob {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    const margin = 16;
    const contentW = w - margin * 2;
    let y = 18;

    const olive: [number, number, number] = [99, 107, 47];
    const darkText: [number, number, number] = [26, 26, 26];
    const gray: [number, number, number] = [120, 120, 120];

    // ═══ Header bar ═══
    doc.setFillColor(...olive);
    doc.rect(0, 0, w, 28, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("WAVELENGTH AI", margin, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Chest X-Ray AI Analysis Report", margin, 18);
    doc.setFontSize(8);
    doc.text(`Report ID: ${report.reportId}`, w - margin, 12, { align: "right" });
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, w - margin, 18, { align: "right" });
    y = 36;

    // ═══ Patient Information (Table) ═══
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...olive);
    doc.text("PATIENT DEMOGRAPHICS", margin, y);
    y += 4;

    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Name", "Age", "Gender", "Smoking History", "Symptoms"]],
        body: [[
            report.patientData.name || "Anonymous",
            report.patientData.age ? `${report.patientData.age} yr` : "—",
            report.patientData.gender || "—",
            report.patientData.smoking_history || "Never",
            report.patientData.symptoms || "None reported"
        ]],
        theme: "grid",
        headStyles: { fillColor: olive, textColor: 255, fontStyle: "bold", fontSize: 8 },
        bodyStyles: { textColor: darkText, fontSize: 9 },
        styles: { cellPadding: 4 }
    });

    y = (doc as any).lastAutoTable.finalY + 12;

    // ═══ Risk Assessment (Table) ═══
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...olive);
    doc.text("AI RISK ASSESSMENT", margin, y);
    y += 4;

    const riskColor: [number, number, number] = report.riskLevel === "High Suspicion" ? [220, 38, 38] : report.riskLevel === "Moderate Risk" ? [217, 119, 6] : [5, 150, 105];

    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Primary Finding Risk Level", "Model Confidence", "Inference Time", "Top Detected Pathology"]],
        body: [[
            report.riskLevel,
            `${report.confidenceScore.toFixed(1)}%`,
            `${(report.inferenceTimeMs / 1000).toFixed(2)}s`,
            report.topDisease
        ]],
        theme: "grid",
        headStyles: { fillColor: [247, 247, 243], textColor: olive, fontStyle: "bold", fontSize: 8, lineWidth: 0.1, lineColor: [220, 220, 210] },
        bodyStyles: { textColor: darkText, fontSize: 10, fontStyle: "bold" },
        columnStyles: { 0: { textColor: riskColor } },
        styles: { cellPadding: 5 }
    });

    y = (doc as any).lastAutoTable.finalY + 14;

    // ═══ Pathology Findings (Table) ═══
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...olive);
    doc.text("PATHOLOGY FINDINGS DETAIL", margin, y);
    y += 4;

    const tableBody = report.diseases.map(d => [
        d.disease,
        d.icd10,
        `${(d.probability * 100).toFixed(1)}%`,
        d.isUncertain ? "Uncertain (Borderline)" : "Definitive Calculation"
    ]);

    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Pathology / Disease", "ICD-10 Code", "Calculated Probability", "Analysis Status"]],
        body: tableBody,
        theme: "striped",
        headStyles: { fillColor: [238, 240, 224], textColor: olive, fontStyle: "bold", fontSize: 8 },
        bodyStyles: { textColor: darkText, fontSize: 8 },
        alternateRowStyles: { fillColor: [252, 252, 250] },
        styles: { cellPadding: 4 }
    });

    y = (doc as any).lastAutoTable.finalY + 14;

    // ═══ Clinical Guideline ═══
    if (y > 240) { doc.addPage(); y = 18; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...olive);
    doc.text("RECOMMENDED CLINICAL NEXT STEP", margin, y);
    y += 4;

    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        body: [[report.clinicalGuideline]],
        theme: "plain",
        bodyStyles: { fillColor: [238, 240, 224], textColor: [42, 48, 16], fontSize: 9, fontStyle: "bold" },
        styles: { cellPadding: 6, lineColor: [197, 204, 154], lineWidth: 0.5 }
    });

    y = (doc as any).lastAutoTable.finalY + 14;

    // ═══ AI Clinical Summary ═══
    if (y > 220) { doc.addPage(); y = 18; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...olive);
    doc.text("AI CLINICAL SYNTHESIS", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...darkText);
    const narrativeLines = doc.splitTextToSize(report.aiSummaryClinical.replace(/## /g, "").replace(/\*\*/g, ""), contentW);
    narrativeLines.forEach((line: string) => {
        if (y > 275) { doc.addPage(); y = 18; }
        doc.text(line, margin, y);
        y += 5;
    });
    y += 10;

    // ═══ Patient Summary ═══
    if (y > 220) { doc.addPage(); y = 18; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...olive);
    doc.text("PATIENT-FRIENDLY SUMMARY", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...darkText);
    const patientLines = doc.splitTextToSize(report.aiSummaryPatient.replace(/## /g, "").replace(/\*\*/g, ""), contentW);
    patientLines.forEach((line: string) => {
        if (y > 275) { doc.addPage(); y = 18; }
        doc.text(line, margin, y);
        y += 5;
    });

    // ═══ Original Radiograph (Appended Page) ═══
    if (imageBase64) {
        doc.addPage();
        y = 18;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...olive);
        doc.text("ORIGINAL SCANNED RADIOGRAPH", margin, y);
        y += 10;

        try {
            const imgSize = 140;
            const imgX = (w - imgSize) / 2;
            doc.setFillColor(0, 0, 0);
            doc.rect(imgX - 2, y - 2, imgSize + 4, imgSize + 4, "F");

            // Guaranteed to work signature for Data URIs
            doc.addImage({
                imageData: imageBase64,
                x: imgX,
                y: y,
                width: imgSize,
                height: imgSize,
                format: "JPEG"
            });
        } catch (e) {
            console.warn("Failed to add image to PDF", e);
        }
    }

    // ═══ Footer on every page ═══
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        const pageH = doc.internal.pageSize.getHeight();
        doc.setDrawColor(220, 220, 210);
        doc.line(margin, pageH - 14, w - margin, pageH - 14);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...gray);
        doc.text("Wavelength AI — Clinical Decision Support Only. All findings require physician verification.", margin, pageH - 9);
        doc.text(`Page ${p} of ${pageCount}`, w - margin, pageH - 9, { align: "right" });
    }

    return doc.output("blob");
}
