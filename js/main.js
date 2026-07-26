import { BASE_W, PAGE_MARGIN_MM, LABEL_DISPLAY_MODE } from './constants.js';
import { computeGrid } from './services/layout_calculator.js';
import { escapeAttr, escapeHTML, getBatchManifest, getDesiredCols } from './utilities.js';
import { LabelDisplayDimension } from './objects/label_display_dimension.js';
import { buildLabelNode, measureNaturalHeight } from './services/label_renderer.js';

import { loadTomSelectPaperSize } from './components/tomselect_papers_size.js';
import { updatePaperSizeDisplay, appPaperSizeManager } from './services/paper_size_manager.js';
import { appProductLabelStagingManager } from './services/app_product_label_staging_manager.js';
import { previewPrintBatch } from './services/printer.js';
import { excelServiceManager } from './services/excel_service_manager.js';

const PRESET_LABELS = ['Density', 'Size', 'Finish', 'Thickness', 'Weight', 'Colour', 'Fire Rating', 'Standard / Compliance', 'Application', 'Packing'];
const UNITS = ['mm', 'cm', 'm'];
const PX_PER_MM_PREVIEW = 3.6;

let batch = [];

function renderSpecRowControls() {
  const wrap = document.getElementById('specRows');
  if (!wrap) return;
  wrap.innerHTML = '';

  const rows = appProductLabelStagingManager.getRows();

  rows.forEach(r => {
    const el = document.createElement('div');
    el.className = 'spec-row';
    const opts = PRESET_LABELS.map(l => `<option value="${l}" ${l === r.label ? 'selected' : ''}>${l}</option>`).join('');
    const unitOpts = u => UNITS.map(x => `<option value="${x}" ${x === u ? 'selected' : ''}>${x}</option>`).join('');

    // Check against BOTH constant and string literal for safety
    const isDimsMode = r.mode === LABEL_DISPLAY_MODE.DIMENSION || r.mode === 'dims';

    let valueBlockHTML;
    if (isDimsMode) {
      valueBlockHTML = `
        <div class="dims-grid">
          <div class="dim-field"><label class="f">T (thick.)</label>
            <div class="dim-row"><input type="number" step="any" value="${escapeAttr(r.dims?.t?.val ?? '')}" data-role="dim-t-val"><select data-role="dim-t-unit">${unitOpts(r.dims?.t?.unit ?? 'mm')}</select></div>
          </div>
          <div class="dim-field"><label class="f">W (width)</label>
            <div class="dim-row"><input type="number" step="any" value="${escapeAttr(r.dims?.w?.val ?? '')}" data-role="dim-w-val"><select data-role="dim-w-unit">${unitOpts(r.dims?.w?.unit ?? 'mm')}</select></div>
          </div>
          <div class="dim-field"><label class="f">L (length)</label>
            <div class="dim-row"><input type="number" step="any" value="${escapeAttr(r.dims?.l?.val ?? '')}" data-role="dim-l-val"><select data-role="dim-l-unit">${unitOpts(r.dims?.l?.unit ?? 'mm')}</select></div>
          </div>
        </div>
        <button class="mode-toggle" data-role="mode-switch" style="margin-top:8px;">Switch to single value box</button>
      `;
    } else {
      valueBlockHTML = `
        <div><label class="f">Value</label><input type="text" value="${escapeAttr(r.value || '')}" data-role="value"></div>
        <button class="mode-toggle" data-role="mode-switch" style="margin-top:2px;">Use T / W / L size boxes instead</button>
      `;
    }

    el.innerHTML = `
      <div class="spec-row-head">
        <input type="checkbox" ${r.on !== false ? 'checked' : ''} data-role="on">
        <span class="rname">Row</span>
        <button class="rm" title="Remove row" data-role="rm">×</button>
      </div>
      <div style="margin-bottom:8px;"><label class="f">Label</label>
        <input type="text" list="presetLabels-${r.id}" value="${escapeAttr(r.label)}" data-role="label">
        <datalist id="presetLabels-${r.id}">${opts}</datalist>
      </div>
      ${valueBlockHTML}
    `;

    el.querySelector('[data-role=on]').addEventListener('change', e => {
      r.on = e.target.checked;
      appProductLabelStagingManager.notify();
    });

    el.querySelector('[data-role=label]').addEventListener('input', e => {
      r.label = e.target.value;
      appProductLabelStagingManager.notify();
    });

    el.querySelector('[data-role=rm]').addEventListener('click', () => {
      appProductLabelStagingManager.removeRow(r.id);
      renderSpecRowControls();
    });

    if (isDimsMode) {
      el.querySelector('[data-role=dim-t-val]').addEventListener('input', e => { r.dims.updateAxis('t', e.target.value); appProductLabelStagingManager.notify(); });
      el.querySelector('[data-role=dim-w-val]').addEventListener('input', e => { r.dims.updateAxis('w', e.target.value); appProductLabelStagingManager.notify(); });
      el.querySelector('[data-role=dim-l-val]').addEventListener('input', e => { r.dims.updateAxis('l', e.target.value); appProductLabelStagingManager.notify(); });
      el.querySelector('[data-role=dim-t-unit]').addEventListener('change', e => { r.dims.updateAxis('t', undefined, e.target.value); appProductLabelStagingManager.notify(); });
      el.querySelector('[data-role=dim-w-unit]').addEventListener('change', e => { r.dims.updateAxis('w', undefined, e.target.value); appProductLabelStagingManager.notify(); });
      el.querySelector('[data-role=dim-l-unit]').addEventListener('change', e => { r.dims.updateAxis('l', undefined, e.target.value); appProductLabelStagingManager.notify(); });
    } else {
      el.querySelector('[data-role=value]').addEventListener('input', e => { r.value = e.target.value; appProductLabelStagingManager.notify(); });
    }

    el.querySelector('[data-role=mode-switch]').addEventListener('click', () => {
      appProductLabelStagingManager.toggleRowMode(r.id);
      renderSpecRowControls(); // Re-render DOM control elements on mode toggle
    });

    wrap.appendChild(el);
  });
}

