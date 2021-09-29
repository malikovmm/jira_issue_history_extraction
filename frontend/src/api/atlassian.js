/**
 * Dealing with connection to Jira.
 * verifying an install exists, that it is valid, etc.
 * NOTE: This originates from connect framework (heavily modified)
 */
import URI from 'urijs';
import * as jwt from 'atlassian-jwt';
import moment from 'moment';

import * as util from '../utils';
import { hostRequest } from './oauth';
import db from '../database';

// @TODO: This should probably be an env variable
export const hostRegex = /[^.]*\.(atlassian\.net|jira-dev\.com|atlassian\.com|jira\.com)$/i;
// @TODO: this should probably be an env variable
// This is for creating JWT tokens for requests to JIRA
export const jwtTokenValidityInMinutes = 5;
// @TODO: this should probably be an env variable
// Session token max age
export const maxTokenAge = 15 * 60 * 1000;

export const skipAuth =
  /no-auth/.test(process.env.AC_OPTS) || process.env.NODE_ENV === 'development';
export const skipLicense = /no-license/.test(process.env.AC_OPTS);
export const JWT_PARAM = 'jwt';
export const AUTH_HEADER = 'Authorization'; // the header name appears as lower-case
export const AUTH_IFRAME_HEADER = 'X-Authorization'; // the header name appears as lower-case

export function sendError(statusCode, msg, verifiedClaims = {}) {
  return Promise.reject({
    ...verifiedClaims,
    statusCode,
    message: msg
  });
}

export function findClientInfoByClientKey(clientKey) {
  if (process.env.NODE_ENV === 'development') {
    console.log('findClientInfo', { clientKey });
  }

  return db.AddonSetting.findOne({
    where: {
      clientKey,
      key: 'clientInfo'
    }
  }).then(response => {
    if (response) {
      const clientInfo = response.toJSON();
      return clientInfo;
    }
  });
}

export function saveClientInfo({ clientId, clientKey, value, logId }) {
  if (process.env.NODE_ENV === 'development') {
    console.log('saveClientInfo', { clientId, clientKey, value });
  }

  return db.AddonSetting.upsert({
    clientKey,
    key: 'clientInfo',
    value
  }).then(() => findClientInfoByClientKey(clientKey));
}

// @TODO: fill in what this function does and why it exists
export function verifyInstallation(req) {
  req.context = req.context || {};

  console.log('VERIFY INSTALL', req.body);

  return (
    // Sanity checks
    validateInstallation(req)
      // Lookup existing info
      .then(regInfo =>
        findClientInfoByClientKey(regInfo.clientKey, req.context)
      )
      // Handle existing info
      .then(async clientInfo => {
        if (clientInfo) {
          console.log(
            `Found existing settings for client ${clientInfo.clientKey}. Authenticating reinstall request.`
          );
          return authenticate(req, false, { skipLicense: true }).then(() =>
            saveClientInfo({
              logId: req.context.logId,
              clientId: clientInfo.clientId,
              clientKey: req.body.clientKey,
              value: {
                ...clientInfo.value,
                ...req.body
              }
            })
          );
        } else {
          return saveClientInfo({
            logId: req.context.logId,
            clientKey: req.body.clientKey,
            value: {
              ...req.body
            }
          });
        }
      })
  );
}

// @TODO: fill in what this function does and why it exists
export async function validateInstallation(req) {
  const regInfo = req.body;

  if (!regInfo || typeof regInfo !== 'object') {
    return sendError(401, 'No registration info provided.');
  }

  const baseUrl = regInfo.baseUrl;
  if (!baseUrl) {
    return sendError(401, 'No baseUrl provided in registration info.');
  }

  // Check whitelist
  const host = URI(baseUrl).hostname();
  if (!hostRegex.test(host)) {
    return sendError(
      401,
      `Host at ${baseUrl} is not authorized to register as the host does not match the registration whitelist (${hostRegex.toString()}).`
    );
  }

  const clientKey = regInfo.clientKey;
  if (!clientKey) {
    return sendError(401, `No client key provided for host at ${baseUrl}.`);
  }

  return regInfo;
}

// @TODO: fill in what this function does and why it exists
/**
 *
 * @param {*} req
 * @param {*} req.query
 * @param {*} req.headers
 * @param {*} req.method
 * @param {*} req.pathname
 * @param {*} skipQshVerification
 *
 */
