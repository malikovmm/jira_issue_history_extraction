/**
 * This is for development use only!!
 *
 * It creates a custom nextjs server with proxy support for running outside of Atlassian Cloud
 */
const URI = require('urijs');
const express = require('express');
const compression = require('compression');
const commandLineArgs = require('command-line-args');
const next = require('next');
const { createProxyMiddleware } = require('http-proxy-middleware');

const { getEnv } = require('./util');

const CLI_OPTIONS = [
  {
    name: 'stage',
    type: String,
    defaultValue: process.env.NODE_ENV === 'development' ? 'local' : 'dev'
  }
];
const options = commandLineArgs(CLI_OPTIONS);

// Configure ENV
getEnv(options.stage);

const db = require('./frontend/src/database').default;

const port = process.env.SERVER_PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: 'frontend' });
const handle = app.getRequestHandler();

const proxyConfig = {
  target: process.env.NEXT_PUBLIC_SERVER_URL,
  auth: process.env.NEXT_PUBLIC_AUTH,
  changeOrigin: true,
  logLevel: 'debug',
  secure: false,
  onProxyRes: function (proxyRes) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = '*';

    if (proxyRes.headers['set-cookie']) {
      [].concat(proxyRes.headers['set-cookie']).forEach((cookie, i) => {
        cookie = cookie.replace('; Secure', '');
        if (typeof proxyRes.headers['set-cookie'] === 'string') {
          proxyRes.headers['set-cookie'] = cookie;
        } else {
          proxyRes.headers['set-cookie'][i] = cookie;
        }
      });
    }
  },
  headers: {
    Origin: URI(process.env.NEXT_PUBLIC_SERVER_URL).pathname('').toString()
  }
};

const apiPaths = {
  '/rest': {
    ...proxyConfig,
    pathRewrite: {
      '^/rest': '/rest'
    }
  }
};

const isDevelopment = process.env.NODE_ENV !== 'production';

app
  .prepare()
  .then(async () => {
    const server = express();

    server.use(compression());

    if (isDevelopment) {
      server.use('/rest', createProxyMiddleware(apiPaths['/rest']));
      await db.connect();
      await db.sequelize.sync();
      await db.disconnect();
    }

    server.all('*', (req, res) => {
      return handle(req, res);
    });

    server.listen(port, err => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.log('Error:::::', err);
  });
