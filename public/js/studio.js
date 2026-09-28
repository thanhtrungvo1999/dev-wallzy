// Wallzy gradient studio actions. UI/state are owned by React.
function getGradientState() {
    return window.__wallzyGradientState || {
        color1: '#111111',
        color2: '#ffffff',
        type: 'to bottom right'
    };
}

window.saveCustomGradient = async () => {
    const state = getGradientState();
    const save = window.__wallzySaveGradient;
    if (!save) {
        window.__wallzyShowMessage?.('Please sign in first.');
        return;
    }
    await save({
        id: Date.now(),
        color1: state.color1,
        color2: state.color2,
        type: state.type,
        created_at: new Date().toISOString()
    });
};

function downloadGradientData(state, filename = 'wallzy-gradient.png') {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = state.type === 'circle'
        ? ctx.createRadialGradient(540, 960, 0, 540, 960, 960)
        : ctx.createLinearGradient(
            state.type === 'to right' ? 0 : 0,
            state.type === 'to bottom' ? 0 : 0,
            1080,
            state.type === 'to bottom' ? 1920 : 1920
        );

    gradient.addColorStop(0, state.color1 || '#111111');
    gradient.addColorStop(1, state.color2 || '#ffffff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
}

window.downloadCustomGradient = () => {
    downloadGradientData(getGradientState());
};

window.__wallzyDownloadGradient = gradient => {
    if (!gradient) return;
    downloadGradientData({
        color1: gradient.color1,
        color2: gradient.color2,
        type: gradient.type
    }, 'wallzy-gradient.png');
};

window.renderSavedGradients = function renderSavedGradients() {};
