/**
 * @TODO: fill in what this file/class does and why it exists
 */
import { omit } from 'underscore';
import URI from 'urijs';

import { HAS_AP_REQUEST, HAS_AP_TOKEN, IS_DEV } from '../constants';
import { promiseTimeout, promiseTimer } from '../utils';

export const DEV_TOKEN = 'PLACEHOLDER_TOKEN';

/**
 * Retrieve JWT token from JIRA via AP iframe connector
 */
export const getToken = async () => {
  if (HAS_AP_TOKEN) {
    return promiseTimeout(resolve => {
      window.AP.context.getToken(token => {
        resolve(token);
      });
    });
  } else if (IS_DEV) {
    return Promise.resolve(DEV_TOKEN);
  } else {
    return Promise.reject('AP.context.getToken not found');
  }
};

var token;
export default async function doFetch(url, options = {}) {
  const isAPRequest = url.indexOf('/rest') !== -1;
  options.headers = options.headers || {};

  if (url.indexOf('/rest') === 0 && HAS_AP_REQUEST) {
    return promiseTimer(
      () =>
        new Promise((resolve, reject) => {
          const { method, type = method, body, data = body, ...rest } = options;
          return window.AP.request(
            URI(url)
              .addSearch(options.query || options.search || {})
              .toString(),
            {
              contentType:
                options.contentType ||
                options.headers['Content-Type'] ||
                'application/json',
              type,
              data,
              ...rest,
              success: responseText => resolve(JSON.parse(responseText)),
              error: reject
            }
          );
        }),
      url,
      options
    );
  } else if (
    url.indexOf('/rest') === 0 &&
    process.env.NODE_ENV === 'production'
  ) {
    return Promise.reject('AP.request not found');
  } else {
    if (!token) {
      token = getToken();
    }

    if (token && !isAPRequest) {
      options.headers.Authorization = `JWT ${await token}`;
    }

    return promiseTimer(
      () =>
        fetch(
          URI(url)
            .search(options.query || options.search || '')
            .toString(),
          {
            ...options,
            headers: {
              'Content-Type':
                options.headers['Content-Type'] ||
                options.headers['content-type'] ||
                'application/json',
              ...omit(options.headers, 'content-type', 'Content-Type')
            }
          }
        )
          .then(async response => {
            const newToken = response.headers.get('x-acpt');
            if (newToken) {
              token = newToken;
            }

            if (options.raw) {
              return response;
            }

            const contentType = response.headers.get('content-type');
            const isJSONResponse =
              !!contentType && contentType.indexOf('application/json') === 0;
            const text =
              response.ok || isJSONResponse ? await response.text() : undefined;
            const resp = isJSONResponse && text ? JSON.parse(text) : text;

            if (response.ok || options.handleError) {
              return resp;
            } else {
              return Promise.reject(resp);
            }
          })
          .catch(e => {
            if (e instanceof Error) {
              console.log(e.toString(), e.stack, e);
              throw e;
            } else {
              console.log(e);
              return Promise.reject(e);
            }
          }),
      url,
      options
    );
  }
}
