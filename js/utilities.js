export function escapeAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function escapeHTML(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

export function getBatchManifest(batch) {
    const manifest = [];
    batch.forEach(entry => {
        for (let i = 0; i < entry.qty; i++) {
            manifest.push(entry);
        }
    });

    return manifest;
}

export function getDesiredCols() {
    const colEl = document.getElementById('colsInput');
    return Math.max(1, Math.min(6, +(colEl ? colEl.value : 2) || 2));
}

export function composeDimsValue(dims) {
    const parts = [];
    if (dims.t.val !== '' && dims.t.val != null) parts.push(`T ${dims.t.val}${dims.t.unit}`);
    if (dims.w.val !== '' && dims.w.val != null) parts.push(`W ${dims.w.val}${dims.w.unit}`);
    if (dims.l.val !== '' && dims.l.val != null) parts.push(`L ${dims.l.val}${dims.l.unit}`);
    return parts.join(' * ');
}