function addSpecRow() {
  appProductLabelStagingManager.addRow();
  renderSpecRowControls();
}

function mountContained(frameEl, productName, activeRows, frameWpx, frameHpx) {
  frameEl.style.width = frameWpx + 'px';
  frameEl.style.height = frameHpx + 'px';
  frameEl.className = 'frame';
  const measureNode = buildLabelNode(productName, activeRows);
  const naturalH = measureNaturalHeight(measureNode);
  const scale = Math.min(frameWpx / BASE_W, frameHpx / naturalH);
  const dispW = BASE_W * scale, dispH = naturalH * scale;
  const offsetX = (frameWpx - dispW) / 2, offsetY = (frameHpx - dispH) / 2;
  const node = buildLabelNode(productName, activeRows);
  node.style.width = BASE_W + 'px';
  node.style.transformOrigin = 'top left';
  node.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  frameEl.innerHTML = '';
  frameEl.appendChild(node);
  return { scale, naturalH };
}

function onSizeChange() {
  const { w, h } = LabelDisplayDimension.fromDefaultIDs().dimensions;
  const lbl = document.getElementById('sizeLabel');
  if (lbl) lbl.textContent = `${w} × ${h}mm`;
  updatePreview();
  renderPageLayout();
}

function updatePreview() {
  const name = appProductLabelStagingManager.name;
  const rows = appProductLabelStagingManager.getRows();
  const { w, h } = LabelDisplayDimension.fromDefaultIDs().dimensions;
  const frame = document.getElementById('livePreview');
  if (frame) {
    mountContained(frame, name, rows, w * PX_PER_MM_PREVIEW, h * PX_PER_MM_PREVIEW);
  }
}

function addToBatch() {
  const qtyEl = document.getElementById('qtyInput');
  const name = appProductLabelStagingManager.name;
  const qty = Math.max(1, +(qtyEl?.value) || 1);

  // Capture clean, plain snapshots with pre-evaluated values
  const snapshottedRows = appProductLabelStagingManager.getRows().map(r => ({
    id: r.id,
    label: r.label,
    value: r.value, // Freezes the calculated value string right now
    on: r.on !== false
  }));

  batch.push({
    id: Date.now() + Math.random(),
    name,
    rows: snapshottedRows,
    qty
  });

  renderBatch();
  renderPageLayout();
}

function removeFromBatch(id) { batch = batch.filter(b => b.id !== id); renderBatch(); renderPageLayout(); }
function clearBatch() { batch = []; renderBatch(); renderPageLayout(); }
function updateQty(id, val) {
  const entry = batch.find(b => b.id === id);
  if (entry) { entry.qty = Math.max(1, +val || 1); renderPageLayout(); }
}

