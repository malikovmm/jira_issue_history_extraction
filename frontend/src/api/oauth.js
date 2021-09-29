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
import { cleanObject } from '../utils';

const fetch = nfbFactory({
  delay: 1 * 1000,
  shouldRetryError: error => {
    console.log('shouldRetryError', error);
    return true;
  },
  fetch: (...args) => {
    return fetchAPI(...args);
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
  const jwtToken = jwt.encode(jwtPayload, clientValue.sharedSecret, 'HS256');

  return jwtToken;
}

// makes an ajax request to jira on behalf of the addon or the user
export async function hostRequest(clientValue, options) {
  const { method = 'get', accountId } = options;
  const httpMethod = method === 'del' ? 'delete' : method;

  let uri = URI(`${clientValue.baseUrl}${options.url}`);
  if (options.search) {
    uri = uri.search(options.search);
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

  const response = await fetch(uri.toString(), {
    method: httpMethod,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      authorization: token
    },
    body: options.body
  }).then(async response => {
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
  });

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
