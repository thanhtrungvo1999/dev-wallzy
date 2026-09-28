export function createWallpaperRenderer({
    getWallpapers,
    getCloudFavorites,
    getCurrentCategory,
    getSearchQuery,
    getDisplayedCount,
    getHasMoreCloudImages,
    isSkeletonActive,
    isCategoryLoading,
    getThumbnailUrl
}) {
    let shuffledAll = [];
    let shuffledSignature = '';
    let renderedIds = new Set();
    let renderedViewSignature = '';
    const qualityCache = new Map();
    const qualityProbePromises = new Map();

    function getQualityLabel(width, height) {
        const maxDimension = Math.max(Number(width) || 0, Number(height) || 0);
        if (maxDimension >= 7680) return '8K';
        if (maxDimension >= 5120) return '6K';
        if (maxDimension >= 3840) return '4K';
        if (maxDimension >= 2560) return '2K';
        if (maxDimension >= 1920) return 'FHD';
        if (maxDimension >= 1280) return 'HD';
        return 'SD';
    }

    function updateQualityBadge(tag, url) {
        const source = String(url || '').trim();
        if (!tag || !source) return;

        const cached = qualityCache.get(source);
        if (cached) {
            tag.textContent = cached;
            tag.classList.remove('hidden');
            return;
        }

        let probe = qualityProbePromises.get(source);
        if (!probe) {
            probe = new Promise(resolve => {
                const probeImage = new Image();
                probeImage.decoding = 'async';
                probeImage.onload = () => resolve(getQualityLabel(probeImage.naturalWidth, probeImage.naturalHeight));
                probeImage.onerror = () => resolve('');
                probeImage.src = source;
            }).then(label => {
                qualityProbePromises.delete(source);
                if (label) qualityCache.set(source, label);
                return label;
            });
            qualityProbePromises.set(source, probe);
        }

        probe.then(label => {
            if (!label || !tag.isConnected) return;
            tag.textContent = label;
            tag.classList.remove('hidden');
        });
    }

    function getStableAllOrder(list) {
        const incomingById = new Map(list.map(w => [String(w.id), w]));

        if (!shuffledSignature) {
            shuffledAll = [...list];
            for (let i = shuffledAll.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledAll[i], shuffledAll[j]] = [shuffledAll[j], shuffledAll[i]];
            }
        } else {
            const knownIds = new Set(shuffledAll.map(w => String(w.id)));
            const newItems = [];
            list.forEach(w => {
                if (!knownIds.has(String(w.id))) {
                    newItems.push(w);
                    knownIds.add(String(w.id));
                }
            });

            for (let i = newItems.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newItems[i], newItems[j]] = [newItems[j], newItems[i]];
            }
            shuffledAll.push(...newItems);
            shuffledAll = shuffledAll.filter(w => incomingById.has(String(w.id)));
        }

        shuffledSignature = list.map(w => String(w.id)).join('|');
        return shuffledAll;
    }

    function filterItemsBySearchAndCategory(list, category) {
        let res = category === 'all'
            ? list
            : list.filter(w => (w.category || '').toLowerCase().includes(category.toLowerCase()));

        const query = getSearchQuery();
        if (query.length > 0) {
            res = res.filter(w => JSON.stringify(w).toLowerCase().includes(query));
        }
        return res;
    }

    function bindImage(img, wallpaper) {
        img.addEventListener('load', () => {
            img.classList.remove('opacity-0');
            img.previousElementSibling?.remove();
        });
        img.addEventListener('error', () => window.handleImageError?.(img));
        img.addEventListener('click', () => { const navigate = window.__wallzyNavigateToWallpaper; if (typeof navigate === 'function') navigate(wallpaper); else if (typeof window.wallpaperPath === 'function') window.location.href = window.wallpaperPath(wallpaper); });
    }

    function createWallpaperCard(w, isFav, isPriority = false) {
        const card = document.createElement('div');
        card.className = 'wallzy-card relative group rounded-3xl overflow-hidden bg-[#0a0a0c] aspect-[9/16] cursor-pointer shadow border border-white/10';
        card.style.contentVisibility = 'auto';

        const skeleton = document.createElement('div');
        skeleton.className = 'absolute inset-0 skeleton-wave z-0';

        const img = document.createElement('img');
        img.dataset.originalSrc = w.url || '';
        img.loading = isPriority ? 'eager' : 'lazy';
        img.fetchPriority = isPriority ? 'high' : 'auto';
        img.decoding = 'async';
        img.sizes = '(max-width: 640px) 50vw, 300px';
        img.className = 'w-full h-full object-cover relative z-10 transition-opacity duration-500 opacity-0';
        const altTitle = String(w.title || w.category || '4K UHD Wallpaper').trim() || '4K UHD Wallpaper';
        img.alt = altTitle + ' wallpaper';
        bindImage(img, w);
        img.src = getThumbnailUrl(w.url);

        if (img.complete) {
            if (img.naturalWidth > 0) {
                img.classList.remove('opacity-0');
                img.previousElementSibling?.remove();
            } else {
                window.handleImageError?.(img);
            }
        }

        const qualityTag = document.createElement('div');
        qualityTag.className = 'absolute top-2 left-2 z-20 hidden px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[9px] font-bold uppercase tracking-[0.08em] text-white shadow-lg pointer-events-none';
        qualityTag.setAttribute('aria-hidden', 'true');
        card.appendChild(qualityTag);
        updateQualityBadge(qualityTag, w.url);

        const categoryTag = document.createElement('div');
        const categoryLabel = String(w.category || 'Wallpaper').trim() || 'Wallpaper';
        categoryTag.className = 'absolute bottom-2 left-2 z-20 max-w-[calc(100%-3.5rem)] px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[9px] font-semibold uppercase tracking-[0.08em] text-white/90 shadow-lg truncate pointer-events-none';
        categoryTag.textContent = '#' + categoryLabel;

        const favButton = document.createElement('button');
        favButton.type = 'button';
        favButton.className = 'absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-xs text-white hover:bg-black/80 transition border border-white/20';
        favButton.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Add to favorites');
        favButton.addEventListener('click', event => {
            event.stopPropagation();
            window.toggleFavorite?.(w.id);
        });

        const icon = document.createElement('i');
        icon.dataset.favoriteId = w.id;
        icon.className = isFav ? 'fa-solid text-white fa-heart' : 'fa-regular text-white fa-heart';
        favButton.appendChild(icon);

        card.append(skeleton, img, categoryTag, favButton);
        return card;
    }

    function renderWallpapers(category = 'all') {
        const grid = document.getElementById('wallpaperGrid');
        const paginationContainer = document.getElementById('paginationContainer');
        if (!grid) return;

        const viewSignature = category + '|' + getSearchQuery();
        if (viewSignature !== renderedViewSignature) {
            renderedViewSignature = viewSignature;
            grid.replaceChildren();
            renderedIds.clear();
        }

        if (isSkeletonActive() || isCategoryLoading()) {
            grid.replaceChildren();
            renderedIds.clear();
            renderedViewSignature = '';
            for (let i = 0; i < 4; i++) {
                const skeleton = document.createElement('div');
                skeleton.className = 'relative group rounded-3xl overflow-hidden aspect-[9/16] shadow-sm skeleton-wave';
                grid.appendChild(skeleton);
            }

            // Keep the Load more bar visible while the database request is
            // still pending, so the user gets immediate feedback instead of
            // an empty gap at the bottom of the feed.
            if (paginationContainer) {
                paginationContainer.classList.remove('hidden');
                const button = paginationContainer.querySelector('#loadMoreBtn');
                if (button) {
                    button.disabled = true;
                    button.innerHTML = '<span class="inline-flex items-center justify-center gap-2"><span class="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"></span><span>Loading...</span></span>';
                    button.classList.add('opacity-70', 'cursor-wait');
                }
            }
            return;
        }

        const activeSearchQuery = getSearchQuery();
        // Database search is global. Do not apply the currently selected
        // category as a second client-side filter, otherwise a search such
        // as "Anime" returns empty whenever another category tab is active.
        let filtered = activeSearchQuery
            ? getWallpapers()
            : filterItemsBySearchAndCategory(getWallpapers(), category);

        if (category === 'all' && !activeSearchQuery) {
            filtered = getStableAllOrder(filtered);
        }

        const existingEmpty = grid.querySelector('[data-wallzy-empty-state="1"]');

        if (filtered.length === 0) {
            if (!existingEmpty) {
                const empty = document.createElement('div');
                empty.dataset.wallzyEmptyState = '1';
                empty.className = 'col-span-2 text-center py-12 text-gray-500 text-xs';
                empty.textContent = 'No matching wallpapers found.';
                grid.appendChild(empty);
            }
            paginationContainer?.classList.add('hidden');
            return;
        }

        existingEmpty?.remove();

        // The loading state is only for the pending database request. Once
        // data has arrived, always restore the button to its normal state.
        const loadMoreButton = paginationContainer?.querySelector('#loadMoreBtn');
        if (loadMoreButton) {
            loadMoreButton.disabled = false;
            loadMoreButton.textContent = 'Load more';
            loadMoreButton.classList.remove('opacity-70', 'cursor-wait');
        }

        const fragment = document.createDocumentFragment();
        filtered.slice(0, getDisplayedCount()).forEach((w, index) => {
            if (renderedIds.has(String(w.id))) return;
            fragment.appendChild(
                createWallpaperCard(w, getCloudFavorites().some(f => f.id === w.id), index < 4)
            );
            renderedIds.add(String(w.id));
        });
        grid.appendChild(fragment);

        if (getHasMoreCloudImages?.()) paginationContainer?.classList.remove('hidden');
        else paginationContainer?.classList.add('hidden');
    }

    function resetRenderState() {
        renderedIds.clear();
        renderedViewSignature = '';
        shuffledAll = [];
        shuffledSignature = '';
    }

    function renderFavoritesView() {
        const grid = document.getElementById('wallpaperGrid');
        document.getElementById('paginationContainer')?.classList.add('hidden');
        if (!grid) return;

        grid.replaceChildren();
        renderedIds.clear();

        const filtered = filterItemsBySearchAndCategory(getCloudFavorites(), getCurrentCategory());
        if (filtered.length === 0) {
            const wrapper = document.createElement('div');
            wrapper.className = 'col-span-2 flex items-center justify-center px-4 py-6';

            const card = document.createElement('div');
            card.className = 'w-full max-w-sm rounded-[28px] border border-white/10 bg-[#0a0a0c]/80 backdrop-blur-xl px-6 py-8 text-center shadow-2xl';

            const iconBox = document.createElement('div');
            iconBox.className = 'mx-auto mb-5 w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center';
            const icon = document.createElement('i');
            icon.className = 'fa-regular fa-heart text-2xl text-white/50';
            iconBox.appendChild(icon);

            const title = document.createElement('h3');
            title.className = 'text-white text-sm font-semibold tracking-wide mb-2';
            title.textContent = 'Your favorites are empty';

            const text = document.createElement('p');
            text.className = 'text-white/40 text-xs leading-5 max-w-[260px] mx-auto';
            text.textContent = 'Save wallpapers you love and they’ll appear here.';

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'mt-6 px-5 py-2.5 rounded-full bg-white text-black text-xs font-semibold active:scale-95 transition-transform';
            button.textContent = 'Explore wallpapers';
            button.addEventListener('click', () => window.navigateWallzy?.('explore'));

            card.append(iconBox, title, text, button);
            wrapper.appendChild(card);
            grid.appendChild(wrapper);
            return;
        }

        const fragment = document.createDocumentFragment();
        filtered.forEach(w => fragment.appendChild(createWallpaperCard(w, true)));
        grid.appendChild(fragment);
    }

    return { renderWallpapers, renderFavoritesView, resetRenderState };
}
