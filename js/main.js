import { KM_LOGO, TNSO_LOGO, BASE_W } from './constants.js';
import { A4_W_MM, A4_H_MM, PAGE_MARGIN_MM } from './constants.js';
import { computeGrid } from './services/layout_calculator.js';
import { escapeAttr, escapeHTML } from './utilities.js';
import { LabelDisplayDimension } from './objects/dimension.js';
import { buildLabelNode } from './services/label_renderer.js';
import { composeDimsValue } from './utilities.js';

function freshDims() {
  return { t: { val: '', unit: 'mm' }, w: { val: '', unit: 'mm' }, l: { val: '', unit: 'mm' } };
}

const DEFAULT_ROWS = [
  { label: 'Density', value: '~64kg / m³ (Nominal)', on: true, mode: 'text' },
  { label: 'Size', value: '', on: true, mode: 'dims', dims: { t: { val: '50', unit: 'mm' }, w: { val: '300', unit: 'mm' }, l: { val: '300', unit: 'mm' } } },
  { label: 'Finish', value: 'Single Sided Aluminium Foil 2 Ways Scrim', on: true, mode: 'text' },
];
const PRESET_LABELS = ['Density', 'Size', 'Finish', 'Thickness', 'Weight', 'Colour', 'Fire Rating', 'Standard / Compliance', 'Application', 'Packing'];
const UNITS = ['mm', 'cm', 'm'];

let rows = JSON.parse(JSON.stringify(DEFAULT_ROWS));
let batch = [];
let rowIdSeq = 0;
rows.forEach(r => r.id = rowIdSeq++);

function renderSpecRowControls() {
  const wrap = document.getElementById('specRows');
  if (!wrap) return;
  wrap.innerHTML = '';
  rows.forEach(r => {
    const el = document.createElement('div');
    el.className = 'spec-row';
    const opts = PRESET_LABELS.map(l => `<option value="${l}" ${l === r.label ? 'selected' : ''}>${l}</option>`).join('');
    const unitOpts = u => UNITS.map(x => `<option value="${x}" ${x === u ? 'selected' : ''}>${x}</option>`).join('');

    let valueBlockHTML;
    if (r.mode === 'dims') {
      valueBlockHTML = `
        <div class="dims-grid">
          <div class="dim-field"><label class="f">T (thick.)</label>
            <div class="dim-row"><input type="number" step="any" value="${escapeAttr(r.dims.t.val)}" data-role="dim-t-val"><select data-role="dim-t-unit">${unitOpts(r.dims.t.unit)}</select></div>
          </div>
          <div class="dim-field"><label class="f">W (width)</label>
            <div class="dim-row"><input type="number" step="any" value="${escapeAttr(r.dims.w.val)}" data-role="dim-w-val"><select data-role="dim-w-unit">${unitOpts(r.dims.w.unit)}</select></div>
          </div>
          <div class="dim-field"><label class="f">L (length)</label>
            <div class="dim-row"><input type="number" step="any" value="${escapeAttr(r.dims.l.val)}" data-role="dim-l-val"><select data-role="dim-l-unit">${unitOpts(r.dims.l.unit)}</select></div>
          </div>
        </div>
        <button class="mode-toggle" data-role="mode-switch" style="margin-top:8px;">Switch to single value box</button>
      `;
    } else {
      valueBlockHTML = `
        <div><label class="f">Value</label><input type="text" value="${escapeAttr(r.value)}" data-role="value"></div>
        <button class="mode-toggle" data-role="mode-switch" style="margin-top:2px;">Use T / W / L size boxes instead</button>
      `;
    }

    el.innerHTML = `
      <div class="spec-row-head">
        <input type="checkbox" ${r.on ? 'checked' : ''} data-role="on">
        <span class="rname">Row</span>
        <button class="rm" title="Remove row" data-role="rm">×</button>
      </div>
      <div style="margin-bottom:8px;"><label class="f">Label</label>
        <input type="text" list="presetLabels-${r.id}" value="${escapeAttr(r.label)}" data-role="label">
        <datalist id="presetLabels-${r.id}">${opts}</datalist>
      </div>
      ${valueBlockHTML}
    `;

    el.querySelector('[data-role=on]').addEventListener('change', e => { r.on = e.target.checked; updatePreview(); });
    el.querySelector('[data-role=label]').addEventListener('input', e => { r.label = e.target.value; updatePreview(); });
    el.querySelector('[data-role=rm]').addEventListener('click', () => { rows = rows.filter(x => x.id !== r.id); renderSpecRowControls(); updatePreview(); });

    if (r.mode === 'dims') {
      el.querySelector('[data-role=dim-t-val]').addEventListener('input', e => { r.dims.t.val = e.target.value; updatePreview(); });
      el.querySelector('[data-role=dim-w-val]').addEventListener('input', e => { r.dims.w.val = e.target.value; updatePreview(); });
      el.querySelector('[data-role=dim-l-val]').addEventListener('input', e => { r.dims.l.val = e.target.value; updatePreview(); });
      el.querySelector('[data-role=dim-t-unit]').addEventListener('change', e => { r.dims.t.unit = e.target.value; updatePreview(); });
      el.querySelector('[data-role=dim-w-unit]').addEventListener('change', e => { r.dims.w.unit = e.target.value; updatePreview(); });
      el.querySelector('[data-role=dim-l-unit]').addEventListener('change', e => { r.dims.l.unit = e.target.value; updatePreview(); });
    } else {
      el.querySelector('[data-role=value]').addEventListener('input', e => { r.value = e.target.value; updatePreview(); });
    }
    el.querySelector('[data-role=mode-switch]').addEventListener('click', () => {
      if (r.mode === 'dims') { r.mode = 'text'; if (!r.value) r.value = composeDimsValue(r.dims); }
      else { r.mode = 'dims'; if (!r.dims) r.dims = freshDims(); }
      renderSpecRowControls(); updatePreview();
    });
    wrap.appendChild(el);
  });
}

