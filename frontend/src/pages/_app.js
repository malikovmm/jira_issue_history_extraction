import React, { useState } from 'react';
import cx from 'classnames';
import Head from 'next/head';
import { useIsomorphicLayoutEffect, useSize } from 'react-use';
import { IntlProvider } from 'react-intl';
import Error from 'next/error';
import Script from 'next/script';

import Spinner from '@atlaskit/spinner';
import SectionMessage from '@atlaskit/section-message';

import { useAP, APContext } from '../ap';
import { IS_DEV, IS_IFRAME } from '../constants';
import useAPURLSync from '../hooks/useAPURLSync';
import LicenseError from '../components/license-error';

function App({ Component, pageProps }) {
  if (pageProps.error) {
    return (
      <Error
        statusCode={pageProps.error.statusCode}
        title={pageProps.error.message}
      />
    );
  }

  return <MyApp Component={Component} pageProps={pageProps} />;
}

function MyApp({ Component, pageProps }) {
  const { resize, autosize, sizeToParent } = pageProps;
  const AP = useAP();
  const { loading, error, resize: doResize } = AP;

  const [sized, size] = useSize(<div />, {});
  const hasSize = size.height !== Infinity && size.width !== Infinity;
  useIsomorphicLayoutEffect(() => {
    if (hasSize && doResize && autosize && resize !== false) {
      if (IS_DEV === 'development') {
        console.log('CALLING RESIZE', {
          width: size.width,
          height: size.height
        });
      }
      doResize();
    }
  }, [resize, size.width, size.height]);

  useIsomorphicLayoutEffect(() => {
    if (
      sizeToParent &&
      hasSize &&
      resize !== false &&
      window.AP &&
      window.AP.sizeToParent
    ) {
      const timeout = setTimeout(() => {
        if (IS_DEV === 'development') {
          console.log('CALLING RESIZE PARENT', {
            width: size.width,
            height: size.height
          });
        }
        window.AP.resize('100%', '100%');
        window.AP.sizeToParent();
      }, 200);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [resize, sizeToParent, hasSize, size.height]);

  useIsomorphicLayoutEffect(() => {
    if (window.location.search.indexOf('dialog=1') !== -1) {
      document.body.classList.add('ap-dialog');
    }
  }, []);

  const [isFakeAP, setIsFakeAP] = useState();
  useIsomorphicLayoutEffect(() => {
    setIsFakeAP(!IS_IFRAME);
  }, [IS_IFRAME]);

  const { ready } = useAPURLSync({ AP });

  return (
    <div className="ac-content">
      {sized}
      {(loading || !ready) && (
        <div style={{ textAlign: 'center' }}>
          <Spinner size="xlarge" />
        </div>
      )}
      {!loading && ready && !AP.isLicensed && <LicenseError />}
      {!loading && ready && AP.isLicensed && (
        <div
          className={cx(
            {
              'fake-ap': isFakeAP
            },
            'page-wrap'
          )}
        >
          <IntlProvider locale={'en'}>
            <APContext.Provider value={AP}>
              <Head>
                <meta
                  name="viewport"
                  content="width=device-width, initial-scale=1"
                />
              </Head>
              {error && (
                <SectionMessage appearance="error" title="Error Starting App">
                  App Must be Loaded from within JIRA
                </SectionMessage>
              )}
              {!error && <Component {...pageProps} />}
            </APContext.Provider>
          </IntlProvider>
        </div>
      )}
      {/* These two are required to communicate via postmessage to JIRA */}
      {IS_DEV && (
        <Script
          src="https://connect-cdn.atl-paas.net/all-debug.js"
          strategy="beforeInteractive"
        ></Script>
      )}
      {!IS_DEV && (
        <Script
          src="https://connect-cdn.atl-paas.net/all.js"
          strategy="beforeInteractive"
        ></Script>
      )}
    </div>
  );
}

export default App;
