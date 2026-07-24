import { KM_LOGO, TNSO_LOGO, BASE_W } from './constants.js';
import {A4_W_MM, A4_H_MM, PAGE_MARGIN_MM} from './constants.js';
import { computeGrid } from './services/layout_calculator.js';

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

function escapeAttr(str) { return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
function escapeHTML(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }

function composeDimsValue(dims) {
  const parts = [];
  if (dims.t.val !== '' && dims.t.val != null) parts.push(`T ${dims.t.val}${dims.t.unit}`);
  if (dims.w.val !== '' && dims.w.val != null) parts.push(`W ${dims.w.val}${dims.w.unit}`);
  if (dims.l.val !== '' && dims.l.val != null) parts.push(`L ${dims.l.val}${dims.l.unit}`);
  return parts.join(' * ');
}

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
function buildLabelNode(productName, activeRows) {
  const kmLogoSrc = KM_LOGO;
  const tnsoLogoSrc = TNSO_LOGO;

  const card = document.createElement('div');
  card.className = 'tnso-label';
  const specHTML = activeRows.filter(r => {
    const val = r.mode === 'dims' ? composeDimsValue(r.dims) : r.value;
    return r.on && (r.label || val);
  }).map(r => {
    const val = r.mode === 'dims' ? composeDimsValue(r.dims) : r.value;
    return `
    <div class="spec-item">
      <div class="spec-bar"></div>
      <div class="spec-text"><b>${escapeHTML(r.label)}${r.label ? ' : ' : ''}</b><span class="val">${escapeHTML(val)}</span></div>
    </div>`;
  }).join('');
  card.innerHTML = `
    <div class="top">
      <div class="top-left">
        <div class="product-name">${escapeHTML(productName) || 'Product name'}</div>
        <div class="spec-list">${specHTML}</div>
      </div>
      <div class="km-logo"><img src="${kmLogoSrc}" alt="KM Performance Choice"></div>
    </div>
    <div class="divider"></div>
    <div class="bottom">
      <div class="tnso-logo"><img src="${tnsoLogoSrc}" alt="TwoNine SixO"></div>
      <div class="vbar"></div>
      <div class="contact">
        <div class="cline"><span><b>Tel :</b> <span class="v">6267 1300</span></span><span><b>Fax :</b> <span class="v">6264 2960</span></span></div>
        <div class="cline"><span><b>Add :</b> <span class="v">21 Tuas West Ave Singapore 638435</span></span></div>
        <div class="cline"><span><b>Email :</b> <span class="v">contact@t2960.com.sg</span></span></div>
      </div>
    </div>`;
  return card;
}

function measureNaturalHeight(node) {
  node.style.position = 'absolute';
  node.style.visibility = 'hidden';
  node.style.left = '-99999px';
  node.style.top = '0';
  node.style.width = BASE_W + 'px';
  document.body.appendChild(node);
  const h = node.offsetHeight;
  document.body.removeChild(node);
  return h;
}

// mount a label contain-fit inside a frame of frameWpx x frameHpx
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

function getSize() {
  const wEl = document.getElementById('labelW');
  const hEl = document.getElementById('labelH');
  const w = Math.max(20, +(wEl ? wEl.value : 100) || 100);
  const h = Math.max(15, +(hEl ? hEl.value : 55) || 55);
  return { w, h };
}

const PX_PER_MM_PREVIEW = 3.6;

function onSizeChange() {
  const { w, h } = getSize();
  const lbl = document.getElementById('sizeLabel');
  if (lbl) lbl.textContent = `${w} × ${h}mm`;
  updatePreview();
  renderPageLayout();
}

function updatePreview() {
  const nameEl = document.getElementById('productName');
  const name = nameEl ? nameEl.value : '';
  const { w, h } = getSize();
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




function getDesiredCols() {
  const colEl = document.getElementById('colsInput');
  return Math.max(1, Math.min(6, +(colEl ? colEl.value : 2) || 2));
}

function flattenBatch() {
  const flat = [];
  batch.forEach(entry => { for (let i = 0; i < entry.qty; i++) flat.push(entry); });
  return flat;
}

function renderPageLayout() {
  const summary = document.getElementById('layoutSummary');
  const wrap = document.getElementById('pagesWrap');
  if (!wrap || !summary) return;
  wrap.innerHTML = '';
  const flat = flattenBatch();
  const pdfBtn = document.getElementById('pdfBtn');

  if (flat.length === 0) {
    summary.textContent = 'Add labels to the batch to see the page layout.';
    if (pdfBtn) pdfBtn.disabled = true;
    return;
  }
  if (pdfBtn) pdfBtn.disabled = false;
  const { w: labelW, h: labelH } = getSize();
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

// ---------------- Print ----------------
function printBatch() {
  const flat = flattenBatch();
  if (flat.length === 0) { alert('Add at least one label to the batch before printing.'); return; }
  const { w: labelW, h: labelH } = getSize();
  const desiredCols = getDesiredCols();
  const { cols, rows, perPage, gap } = computeGrid(labelW, labelH, desiredCols);
  const pages = Math.ceil(flat.length / perPage);
  const sheet = document.getElementById('printSheet');
  if (!sheet) return;
  sheet.innerHTML = '';
  const PX_PER_MM = 3.78;

  for (let p = 0; p < pages; p++) {
    const pageDiv = document.createElement('div');
    pageDiv.className = 'print-page';
    const startIdx = p * perPage;
    const items = flat.slice(startIdx, startIdx + perPage);
    items.forEach((entry, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.style.left = (PAGE_MARGIN_MM + c * (labelW + gap)) + 'mm';
      cell.style.top = (PAGE_MARGIN_MM + r * (labelH + gap)) + 'mm';
      cell.style.width = labelW + 'mm';
      cell.style.height = labelH + 'mm';
      pageDiv.appendChild(cell);
      mountContained(cell, entry.name, entry.rows, labelW * PX_PER_MM, labelH * PX_PER_MM);
      cell.style.overflow = 'hidden';
    });
    sheet.appendChild(pageDiv);
  }
  window.print();
}

// ---------------- PDF export ----------------
async function exportPDF() {
  const flat = flattenBatch();
  if (flat.length === 0) { alert('Add at least one label to the batch before exporting.'); return; }
  const btn = document.getElementById('pdfBtn');
  let oldText = '';
  if (btn) {
    btn.disabled = true;
    oldText = btn.textContent;
    btn.textContent = 'Rendering…';
  }

  try {
    const { w: labelW, h: labelH } = getSize();
    const desiredCols = getDesiredCols();
    const { cols, rows, perPage, gap } = computeGrid(labelW, labelH, desiredCols);
    const pages = Math.ceil(flat.length / perPage);

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
      cache.set(entry.id, { dataUrl: canvas.toDataURL('image/png'), aspect: canvas.height / canvas.width });
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    for (let p = 0; p < pages; p++) {
      if (p > 0) doc.addPage();
      const startIdx = p * perPage;
      const items = flat.slice(startIdx, startIdx + perPage);
      items.forEach((entry, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        const cellX = PAGE_MARGIN_MM + c * (labelW + gap);
        const cellY = PAGE_MARGIN_MM + r * (labelH + gap);
        const { dataUrl, aspect } = cache.get(entry.id);
        let drawW = labelW, drawH = labelW * aspect;
        if (drawH > labelH) { drawH = labelH; drawW = labelH / aspect; }
        const offX = cellX + (labelW - drawW) / 2;
        const offY = cellY + (labelH - drawH) / 2;
        doc.addImage(dataUrl, 'PNG', offX, offY, drawW, drawH);
      });
    }
    doc.save('labels.pdf');
  } catch (err) {
    console.error(err);
    alert('Something went wrong generating the PDF. Please try again.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = oldText;
    }
  }
}

// Attach functions to global window so button onclick="" handlers work
window.addSpecRow = addSpecRow;
window.addToBatch = addToBatch;
window.clearBatch = clearBatch;
window.printBatch = printBatch;
window.exportPDF = exportPDF;

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