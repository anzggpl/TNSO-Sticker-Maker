import { productLabelDataTableManager } from "../services/product_label_datatable_manager.js";
import { appProductLabelStagingManager } from "../services/app_product_label_staging_manager.js";

export async function loadTomSelectProductLabel() {
    const element = document.getElementById('product-label-select');
    if (!element) return null;

    element.innerHTML = '';

    // Wait for the data to actually finish loading
    const productLabels = await productLabelDataTableManager.getProductLabels();

    const selectOptions = productLabels.map((productLabel, index) => ({
        id: index + 1,
        text: productLabel.getSearchTerm(),
        searchTerm: productLabel.getSearchTerm(),
        instance: productLabel
    }));

    const tsInstance = new TomSelect('#product-label-select', {
        plugins: ['dropdown_input'],
        options: selectOptions,
        valueField: 'id',
        labelField: 'text',
        searchField: ['searchTerm', 'text'],
        maxOptions: 10,
        items: [],
    });

    tsInstance.on('change', (selectedId) => {
        if (selectedId) {
            const selectedOption = tsInstance.options[selectedId];
            if (selectedOption?.instance) {
                console.log(selectedOption.instance)
                appProductLabelStagingManager.setStagedProductLabel(selectedOption.instance);
            }
        }
    });

    return tsInstance;
}