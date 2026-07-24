import { PAGE_MARGIN_MM, DEFAULT_GAP_MM, MIN_GAP_MM } from '../constants.js';
import { appPaperSizeManager } from './paper_size_manager.js';

export function computeGrid(labelWmm, labelHmm, desiredCols) {
    // 1. Fetch active dimensions directly from the global state singleton
    const currentPaper = appPaperSizeManager.getCurrentSize();

    // 2. Derive dynamic usable layout space boundaries
    const usableW = currentPaper.width - 2 * PAGE_MARGIN_MM;
    const usableH = currentPaper.height - 2 * PAGE_MARGIN_MM;

    let cols = Math.max(1, desiredCols);
    let gap = DEFAULT_GAP_MM;

    // Adjust gap and cols to fit the target dynamic width boundaries
    while (cols > 1 && (cols * labelWmm + (cols - 1) * gap) > usableW && gap > MIN_GAP_MM) {
        gap -= 0.5;
    }
    while (cols > 1 && (cols * labelWmm + (cols - 1) * MIN_GAP_MM) > usableW) {
        cols -= 1;
        gap = DEFAULT_GAP_MM;
        while (cols > 1 && (cols * labelWmm + (cols - 1) * gap) > usableW && gap > MIN_GAP_MM) {
            gap -= 0.5;
        }
    }

    if (cols * labelWmm > usableW) {
        cols = 1;
        gap = DEFAULT_GAP_MM;
    }

    // Calculate dynamic rows capacity relative to target canvas heights
    const rows = Math.max(1, Math.floor((usableH + gap) / (labelHmm + gap)));
    const fitOk = cols >= desiredCols;

    return { cols, rows, perPage: cols * rows, gap, fitOk };
}
