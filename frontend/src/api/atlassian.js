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
import db, { ins } from '../database';
import { getCommentAction, getHistoryAction } from '../database/util';
import { inspect } from 'util';
import { collectAllowedIds } from '../database/models/change';
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
      const clientInfo = JSON.parse(JSON.stringify({ ...response.dataValues }));
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
          return authenticate(req, false, {
            skipLicense: true,
            allowNewClientInfo: true
          }).then(() =>
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
            // clientId: process.env.CLIENT_KEY,
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
  let verifiedClaims;
  try {
    const kid = jwt.getKeyId(token);
    if (kid) {
      const publicKey = await fetch(
        `https://connect-install-keys.atlassian.com/${kid}`
      ).then(response => response.text());
      verifiedClaims = jwt.decodeAsymmetric(token, publicKey, 'RS256'); // decode without verification;
      unverifiedClaims = verifiedClaims;
    } else {
      unverifiedClaims = jwt.decodeSymmetric(token, '', 'HS256', true); // decode without verification;
    }
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
  if (!clientInfo && !verifiedClaims && !options.allowNewClientInfo) {
    return sendError(
      401,
      `Could not find stored client data for ${clientKey}. Is this client registered?`
    );
  }

  if (!verifiedClaims) {
    const secret = clientInfo.value.sharedSecret;
    if (!secret) {
      return sendError(
        401,
        `Could not find JWT sharedSecret in stored client data for ${clientKey}`
      );
    }

    try {
      verifiedClaims = jwt.decodeSymmetric(token, secret, 'HS256', false);
    } catch (e) {
      return sendError(400, `Unable to decode JWT token: ${e}`);
    }
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
    clientId: clientInfo && clientInfo.clientId,
    clientKey,
    clientInfo,
    sessionToken:
      clientInfo &&
      createSessionToken({
        accountId,
        ...clientInfo.value,
        clientId: clientInfo.clientId,
        context: verifiedClaims.context
      }),
    verifiedClaims
  };

  return {
    accountId,
    clientId: clientInfo && clientInfo.clientId,
    clientKey,
    clientInfo,
    sessionToken:
      clientInfo &&
      createSessionToken({
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
  var token = jwt.encodeSymmetric(
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
    sharedSecret,
    'HS256'
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
export async function getIssue(context, options = {}) {
  const { issueKey, fields = ['comment'], expand = ['changelog'] } = options;
  return await hostRequest(context.clientInfo.value, {
    accountId: context.accountId,
    url: `/rest/api/3/issue/${issueKey}?${
      fields ? '&fields=' + fields.join(',') : ''
    }${expand ? '&expand=' + expand.join(',') : ''}`
  });
}
export async function searchIssues(context, options = {}) {
  const { maxResults = 100, startAt = 0, fields, expand } = options;
  return await hostRequest(context.clientInfo.value, {
    accountId: context.accountId,
    url: `/rest/api/3/search?maxResults=${maxResults}&startAt=${startAt}${
      fields ? '&fields=' + fields.join(',') : ''
    }${expand ? '&expand=' + expand.join(',') : ''}`
  });
}
export async function getProjectDetails(context) {
  return await hostRequest(context.clientInfo.value, {
    accountId: context.accountId,
    url: '/rest/api/3/project'
  });
}

export async function getIssueChangelog(context, options = {}) {
  const { maxResults = 100, startAt = 0, issueKey } = options;
  if (!issueKey) throw 'issueKey is required';
  return await hostRequest(context.clientInfo.value, {
    accountId: context.accountId,
    url: `/rest/api/3/issue/${issueKey}/changelog?startAt=${startAt}&maxResults=${maxResults}`
  });
}
export async function getAllIssues(context, data) {
  const issues = await searchIssues(context, data);
  if (issues.total > issues.maxResults) {
    const numberOfRequests = Math.ceil(issues.total / issues.maxResults) - 1;
    for (
      let i = 0, startAt = issues.maxResults;
      i < numberOfRequests;
      i++, startAt += issues.maxResults
    ) {
      const fetched = await searchIssues(context, { ...data, startAt });
      issues.issues.push(...fetched.issues);
    }
  }
  return issues;
}

function handleToVal(item) {
  switch (item.field) {
    case 'status': {
      return item.to;
    }
    case 'timeestimate': {
      return item.to;
    }
    case 'timespent': {
      return item.to;
    }
    default: {
      return item.toString;
    }
  }
}

function handleFromVal(item) {
  switch (item.field) {
    case 'status': {
      return item.from;
    }
    case 'timeestimate': {
      return item.from;
    }
    case 'timespent': {
      return item.from;
    }
    default: {
      return item.fromString;
    }
  }
}

export async function getAllIssueChangelogs(context, issue) {
  const total = issue.changelog.total;
  const maxRes = issue.changelog.maxResults;
  const preparedChanges = [];
  for (let comment of issue.fields.comment.comments) {
    preparedChanges.push({
      changeId: comment.id,
      issueKey: issue.key,
      projectId: issue.fields.project.id,
      changedAt: comment.updated,
      authorId: comment.updateAuthor.accountId,
      field: 'comment',
      fieldType: 'comment',
      fieldId: 'comment',
      isComment: true,
      action: getCommentAction(comment),
      clientKey: context.clientInfo.clientKey
    });
  }
  for (let history of issue.changelog.histories) {
    // console.log('history', history, '<history');
    for (let item of history.items) {
      const collectAllowed = collectAllowedIds.includes(item.fieldId);
      // console.log('item >>>>>>>>', item, { collectAllowed }, '<<<');
      preparedChanges.push({
        changeId: history.id,
        issueKey: issue.key,
        projectId: issue.fields.project.id,
        changedAt: history.created,
        authorId: history.author.accountId,
        field: item.field,
        fieldType: item.fieldtype,
        fieldId: item.fieldId,
        isComment: false,
        action: getHistoryAction(item),
        clientKey: context.clientInfo.clientKey,
        fromVal: collectAllowed ? handleToVal(item) : null,
        toVal: collectAllowed ? handleFromVal(item) : null
      });
    }
  }
  if (total > maxRes) {
    const numberOfRequests = Math.ceil(total / maxRes) - 1;
    const offset = total % maxRes;
    for (let i = 0; i < numberOfRequests; ++i) {
      const fetched = await getIssueChangelog(context, {
        issueKey: issue.key,
        startAt: offset ? (i ? maxRes * (i - 1) + offset : 0) : i * maxRes,
        maxResults: offset ? (i ? maxRes : offset) : maxRes
      });

      for (let val of fetched.values) {
        preparedChanges.push(
          ...val.items.map(item => {
            const collectAllowed = collectAllowedIds.includes(item.fieldId);
            return {
              changeId: val.id,
              issueKey: issue.key,
              projectId: issue.fields.project.id,
              changedAt: val.created,
              authorId: val.author.accountId,
              field: item.field,
              fieldType: item.fieldtype,
              fieldId: item.fieldId,
              isComment: false,
              action: getHistoryAction(item),
              clientKey: context.clientInfo.clientKey,
              fromVal: collectAllowed ? handleToVal(item) : null,
              toVal: collectAllowed ? handleFromVal(item) : null
            };
          })
        );
      }
    }
  }
  return preparedChanges;
}

export async function getUsers(context, options = {}) {
  const { accountIds = [] } = options;
  if (!accountIds.length) throw `accountIds is empty`;
  const query = 'accountId=' + accountIds.join('&accountId=');
  return await hostRequest(context.clientInfo.value, {
    accountId: context.accountId,
    url: `/rest/api/3/user/bulk?${query}`
  });
}

export async function getAllStatuses(context) {
  return await hostRequest(context.clientInfo.value, {
    accountId: context.accountId,
    url: `/rest/api/3/status`
  });
}
export async function searchProjects(context, options = {}) {
  const { maxResults = 100, startAt = 0, id, expand } = options;
  return await hostRequest(context.clientInfo.value, {
    accountId: context.accountId,
    url: `/rest/api/3/project/search?maxResults=${maxResults}&startAt=${startAt}${
      id.length > 0 ? '&id=' + id.join('&id=') : ''
    }`
  });
}
