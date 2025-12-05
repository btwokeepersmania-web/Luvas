const ELFSIGHT_SCRIPT_SRC = 'https://elfsightcdn.com/platform.js';

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

let loadPromise = null;

const callWidgetInit = () => {
  if (typeof window === 'undefined') return;
  if (window.ELFSIGHT_APP?.widgets?.init) {
    try {
      window.ELFSIGHT_APP.widgets.init();
    } catch (error) {
      console.warn('Elfsight widget initialisation failed', error);
    }
  }
};

export const loadElfsightPlatform = () => {
  if (!isBrowser) {
    return Promise.resolve(false);
  }

  const existingScript = document.querySelector(`script[src="${ELFSIGHT_SCRIPT_SRC}"]`);
  if (existingScript) {
    callWidgetInit();
    return Promise.resolve(true);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = ELFSIGHT_SCRIPT_SRC;
    script.async = true;

    script.onload = () => {
      callWidgetInit();
      resolve(true);
    };

    script.onerror = (error) => {
      console.warn('Failed to load Elfsight script', error);
      script.remove();
      loadPromise = null;
      reject(error);
    };

    document.body.appendChild(script);
  });

  return loadPromise;
};

export const ELFSIGHT_SCRIPT_URL = ELFSIGHT_SCRIPT_SRC;
