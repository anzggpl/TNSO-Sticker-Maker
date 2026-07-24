import { BASE_W } from "../constants.js";
import { KM_LOGO, TNSO_LOGO } from "../constants.js";
import { escapeHTML } from "../utilities.js";
import { composeDimsValue } from "../utilities.js";

export function measureNaturalHeight(node) {
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

export function buildLabelNode(productName, activeRows) {
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
      <div class="km-logo"><img src="${KM_LOGO}" alt="KM Performance Choice"></div>
    </div>
    <div class="divider"></div>
    <div class="bottom">
      <div class="tnso-logo"><img src="${TNSO_LOGO}" alt="TwoNine SixO"></div>
      <div class="vbar"></div>
      <div class="contact">
        <div class="cline"><span><b>Tel :</b> <span class="v">6267 1300</span></span><span><b>Fax :</b> <span class="v">6264 2960</span></span></div>
        <div class="cline"><span><b>Address :</b> <span class="v">21 Tuas West Ave Singapore 638435</span></span></div>
        <div class="cline"><span><b>Email :</b> <span class="v">contact@t2960.com.sg</span></span></div>
      </div>
    </div>`;
    return card;
}