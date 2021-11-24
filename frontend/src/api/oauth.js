/**
 * Server-side only.
 *
 * This class is responsible for talking to Jira either on behalf ot he addon itself, or on behalf of a user.
 * It generally handles all the JWT/Oauth tokens like bearer tokens needed to communicate with Jira.
 *
 */
import oauth2 from 'atlassian-oauth2';
import moment from 'moment';
import URI from 'urijs';
import * as jwt from 'atlassian-jwt';
import { parse } from 'node-html-parser';
import { oneLine } from 'common-tags';
import nfbFactory from 'node-fetch-backoff';
import fetchAPI from 'isomorphic-fetch';
import md5 from 'md5';

import db from '../database';
import { cleanObject, sleep } from '../utils';

const fetch = nfbFactory({
  delay: 1 * 1000,
  shouldRetryError: error => {
    return error.status !== 404 && error.status !== 401 && error.status !== 429;
  },
  fetch: (...args) => {
    return fetchAPI(...args).then(resp => {
      if (resp.status !== 200) {
        return Promise.reject(resp);
      }
      return resp;
    });
  }
});

/**
 *
 * @param {*} clientValue Standard clientValue object
 * @param {*} clientValue.accountId Also includes the accountId
 */
export async function getBearerToken(
  clientValue,
  accountId = clientValue.accountId,
  options = {}
) {
  const tokenInfo = await findBearerToken(clientValue, accountId, options);

  let generateNewToken = !tokenInfo || !tokenInfo.token;
  if (tokenInfo && !generateNewToken) {
    const tokenExpiryTime = moment
      .unix(tokenInfo.expiresAt)
      .subtract(3, 'seconds');
    const isTokenExpired = tokenExpiryTime.isBefore(moment());
    generateNewToken = isTokenExpired;
  }

  if (generateNewToken) {
    const host = new URI(clientValue.baseUrl).hostname();
    const hostEnvironment = host.substring(host.indexOf('.') + 1);
    const now = moment();
    return oauth2
      .getAccessToken({
        hostBaseUrl: clientValue.baseUrl,
        oauthClientId: clientValue.oauthClientId,
        sharedSecret: clientValue.sharedSecret,
        userAccountId: accountId,
        authorizationServerBaseUrl:
          hostEnvironment === 'jira-dev.com'
            ? 'https://auth.dev.atlassian.io'
            : undefined
      })
      .then(async tokenInfo => {
        const expiresAt = now.add(tokenInfo.expires_in, 'seconds').unix();
        const newToken = {
          token: tokenInfo.access_token,
          expiresAt,
          accountId
        };
        await saveBearerToken(clientValue, newToken, options);
        return newToken;
      });
  } else {
    return tokenInfo;
  }
}

export function createJwtPayload(options) {
  const {
    key,
    method,
    pathname,
    query,
    clientKey,
    productType,
    baseUrl
  } = options;
  const now = moment().utc(),
    jwtTokenValidityInMinutes = 1;

  const token = {
    iss: key,
    iat: now.unix(),
    exp: now.add(jwtTokenValidityInMinutes, 'minutes').unix(),
    qsh: jwt.createQueryStringHash(
      {
        method,
        pathname,
        query
      },
      false,
      baseUrl
    )
  };

  if (productType === 'bitbucket') {
    token.sub = clientKey;
  } else if (productType === 'confluence' || productType === 'jira') {
    token.aud = [options.clientKey];
  }

  return token;
}

