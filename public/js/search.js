export function createSearchController({ onSearch, onClear }) {
    let timer = null;
    let lastValue = '';

    window.handleSearchInput = (val) => {
        const value = String(val || '').trim().toLowerCase();
        const clearBtn = document.getElementById('clearSearchBtn');
        if (clearBtn) clearBtn.classList.toggle('hidden', value.length === 0);

        if (value === lastValue) return;
        lastValue = value;
        clearTimeout(timer);
        timer = setTimeout(() => onSearch?.(value), value ? 300 : 0);
    };

    window.clearSearch = () => {
        const input = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearSearchBtn');
        if (input) input.value = '';
        if (clearBtn) clearBtn.classList.add('hidden');
        lastValue = '';
        clearTimeout(timer);
        onClear?.();
    };
}
