function getThumbnailUrl(originalUrl, width = 600) {
    if (!originalUrl || originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) return originalUrl;

    try {
        const url = new URL(originalUrl);

        // Cloudflare R2 custom domain + Image Transformations.
        // Grid/detail images are delivered at 600px; downloads keep using originalUrl.
        if (url.hostname === 'img.wallzy.org') {
            return `https://img.wallzy.org/cdn-cgi/image/width=600,quality=75,format=auto${url.pathname}${url.search}`;
        }

        return originalUrl;
    } catch (e) {
        return originalUrl;
    }
}

window.handleImageError = (imgElement) => {
    imgElement.onerror = null;
    const originalUrl = imgElement.dataset.originalSrc;
    if (originalUrl && imgElement.dataset.thumbnailFallback !== '1') {
        imgElement.dataset.thumbnailFallback = '1';
        imgElement.src = originalUrl;
        return;
    }
    imgElement.src = 'https://placehold.co/600x900/0a0a0c/ffffff?text=Image+Unavailable';
    imgElement.classList.remove('opacity-0');
    if (imgElement.previousElementSibling) imgElement.previousElementSibling.remove();
    imgElement.onclick = null;
    const card = imgElement.closest('.group');
    if (card) {
        card.classList.remove('cursor-pointer');
        const favBtn = card.querySelector('button');
        if (favBtn) favBtn.style.display = 'none';
    }
};

window.handleModalImageError = (imgElement) => {
    const originalUrl = imgElement.dataset.originalSrc;
    if (originalUrl && imgElement.dataset.thumbnailFallback !== '1') {
        imgElement.dataset.thumbnailFallback = '1';
        imgElement.onerror = null;
        imgElement.src = originalUrl;
        return;
    }
    imgElement.onerror = null;
    imgElement.src = 'https://placehold.co/600x900/0a0a0c/ffffff?text=Image+Unavailable';
    imgElement.classList.remove('opacity-0');
    document.getElementById('modalImgSkel')?.classList.add('hidden');
    window.showMessage?.("Error: Unable to load images from the server.");
};

export { getThumbnailUrl };
