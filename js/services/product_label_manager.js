import { LABEL_DISPLAY_MODE } from "../constants.js";
import { ProductLabelLine } from "../objects/product_label_line.js";

export class ProductLabelManager {
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

    constructor(initialName = ProductLabelManager.DEFAULT_LABEL) {
        this._name = initialName.trim();
        this.rows = ProductLabelManager.DEFAULT_ROWS.map(row => new ProductLabelLine(row));
        this.listeners = [];
    }

    get name() {
        return this._name;
    }

    set name(newName) {
        const trimmed = (newName || '').trim();
        if (trimmed) {
            this._name = trimmed;
            this.notify();
        }
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this));
    }

    setName(name) {
        this.name = name;
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
}

export const appProductLabelManager = new ProductLabelManager();