export async function authenticate(
  req,
  skipQshVerification = true,
  options = {}
) {
  req.context = req.context || {};

  console.log(
    `Authenticating... SkipAuth: ${skipAuth}, SkipQSH: ${!!skipQshVerification}`
  );

  const request = {
    method: req.method.toLowerCase(),
    pathname: req.url.split('?')[0],
    query: req.query,
    body: req.body
  };

  var { token } = extractJWTFromEvent(req);

  if (
    token === 'PLACEHOLDER_TOKEN' &&
    process.env.NODE_ENV === 'development' &&
    skipAuth &&
    process.env.CLIENT_KEY &&
    process.env.ACCOUNT_ID
  ) {
    console.log(
      `Override auth check ${process.env.CLIENT_KEY}|${process.env.ACCOUNT_ID}`
    );
    await findClientInfoByClientKey(process.env.CLIENT_KEY, req.context).then(
      clientInfo => {
        if (clientInfo) {
          token = createSessionToken({
            ...clientInfo.value,
            // Blank out clientId because this is a dev token and we still want to do the normal checks.
            clientId: undefined,
            accountId: process.env.ACCOUNT_ID
          });
        } else {
          return Promise.reject({
            statusCode: 401,
            message: `Could not find stored client data for ${process.env.CLIENT_KEY}. Is this client registered?`
          });
        }
      }
    );
  }

  if (!token) {
    return sendError(401, 'Could not find authentication data on request');
  }

  let unverifiedClaims;
  try {
    unverifiedClaims = jwt.decode(token, '', true); // decode without verification;
  } catch (e) {
    return sendError(400, 'Unable to decode JWT token: ' + e.message);
  }

  const issuer = unverifiedClaims.iss;
  if (!issuer) {
    return sendError(401, 'JWT claim did not contain the issuer (iss) claim');
  }

  const queryStringHash = unverifiedClaims.qsh;
  if (!queryStringHash && !skipQshVerification) {
    // session JWT tokens don't require a qsh
    return sendError(
      401,
      'JWT claim did not contain the query string hash (qsh) claim'
    );
  }

  // The audience claim identifies the intended recipient, according to the JWT spec,
  // but we still allow the issuer to be used if 'aud' is missing.
  // Session JWTs make use of this (the issuer is the add-on in this case)
  let clientKey = issuer;
  if (unverifiedClaims.aud && unverifiedClaims.aud.length > 0) {
    clientKey = unverifiedClaims.aud[0];
  }

  const clientInfo = await findClientInfoByClientKey(clientKey, req.context);
  if (!clientInfo) {
    return sendError(
      401,
      `Could not find stored client data for ${clientKey}. Is this client registered?`
    );
  }

  const secret = clientInfo.value.sharedSecret;
  if (!secret) {
    return sendError(
      401,
      `Could not find JWT sharedSecret in stored client data for ${clientKey}`
    );
  }

  let verifiedClaims;
  try {
    verifiedClaims = jwt.decode(token, secret, false);
  } catch (e) {
    return sendError(400, `Unable to decode JWT token: ${e}`);
  }

  const expiry = verifiedClaims.exp + 60 * jwtTokenValidityInMinutes; // Give some extra wiggle room
  if (expiry && moment.utc().unix() >= expiry) {
    return sendError(
      401,
      'Authentication request has expired. Try reloading the page.',
      verifiedClaims
    );
  }

  // First check query string params
  if (verifiedClaims.qsh) {
    let expectedHash = jwt.createQueryStringHash(
      request,
      false,
      process.env.DEPLOY_URL
    );
    let signatureHashVerified =
      verifiedClaims.qsh === expectedHash ||
      verifiedClaims.qsh === 'context-qsh';
    if (!signatureHashVerified) {
      // Send the error message for the first verification - it's 90% more likely to be the one we want.
      const error = `Auth failure: Query hash mismatch: Received: "${
        verifiedClaims.qsh
      }" but calculated "${expectedHash}". Canonical query was: ${jwt.createCanonicalRequest(
        request,
        process.env.DEPLOY_URL
      )}`;
      // If that didn't verify, it might be a post/put - check the request body too
      expectedHash = jwt.createQueryStringHash(
        request,
        true,
        process.env.DEPLOY_URL
      );
      signatureHashVerified = verifiedClaims.qsh === expectedHash;
      if (!signatureHashVerified) {
        console.error(error);
        return sendError(
          401,
          'Authentication failed: query hash does not match.',
          verifiedClaims
        );
      }
    }
  }

  verifiedClaims.context = verifiedClaims.context
    ? util.flatten(verifiedClaims.context)
    : {};

  // If not signed by us, do a license check
  if (
    !verifiedClaims.context.clientId &&
    !skipLicense &&
    !options.skipLicense
  ) {
    const addonDetails = await getAddonDetails({
      clientInfo,
      logId: req.context.logId
    });
    const isLicensed =
      !!addonDetails && addonDetails.license && addonDetails.license.active;
    if (!isLicensed) {
      return sendError(403, 'No Active License.', verifiedClaims);
    }
  }

  const accountId = verifiedClaims.sub;

  req.context = {
    ...req.context,
    accountId,
    clientId: clientInfo.clientId,
    clientKey,
    clientInfo,
    sessionToken: createSessionToken({
      accountId,
      ...clientInfo.value,
      clientId: clientInfo.clientId,
      context: verifiedClaims.context
    }),
    verifiedClaims
  };

  return {
    accountId,
    clientId: clientInfo.clientId,
    clientKey,
    clientInfo,
    sessionToken: createSessionToken({
      accountId,
      ...clientInfo.value,
      clientId: clientInfo.clientId,
      context: verifiedClaims.context
    }),
    verifiedClaims
  };
}

// Create a JWT token that can be used instead of a session cookie
export function createSessionToken(authorizer) {
  const { accountId, clientKey, context = {}, sharedSecret, clientId } =
    authorizer || {};
  var now = moment().utc();
  var token = jwt.encode(
    {
      iss: process.env.PLUGIN_KEY,
      sub: accountId,
      iat: now.unix(),
      exp: now.add(maxTokenAge, 'milliseconds').unix(),
      aud: [clientKey],
      context: {
        ...(context || {}),
        clientId
      }
    },
    sharedSecret
  );

  return token;
}

// @TODO: fill in what this function does and why it exists
export function extractJWTFromEvent(req) {
  let token = req.query[JWT_PARAM];
  let type = token ? JWT_PARAM : undefined;

  // if there was no token in the query-string then fall back to checking the Authorization header
  const authHeader = util.getHeader(AUTH_HEADER, req.headers);
  if (authHeader && authHeader.indexOf('JWT ') == 0) {
    if (token) {
      console.warn(
        'JWT token found in query and in header: using query value.'
      );
    } else {
      token = authHeader.substring(4);
      type = AUTH_HEADER;
    }
  }

  return { token, type };
}

export async function getAddonDetails(context) {
  return await hostRequest(context.clientInfo.value, {
    logId: context.logId,
    method: 'GET',
    url: `/rest/atlassian-connect/1/addons/${process.env.PLUGIN_KEY}`
  });
}
