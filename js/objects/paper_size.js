export class PaperSize {
    constructor(name, width, height) {
        this.name = name;
        this.width = width;
        this.height = height;
    }

    getLabel() {
        return `${this.name} (${this.width}mm × ${this.height}mm)`;
    }
}