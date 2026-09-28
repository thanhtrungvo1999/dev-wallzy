import "./download.js";
import "./studio.js";
import "./scroll.js";
import { getThumbnailUrl } from "./image-utils.js";
import "./ui-modals.js";
import { requireLogin, setLoginUser } from "./login-check.js";
import { createNavigationController } from "./navigation.js";
import { createCategoryController } from "./category.js";

        let app, db, auth, appId, userId = null;
        let wallpapers = [], cloudFavorites = [], cloudCustomGradients = [], cloudUploadedImages = [];
        let allWallpapersCache = [], allHasMoreCloudImages = false, allLoadMoreImagesFromBackend = null;
        let hasMoreCloudImages = false, isLoadingMoreCloudImages = false, loadMoreImagesFromBackend = null, getImageByIdFromBackend = null, searchWallpapersFromBackend = null;
        let currentTab = 'explore', currentCategory = 'all', searchQuery = '';
        let cloudCategories = [];
        let displayedCount = 20, loadStepCount = 20, isSkeletonActive = true, isCategoryLoading = false, isWallpaperDataReady = false, invalidUrlActive = false;
        const SKELETON_MIN_TIME = 700;
        const skeletonStartedAt = Date.now();

        function hideSplashScreen() {
            const splashScreen = document.getElementById('splashScreen');
            const body = document.getElementById('bodyElement');
            if (!splashScreen || splashScreen.dataset.wallzyHidden === '1') return;
            splashScreen.dataset.wallzyHidden = '1';
            splashScreen.style.opacity = '0';
            // Keep body overflow locked so the viewport width does not change
            // when the splash disappears and cause appContainer to jump.
            setTimeout(() => { splashScreen.style.display = 'none'; }, 350);
        }
        let pageProgressTimer = null;
        let pageProgressStartedAt = 0;
        function startPageTransitionProgress() {
            const progress = document.getElementById('pageTransitionProgress');
            if (!progress) return;
            clearTimeout(pageProgressTimer);
            pageProgressStartedAt = Date.now();
            progress.classList.remove('is-complete');
            progress.classList.add('is-active');
        }
        function finishPageTransitionProgress() {
            const progress = document.getElementById('pageTransitionProgress');
            if (!progress) return;
            clearTimeout(pageProgressTimer);
            const elapsed = Date.now() - pageProgressStartedAt;
            const wait = Math.max(0, 420 - elapsed);
            pageProgressTimer = setTimeout(() => {
                progress.classList.remove('is-active');
                progress.classList.add('is-complete');
                setTimeout(() => progress.classList.remove('is-complete'), 300);
            }, wait);
        }
        window.__wallzyStartPageTransition = startPageTransitionProgress;
        window.__wallzyFinishPageTransition = finishPageTransitionProgress;

        function getExploreHistoryState() {
            const scrollArea = document.getElementById('mainScrollArea');
            const searchInput = document.getElementById('searchInput');
            return {
                type: 'wallzy-explore',
                category: currentCategory,
                search: searchInput?.value || searchQuery || '',
                scrollTop: scrollArea?.scrollTop || 0,
                displayedCount,
                timestamp: Date.now()
            };
        }

        function markCurrentExploreHistoryState() {
            try {
                const current = window.history.state && typeof window.history.state === 'object'
                    ? window.history.state
                    : {};
                window.history.replaceState(
                    { ...current, __wallzyExploreState: getExploreHistoryState() },
                    '',
                    window.location.href
                );
            } catch (e) {
                console.warn('[Wallzy] Could not save browser history state:', e);
            }
        }

        function restoreExploreHistoryState(state) {
            if (!state || state.type !== 'wallzy-explore') return false;
            currentCategory = state.category || 'all';
            searchQuery = String(state.search || '');

            window.__wallzySetSearchValue?.(searchQuery);

            displayedCount = Number(state.displayedCount) || displayedCount;
            invalidUrlActive = false;
            document.getElementById('invalidUrlScreen')?.classList.add('hidden');

            // The Explore shell never unmounted, so render only if the
            // visible UI needs synchronizing. No database call is made here.
            categoryController.renderCategoryNav();

            requestAnimationFrame(() => {
                const scrollArea = document.getElementById('mainScrollArea');
                if (scrollArea) scrollArea.scrollTop = Number(state.scrollTop) || 0;
            });

            return true;
        }

        window.__wallzyPrepareDetailNavigation = () => {
            markCurrentExploreHistoryState();
        };

        function saveExploreState() {
            try {
                const scrollArea = document.getElementById('mainScrollArea');
                const searchInput = document.getElementById('searchInput');
                sessionStorage.setItem('wallzy_explore_state', JSON.stringify({
                    category: currentCategory,
                    search: searchInput?.value || searchQuery || '',
                    scrollTop: scrollArea?.scrollTop || 0,
                    images: cloudUploadedImages,
                    allImages: allWallpapersCache,
                    displayedCount,
                    hasMore: hasMoreCloudImages,
                    allHasMore: allHasMoreCloudImages
                }));
            } catch (e) { console.warn('[Wallzy] Could not save Explore state:', e); }
        }

        window.__wallzySaveExploreState = saveExploreState;

        function restoreExploreState() {
            try {
                const raw = sessionStorage.getItem('wallzy_explore_state');
                if (!raw) return false;
                const state = JSON.parse(raw);
                sessionStorage.removeItem('wallzy_explore_state');
                if (Array.isArray(state.images) && state.images.length) cloudUploadedImages = state.images;
                if (Array.isArray(state.allImages) && state.allImages.length) allWallpapersCache = state.allImages;
                currentCategory = state.category || 'all';
                searchQuery = String(state.search || '');
                displayedCount = Number(state.displayedCount) || cloudUploadedImages.length || 20;
                hasMoreCloudImages = Boolean(state.hasMore);
                allHasMoreCloudImages = Boolean(state.allHasMore);
                window.__wallzySetSearchValue?.(searchQuery);
                categoryController.renderCategoryNav();
                updateWallpapersList();
                requestAnimationFrame(() => {
                    const scrollArea = document.getElementById('mainScrollArea');
                    if (scrollArea) scrollArea.scrollTop = Number(state.scrollTop) || 0;
                });
                return true;
            } catch (e) {
                sessionStorage.removeItem('wallzy_explore_state');
                console.warn('[Wallzy] Could not restore Explore state:', e);
                return false;
            }
        }

        
        setTimeout(() => {
            if (!isWallpaperDataReady) {
                isSkeletonActive = false; isWallpaperDataReady = true;
                updateWallpapersList(); checkUrlParamForImage();
                hideSplashScreen();
            }
        }, 10000);

        function initTopControlsHideOnScroll() {
            const scrollArea = document.getElementById('mainScrollArea');
            const wrapper = document.getElementById('topControlsWrapper');
            const header = document.getElementById('headerEl');
            const footer = document.getElementById('footerEl');
            if (!scrollArea || !wrapper || !header) return;

            let lastScrollTop = 0, isHidden = false, isHeaderHidden = false, ticking = false;
            const threshold = 6;
            let headerH = header.offsetHeight, wrapperH = wrapper.offsetHeight;

            function applyLayout() {
                wrapper.style.top = (isHeaderHidden ? 0 : headerH) + 'px';
                scrollArea.style.paddingTop = (headerH + wrapperH + 8) + 'px';
                wrapper.style.transform = isHidden ? `translateY(-${wrapperH}px)` : 'translateY(0)';
                header.style.transform = isHeaderHidden ? `translateY(-${headerH}px)` : 'translateY(0)';
            }
            function showHeader() { if (!isHeaderHidden) return; isHeaderHidden = false; header.style.transform = 'translateY(0)'; wrapper.style.top = headerH + 'px'; }
            function hideHeader() { if (isHeaderHidden) return; isHeaderHidden = true; header.style.transform = `translateY(-${headerH}px)`; wrapper.style.top = '0px'; }
            function show() {
                if (!isHidden) return; isHidden = false;
                wrapper.style.transform = 'translateY(0)'; wrapper.style.opacity = '1'; wrapper.style.pointerEvents = '';
                if (footer) { footer.style.transform = 'translateY(0)'; footer.style.opacity = '1'; footer.style.pointerEvents = ''; }
            }
            function hide() {
                if (isHidden) return; isHidden = true;
                wrapper.style.transform = `translateY(-${wrapperH}px)`; wrapper.style.opacity = '0'; wrapper.style.pointerEvents = 'none';
                if (footer) { footer.style.transform = 'translateY(150%)'; footer.style.opacity = '0'; footer.style.pointerEvents = 'none'; }
            }

            applyLayout(); wrapper.style.opacity = '1';
            const remeasure = () => { headerH = header.offsetHeight; wrapperH = wrapper.offsetHeight; applyLayout(); };
            if (window.ResizeObserver) { const ro = new ResizeObserver(remeasure); ro.observe(header); ro.observe(wrapper); } 
            else window.addEventListener('resize', remeasure);

            scrollArea.addEventListener('scroll', () => {
                if (ticking) return; ticking = true;
                requestAnimationFrame(() => {
                    const maxScroll = Math.max(0, scrollArea.scrollHeight - scrollArea.clientHeight);
                    const st = Math.min(Math.max(0, scrollArea.scrollTop), maxScroll);
                    const delta = st - lastScrollTop;
                    if (st <= threshold) { show(); showHeader(); lastScrollTop = st; } 
                    else {
                        hideHeader();
                        if (st >= maxScroll - threshold) lastScrollTop = st;
                        else if (delta > threshold) { hide(); lastScrollTop = st; } 
                        else if (delta < -threshold) { show(); lastScrollTop = st; }
                    }
                    ticking = false;
                });
            }, { passive: true });
            window.refreshTopControlsHeight = remeasure;
        }

        async function bootstrapBackend() {
            try {
                const [{ initBackend }, { createAuthController }] = await Promise.all([
                    import("./backend.js"),
                    import("./auth.js")
                ]);
                let authController;
                const backend = await initBackend({
                    onImagesLoaded: (images, hasMore = false) => {
                        if (!isWallpaperDataReady) {
                            cloudUploadedImages = images;
                            allWallpapersCache = [...images];
                            allHasMoreCloudImages = Boolean(hasMore);
                            allLoadMoreImagesFromBackend = loadMoreImagesFromBackend;
                            displayedCount = images.length;
                        } else if (images?.length) {
                            cloudUploadedImages = [...cloudUploadedImages, ...images];
                            displayedCount += images.length;
                        }
                        hasMoreCloudImages = Boolean(hasMore);

                        const finishInitialLoad = () => {
                            restoreExploreState();
                            isSkeletonActive = false;
                            isWallpaperDataReady = true;
                            updateWallpapersList();
                            checkUrlParamForImage();
                            hideSplashScreen();
                        };

                        const elapsed = Date.now() - skeletonStartedAt;
                        const remaining = Math.max(0, SKELETON_MIN_TIME - elapsed);
                        setTimeout(finishInitialLoad, remaining);
                    },
                    onCategoriesLoaded: categories => {
                        cloudCategories = Array.isArray(categories) ? categories : [];
                        categoryController.renderCategoryNav();
                    },
                    onImagesError: () => {
                        isSkeletonActive = false; isWallpaperDataReady = true; cloudUploadedImages = [];
                        updateWallpapersList(); checkUrlParamForImage();
                        hideSplashScreen();
                    },
                    onAuthUser: user => {
                        if (user) {
                            userId = user.id; setLoginUser(user); authController?.updateAuthUIState(user);
                        } else {
                            userId = null; setLoginUser(null); authController?.updateAuthUIState(null); cloudFavorites = []; cloudCustomGradients = []; window.__wallzySetFavoriteIds?.([]); window.__wallzySetGradients?.([]);
                            if (currentTab !== 'tiktok') refreshCurrentView();
                        }
                    },
                    onFavorites: items => {
                        cloudFavorites = items;
                        window.__wallzySetFavoriteIds?.((items || []).map(item => String(item?.id || '')).filter(Boolean));
                        if (currentTab !== 'tiktok') refreshCurrentView();
                    },
                    onGradients: d => {
                        if (d.exists() && d.data().items) cloudCustomGradients = Array.isArray(d.data().items) ? d.data().items : [];
                        else cloudCustomGradients = [];
                        window.__wallzySetGradients?.(cloudCustomGradients);
                        if (currentTab === 'studio') window.renderSavedGradients?.();
                    },
                    onLoadMoreReady: loader => {
                        loadMoreImagesFromBackend = loader;
                        allLoadMoreImagesFromBackend = loader;
                    }
                });
                app = backend.app; db = backend.db; auth = backend.auth; appId = backend.appId;
                getImageByIdFromBackend = backend.getImageById; window.__wallzySaveGradient = async gradient => { if (!userId || !backend.saveGradient) { showMessage("Please sign in first."); return null; } try { const items = await backend.saveGradient(gradient); cloudCustomGradients = items || []; window.__wallzySetGradients?.(cloudCustomGradients); return items; } catch (error) { console.error("[Wallzy] Gradient save failed:", error); showMessage("Unable to save gradient. Please try again."); return null; } };
        window.__wallzyDeleteGradient = async gradientId => { if (!userId || !backend.deleteGradient) { showMessage("Please sign in first."); return null; } try { const items = await backend.deleteGradient(gradientId); cloudCustomGradients = items || []; window.__wallzySetGradients?.(cloudCustomGradients); return items; } catch (error) { console.error("[Wallzy] Gradient delete failed:", error); showMessage("Unable to delete gradient."); return null; } };
                searchWallpapersFromBackend = backend.searchWallpapers;
                authController = createAuthController({ getAuth: backend.auth });

                // initBackend invokes onImagesLoaded before it returns, so a
                // direct /category/... route can run before the global db
                // reference is assigned. Re-apply the route after the backend
                // is fully initialized so category pagination gets its loader.
                if (/^\/category\//i.test(window.location.pathname)) {
                    void applyRouteFromUrl();
                }
            } catch (e) {
                console.error('[Wallzy] Backend bootstrap failed:', e);
            }
        }


        const initWallzyApp = () => {
            try { markCurrentExploreHistoryState(); } catch (e) {}
            const splashScreen = document.getElementById('splashScreen');
            const body = document.getElementById('bodyElement');
            try { updateWallpapersList(); } catch (e) {}
            try { initTopControlsHideOnScroll(); } catch (e) {}
            bootstrapBackend();

            // Keep the splash visible until the first data render finishes.
            // The splash is dismissed by finishInitialLoad/onImagesError below,
            // so it never swaps early to the skeleton and causes a layout jump.
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initWallzyApp, { once: true });
        else initWallzyApp();

        window.showMessage = msg => {
            if (window.__wallzyShowMessage) return window.__wallzyShowMessage(String(msg || ''));
            const text = document.getElementById('msgText');
            const modal = document.getElementById('msgModal');
            if (text && modal) {
                text.innerText = String(msg || '');
                modal.classList.remove('hidden');
            }
        };
        window.closeMsgModal = () => {
            if (window.__wallzyCloseMessage) return window.__wallzyCloseMessage();
            document.getElementById('msgModal')?.classList.add('hidden');
        };
        window.openInstallModal = () => {
            if (window.__wallzyOpenInstallModal) return window.__wallzyOpenInstallModal();
            document.getElementById('installModal')?.classList.remove('hidden');
        };
        window.closeInstallModal = () => {
            if (window.__wallzyCloseInstallModal) return window.__wallzyCloseInstallModal();
            document.getElementById('installModal')?.classList.add('hidden');
        };
        window.openAuthModal = () => window.__wallzyOpenAuthModal?.();
        window.closeAuthModal = () => window.__wallzyCloseAuthModal?.();

        function categorySlug(category) {
            return String(category || 'all').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'all';
        }
        function categoryPath(category) {
            return '/category/' + categorySlug(category);
        }
        function findCategoryFromPath(path) {
            const match = path.match(/^\/category\/([^/]+)\/?$/i);
            if (!match) return null;
            const slug = match[1].toLowerCase();

            // "all" is a valid category route even though it is not stored
            // as a category value in the database.
            if (slug === 'all') return 'all';

            return cloudCategories.find(category => categorySlug(category) === slug)
                || wallpapers.find(w => categorySlug(w.category) === slug)?.category
                || cloudUploadedImages.find(w => categorySlug(w.category) === slug)?.category
                || null;
        }
        function setCategorySEO(category) {
            const name = category || 'All Wallpapers';
            const title = name === 'All Wallpapers' ? 'Wallzy - 4K UHD Wallpapers' : name + ' Wallpapers - Wallzy';
            const description = name === 'All Wallpapers'
                ? 'Discover free 4K UHD wallpapers for your phone on Wallzy.'
                : 'Explore free ' + name + ' wallpapers for your phone on Wallzy.';
            document.title = title;
            const descriptionEl = document.getElementById('pageDescription');
            const ogTitle = document.getElementById('ogTitle');
            const ogDescription = document.getElementById('ogDescription');
            const twitterTitle = document.getElementById('twitterTitle');
            const twitterDescription = document.getElementById('twitterDescription');
            const canonical = document.getElementById('canonicalUrl');
            const ogUrl = document.getElementById('ogUrl');
            const twitterUrl = document.getElementById('twitterUrl');
            const url = window.location.origin + window.location.pathname;
            if (descriptionEl) descriptionEl.content = description;
            if (ogTitle) ogTitle.content = title;
            if (ogDescription) ogDescription.content = description;
            if (twitterTitle) twitterTitle.content = title;
            if (twitterDescription) twitterDescription.content = description;
            if (canonical) canonical.href = url;
            if (ogUrl) ogUrl.content = url;
            if (twitterUrl) twitterUrl.content = url;
        }

        function wallpaperSlug(w) { return String(w?.title || w?.category || 'wallpaper').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'wallpaper'; }
        function wallpaperPath(w) { return `/wallpaper/${wallpaperSlug(w)}-${encodeURIComponent(String(w.id))}`; }
        function wallpaperIdFromPath(path = window.location.pathname) {
            const cleanPath = String(path || '').replace(/\/+$/, '');
            const match = cleanPath.match(/^\/wallpaper\/(.+)$/i);
            if (!match) return null;
            const tail = match[1];

            // UUIDs contain hyphens, so parse the complete UUID instead of the final segment.
            const uuid = tail.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
            if (uuid) return uuid[1];

            const numeric = tail.match(/-(\d+)$/);
            if (numeric) return numeric[1];

            const legacy = tail.match(/-(.+)$/);
            if (!legacy) return null;
            try { return decodeURIComponent(legacy[1]); } catch (e) { return null; }
        }

        function findWallpaperFromPath() {
            const encodedId = wallpaperIdFromPath();
            if (!encodedId) return null;
            return wallpapers.find(w => String(w.id) === String(encodedId)) || cloudFavorites.find(w => String(w.id) === String(encodedId)) || null;
        }
        function clearWallpaperSEO() {
            document.title = 'Wallzy - 4K UHD Wallpapers';
            const canonical = document.getElementById('canonicalUrl');
            const ogUrl = document.getElementById('ogUrl');
            const twitterUrl = document.getElementById('twitterUrl');
            const url = window.location.origin + window.location.pathname;
            if (canonical) canonical.href = url;
            if (ogUrl) ogUrl.content = url;
            if (twitterUrl) twitterUrl.content = url;
        }

        function setAppRoute(route, replace = false) {
            const cleanRoute = route || '/';
            try {
                if (replace) window.history.replaceState({ wallzyRoute: cleanRoute }, '', cleanRoute);
                else window.history.pushState({ wallzyRoute: cleanRoute }, '', cleanRoute);
            } catch (e) {}
        }

        function routeForTab(tab) {
            if (tab === 'favorites') return '/favorites';
            if (tab === 'studio') return '/studio';
            if (tab === 'tiktok') return '/tiktok';
            return '/explore';
        }

        let searchRequestToken = 0;
        let searchLoader = null;

        async function runDatabaseSearch(query) {
            searchRequestToken += 1;
            const token = searchRequestToken;
            searchQuery = String(query || '').trim().toLowerCase();
            displayedCount = 20;
            searchLoader = null;

            const searchScrollArea = document.getElementById('mainScrollArea');
            if (searchScrollArea) searchScrollArea.scrollTo({ top: 0, behavior: 'instant' });

            if (!searchQuery) {
                if (currentCategory !== 'all' && typeof window.filterCategory === 'function') {
                    await window.filterCategory(currentCategory);
                    return;
                }
                cloudUploadedImages = [...allWallpapersCache];
                wallpapers = [...cloudUploadedImages];
                hasMoreCloudImages = Boolean(allHasMoreCloudImages);
                loadMoreImagesFromBackend = allLoadMoreImagesFromBackend;
                
                refreshCurrentView();
                return;
            }

            if (currentTab !== 'explore') {
                
                refreshCurrentView();
                return;
            }

            isCategoryLoading = true;
            cloudUploadedImages = [];
            wallpapers = [];
            hasMoreCloudImages = false;
            loadMoreImagesFromBackend = null;
            
            refreshCurrentView();

            const categoryAtStart = currentCategory;
            const loadSearchPage = async (offset = 0) => {
                if (!searchQuery || token !== searchRequestToken) return { images: [], hasMore: false };
                if (typeof searchWallpapersFromBackend !== 'function') throw new Error('Search backend is not ready.');
                const result = await searchWallpapersFromBackend(searchQuery, categoryAtStart, offset);
                if (token !== searchRequestToken) return { images: [], hasMore: false };
                return result;
            };

            try {
                const page = await loadSearchPage(0);
                if (token !== searchRequestToken) return;

                cloudUploadedImages = [...page.images];
                wallpapers = [...page.images];
                displayedCount = page.images.length;
                hasMoreCloudImages = Boolean(page.hasMore);
                isCategoryLoading = false;

                searchLoader = async () => {
                    const offset = cloudUploadedImages.length;
                    const next = await loadSearchPage(offset);
                    if (token !== searchRequestToken) return { images: [], hasMore: false };
                    return next;
                };
                loadMoreImagesFromBackend = searchLoader;
                refreshCurrentView();
            } catch (error) {
                if (token !== searchRequestToken) return;
                isCategoryLoading = false;
                hasMoreCloudImages = false;
                console.error('[Wallzy] Search failed:', error);
                showMessage('Unable to search wallpapers. Please try again.');
                refreshCurrentView();
            }
        }

        window.__wallzySearch = runDatabaseSearch;

        createNavigationController({
            getCurrentTab: () => currentTab,
            setCurrentTab: tab => { currentTab = tab; },
            routeForTab,
            setAppRoute,
            refreshCurrentView,
            renderSavedGradients: () => window.renderSavedGradients?.(),
        });


        const categoryController = createCategoryController({
            getWallpapers: () => wallpapers,
            getCloudUploadedImages: () => cloudUploadedImages,
            getCloudCategories: () => cloudCategories,
            getCurrentCategory: () => currentCategory,
            setCurrentCategory: value => { currentCategory = value; },
            resetDisplayedCount: () => { displayedCount = 20; },
            refreshCurrentView: () => refreshCurrentView(),
            setCategorySEO,
            setAppRoute,
            categoryPath,
            isSkeletonActive: () => isSkeletonActive,
            isCategoryLoading: () => isCategoryLoading
        });

        // Each category keeps its own paginated state in memory.
        // The "all" view reuses the main feed cache so Home, Explore and
        // /category/all never issue duplicate database reads.
        function shuffleCategoryBatch(images, categoryKey, pageOffset) {
            const list = [...images];
            let seed = 2166136261;
            const seedText = String(categoryKey) + ':' + String(pageOffset);
            for (let i = 0; i < seedText.length; i++) {
                seed ^= seedText.charCodeAt(i);
                seed = Math.imul(seed, 16777619);
            }
            const random = () => {
                seed += 0x6D2B79F5;
                let t = seed;
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
            for (let i = list.length - 1; i > 0; i--) {
                const j = Math.floor(random() * (i + 1));
                [list[i], list[j]] = [list[j], list[i]];
            }
            return list;
        }

        const categoryPagesCache = new Map();
        const allCategoryCache = {
            get images() { return allWallpapersCache; },
            get hasMore() { return allHasMoreCloudImages; },
            get loadMore() { return allLoadMoreImagesFromBackend; }
        };

        // Categories use the same 20-row pagination pattern as the home feed.
        const defaultFilterCategory = window.filterCategory;
        window.filterCategory = async (cat, el) => {
            defaultFilterCategory?.(cat, el);

            if (searchQuery) {
                await runDatabaseSearch(searchQuery);
                return;
            }

            const categoryName = String(cat || '').trim();
            const categoryKey = categoryName.toLowerCase() || 'all';

            const cached = categoryPagesCache.get(categoryKey);
            if (cached) {
                cloudUploadedImages = [...cached.images];
                wallpapers = [...cached.images];
                displayedCount = cached.images.length;
                hasMoreCloudImages = cached.hasMore;
                loadMoreImagesFromBackend = cached.loadMore;
                refreshCurrentView();
                return;
            }

            if (categoryKey === 'all') {
                if (!allWallpapersCache.length) {
                    console.warn('[Wallzy] All category cache is not ready yet.');
                    return;
                }

                cloudUploadedImages = [...allCategoryCache.images];
                wallpapers = [...allCategoryCache.images];
                displayedCount = allCategoryCache.images.length;
                hasMoreCloudImages = allCategoryCache.hasMore;
                loadMoreImagesFromBackend = allCategoryCache.loadMore;
                refreshCurrentView();
                return;
            }

            const categoryDb = db?.from ? db : window.__wallzySupabase;
            if (!categoryDb?.from) {
                console.warn('[Wallzy] Category database is not ready yet.');
                return;
            }

            const state = {
                images: [],
                offset: 0,
                hasMore: true,
                loading: false
            };

            // Keep the first page for this browser session so switching back
            // or re-entering the same category does not hit the database again.
            const categoryCacheKey = `wallzy:category-cache:${categoryKey}`;
            try {
                const cachedRaw = sessionStorage.getItem(categoryCacheKey);
                if (cachedRaw) {
                    const cachedData = JSON.parse(cachedRaw);
                    const fresh = Date.now() - Number(cachedData?.savedAt || 0) < 10 * 60 * 1000;
                    if (fresh && Array.isArray(cachedData?.images) && cachedData.images.length) {
                        state.images = cachedData.images;
                        state.offset = state.images.length;
                        state.hasMore = Boolean(cachedData.hasMore);
                    }
                }
            } catch {}

            const loadCategoryPage = async () => {
                if (state.loading || !state.hasMore) return { images: [], hasMore: false };
                state.loading = true;
                try {
                    let query = categoryDb
                        .from('wallpapers')
                        .select('id,category,keywords,storage_path,public_url,created_at')
                        .order('created_at', { ascending: false })
                        .order('id', { ascending: false })
                        .range(state.offset, state.offset + 19);

                    if (categoryKey !== 'all') {
                        query = query.eq('category', categoryName);
                    }

                    const { data, error, count } = await query;
                    if (error) throw error;

                    const fetchedImages = (data || []).map(row => {
                        const storagePath = String(row.storage_path || '').trim();
                        const url = storagePath
                            ? (storagePath.startsWith('http://') || storagePath.startsWith('https://')
                                ? storagePath
                                : `https://img.wallzy.org/${storagePath.replace(/^\/+/, '')}`)
                            : (row.public_url || row.url || '');

                        return {
                            id: String(row.id),
                            url,
                            title: row.title || row.name || '',
                            category: row.category || 'Other',
                            keywords: Array.isArray(row.keywords) ? row.keywords : [],
                            timestamp: row.created_at || row.timestamp || '',
                            quality: row.quality || '4K',
                            storage_path: storagePath
                        };
                    });

                    // Each category gets its own deterministic shuffle seed.
                    // The page offset is part of the seed so page 2+ is also
                    // shuffled without changing the already-loaded page.
                    const images = shuffleCategoryBatch(fetchedImages, categoryKey, state.offset);
                    state.images.push(...images);
                    state.offset += images.length;
                    state.hasMore = images.length === 20;

                    try {
                        sessionStorage.setItem(categoryCacheKey, JSON.stringify({
                            savedAt: Date.now(),
                            images: state.images,
                            hasMore: state.hasMore
                        }));
                    } catch {}

                    return { images, hasMore: state.hasMore };
                } finally {
                    state.loading = false;
                }
            };

            categoryPagesCache.set(categoryKey, state);

            try {
                isLoadingMoreCloudImages = false;
                isCategoryLoading = true;
                cloudUploadedImages = [];
                wallpapers = [];
                hasMoreCloudImages = false;
                loadMoreImagesFromBackend = loadCategoryPage;
                refreshCurrentView();

                if (state.images.length === 0) {
                    // Let the browser paint the loading state first. Without
                    // yielding here, a fast request can finish before the
                    // spinner/skeleton is ever visible on screen.
                    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                    await loadCategoryPage();
                }

                // Do not let an old request overwrite a newer category.
                if (String(currentCategory || '').toLowerCase() !== categoryKey) return;

                cloudUploadedImages = [...state.images];
                wallpapers = [...state.images];
                displayedCount = state.images.length;
                hasMoreCloudImages = state.hasMore;
                loadMoreImagesFromBackend = loadCategoryPage;
                isCategoryLoading = false;
                refreshCurrentView();
            } catch (error) {
                isCategoryLoading = false;
                categoryPagesCache.delete(categoryKey);
                console.error('[Wallzy] Category load failed:', error);
                showMessage('Unable to load this category. Please try again.');
                refreshCurrentView();
            }
        };

        function updateWallpapersList() {
            wallpapers = [...cloudUploadedImages];
            categoryController.renderCategoryNav();
            refreshCurrentView();
        }

        function refreshCurrentView() {
            window.__wallzySetWallpaperView?.({
                mode: currentTab === 'favorites' ? 'favorites' : 'explore',
                items: currentTab === 'favorites' ? [...cloudFavorites] : [...wallpapers],
                favorites: [...cloudFavorites],
                category: currentCategory,
                search: searchQuery,
                displayedCount,
                hasMore: currentTab === 'explore' && hasMoreCloudImages,
                loading: Boolean(isSkeletonActive || isCategoryLoading),
                loadingMore: Boolean(isLoadingMoreCloudImages)
            });
        }

        window.loadMoreWallpapers = async () => {
            if (isLoadingMoreCloudImages || !hasMoreCloudImages) return;

            if (typeof loadMoreImagesFromBackend !== 'function' && currentCategory !== 'all') {
                // A direct /category/[slug] route can finish its initial
                // shell render before the category loader is installed.
                // Initialize that category here instead of showing an error.
                await window.filterCategory?.(currentCategory);
            }

            const loader = loadMoreImagesFromBackend;
            if (typeof loader !== 'function') {
                return;
            }

            isLoadingMoreCloudImages = true;
            refreshCurrentView();

            try {
                const page = await loader();
                const images = Array.isArray(page?.images) ? page.images : [];

                if (images.length > 0) {
                    const existingIds = new Set(cloudUploadedImages.map(item => String(item.id)));
                    const newImages = images.filter(item => !existingIds.has(String(item.id)));

                    if (newImages.length > 0) {
                        cloudUploadedImages = [...cloudUploadedImages, ...newImages];
                        displayedCount = cloudUploadedImages.length;

                        if (currentCategory === 'all') {
                            allWallpapersCache = [...cloudUploadedImages];
                        }
                    }

                    hasMoreCloudImages = Boolean(page?.hasMore);
                    if (currentCategory === 'all') {
                        allHasMoreCloudImages = hasMoreCloudImages;
                    }
                    updateWallpapersList();
                } else {
                    hasMoreCloudImages = false;
                    updateWallpapersList();
                }
            } catch (error) {
                console.error('[Wallzy] Load more failed:', error);
                showMessage('Unable to load more wallpapers. Please try again.');
            } finally {
                isLoadingMoreCloudImages = false;
                refreshCurrentView();
            }
        };

        async function applyRouteFromUrl() {
            window.__wallzyApplyingRoute = true;
            const path = window.location.pathname.replace(/\/+$/, '') || '/';
            let wallpaper = findWallpaperFromPath();
            const categoryFromPath = findCategoryFromPath(path);

            if (!wallpaper && /^\/wallpaper\/.+/i.test(path) && getImageByIdFromBackend) {
                const encodedId = wallpaperIdFromPath(path);
                if (encodedId) {
                    try {
                        wallpaper = await getImageByIdFromBackend(encodedId);
                    } catch (error) {
                        console.error('[Wallzy] Direct wallpaper load failed:', error);
                    }
                }
            }

            if (wallpaper) {
                invalidUrlActive = false;
                document.getElementById('invalidUrlScreen')?.classList.add('hidden');
                currentTab = 'explore';
                window.__wallzyApplyingRoute = false;
                return;
            }

            let tab = 'explore';
            if (categoryFromPath) {
                currentCategory = categoryFromPath;
                displayedCount = 20;
                invalidUrlActive = false;
                document.getElementById('invalidUrlScreen')?.classList.add('hidden');
                switchMainTab('explore', document.getElementById('navExploreBtn'));
                categoryController.renderCategoryNav();
                setCategorySEO(currentCategory);

                // A direct /category/... request must load that category's
                // first database page instead of only filtering the initial
                // 20 wallpapers already in memory.
                const categoryButton = [...document.querySelectorAll('.cat-btn')]
                    .find(btn => btn.textContent?.trim().replace(/^#/, '').toLowerCase() === String(currentCategory).toLowerCase());
                if (typeof window.filterCategory === 'function') {
                    await window.filterCategory(currentCategory, categoryButton);
                }

                // After a direct category URL/reload, bring the active tab
                // into the visible horizontal category row.
                requestAnimationFrame(() => {
                    const activeCategoryButton = [...document.querySelectorAll('.cat-btn')]
                        .find(btn => btn.textContent?.trim().replace(/^#/, '').toLowerCase() === String(currentCategory).toLowerCase());
                    activeCategoryButton?.scrollIntoView({
                        behavior: 'instant',
                        block: 'nearest',
                        inline: 'center'
                    });
                });

                window.__wallzyApplyingRoute = false;
                return;
            }
            if (path === '/' || path === '/explore') tab = 'explore';
            else if (path === '/favorites') tab = 'favorites';
            else if (path === '/studio') tab = 'studio';
            else if (path === '/tiktok') tab = 'tiktok';
            else if (path !== '/') {
                invalidUrlActive = true;
                const screen = document.getElementById('invalidUrlScreen');
                if (screen) {
                    screen.classList.remove('hidden');
                    screen.classList.add('flex');
                    const pathEl = document.getElementById('invalidUrlPath');
                    if (pathEl) pathEl.textContent = window.location.pathname;
                }
                window.__wallzyApplyingRoute = false;
                return;
            }

            invalidUrlActive = false;
            document.getElementById('invalidUrlScreen')?.classList.add('hidden');

            // If Android/iPhone physical Back returned from a wallpaper URL,
            // close the detail modal instead of leaving it visible over the tab.
            const detailModal = document.getElementById('detailModal');
            if (detailModal?.classList.contains('modal-visible')) {
                window.closeModal?.();
            }

            const btnId = tab === 'favorites' ? 'navFavBtn' : tab === 'studio' ? 'navStudioBtn' : tab === 'tiktok' ? 'navTikTokBtn' : 'navExploreBtn';
            switchMainTab(tab, document.getElementById(btnId));
            if (tab === 'explore') {
                currentCategory = 'all';
                categoryController.renderCategoryNav();
            }
            clearWallpaperSEO();
            window.__wallzyApplyingRoute = false;
        }

        window.navigateWallzy = (tab, push = true) => {
            const route = routeForTab(tab);
            if (push && window.location.pathname !== route) setAppRoute(route);
            const btnId = tab === 'favorites' ? 'navFavBtn' : tab === 'studio' ? 'navStudioBtn' : tab === 'tiktok' ? 'navTikTokBtn' : 'navExploreBtn';
            switchMainTab(tab, document.getElementById(btnId));
        };

        window.goHomeFromInvalidUrl = () => {
            document.getElementById('invalidUrlScreen')?.classList.add('hidden');
            invalidUrlActive = false;
            setAppRoute('/explore', true);
            switchMainTab('explore', document.getElementById('navExploreBtn'));
            clearWallpaperSEO();
        };
        window.goBackFromInvalidUrl = () => {
            if (window.history.length > 1) window.history.back();
            else window.goHomeFromInvalidUrl();
        };

        async function checkUrlParamForImage() {
            await applyRouteFromUrl();
        }

        window.addEventListener('popstate', event => {
            // Browser Back from the standalone Next.js detail route returns
            // to the existing Explore history entry. Restore that state
            // directly instead of routing/rendering/querying Supabase again.
            if (restoreExploreHistoryState(event.state?.__wallzyExploreState)) {
                return;
            }
            if (isWallpaperDataReady) void applyRouteFromUrl();
        });

        window.toggleFavorite = id => {
            if (!requireLogin()) return;
            const wallpaper = wallpapers.find(w => w.id === id); if (!wallpaper) return;
            let updated = [...cloudFavorites]; const idx = updated.findIndex(f => f.id === id);
            idx > -1 ? updated.splice(idx, 1) : updated.push(wallpaper); cloudFavorites = updated; window.__wallzySetFavoriteIds?.(cloudFavorites.map(item => String(item?.id || '')).filter(Boolean));
            if (userId && db) {
                db.from('favorites').upsert({ user_id: userId, items: cloudFavorites }, { onConflict: 'user_id' })
                    .then(({ error }) => { if (error) console.error('[Wallzy] Favorite sync failed:', error); })
                    .catch(error => console.error('[Wallzy] Favorite sync failed:', error));
            }
            if (currentTab === 'favorites') refreshCurrentView();
        };

        window.__wallzyIsFavorite = id => !!cloudFavorites.some(item => String(item?.id) === String(id));

        window.__wallzyToggleDetailFavorite = async wallpaper => {
            if (!requireLogin()) return null;
            if (!db) return null;
            const id = String(wallpaper?.id || "");
            if (!id) return null;
            const idx = cloudFavorites.findIndex(item => String(item?.id) === id);
            const updated = [...cloudFavorites];
            if (idx > -1) updated.splice(idx, 1);
            else updated.push(wallpaper);
            const { error } = await db.from('favorites')
                .upsert({ user_id: userId, items: updated }, { onConflict: 'user_id' });
            if (error) {
                console.error('[Wallzy] Detail favorite sync failed:', error);
                showMessage("Unable to update favorite. Please try again.");
                return null;
            }
            cloudFavorites = updated;
            window.__wallzySetFavoriteIds?.(cloudFavorites.map(item => String(item?.id || '')).filter(Boolean));
            if (currentTab === 'favorites') refreshCurrentView();
            return idx === -1;
        };
