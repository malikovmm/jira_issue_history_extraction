import React, { useEffect, useMemo, useRef } from 'react';
import { omit } from 'underscore';
import { useIsomorphicLayoutEffect, usePrevious } from 'react-use';

import { APDialogContext, useAPDialog } from '.';

const DialogWrapper = props => {
  useIsomorphicLayoutEffect(() => {
    document.body.classList.add('ap-dialog');
  }, []);

  return props.children;
};

/**
 * Provides a convienent way to launch and control dialogs using AP.dialog.create
 * with support for emulating the dialogs outside of JIRA iframe.
 * @todo implement handling for props.buttons
 * @param {*} props
 */
const APDialog = props => {
  const { children, show } = props;
  const dialog = useAPDialog();
  const options = useMemo(
    () => ({
      ...omit(props, 'children', 'show')
    }),
    // eslint-disable-next-line
    [
      props.id, // remaps to `key`
      props.size,
      props.width,
      props.height,
      props.chrome,
      props.heading,
      props.submitText,
      props.cancelText,
      props.customData,
      props.closeOnEscape,
      props.buttons,
      props.hint,
      // custom
      props.onClose
    ]
  );

  const launched = useRef(false);
  const lastShow = usePrevious(show);
  const isHandledOrLoading =
    dialog.loading || !!dialog.customData || launched.current;
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.AP &&
      window.AP.dialog &&
      show &&
      (!isHandledOrLoading || !lastShow || show !== lastShow) &&
      !!options.id
    ) {
      const dialogOptions = {
        key: options.id,
        shouldCloseOnEscapePress: options.closeOnEscape,
        ...options,
        customData: options.customData || {}
      };
      const apDialog = window.AP.dialog.create(dialogOptions);
      launched.current = true;
      apDialog.on('close', data => {
        launched.current = false;

        if (process.env.NODE_ENV === 'development') {
          console.log('"close" event called', dialogOptions);
        }

        if (options.onClose) {
          options.onClose(data);
        }
      });
    }
  }, [show, isHandledOrLoading, options, lastShow]);

  useEffect(() => {
    if (
      !show &&
      launched.current &&
      options.id &&
      window.AP &&
      window.AP.dialog &&
      window.AP.dialog.close
    ) {
      window.AP.dialog.close();
    }
  }, [show, options]);

  if (dialog.loading) {
    return null;
  }

  if (dialog.customData) {
    return <DialogWrapper>{children}</DialogWrapper>;
  } else if (typeof window !== 'undefined' && window.AP && !window.AP.dialog) {
    return (
      <APDialogContext.Provider value={options}>
        {children}
      </APDialogContext.Provider>
    );
  } else {
    return null;
  }
};

export default APDialog;

APDialog.defaultProps = {
  chrome: false,
  width: '100%',
  height: '100%',
  closeOnEscape: false,
  submitText: 'Submit',
  cancelText: 'Cancel',
  customData: {}
};
