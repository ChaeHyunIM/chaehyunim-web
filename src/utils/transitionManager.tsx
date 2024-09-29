// File: src/utils/transitionManager.ts

interface TransitionManagerOptions {
  threshold?: number;
  scrollRestoreDelay?: number;
}

interface ScrollPosition {
  x: number;
  y: number;
}

interface HistoryStateWithScroll extends History {
  state: { scrollPosition?: ScrollPosition } | null;
}

declare global {
  interface Window {
    elementStates: Map<Element, string>;
  }
}

export function setupTransitionManager(options: TransitionManagerOptions = {}) {
  const defaultOptions: Required<TransitionManagerOptions> = {
    threshold: 0.1,
    scrollRestoreDelay: 100,
  };
  const config: Required<TransitionManagerOptions> = {
    ...defaultOptions,
    ...options,
  };

  let isRestoringScroll = false;

  function saveScrollPosition(): void {
    const scrollPosition: ScrollPosition = {
      x: window.scrollX,
      y: window.scrollY,
    };
    const historyWithScroll = history as HistoryStateWithScroll;
    historyWithScroll.replaceState(
      {
        ...historyWithScroll.state,
        scrollPosition,
      },
      ""
    );
  }

  function restoreScrollPosition(event: PopStateEvent): void {
    const state = (event.state || {}) as { scrollPosition?: ScrollPosition };
    if (state.scrollPosition) {
      isRestoringScroll = true;
      window.scrollTo(state.scrollPosition.x, state.scrollPosition.y);
      setTimeout(() => {
        isRestoringScroll = false;
      }, config.scrollRestoreDelay);
    }
  }

  function handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      const element = entry.target;
      const scopeValue =
        window.elementStates.get(element) ||
        element.dataset["astroTransitionScope"] ||
        "";

      if (entry.isIntersecting) {
        element.setAttribute("data-astro-transition-scope", scopeValue);
      } else {
        element.removeAttribute("data-astro-transition-scope");
      }

      window.elementStates.set(element, scopeValue);
    });
  }

  function setupObserver(): void {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: config.threshold,
    });

    const elements = document.querySelectorAll<Element>(
      "[data-astro-transition-scope]"
    );
    elements.forEach(el => {
      observer.observe(el);
      window.elementStates.set(el, el.dataset["astroTransitionScope"] || "");
    });
  }

  function cleanupElementStates(): void {
    window.elementStates.forEach((value, element) => {
      if (!document.body.contains(element)) {
        window.elementStates.delete(element);
      }
    });
  }

  function init(): void {
    if (typeof window === "undefined") return;

    window.elementStates = window.elementStates || new Map();

    document.addEventListener("astro:page-load", () => {
      setupObserver();
      cleanupElementStates();
    });

    document.addEventListener("astro:before-preparation", saveScrollPosition);

    window.addEventListener("popstate", restoreScrollPosition);

    window.addEventListener(
      "scroll",
      () => {
        if (!isRestoringScroll) {
          saveScrollPosition();
        }
      },
      { passive: true }
    );

    document.addEventListener("astro:after-swap", event => {
      event.preventDefault();
      restoreScrollPosition({ state: history.state } as PopStateEvent);
    });
  }

  return { init };
}
