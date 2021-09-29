import { useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from 'react-use';

export function useDocumentResize({ useFirstChild } = {}) {
  const ref = useRef();
  const [hiddenHeight, setHiddenHeight] = useState();

  useIsomorphicLayoutEffect(() => {
    if (!ref.current) {
      return;
    }

    const node = useFirstChild
      ? ref.current.firstChild || ref.current
      : ref.current;
    const nodeRect = node.getBoundingClientRect();
    const requiredHeight =
      nodeRect.height + (nodeRect.top > 0 ? nodeRect.top : nodeRect.bottom);

    if (document.body.clientHeight < requiredHeight) {
      setHiddenHeight(requiredHeight + 10);
    }
  });

  useIsomorphicLayoutEffect(() => {
    if (
      !isNaN(hiddenHeight) &&
      typeof window !== 'undefined' &&
      window.AP &&
      window.AP.resize
    ) {
      window.AP.resize('100%', `${hiddenHeight}px`);
    }
  }, [hiddenHeight]);

  return [ref, { height: hiddenHeight }];
}
