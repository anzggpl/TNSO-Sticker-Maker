class ExcelServiceManager {
    constructor(filePath = 'backend/product_master.xlsx', tableName = 'ProductMaster') {
        this.filePath = filePath;
        this.tableName = tableName;

        // Cache the loading Promise in the constructor so fetch runs once
        this.cachePromise = this.initCache();
    }

    cleanValue(val) {
        if (val === null || val === undefined) return '';
        const str = String(val).trim();
        const upper = str.toUpperCase();
        if (upper === 'NA' || upper === 'N/A') {
            return '';
        }
        return str;
    }

    /**
     * Private helper to fetch, locate "ProductMaster", and populate cache
     */
    async initCache() {
        try {
            const response = await fetch(this.filePath);
            if (!response.ok) {
                throw new Error(`Failed to load file: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });

            // 1. Check if a worksheet is named "ProductMaster"
            let worksheet = workbook.Sheets[this.tableName];

            // 2. Fallback: If not found by exact sheet name, check if sheet name contains it
            if (!worksheet) {
                const matchedSheetName = workbook.SheetNames.find(
                    name => name.toLowerCase() === this.tableName.toLowerCase()
                );
                if (matchedSheetName) {
                    worksheet = workbook.Sheets[matchedSheetName];
                }
            }

            // 3. Fallback: Default to the first sheet if specific name is missing
            if (!worksheet) {
                console.warn(`Sheet "${this.tableName}" not found. Falling back to first sheet: ${workbook.SheetNames[0]}`);
                worksheet = workbook.Sheets[workbook.SheetNames[0]];
            }

            // Convert worksheet to JSON rows
            const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            console.log(rawRows)
            // Map rows preserving EXACT original order
            const productLabels = rawRows.map((row, index) => {
                return {
                    id: index + 1, // Unique ID for TomSelect
                    labelWidth: Number(row['labelWidth']) || 0,
                    labelHeight: Number(row['labelHeight']) || 0,
                    qtyPerPaper: Number(row['qtyPerPaper']) || 0,
                    productName: this.cleanValue(row['productName']),
                    colour: this.cleanValue(row['colour']),
                    density: this.cleanValue(row['density']),
                    finish: this.cleanValue(row['finish']),
                    thicknessUnit: this.cleanValue(row['thicknessUnit']),
                    widthUnit: this.cleanValue(row['widthUnit']),
                    lengthUnit: this.cleanValue(row['lengthUnit']),
                    packing: this.cleanValue(row['packing']),
                    lotNo: this.cleanValue(row['lotNo'])
                };
            });

            console.log(`Loaded ${productLabels.length} rows from sheet "${this.tableName}"`);
            return productLabels;

        } catch (error) {
            console.error('Error reading Excel file:', error);
            return [];
        }
    }

    /**
     * Returns cached product labels instantly (or waits for the initial load if still pending)
     */
    async loadProductLabels() {
        return await this.cachePromise;
    }
}

export const excelServiceManager = new ExcelServiceManager();