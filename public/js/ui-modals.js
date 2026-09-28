window.showMessage = msg => window.__wallzyShowMessage?.(String(msg || ''));
window.closeMsgModal = () => window.__wallzyCloseMessage?.();
window.openInstallModal = () => window.__wallzyOpenInstallModal?.();
window.closeInstallModal = () => window.__wallzyCloseInstallModal?.();
window.openAuthModal = () => window.__wallzyOpenAuthModal?.();
window.closeAuthModal = () => window.__wallzyCloseAuthModal?.();
export {};