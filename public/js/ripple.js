(() => {
    if (window.__wallzyRippleStarted) return;
    window.__wallzyRippleStarted = true;

    const styleId = 'wallzy-native-touch-style';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .ripple-target {
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
                position: relative !important;
                overflow: hidden !important;
            }
            .ripple-target.ripple-press {
                transform: scale(.985);
                filter: brightness(.92);
            }
            .native-ripple {
                position: absolute;
                z-index: 2147483647;
                pointer-events: none;
                border-radius: 9999px;
                background: rgba(255,255,255,.22);
                transform: translate(-50%, -50%) scale(0);
                animation: wallzy-native-ripple 420ms ease-out forwards;
            }
            @keyframes wallzy-native-ripple {
                0% { opacity: .48; transform: translate(-50%, -50%) scale(0); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
            }
            @media (prefers-reduced-motion: reduce) {
                .native-ripple { animation-duration: 120ms; }
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    const selector = [
        'button',
        '[role="button"]',
        'a',
        'img[onclick]',
        '.cursor-pointer'
    ].join(',');

    let lastTouchTime = 0;

    function targetFromEvent(e) {
        const el = e.target?.closest?.(selector);
        if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return null;
        if (!document.body.contains(el)) return null;
        return el;
    }

    function showRipple(target, clientX, clientY) {
        const rect = target.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        target.classList.remove('ripple-press');
        void target.offsetWidth;
        target.classList.add('ripple-target', 'ripple-press');

        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const radius = Math.max(rect.width, rect.height) * 0.9 + Math.hypot(x - rect.width / 2, y - rect.height / 2);

        const ripple = document.createElement('span');
        ripple.className = 'native-ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.width = radius * 2 + 'px';
        ripple.style.height = radius * 2 + 'px';

        target.appendChild(ripple);
        window.setTimeout(() => {
            ripple.remove();
            target.classList.remove('ripple-press');
        }, 430);
    }

    function onPointerDown(e) {
        const target = targetFromEvent(e);
        if (!target) return;
        if (e.pointerType === 'touch') lastTouchTime = Date.now();
        showRipple(target, e.clientX, e.clientY);
    }

    function onTouchStart(e) {
        const target = targetFromEvent(e);
        if (!target || !e.touches?.[0]) return;
        lastTouchTime = Date.now();
        const touch = e.touches[0];
        showRipple(target, touch.clientX, touch.clientY);
    }

    function onClick(e) {
        // Touch already got its visual feedback from touchstart/pointerdown.
        if (Date.now() - lastTouchTime < 700) return;
        const target = targetFromEvent(e);
        if (!target) return;
        showRipple(target, e.clientX || 0, e.clientY || 0);
    }

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    document.addEventListener('click', onClick, true);
})();
