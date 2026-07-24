import { STANDARD_PAPER_SIZES } from "../constants.js";

class PaperSizeManager {
    constructor() {
        this.currentPaper = STANDARD_PAPER_SIZES.A4;
        this.listeners = new Set(); // Using Set auto-prevents duplicate listener callbacks
    }

    subscribe(callback) {
        this.listeners.add(callback);

        return () => this.listeners.delete(callback);
    }

    notify() {
        this.listeners.forEach(callback => callback(this.currentPaper));
    }

    setPaperSize(sizeName) {
        const normName = sizeName.toUpperCase();
        const paper = STANDARD_PAPER_SIZES[normName];

        if (!paper) {
            console.error(`Unsupported paper size: ${sizeName}`);
            return;
        }

        // Just swaps a memory reference—super lightweight!
        this.currentPaper = paper;
        this.notify();
    }

    getCurrentSize() {
        return this.currentPaper;
    }

    // Direct replacement for the old factory method for TomSelect
    getAllStandardSizes() {
        return Object.values(STANDARD_PAPER_SIZES);
    }
}

// Global paperSizeManager singleton
export const appPaperSizeManager = new PaperSizeManager();

export function updatePaperSizeDisplay(paper) {
    const heading = document.getElementById('page-layout-heading');

    if (heading) {
        heading.textContent = `${paper.name} page layout (auto-arranged)`;
    }
}