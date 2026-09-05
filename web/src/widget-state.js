const STORAGE_KEY = "sentinel.collapsedWidgets";

const DEFAULTS = {
  "inactive-securities": true,
  composition: true,
  "forward-return": true,
};

function readState() {
  try {
    const stored = window.localStorage?.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function widgetCollapsed(id) {
  return Boolean(readState()[id]);
}

export function storeWidgetCollapsed(id, collapsed) {
  try {
    window.localStorage?.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...readState(), [id]: Boolean(collapsed) }),
    );
  } catch {
    // The widgets remain usable when browser storage is unavailable.
  }
}
