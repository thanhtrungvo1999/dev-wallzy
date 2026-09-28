function getActiveAuthModal(){const modals=document.querySelectorAll('[id="authModal"]');if(!modals.length)return null;return window.location.pathname.startsWith("/wallpaper/")?modals[modals.length-1]:modals[0]}
window.showMessage = msg => { document.getElementById('msgText').innerText = msg; document.getElementById('msgModal').classList.remove('hidden'); };
window.closeMsgModal = () => document.getElementById('msgModal').classList.add('hidden');
window.openInstallModal = () => document.getElementById('installModal').classList.remove('hidden');
window.closeInstallModal = () => document.getElementById('installModal').classList.add('hidden');
window.openAuthModal = () => getActiveAuthModal()?.classList.remove('hidden');
window.closeAuthModal = () => getActiveAuthModal()?.classList.add('hidden');
export {};