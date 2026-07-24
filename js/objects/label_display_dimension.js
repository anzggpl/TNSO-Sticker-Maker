export class LabelDisplayDimension {
  static MIN_WIDTH = 20;
  static MIN_HEIGHT = 15;
  static DEFAULT_WIDTH = 100;
  static DEFAULT_HEIGHT = 55;

  constructor(w = LabelDisplayDimension.DEFAULT_WIDTH, h = LabelDisplayDimension.DEFAULT_HEIGHT) {
    this.w = w;
    this.h = h;
  }

  // Pure data parsing core logic
  static parse(wVal, hVal) {
    const rawW = +wVal || LabelDisplayDimension.DEFAULT_WIDTH;
    const rawH = +hVal || LabelDisplayDimension.DEFAULT_HEIGHT;

    return new LabelDisplayDimension(
      Math.max(LabelDisplayDimension.MIN_WIDTH, rawW),
      Math.max(LabelDisplayDimension.MIN_HEIGHT, rawH)
    );
  }

  static fromDefaultIDs() {
    const wEl = document.getElementById('labelW');
    const hEl = document.getElementById('labelH');
    return LabelDisplayDimension.parse(wEl?.value, hEl?.value);
  }

  get dimensions() {
    return { w: this.w, h: this.h };
  }
}