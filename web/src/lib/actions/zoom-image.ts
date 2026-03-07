import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
import { createZoomImageWheel } from '@zoom-image/core';

export const zoomImageAction = (
  node: HTMLElement,
  options?: { disablePointer?: boolean; zoomTarget?: HTMLElement },
) => {
  const zoomInstance = createZoomImageWheel(node, {
    maxZoom: 10,
    initialState: assetViewerManager.zoomState,
    zoomTarget: options?.zoomTarget,
  });

  const unsubscribes = [
    assetViewerManager.on({ ZoomChange: (state) => zoomInstance.setState(state) }),
    zoomInstance.subscribe(({ state }) => assetViewerManager.onZoomChange(state)),
  ];

  const stopPointerIfDisabled = (event: Event) => {
    if (options?.disablePointer) {
      event.stopImmediatePropagation();
    }
  };

  const controller = new AbortController();
  const { signal } = controller;

  node.addEventListener('pointerdown', stopPointerIfDisabled, { capture: true, signal });

  // Capture wheel events from sibling overlays (e.g. face editor) so zoom still works with editor open
  const forwardWheelFromSiblings = (event: WheelEvent) => {
    const target = event.target as Element;
    if (!node.contains(target) && !target.closest('[data-ignore-zoom]')) {
      event.stopPropagation();
      node.dispatchEvent(new WheelEvent(event.type, event));
    }
  };

  node.parentElement?.addEventListener('wheel', forwardWheelFromSiblings, { capture: true, signal });

  node.style.overflow = 'visible';
  return {
    update(newOptions?: { disablePointer?: boolean; zoomTarget?: HTMLElement }) {
      options = newOptions;
      if (newOptions?.zoomTarget !== undefined) {
        zoomInstance.setState({ zoomTarget: newOptions.zoomTarget });
      }
    },
    destroy() {
      controller.abort();
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
      zoomInstance.cleanup();
    },
  };
};
