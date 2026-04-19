import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MGA",
    maximumFractionDigits: 0,
  }).format(amount);
};

const renderFacturePage = (doc, facture, entrepriseName = "Entreprise") => {
  if (!facture) {
    throw new Error("Facture introuvable pour l'export PDF.");
  }

  const produitLivre =
    facture?.livraison?.proforma?.demande?.produit ||
    facture?.livraison?.proforma?.demande?.produitNom ||
    facture?.livraison?.proforma?.produit ||
    facture?.produit ||
    "-";
  const quantiteLivree =
    facture?.livraison?.proforma?.demande?.quantite ??
    facture?.livraison?.quantite ??
    facture?.quantite ??
    1;

  const livraisonsReference = facture?.livraison?.reference || facture?.livraison?.id || "-";

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const bodyFontSize = 10;
  const sectionFontSize = 10;

  const primary = [22, 74, 108];
  const accent = [18, 183, 206];
  const accent2 = [245, 158, 11];
  const text = [33, 37, 41];
  const light = [248, 250, 252];
  const soft = [235, 244, 248];

  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 38, "F");
  doc.setFillColor(...accent);
  doc.circle(pageWidth - 18, 19, 10, "F");
  doc.setFillColor(...accent2);
  doc.circle(pageWidth - 32, 12, 4, "F");
  doc.circle(pageWidth - 40, 26, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("FACTURE", 14, 16);
  doc.setFontSize(bodyFontSize);
  doc.setFont("helvetica", "normal");
  doc.text(`Export genere automatiquement le ${formatDateTime(new Date())}`, 14, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(bodyFontSize);
  doc.text(entrepriseName, pageWidth - 14, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(bodyFontSize);
  doc.text("Document comptable professionnel", pageWidth - 14, 20, { align: "right" });

  doc.setTextColor(...text);

  const topY = 48;
  const boxWidth = (pageWidth - 42) / 2;

  const drawInfoBox = (x, y, title, lines, boxHeight = 38) => {
    doc.setDrawColor(220, 226, 232);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, boxWidth, boxHeight, 4, 4, "FD");
    doc.setFillColor(...soft);
    doc.roundedRect(x + 1.5, y + 1.5, boxWidth - 3, 8, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(sectionFontSize);
    doc.setTextColor(...primary);
    doc.text(title, x + 4, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(bodyFontSize);
    doc.setTextColor(...text);
    lines.forEach((line, index) => {
      const wrapped = doc.splitTextToSize(line, boxWidth - 8);
      doc.text(wrapped, x + 4, y + 14 + index * 5);
    });
  };

  drawInfoBox(14, topY, "Informations facture", [
    `Reference: ${facture.reference || "-"}`,
    `Statut: ${facture.statut || "-"}`,
    `Date facture: ${formatDateTime(facture.dateFacture)}`,
  ]);

  drawInfoBox(14 + boxWidth + 14, topY, "Client & livraison", [
    `Client: ${facture.client?.nom || "-"}`,
    `Livraison: ${livraisonsReference}`,
    `Produit livre: ${produitLivre}`,
    `Quantite livree: ${quantiteLivree}`,
    `Echeance: ${formatDate(facture.dateEcheance)}`,
  ], 52);

  autoTable(doc, {
    startY: 108,
    head: [["Designation", "Reference", "Quantite", "PU", "Total"]],
    body: [[
      produitLivre,
      livraisonsReference,
      String(quantiteLivree),
      formatCurrency(facture.montantHt),
      formatCurrency(facture.montantTtc),
    ]],
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: bodyFontSize,
      cellPadding: 3,
      textColor: text,
      lineColor: [220, 226, 232],
    },
    headStyles: {
      fillColor: primary,
      textColor: 255,
      halign: "center",
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 54 },
      1: { cellWidth: 32 },
      2: { halign: "center", cellWidth: 18 },
      3: { halign: "right", cellWidth: 39 },
      4: { halign: "right", cellWidth: 39 },
    },
    margin: { left: 14, right: 14 },
  });

  const totalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : 122;
  const summaryX = 14;
  const summaryY = totalY;
  const summaryWidth = pageWidth - 28;
  const summaryHeight = 30;

  doc.setFillColor(...light);
  doc.roundedRect(summaryX, summaryY, summaryWidth, summaryHeight, 5, 5, "F");
  doc.setDrawColor(220, 226, 232);
  doc.roundedRect(summaryX, summaryY, summaryWidth, summaryHeight, 5, 5, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(sectionFontSize);
  doc.setTextColor(...primary);
  doc.text("Synthese montant", summaryX + 4, summaryY + 8);
  doc.setFontSize(bodyFontSize);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...text);
  doc.text(`HT: ${formatCurrency(facture.montantHt)}`, summaryX + 4, summaryY + 16);
  doc.text(`TVA: ${formatCurrency(facture.tva)}`, summaryX + 60, summaryY + 16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primary);
  doc.text(`TTC: ${formatCurrency(facture.montantTtc)}`, summaryX + 120, summaryY + 16);

  doc.setTextColor(90, 96, 105);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(bodyFontSize);
  doc.text(
    `Produit: ${produitLivre} | Quantite: ${quantiteLivree}`,
    summaryX + 4,
    summaryY + 24
  );

  doc.setDrawColor(...accent);
  doc.setLineWidth(0.4);
  doc.line(14, pageHeight - 24, pageWidth - 14, pageHeight - 24);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(bodyFontSize);
  doc.setTextColor(90, 96, 105);
  doc.text(
    "CRM ERP - Facture exportee automatiquement depuis le workflow livraison -> facture",
    pageWidth / 2,
    pageHeight - 16,
    { align: "center" }
  );

};

export const generateFacturePdf = (facture, entrepriseName = "Entreprise") => {
  const doc = new jsPDF("p", "mm", "a4");
  renderFacturePage(doc, facture, entrepriseName);

  const safeName = String(facture?.reference || `facture-${facture?.id || "export"}`)
    .replace(/[^a-z0-9\-_.]+/gi, "_")
    .toLowerCase();
  doc.save(`${safeName}.pdf`);
};

export const generateFactureLotPdf = (factures, entrepriseName = "Entreprise", lotLabel = "lot") => {
  const facturesList = Array.isArray(factures) ? factures.filter(Boolean) : [];
  if (facturesList.length === 0) {
    throw new Error("Aucune facture disponible pour l'export PDF du lot.");
  }

  const doc = new jsPDF("p", "mm", "a4");
  facturesList.forEach((facture, index) => {
    if (index > 0) {
      doc.addPage();
    }
    renderFacturePage(doc, facture, entrepriseName);
  });

  const safeLot = String(lotLabel || "lot")
    .replace(/[^a-z0-9\-_.]+/gi, "_")
    .toLowerCase();
  doc.save(`factures-lot-${safeLot}.pdf`);
};
