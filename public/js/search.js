export function createSearchController({ onSearch, onClear }) {
    let timer = null;
    let lastValue = '';

    window.handleSearchInput = (val) => {
        const value = String(val || '').trim().toLowerCase();
        if (value === lastValue) return;
        lastValue = value;
        clearTimeout(timer);
        timer = setTimeout(() => onSearch?.(value), value ? 300 : 0);
    };

    window.clearSearch = () => {
        lastValue = '';
        clearTimeout(timer);
        window.__wallzySetSearchValue?.('');
        onClear?.();
    };
}
