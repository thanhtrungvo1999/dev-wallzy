export function createNavigationController({
    setCurrentTab,
    routeForTab,
    setAppRoute,
    refreshCurrentView,
    renderSavedGradients,
}) {
    window.switchMainTab = (tab) => {
        setCurrentTab(tab);

        window.__wallzySwitchMainTab?.(tab);

        const scrollArea = document.getElementById('mainScrollArea');
        if (scrollArea) scrollArea.scrollTo({ top: 0, behavior: 'instant' });

        if (!window.__wallzyApplyingRoute && typeof routeForTab === 'function') {
            const route = routeForTab(tab);
            if (window.location.pathname !== route) {
                window.__wallzyStartPageTransition?.();
                setAppRoute(route);
            }
        }

        if (tab === 'explore' || tab === 'favorites') {
            if (tab === 'explore') window.resetWallpaperRenderer?.();
            refreshCurrentView();
        }

        window.refreshTopControlsHeight?.();
    };
}
