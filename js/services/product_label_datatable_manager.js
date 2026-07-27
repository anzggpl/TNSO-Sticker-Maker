import { excelServiceManager } from "./excel_service_manager.js";
import { ProductLabel } from "../objects/product_label.js";
import { LABEL_DISPLAY_MODE } from "../constants.js";

class ProductLabelDataTableManager {
    constructor() {
        this.rows = [];
        // Save the init Promise so consumers can wait on it
        this.initPromise = this.init();
    }

    async init() {
        try {
            const rawProductLabels = await excelServiceManager.getProductLabels();
            this.rows = rawProductLabels.map(item => this.formatProductLabel(item));
            console.log(`ProductLabelDataTableManager initialized with ${this.rows.length} items.`);
        } catch (error) {
            console.error("Failed to initialize ProductLabelDataTableManager:", error);
        }
    }

    formatProductLabel(rawProductLabel) {
        const productLabel = new ProductLabel();
        productLabel.setProductName(rawProductLabel.productName);
        productLabel.setLabelDisplayDimensions({ w: rawProductLabel.labelWidth, h: rawProductLabel.labelHeight });
        productLabel.setQtyPerBatch(rawProductLabel.qtyPerPaper)
        productLabel.addRow({ label: "colour", value: rawProductLabel.colour });
        productLabel.addRow({ label: "density", value: rawProductLabel.density });
        productLabel.addRow({ label: "finish", value: rawProductLabel.finish });
        productLabel.addRow({ label: "size", mode: LABEL_DISPLAY_MODE.DIMENSION, dims: { t: { val: '0', unit: rawProductLabel.thicknessUnit }, w: { val: '0', unit: rawProductLabel.widthUnit }, l: { val: '0', unit: rawProductLabel.lengthUnit } } })
        productLabel.addRow({ label: "packing", value: rawProductLabel.packing });
        productLabel.addRow({ label: "lot no.", value: rawProductLabel.lotNo });
        
        return productLabel;
    }

    async getProductLabels() {
        await this.initPromise;
        return this.rows;
    }
}

export const productLabelDataTableManager = new ProductLabelDataTableManager();