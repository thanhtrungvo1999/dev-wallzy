// Wallzy gradient studio actions. UI/state are owned by React.
function getGradientState() {
    return window.__wallzyGradientState || {
        color1: '#111111',
        color2: '#ffffff',
        type: 'to bottom right'
    };
}

window.saveCustomGradient = () => {
    const state = getGradientState();
    try {
        const key = 'wallzy_local_gradients';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const gradients = Array.isArray(existing) ? existing : [];
        gradients.unshift({
            id: Date.now(),
            color1: state.color1,
            color2: state.color2,
            type: state.type
        });
        localStorage.setItem(key, JSON.stringify(gradients.slice(0, 50)));
        window.__wallzyShowMessage?.('Saved local gradient!');
    } catch (error) {
        console.error('[Wallzy] Save gradient failed:', error);
        window.__wallzyShowMessage?.('Unable to save gradient.');
    }
};

window.downloadCustomGradient = () => {
    const state = getGradientState();
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = state.type === 'circle'
        ? ctx.createRadialGradient(540, 960, 0, 540, 960, 960)
        : ctx.createLinearGradient(
            state.type === 'to right' ? 0 : state.type === 'to bottom right' ? 0 : 0,
            state.type === 'to bottom' ? 0 : 0,
            state.type === 'to right' ? 1080 : 1080,
            state.type === 'to bottom' ? 1920 : 1920
        );

    gradient.addColorStop(0, state.color1);
    gradient.addColorStop(1, state.color2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
        if (!blob) {
            window.__wallzyShowMessage?.('Unable to create gradient.');
            return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'wallzy-gradient.png';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
};

window.renderSavedGradients = function renderSavedGradients() {};
