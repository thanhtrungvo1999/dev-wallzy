let currentUserId = null;

export function setLoginUser(user) {
  currentUserId = user?.id ? String(user.id) : null;
  window.__wallzyUserId = currentUserId;
}

export function isLoggedIn() {
  return Boolean(currentUserId);
}

export function requireLogin(message = "Please sign in to save wallpapers.") {
  if (isLoggedIn()) return true;
  window.openAuthModal?.();
  window.showMessage?.(message);
  return false;
}

window.__wallzyIsLoggedIn = isLoggedIn;
window.__wallzyRequireLogin = requireLogin;
