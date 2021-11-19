import { authenticate } from '../api/atlassian';

export const doAuth = async ctx => {
  const { req, query } = ctx;
  const authInfo = await authenticate({ ...req, query });

  return authInfo;
};

export default function auth(next, options = {}) {
  return async (req, res) => {
    return authenticate(req, !!options.skipQshVerification)
      .then(async ({ clientInfo }) => {
        req.context.clientInfo = clientInfo;
        return next(req, res);
      })
      .catch(e => {
        console.error(e);
        res.status(500).json({
          success: false,
          message: e.toString()
        });
      });
  };
}

export function withServerSideAuth(handler, options = {}) {
  return async context => {
    const { req, query } = context;
    return authenticate({ ...req, query: query || req.query }, true)
      .then(authInfo => {
        context.req.context = context.req.context || {};
        context.req.context = {
          ...context.req.context,
          ...authInfo
        };
        return handler(context);
      })
      .catch(e => {
        console.log(e);
        return {
          props: {
            error: { statusCode: 403, message: e.toString() }
          }
        };
      });
  };
}