function addSpecRow() { rows.push({ id: rowIdSeq++, label: '', value: '', on: true, mode: 'text' }); renderSpecRowControls(); updatePreview(); }

// ---------- build the fixed-design label DOM node ----------


import { measureNaturalHeight } from './services/label_renderer.js';
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

const PX_PER_MM_PREVIEW = 3.6;

function onSizeChange() {
  const { w, h } = LabelDisplayDimension.fromDefaultIDs().dimensions;
  const lbl = document.getElementById('sizeLabel');
  if (lbl) lbl.textContent = `${w} × ${h}mm`;
  updatePreview();
  renderPageLayout();
}

function updatePreview() {
  const nameEl = document.getElementById('productName');
  const name = nameEl ? nameEl.value : '';
  const { w, h } = LabelDisplayDimension.fromDefaultIDs().dimensions;
  const frame = document.getElementById('livePreview');
  if (frame) {
    mountContained(frame, name, rows, w * PX_PER_MM_PREVIEW, h * PX_PER_MM_PREVIEW);
  }
}

function addToBatch() {
  const nameEl = document.getElementById('productName');
  const qtyEl = document.getElementById('qtyInput');
  const name = nameEl ? nameEl.value : '';
  const qty = Math.max(1, +(qtyEl ? qtyEl.value : 1) || 1);
  batch.push({ name, rows: JSON.parse(JSON.stringify(rows)), qty, id: Date.now() + Math.random() });
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
    const activeCount = entry.rows.filter(r => r.on).length;
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

import { getBatchManifest } from './utilities.js';
import { getDesiredCols } from './utilities.js';

function renderPageLayout() {
  const summary = document.getElementById('layoutSummary');
  const wrap = document.getElementById('pagesWrap');
  if (!wrap || !summary) return;
  wrap.innerHTML = '';
  const flat = getBatchManifest(batch);

  const { w: labelW, h: labelH } = LabelDisplayDimension.fromDefaultIDs().dimensions;
  const desiredCols = getDesiredCols();
  const { cols, rows, perPage, gap, fitOk } = computeGrid(labelW, labelH, desiredCols);
  const pages = Math.ceil(flat.length / perPage);
  let warning = '';
  if (!fitOk) {
    warning = ` &nbsp;·&nbsp; <span style="color:#B8701E;">⚠ ${desiredCols} columns didn't fit at this width — showing ${cols} instead</span>`;
  }
  summary.innerHTML = `<b>${flat.length}</b> label${flat.length === 1 ? '' : 's'} total &nbsp;·&nbsp; <b>${cols}×${rows}</b> = ${perPage} per A4 sheet &nbsp;·&nbsp; <b>${pages}</b> page${pages === 1 ? '' : 's'} needed${warning}`;

  const THUMB_PX_PER_MM = 1.55;
  for (let p = 0; p < pages; p++) {
    const pageDiv = document.createElement('div');
    pageDiv.className = 'a4-page';
    pageDiv.style.width = (A4_W_MM * THUMB_PX_PER_MM) + 'px';
    pageDiv.style.height = (A4_H_MM * THUMB_PX_PER_MM) + 'px';
    pageDiv.style.padding = (PAGE_MARGIN_MM * THUMB_PX_PER_MM) + 'px';
    pageDiv.style.display = 'grid';
    pageDiv.style.gridTemplateColumns = `repeat(${cols}, ${labelW * THUMB_PX_PER_MM}px)`;
    pageDiv.style.gridAutoRows = `${labelH * THUMB_PX_PER_MM}px`;
    pageDiv.style.gap = (gap * THUMB_PX_PER_MM) + 'px';
    pageDiv.style.alignContent = 'start';

    const startIdx = p * perPage;
    const items = flat.slice(startIdx, startIdx + perPage);
    items.forEach(entry => {
      const cell = document.createElement('div');
      cell.className = 'cell';
      pageDiv.appendChild(cell);
      mountContained(cell, entry.name, entry.rows, labelW * THUMB_PX_PER_MM, labelH * THUMB_PX_PER_MM);
    });

    const col = document.createElement('div');
    col.appendChild(pageDiv);
    const cap = document.createElement('div');
    cap.className = 'page-label';
    cap.textContent = `Page ${p + 1} of ${pages}`;
    col.appendChild(cap);
    wrap.appendChild(col);
  }
}

import { previewPrintBatch } from './services/printer.js';

// Attach functions to global window so button onclick="" handlers work
window.addSpecRow = addSpecRow;
window.addToBatch = addToBatch;
window.clearBatch = clearBatch;
window.previewPrintBatch = () => previewPrintBatch(batch);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  renderSpecRowControls();
  onSizeChange();
  renderBatch();
  renderPageLayout();

  // Attach event listeners to input elements if present
  const productName = document.getElementById('productName');
  if (productName) productName.addEventListener('input', updatePreview);

  const labelW = document.getElementById('labelW');
  if (labelW) labelW.addEventListener('input', onSizeChange);

  const labelH = document.getElementById('labelH');
  if (labelH) labelH.addEventListener('input', onSizeChange);

  const colsInput = document.getElementById('colsInput');
  if (colsInput) colsInput.addEventListener('input', renderPageLayout);
});