function renderBatch() {
  const grid = document.getElementById('batchGrid');
  if (!grid) return;
  const total = batch.reduce((s, b) => s + b.qty, 0);
  const countEl = document.getElementById('batchCount');
  if (countEl) countEl.textContent = `Batch (${batch.length} product${batch.length === 1 ? '' : 's'}, ${total} label${total === 1 ? '' : 's'} total)`;
  grid.innerHTML = '';
  if (batch.length === 0) {
    grid.innerHTML = '<div class="empty-state">No labels yet — fill in the product details and click "Add to batch".</div>';
    return;
  }
  batch.forEach(entry => {
    const activeCount = entry.rows.filter(r => r.on !== false).length;
    const card = document.createElement('div');
    card.className = 'batch-card';
    card.innerHTML = `<div class="mini-title">${escapeHTML(entry.name || 'Untitled product')}</div>
                       <div class="mini-sub">${activeCount} spec row${activeCount === 1 ? '' : 's'}</div>
                       <div class="qty-edit">Qty <input type="number" min="1" value="${entry.qty}"></div>
                       <button class="remove" title="Remove">×</button>`;
    card.querySelector('input').addEventListener('input', e => updateQty(entry.id, e.target.value));
    card.querySelector('.remove').addEventListener('click', () => removeFromBatch(entry.id));
    grid.appendChild(card);
  });
}

function renderPageLayout() {
  const summary = document.getElementById('layoutSummary');
  const wrap = document.getElementById('pagesWrap');
  if (!wrap || !summary) return;

  wrap.innerHTML = '';

  const flat = getBatchManifest(batch);
  const currentPaper = appPaperSizeManager.getCurrentSize();

  const { w: labelW, h: labelH } = LabelDisplayDimension.fromDefaultIDs().dimensions;
  const desiredCols = getDesiredCols();
  const { cols, rows, perPage, gap, fitOk } = computeGrid(labelW, labelH, desiredCols);

  const pages = Math.ceil(flat.length / perPage) || 1;

  let warning = '';
  if (!fitOk) {
    warning = ` &nbsp;·&nbsp; <span style="color:#B8701E;">⚠ ${desiredCols} columns didn't fit at this width — showing ${cols} instead</span>`;
  }
  summary.innerHTML = `<b>${flat.length}</b> label${flat.length === 1 ? '' : 's'} total &nbsp;·&nbsp; <b>${cols}×${rows}</b> = ${perPage} per sheet &nbsp;·&nbsp; <b>${pages}</b> page${pages === 1 ? '' : 's'} needed${warning}`;

  const THUMB_PX_PER_MM = 1.55;
  const scale = THUMB_PX_PER_MM;

  const fragment = document.createDocumentFragment();

  for (let p = 0; p < pages; p++) {
    const pageDiv = document.createElement('div');

    pageDiv.className = `${currentPaper.name.toLowerCase()}-page`;
    pageDiv.style.width = `${currentPaper.width * scale}px`;
    pageDiv.style.height = `${currentPaper.height * scale}px`;
    pageDiv.style.padding = `${PAGE_MARGIN_MM * scale}px`;
    pageDiv.style.display = 'grid';
    pageDiv.style.alignContent = 'start';
    pageDiv.style.gap = `${gap * scale}px`;

    pageDiv.style.gridTemplateColumns = `repeat(${cols}, ${labelW * scale}px)`;
    pageDiv.style.gridTemplateRows = `repeat(${rows}, ${labelH * scale}px)`;

    const startIdx = p * perPage;
    const items = flat.slice(startIdx, startIdx + perPage);

    items.forEach(entry => {
      const cell = document.createElement('div');
      cell.className = 'cell';
      pageDiv.appendChild(cell);
      mountContained(cell, entry.name, entry.rows, labelW * scale, labelH * scale);
    });

    const col = document.createElement('div');
    col.appendChild(pageDiv);

    const cap = document.createElement('div');
    cap.className = 'page-label';
    cap.textContent = `Page ${p + 1} of ${pages}`;

    col.appendChild(cap);
    fragment.appendChild(col);
  }

  wrap.appendChild(fragment);
}

// Attach functions to global window so button onclick="" handlers work
window.addSpecRow = addSpecRow;
window.addToBatch = addToBatch;
window.clearBatch = clearBatch;
window.previewPrintBatch = () => previewPrintBatch(batch);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  excelServiceManager;

  loadTomSelectPaperSize();

  appPaperSizeManager.subscribe((newPaper) => {
    updatePaperSizeDisplay(newPaper);
    renderPageLayout();
  });

  appProductLabelStagingManager.subscribe(() => {
    updatePreview();
    renderPageLayout();
  });

  const initialPaper = appPaperSizeManager.getCurrentSize();
  updatePaperSizeDisplay(initialPaper);

  renderSpecRowControls();
  onSizeChange();
  renderBatch();
  renderPageLayout();

  const attachListener = (id, event, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  };

  attachListener('productName', 'input', (e) => {
    appProductLabelStagingManager.setName(e.target.value);
  });
  attachListener('labelW', 'input', onSizeChange);
  attachListener('labelH', 'input', onSizeChange);
  attachListener('colsInput', 'input', renderPageLayout);
});