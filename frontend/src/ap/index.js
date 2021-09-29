/**
 * @TODO: fill in what this file/class does and why it exists
 */

import { useAsync } from 'react-use';
import { createContext, useCallback, useContext, useRef } from 'react';

import { promiseTimeout, promiseTimer } from '../utils';
import {
  HAS_AP_CONTEXT,
  IS_DEV,
  IS_SERVER,
  HAS_AP_LOCATION,
  HAS_AP_DIALOG_CUSTOM_DATA,
  HAS_AP_DIALOG_CLOSE,
  HAS_AP_USER,
  SKIP_LICENSE
} from '../constants';
import fetch, { getToken } from './request';

export { fetch };

export const APContext = createContext();
export const APDialogContext = createContext();

/**
 * Retrieves information about the context of the page
 * ```
 * {
 *    jira: {
 *      issue: {
 *        issuetype: "",
 *        key: "",
 *        id: "",
 *      },
 *      project: {
 *        key: "",
 *        id: "",
 *      },
 *    },
 *  }
 * ```
 **/
export const getContext = async () => {
  if (HAS_AP_CONTEXT) {
    return promiseTimeout(resolve => {
      window.AP.context.getContext(context => {
        resolve(context);
      });
    });
  } else if (IS_DEV) {
    return Promise.resolve();
  } else {
    return Promise.reject('AP.context.getContext not found');
  }
};

/**
 * Retrieve location data of the parent iframe via AP iframe connector
 */
export const getLocation = async () => {
  if (HAS_AP_LOCATION) {
    return promiseTimeout(resolve => {
      window.AP.getLocation(location => {
        resolve(location);
      });
    });
  } else if (IS_DEV) {
    return Promise.resolve(
      process.env.NEXT_PUBLIC_SERVER_URL || window.location.href
    );
  } else {
    return Promise.reject('AP.getLocation not found');
  }
};

/**
 * Retrieve current user from JIRA
 */
export const getUser = async () => {
  if (HAS_AP_USER) {
    return promiseTimeout(resolve => {
      window.AP.user.getCurrentUser(userResponse => {
        const user = {
          accountId: userResponse.atlassianAccountId,
          accountType: userResponse.accountType
        };
        if (!user.accountType) {
          user.accountType =
            user.accountId.indexOf('gm') === 0 ? 'customer' : 'atlassian';
        }
        resolve(user);
      });
    });
  } else if (IS_DEV) {
    return Promise.resolve(await fetch('/rest/api/3/myself', {})).then(user => {
      if (!user.accountType) {
        user.accountType =
          user.accountId.indexOf('gm') === 0 ? 'customer' : 'atlassian';
      }
      return user;
    });
  } else {
    return Promise.reject('AP.getUser not found');
  }
};

/**
 * Resolves the AP.dialog.getCustomData function.
 * This is how you inject context into the dialogs.
 * Pass `customData` to the <Dialog> component and it shows up here.
 * @param {*} customData
 */
export const getDialogCustomData = async customData => {
  if (HAS_AP_DIALOG_CUSTOM_DATA) {
    return promiseTimeout(resolve => {
      window.AP.dialog.getCustomData(data => {
        resolve(data);
      });
    });
  } else if (IS_DEV) {
    return Promise.resolve(customData);
  } else {
    return Promise.reject('AP.context.getToken not found');
  }
};

/**
 * Grabs contextData if available and provides a convienent way to `close` the dialogs.
 */
export const useAPDialog = () => {
  const dialogContext = useContext(APDialogContext) || {};
  const { loading, error, value: customData } = useAsync(
    () =>
      promiseTimer(
        () => getDialogCustomData(dialogContext.customData),
        'AP Dialog'
      ),
    [dialogContext.customData]
  );

  const close = useCallback(
    data => {
      const onClose = dialogContext.onClose;
      console.log('close called', data);

      if (onClose) {
        onClose(data);
      }

      if (HAS_AP_DIALOG_CLOSE) {
        window.AP.dialog.close(data);
      }
    },
    [dialogContext.onClose]
  );

  return {
    customData,
    loading,
    close,
    error,
    options: dialogContext
  };
};

export const getLicense = () => {
  return (
    !!SKIP_LICENSE ||
    !!IS_SERVER ||
    window.location.search.indexOf('lic=none') === -1
  );
};

/**
 * Retrieves values from JIRAs AP iframe connector.
 * `token` is the most important item here
 */
export const useAP = () => {
  const { loading, error, value } = useAsync(() =>
    promiseTimer(async () => {
      const isLicensed = getLicense();

      if (typeof window === 'undefined') {
        console.log(`AP Error "window=undefined"`);
        return Promise.resolve([]);
      }

      return Promise.all([
        getContext(),
        getLocation(),
        getToken(),
        isLicensed && getUser(),
        Promise.resolve(isLicensed)
      ]);
    }, 'AP').catch(e => {
      console.log(`AP Error: ${e.toString()}`, e);
      throw e;
    })
  );

  const resizeTimeout = useRef();
  const resize = useCallback((...args) => {
    clearTimeout(resizeTimeout.current);
    resizeTimeout.current = setTimeout(() => {
      if (typeof window !== 'undefined' && window.AP && window.AP.resize) {
        if (process.env.NODE_ENV === 'development') {
          console.log('RESIZING');
        }
        window.AP.resize(...args);
      }
    }, 10);
  }, []);

  return {
    context: value ? value[0] : undefined,
    location: value ? value[1] : undefined,
    token: value ? value[2] : undefined,
    user: value ? value[3] : undefined,
    isLicensed: value ? value[4] : undefined,
    error,
    loading: loading || typeof window === 'undefined',
    resize
  };
};
