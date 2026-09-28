export function createCategoryController({
    getWallpapers,
    getCloudUploadedImages,
    getCloudCategories,
    getCurrentCategory,
    setCurrentCategory,
    resetDisplayedCount,
    refreshCurrentView,
    setCategorySEO,
    setAppRoute,
    categoryPath,
    isSkeletonActive
}) {
    function renderCategoryNav() {
        if (isSkeletonActive()) {
            window.__wallzySetCategoryLoading?.(true);
            window.__wallzySetCategoryOptions?.([]);
            return;
        }

        const wallpaperSource = [
            ...getWallpapers(),
            ...(getCloudUploadedImages?.() || [])
        ];

        let categories = Array.from(new Set([
            ...(getCloudCategories?.() || []),
            ...wallpaperSource.map(w => w.category?.trim()).filter(Boolean)
        ]));
        categories.sort((a, b) => a.localeCompare(b));

        const otherIndex = categories.findIndex(c => c.toLowerCase() === 'other');
        if (otherIndex > -1) categories.push(categories.splice(otherIndex, 1)[0]);

        window.__wallzySetCategoryLoading?.(false);
        window.__wallzySetCategoryOptions?.(categories);
        window.__wallzySetActiveCategory?.(getCurrentCategory());

        window.refreshTopControlsHeight?.();
        requestAnimationFrame(() => {
            window.refreshTopControlsHeight?.();
            requestAnimationFrame(() => window.refreshTopControlsHeight?.());
        });
    }

    window.filterCategory = (cat) => {
        setCurrentCategory(cat);
        window.__wallzySetActiveCategory?.(cat);
        resetDisplayedCount();

        // Every category switch starts from the top of the feed.
        const scrollArea = document.getElementById('mainScrollArea');
        if (scrollArea) scrollArea.scrollTo({ top: 0, behavior: 'instant' });

        const route = categoryPath(cat);
        if (window.location.pathname !== route) setAppRoute(route);

        setCategorySEO(cat);
        refreshCurrentView();
    };

    return { renderCategoryNav };
}
