import { getBatchManifest } from "../utilities.js";
import { computeGrid } from "./layout_calculator.js";
import { LabelDisplayDimension } from "../objects/label_display_dimension.js";
import { PAGE_MARGIN_MM, BASE_W } from "../constants.js";
import { getDesiredCols } from '../utilities.js';
import { buildLabelNode } from "./label_renderer.js";
import { appPaperSizeManager } from "./paper_size_manager.js";

export async function previewPrintBatch(batch) {
    const manifest = getBatchManifest(batch);

    if (manifest.length === 0) {
        alert('Add at least one label to the batch before printing.');
        return;
    }

    const btn = document.getElementById('previewPrintBatchBtn');
    let oldText = '';
    if (btn) {
        btn.disabled = true;
        oldText = btn.textContent;
        btn.textContent = 'Generating PDF View…';
    }
    try {
        const { w: labelW, h: labelH } = LabelDisplayDimension.fromDefaultIDs().dimensions;
        const desiredCols = getDesiredCols();
        const { cols, rows, perPage, gap } = computeGrid(labelW, labelH, desiredCols);
        const pages = Math.ceil(manifest.length / perPage);

        // 1. Process and cache the HTML element snapshots into high-res images
        const cache = new Map();
        for (const entry of batch) {
            if (cache.has(entry.id)) continue;
            const node = buildLabelNode(entry.name, entry.rows);
            node.style.width = BASE_W + 'px';
            node.style.position = 'absolute';
            node.style.left = '-99999px';
            node.style.top = '0';
            document.body.appendChild(node);

            await new Promise(r => setTimeout(r, 30));
            const canvas = await html2canvas(node, { scale: 3, backgroundColor: '#ffffff', useCORS: true });
            document.body.removeChild(node);

            cache.set(entry.id, {
                dataUrl: canvas.toDataURL('image/png'),
                aspect: canvas.height / canvas.width
            });
        }

        // 2. Fetch the active dimensions from the singleton and map to array vector format
        const currentPaper = appPaperSizeManager.getCurrentSize();
        const pdfFormat = [currentPaper.width, currentPaper.height];

        // 3. Build the precise vector PDF container using dynamic page dimensions
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            unit: 'mm',
            format: pdfFormat,
            orientation: 'portrait'
        });

        // 4. Loop through the generated array blocks and render grid cells cleanly
        for (let p = 0; p < pages; p++) {
            // Force dynamic page size target constraints across multi-page loops
            if (p > 0) doc.addPage(pdfFormat, 'portrait');
            const startIdx = p * perPage;
            const items = manifest.slice(startIdx, startIdx + perPage);

            items.forEach((entry, i) => {
                const r = Math.floor(i / cols);
                const c = i % cols;
                const cellX = PAGE_MARGIN_MM + c * (labelW + gap);
                const cellY = PAGE_MARGIN_MM + r * (labelH + gap);

                const { dataUrl, aspect } = cache.get(entry.id);
                let drawW = labelW;
                let drawH = labelW * aspect;

                if (drawH > labelH) {
                    drawH = labelH;
                    drawW = labelH / aspect;
                }
                const offX = cellX + (labelW - drawW) / 2;
                const offY = cellY + (labelH - drawH) / 2;

                doc.addImage(dataUrl, 'PNG', offX, offY, drawW, drawH);
            });
        }

        // 5. Output the PDF directly into a fresh, standalone browser tab window
        const pdfBlob = doc.output('blob');
        const blobURL = URL.createObjectURL(pdfBlob);
        window.open(blobURL, '_blank');

    } catch (err) {
        console.error(err);
        alert('Something went wrong generating the print preview. Please try again.');
    } finally {
        // Restore button text UI settings back to normal operational state
        if (btn) {
            btn.disabled = false;
            btn.textContent = oldText;
        }
    }
}
