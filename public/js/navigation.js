export function createNavigationController({
    setCurrentTab,
    routeForTab,
    setAppRoute,
    refreshCurrentView,
    renderSavedGradients,
}) {
    window.switchMainTab = (tab, el) => {
        setCurrentTab(tab);

        // Every bottom navigation tab starts at the top of the main scroll area.
        const scrollArea = document.getElementById('mainScrollArea');
        if (scrollArea) scrollArea.scrollTo({ top: 0, behavior: 'instant' });
        if (!window.__wallzyApplyingRoute && typeof routeForTab === 'function') {
            const route = routeForTab(tab);
            if (window.location.pathname !== route) { window.__wallzyStartPageTransition?.(); setAppRoute(route); }
        }

        const gridContainer = document.getElementById('wallpaperGridContainer');
        const studioContainer = document.getElementById('gradientStudioMount');
        const tiktokContainer = document.getElementById('tiktokDownloaderContainer');
        const categoryNav = document.getElementById('categoryNav');
        const searchBarContainer = document.getElementById('searchBarContainer');
        if (!gridContainer || !studioContainer || !tiktokContainer || !categoryNav || !searchBarContainer) return;

        ['navExploreBtn', 'navFavBtn', 'navStudioBtn', 'navTikTokBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.className = 'flex flex-col items-center space-y-0.5 text-gray-400 hover:text-white cursor-pointer transition';
            const icon = btn.querySelector('i');
            if (icon) icon.className = icon.className.replace('text-white', 'text-gray-400');
        });

        if (el) {
            el.className = 'flex flex-col items-center space-y-0.5 text-white cursor-pointer transition';
            const icon = el.querySelector('i');
            if (icon) icon.className = icon.className.replace('text-gray-400', 'text-white');
        }

        gridContainer.classList.add('hidden');
        studioContainer.classList.add('hidden');
        tiktokContainer.classList.add('hidden');

        if (tab === 'studio') {
            studioContainer.classList.remove('hidden');
            categoryNav.classList.add('hidden');
            searchBarContainer.classList.add('hidden');
        } else if (tab === 'tiktok') {
            tiktokContainer.classList.remove('hidden');
            categoryNav.classList.add('hidden');
            searchBarContainer.classList.add('hidden');
        } else {
            if (tab === 'explore') {
                // Switching back from Favorites/Studio/TikTok must not leave
                // the previous view's DOM nodes or rendered-id cache behind.
                // Wallpaper grid is now owned by React.
                // Do not mutate or clear its DOM from the legacy navigation layer.
                window.resetWallpaperRenderer?.();
            }
            gridContainer.classList.remove('hidden');
            categoryNav.classList.remove('hidden');
            searchBarContainer.classList.remove('hidden');
            refreshCurrentView();
        }
        window.refreshTopControlsHeight?.();
    };
}
