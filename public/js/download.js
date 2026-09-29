// Wallzy download and ad flow
        window.openAdModal = (urlToDownload, customFilename = null) => {
            window.__wallzyOpenDownloadAd?.(urlToDownload, customFilename);
        };

        window.closeDownloadAdModal = () => {
            window.__wallzyCloseDownloadAd?.();
        };

        window.skipDownloadAdAndStart = () => {
            window.__wallzySkipDownloadAd?.();
        };

        window.showRewardedAdThenDownload = () => {
            const wallpaper = window.__wallzyGetCurrentWallpaper?.();
            if (wallpaper?.url) window.__wallzyOpenDownloadAd?.(wallpaper.url);
        };

        function setDownloadLoading(visible, title = 'Preparing download', status = 'Getting the original wallpaper...') {
            window.__wallzySetDownloadLoading?.(visible, title, status);
        }

        window.startDownloadDirectly = async (urlToDownload = null, customFilename = null) => {
            const targetUrl = urlToDownload || window.__wallzyGetCurrentWallpaper?.()?.url;
            if (!targetUrl) return;

            const originalUrl = targetUrl;
            const wallpaperId = customFilename ? customFilename.replace('.jpg', '') : (window.__wallzyGetCurrentWallpaper?.()?.id || Date.now());
            const defaultFilename = customFilename || `wallzy-${wallpaperId}.jpg`;

            const getExtension = (type) => {
                const clean = (type || '').split(';')[0].toLowerCase();
                if (clean === 'image/png') return 'png';
                if (clean === 'image/webp') return 'webp';
                if (clean === 'image/avif') return 'avif';
                if (clean === 'image/gif') return 'gif';
                return 'jpg';
            };

            const getFilename = (type) => customFilename || `wallzy-${wallpaperId}.${getExtension(type)}`;

            const saveBlobAsFile = (blob, filename) => {
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename;
                link.setAttribute('download', filename);
                link.rel = 'noopener';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
            };

            const fetchImage = async (url, timeout = 12000) => {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), timeout);
                try {
                    const response = await fetch(url, {
                        mode: 'cors',
                        cache: 'force-cache',
                        credentials: 'omit',
                        signal: controller.signal
                    });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const blob = await response.blob();
                    if (!blob || !blob.size) throw new Error('Empty image');
                    return { response, blob };
                } finally {
                    clearTimeout(timer);
                }
            };

            setDownloadLoading(true, 'Downloading', 'Getting the original image...');

            try {
                let result;
                try {
                    result = await fetchImage(originalUrl, 15000);
                } catch (directError) {
                    console.warn('Direct image download failed:', directError);
                    
                    const fallbackUrl = `/api/download?url=${encodeURIComponent(originalUrl)}&name=${encodeURIComponent(defaultFilename)}`;
                    setDownloadLoading(true, 'Downloading', 'Preparing the file...');

                    const fallbackLink = document.createElement('a');
                    fallbackLink.href = fallbackUrl;
                    fallbackLink.download = defaultFilename;
                    fallbackLink.setAttribute('download', defaultFilename);
                    fallbackLink.rel = 'noopener';
                    fallbackLink.style.display = 'none';
                    document.body.appendChild(fallbackLink);
                    fallbackLink.click();
                    fallbackLink.remove();

                    setDownloadLoading(false);
                    showMessage('Downloading file...');
                    return;
                }

                const sourceBlob = result.blob;
                const responseType = (result.response.headers.get('content-type') || '').split(';')[0].toLowerCase();
                const imageType = sourceBlob.type.startsWith('image/') ? sourceBlob.type : (responseType.startsWith('image/') ? responseType : 'image/jpeg');
                const fileBlob = sourceBlob.type === imageType ? sourceBlob : new Blob([sourceBlob], { type: imageType });
                const filename = getFilename(imageType);

                setDownloadLoading(false);
                saveBlobAsFile(fileBlob, filename);
                showMessage('Downloading file...');
            } catch (error) {
                setDownloadLoading(false);
                if (error?.name === 'AbortError') {
                    showMessage('The image took too long to load. Please try again.');
                    return;
                }
                console.error('Wallzy download error:', error);
                
                // Ultimate fallback for cross-origin URLs if they don't have Content-Disposition header
                const link = document.createElement('a');
                link.href = originalUrl;
                link.download = defaultFilename;
                link.setAttribute('download', defaultFilename);
                link.target = "_blank";
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        };

