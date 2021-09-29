import { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { useIsomorphicLayoutEffect } from 'react-use';
import URI from 'urijs';
import { omit } from 'underscore';
import { HAS_AP_HISTORY, IS_SERVER } from '../constants';

export const getCurrentURL = (
  location = IS_SERVER ? undefined : window.location
) => {
  const uri = !IS_SERVER
    ? URI(location.pathname).search(location.search)
    : undefined;
  const url =
    uri &&
    uri
      .search(
        omit(uri.search(true), [
          'xdm_e',
          'xdm_c',
          'cp',
          'xdm_deprecated_addon_key_do_not_use',
          'lic',
          'cv',
          'jwt'
        ])
      )
      .toString();

  return url;
};

export const getURLFromParentFrameURL = parentURL => {
  const fragment = parentURL ? URI(parentURL).fragment() : '';
  const url =
    fragment && fragment[0] === '!'
      ? URI(decodeURI(fragment.substring(1))).toString()
      : undefined;
  return url;
};

export default function useAPURLSync({ AP }) {
  const { loading, location: initialAPURL } = AP;
  const router = useRouter() || {};
  const [ready, setReady] = useState(false);
  const [initialURL, setInitialURL] = useState(() => getCurrentURL());
  const { push: routerPush, replace: routerReplace } = router;
  const iframeURL = getURLFromParentFrameURL(initialAPURL);
  const isReady = !loading && (!iframeURL || iframeURL === initialURL);

  // When the parent URL is different from the iframe URL, this is how we know its in sync
  useIsomorphicLayoutEffect(() => {
    if (router.asPath === iframeURL) {
      setInitialURL(router.asPath);
    }
  }, [router.asPath, initialURL, iframeURL]);

  // Handle parent frame URL changes
  const handleOutsideNavigation = useCallback(
    (url, replace) => {
      const oldURL = getCurrentURL();
      if (!URI(oldURL).equals(url)) {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `ROUTER - OUTSIDE NAVIGATION - ${replace ? 'replace' : 'push'}`,
            {
              url,
              oldURL
            }
          );
        }
        replace ? routerReplace(url) : routerPush(url);
      }
    },
    [routerPush, routerReplace]
  );

  // Initial URL Sync Logic
  useIsomorphicLayoutEffect(() => {
    if (ready || loading) {
      return;
    }

    // If parent frame URL contains a path for us then
    // route that path through next/router
    if (iframeURL && initialURL !== iframeURL) {
      const iframeURI = URI(iframeURL);

      if (process.env.NODE_ENV === 'development') {
        console.log('ROUTER - INITIAL ROUTE REPLACE', iframeURL.toString());
      }

      routerReplace({
        pathname: iframeURI.pathname(),
        search: iframeURI.search()
      });
    }
    // Replace the parent frame URL so that if user goes backwards,
    // we capture the correct route to go back to
    else if (!iframeURL && HAS_AP_HISTORY) {
      if (process.env.NODE_ENV === 'development') {
        console.log('ROUTER - INITIAL FRAME SYNC', initialURL.toString());
      }

      window.AP.history.replaceState(initialURL.toString());
    }

    // Detect when the parent frame URL changes
    HAS_AP_HISTORY &&
      window.AP.history.popState(e => {
        if (e.newURL) {
          handleOutsideNavigation(decodeURIComponent(e.newURL));
        }
      });

    setReady(true);
  }, [loading, iframeURL, initialURL]);

  // Update the parent IFRAME url when next routing detects a chagne
  const currentURL = getCurrentURL();
  useIsomorphicLayoutEffect(() => {
    if (
      !isReady ||
      currentURL === iframeURL ||
      (!iframeURL && currentURL === initialURL)
    ) {
      return;
    }

    if (HAS_AP_HISTORY) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`ROUTER - ATLASSIAN PUSH`, currentURL);
      }

      window.AP.history.pushState(currentURL);
    }
  }, [currentURL, iframeURL, isReady]);

  return {
    ready: isReady
  };
}
