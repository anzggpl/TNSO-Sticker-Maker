export class ProductRow {
  constructor({ label, value = '', mode = 'text', dims = null }) {
    this.label = label;
    this.value = value;
    this.mode = mode;
    
    // Instantiate Dimension object if dims data exists
    // this.dims = dims ? new Dimension(dims.t, dims.w, dims.l) : null;
  }
}