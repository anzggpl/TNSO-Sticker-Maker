import { ProductLabelLine } from "./product_label_line.js";
import { LABEL_DISPLAY_MODE } from "../constants.js";

export class ProductLabel {
    constructor() {
        this.product_name = '';
        this.label_width = '';
        this.label_height = '';
        this.qty_per_batch = 0;
        this.rows = [];
    }

    getProductName() {
        return this.product_name;
    }

    setProductName(name) {
        this.product_name = name;
    }

    getLabelWidth() {
        return this.label_width;
    }

    getLabelHeight() {
        return this.label_height;
    }

    setLabelDisplayDimensions({ w, h }) {
        this.label_width = w;
        this.label_height = h;
    }

    getQtyPerBatch() {
        return this.qty_per_batch;
    }

    setQtyPerBatch(qty) {
        this.qty_per_batch = qty;
    }

    getRows() {
        return this.rows;
    }

    getSearchTerm() {
        const name = this.getProductName() || '';

        const lineValues = this.rows
            .slice(0, 2)
            .map(row => row.value)
            .filter(val => val !== null && val !== undefined && String(val).trim() !== '');

        return [name, ...lineValues].join(' - ').trim();
    }

    addRow({ label, value, mode = LABEL_DISPLAY_MODE.TEXT, dims = null }) {
        const isEmpty = (val) => val === null || val === undefined || String(val).trim() === '';

        if (mode === LABEL_DISPLAY_MODE.TEXT) {
            if (isEmpty(label) || isEmpty(value)) return;
        }

        const new_row = new ProductLabelLine({ label: label, value: value, mode: mode, dims: dims });


        this.rows.push(new_row);
    }

    removeRow(id) {
        this.rows = this.rows.filter(r => r.id !== id);
    }
}