export function getJWTToken(clientValue, req) {
  const jwtPayload = createJwtPayload({
    ...req,
    key: clientValue.key,
    clientKey: clientValue.clientKey,
    productType: clientValue.productType
  });
  const jwtToken = jwt.encodeSymmetric(
    jwtPayload,
    clientValue.sharedSecret,
    'HS256'
  );

  return jwtToken;
}
// let counter = 0;
// makes an ajax request to jira on behalf of the addon or the user
export async function hostRequest(clientValue, options) {
  // console.log(
  //   `>>>>>>>>>>>>>>>>>>> REQUEST #${++counter} <<<<<<<<<<<<<<<<<<<<<<<`
  // );
  const { method = 'get', accountId, raw, qs, search = qs } = options;
  const httpMethod = method === 'del' ? 'delete' : method;

  let uri = URI(`${clientValue.baseUrl}${options.url}`);
  if (search) {
    uri = uri.search(search);
  }
  const token = accountId
    ? `Bearer ${await getBearerToken(clientValue, accountId, options).then(
        tokenInfo => tokenInfo.token
      )}`
    : `JWT ${getJWTToken(clientValue, {
        method: httpMethod,
        pathname: uri.pathname(),
        query: uri.search(true),
        body: options.body,
        baseUrl: clientValue.baseUrl,
        logId: options.logId
      })}`;

  console.log(
    'Host Request',
    JSON.stringify({
      method: httpMethod,
      pathname: uri.pathname(),
      query: uri.search(true),
      body: options.body,
      baseUrl: clientValue.baseUrl,
      accountId
    })
  );

  let doRefetch = false;
  let response;
  let beforeFetch = async () => {};
  do {
    await beforeFetch();
    response = await fetch(uri.toString(), {
      method: httpMethod,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        authorization: token
      },
      body: options.body
    })
      .then(async response => {
        doRefetch = false;
        if (raw) {
          return response;
        }

        const decodedResponse = await response.text().then(responseText => {
          try {
            return JSON.parse(responseText);
          } catch (e) {
            try {
              return oneLine(
                parse(responseText).querySelector('body').text || responseText
              );
            } catch (e) {
              return responseText;
            }
          }
        });

        if (typeof decodedResponse === 'string' && decodedResponse) {
          return Promise.reject(
            decodedResponse.length > 1000
              ? 'Error: response error to long to display'
              : decodedResponse
          );
        } else {
          return decodedResponse;
        }
      })
      .catch(err => {
        if (err.status == 429) {
          if (err.headers.get('retry-after')) {
            doRefetch = true;
            beforeFetch = async () => {
              await sleep(Number(err.headers.get('retry-after') * 1000) + 1);
            };
          }
        }
      });
  } while (doRefetch);

  return response;
}

export async function findBearerToken(clientValue, accountId, options) {
  return db.AddonSetting.findOne({
    where: cleanObject({
      clientId: clientValue.clientValue,
      clientKey: clientValue.clientKey,
      key: `bearer:${md5(accountId)}`
    })
  }).then(response => {
    if (response) {
      return {
        accountId,
        ...response.toJSON().value
      };
    }
  });
}

export async function saveBearerToken(clientValue, newToken) {
  const { token, expiresAt, accountId = clientValue.accountId } = newToken;
  return db.AddonSetting.upsert(
    cleanObject({
      clientKey: clientValue.clientKey,
      key: `bearer:${md5(accountId)}`,
      value: cleanObject({
        token,
        expiresAt
      })
    })
  ).then(() => {
    return clientValue;
  });
}

/**
 * Mock up a compatible version of httpClient
 * that can be used mostly interchangeably
 * @param {*} clientValue
 * @param {*} accountId
 * @returns
 */
function getHTTPClient(clientValue, accountId, config) {
  const httpClient = ['get', 'post', 'del', 'put'].reduce(
    (acc, key) => {
      acc[key] = ({ uri: url, json, ...options }, callback) => {
        return hostRequest(clientValue, {
          url,
          accountId,
          ...options,
          method: key === 'del' ? 'delete' : key,
          raw: true
        })
          .then(async response => {
            response.statusCode = response.status;

            const body = json ? await response.json() : await response.text();
            if (callback) {
              callback(null, response, body);
            }

            return body;
          })
          .catch(async e => {
            e.statusCode = e.status;

            const body =
              !!e.text &&
              (await e.text().then(text => {
                try {
                  return json ? JSON.parse(text) : text;
                } catch (e) {
                  return text;
                }
              }));

            if (callback) {
              callback(e, e, body || null);
            } else {
              return Promise.reject(body);
            }

            // Don't return a rejection if using callbacks because it will
            // result in an unhandled promise rejection
            return body;
          });
      };
      return acc;
    },
    {
      addon: config
        ? {
            config
          }
        : undefined,
      asUserByAccountId: accountId => {
        return getHTTPClient(clientValue, accountId, config);
      }
    }
  );

  return httpClient;
}

module.exports = {
  getBearerToken,
  createJwtPayload,
  hostRequest,
  getHTTPClient
};
