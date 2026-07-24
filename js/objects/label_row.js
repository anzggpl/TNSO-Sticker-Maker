export class ProductLabelLine {
  constructor({ label, value = '', on = true, mode = 'text', dims = null }) {
    this.id = Date.now() + Math.random()
    this.label = label;
    this._value = value; // Store static text value internally
    this.on = on;
    this.mode = mode;
    this.dims = dims;    // Expects an instance of Dimension or null
  }

  // Dynamic getter handles either text value or dimension formatting
  get value() {
    if (this.mode === 'dims' && this.dims) {
      return this.dims.formattedValue;
    }
    return this._value;
  }

  // Setter keeps text values updatable
  set value(newValue) {
    this._value = newValue;
  }
}