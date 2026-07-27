import { LABEL_DISPLAY_MODE } from "../constants.js";
import { ProductLabelLine } from "../objects/product_label_line.js";
import { LabelDisplayDimension } from "../objects/label_display_dimension.js";
class AppProductLabelStagingManager {
    static DEFAULT_LABEL = "MW MINERAL WOOL";

    static DEFAULT_ROWS = [
        { label: 'Density', value: '~64kg / m³ (Nominal)', mode: LABEL_DISPLAY_MODE.TEXT },
        {
            label: 'Size',
            value: '',
            on: true,
            mode: LABEL_DISPLAY_MODE.DIMENSION,
            dims: { t: { val: '50', unit: 'mm' }, w: { val: '300', unit: 'mm' }, l: { val: '300', unit: 'mm' } }
        },
        { label: 'Finish', value: 'PLAIN', on: true, mode: LABEL_DISPLAY_MODE.TEXT },
    ];

    constructor(initialName = AppProductLabelStagingManager.DEFAULT_LABEL) {
        this._name = initialName.trim();
        this.rows = AppProductLabelStagingManager.DEFAULT_ROWS.map(row => new ProductLabelLine(row));
        this.listeners = [];
        this.labelDisplayDimension = new LabelDisplayDimension()
        this.qty_per_batch = 1;
    }

    get name() {
        return this._name;
    }

    getQtyPerBatch() {
        return this.qty_per_batch;
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this));
    }

    setName(name) {
        this._name = name;
        const productNameEl = document.getElementById('productName');
        productNameEl.value = name;
        this.notify();
    }

    getRows() {
        return this.rows;
    }

    addRow(label = '', value = '', mode = LABEL_DISPLAY_MODE.TEXT) {
        const newLine = new ProductLabelLine({ label: label, value: value, mode: mode });
        this.rows.push(newLine);
        this.notify();
        return newLine;
    }

    removeRow(id) {
        this.rows = this.rows.filter(r => r.id !== id);
        this.notify();
    }

    toggleRowMode(id) {
        const row = this.rows.find(r => r.id === id);
        if (!row) return;

        if (row.mode === LABEL_DISPLAY_MODE.DIMENSION) {
            row.mode = LABEL_DISPLAY_MODE.TEXT;
            if (!row._value) row._value = row.dims.formattedValue;
        } else {
            row.mode = LABEL_DISPLAY_MODE.DIMENSION;
        }
        this.notify();
    }

    setLabelDisplayDimension(productLabel) {
        this.labelDisplayDimension.setDisplayDimensions({ w: productLabel.label_width, h: productLabel.label_height })
        const wEl = document.getElementById('labelW');
        const hEl = document.getElementById('labelH');

        wEl.value = productLabel.label_width;
        hEl.value = productLabel.label_height;
    }

    setQtyPerBatch(qty_per_batch) {
        this.qty_per_batch = qty_per_batch;
        const qtyEl = document.getElementById('qtyInput');
        if (qtyEl) {
            qtyEl.value = qty_per_batch;
        }
    }

    updateQtyPerBatchFromInput(value) {
        const parsed = parseInt(value, 10);

        const cleanQty = isNaN(parsed) || parsed < 1 ? 1 : parsed;

        if (this.qty_per_batch !== cleanQty) {
            this.qty_per_batch = cleanQty;
            this.notify();
        }
    }

    setStagedProductLabel(productLabel) {
        this.setName(productLabel.getProductName());
        this.setLabelDisplayDimension(productLabel);
        this.setQtyPerBatch(productLabel.getQtyPerBatch());
        const incomingRows = productLabel.getRows();
        this.rows = incomingRows.map(row => row.clone());
        this.notify();
    }
}

export const appProductLabelStagingManager = new AppProductLabelStagingManager();