export class ProductSpecificationDimension {
    constructor(t = null, w = null, l = null) {
        this.t = { val: t?.val ?? '', unit: t?.unit ?? 'mm' };
        this.w = { val: w?.val ?? '', unit: w?.unit ?? 'mm' };
        this.l = { val: l?.val ?? '', unit: l?.unit ?? 'mm' };
    }

    _hasVal(v) {
        return v !== '' && v !== null && v !== undefined;
    }

    get formattedValue() {
        const parts = [];
        if (this._hasVal(this.t.val)) parts.push(`T ${this.t.val}${this.t.unit}`);
        if (this._hasVal(this.w.val)) parts.push(`W ${this.w.val}${this.w.unit}`);
        if (this._hasVal(this.l.val)) parts.push(`L ${this.l.val}${this.l.unit}`);
        return parts.join(' * ');
    }

    updateAxis(axis, val, unit) {
        const validAxes = ['t', 'w', 'l'];
        if (validAxes.includes(axis)) {
            if (val !== undefined) this[axis].val = val;
            if (unit !== undefined) this[axis].unit = unit;
        }
    }

    clone() {
        return new ProductSpecificationDimension(
            { ...this.t },
            { ...this.w },
            { ...this.l }
        );
    }
}
