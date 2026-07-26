import { appPaperSizeManager } from "../services/paper_size_manager.js";

export function loadTomSelectPaperSize() {
    const element = document.getElementById('paper-size-select');
    if (!element) return null;

    // Clear any existing hardcoded options from HTML
    element.innerHTML = '';

    // Get standardized objects from our factory
    const paperSizes = appPaperSizeManager.getAllStandardSizes();

    // Map our class instances into the data format TomSelect expects
    const selectOptions = paperSizes.map(paper => ({
        value: paper.name,
        text: paper.name
    }));

    // Initialize TomSelect with programmatically injected options
    const tsInstance = new TomSelect('#paper-size-select', {
        plugins: ['dropdown_input'],
        options: selectOptions,
        valueField: 'value',
        labelField: 'text',
        searchField: ['text'],
        items: ['A4'], // Sets the default selected value
    });

    // Fire the manager's state change when a user selects a new option
    tsInstance.on('change', (value) => {
        if (value) {
            appPaperSizeManager.setPaperSize(value);
        }
    });

    return tsInstance;
}