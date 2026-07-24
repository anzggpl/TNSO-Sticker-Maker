import {A4_W_MM, A4_H_MM, PAGE_MARGIN_MM, DEFAULT_GAP_MM, MIN_GAP_MM} from '../constants.js';

export function computeGrid(labelWmm, labelHmm, desiredCols) {
  const usableW = A4_W_MM - 2 * PAGE_MARGIN_MM;
  const usableH = A4_H_MM - 2 * PAGE_MARGIN_MM;
  let cols = Math.max(1, desiredCols);
  let gap = DEFAULT_GAP_MM;

  // Adjust gap and cols to fit
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

  const rows = Math.max(1, Math.floor((usableH + gap) / (labelHmm + gap)));
  const fitOk = cols >= desiredCols;

  return { cols, rows, perPage: cols * rows, gap, fitOk };
}