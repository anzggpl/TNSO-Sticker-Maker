import { ProductSpecificationDimension } from "./product_specification_dimension.js";
import { LABEL_DISPLAY_MODE } from "../constants.js";

export class ProductLabelLine {
  constructor({ label = '', value = '', mode = LABEL_DISPLAY_MODE.TEXT, dims = null } = {}) {
    this.id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `line-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    this.label = label;
    this._value = value;
    this.mode = mode;

    if (dims && !(dims instanceof ProductSpecificationDimension)) {
      this.dims = new ProductSpecificationDimension(dims.t, dims.w, dims.l);
    } else {
      this.dims = dims || new ProductSpecificationDimension();
    }
  }

  get value() {
    if (this.mode === LABEL_DISPLAY_MODE.DIMENSION && this.dims) {
      return this.dims.formattedValue;
    }
    return this._value;
  }

  set value(newValue) {
    this._value = newValue;
  }
}