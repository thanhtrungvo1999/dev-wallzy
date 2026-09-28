// Wallzy gradient studio actions are rendered by React.
// Keep the legacy globals as compatibility bridges for existing callers.
window.saveCustomGradient = () => {
    window.__wallzyShowMessage?.("Saved local gradient!");
};
window.downloadCustomGradient = () => {
    window.__wallzyShowMessage?.("Not implemented in this snippet");
};
window.renderSavedGradients = function renderSavedGradients() {};
