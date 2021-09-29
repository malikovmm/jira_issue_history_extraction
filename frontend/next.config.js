const { compact } = require('underscore');
const withPlugins = require('next-compose-plugins');
const withImages = require('next-images');
const withFonts = require('next-fonts');

const { getEnv } = require('../util');

const {
  STAGE: stage = process.env.NODE_ENV === 'development' ? 'local' : 'dev'
} = process.env;

const env = getEnv(stage);

module.exports = withPlugins(
  [
    [withFonts, { enableSvg: true }],
    [withImages, {}]
  ],
  {
    // This gets automatically inserted during the build
    // target: 'serverless',
    distDir: '.next',
    pageExtensions: ['js'],
    env,
    images: {
      minimumCacheTTL: 60 * 60 * 24,
      domains: compact([
        process.env.NODE_ENV === 'development'
          ? 'localhost'
          : [env.SUBDOMAIN, env.DOMAIN].join('.')
      ])
    },
    webpack5: true,
    webpack: (config, options) => {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        // not sure why but next-remote-mdx requires this
        child_process: false,
        worker_threads: false
      };

      if (options.isServer) {
        // This is for sequelize support
        config.externals.push(
          'pg',
          'sqlite3',
          'tedious',
          'pg-hstore',
          'cardinal',
          'mssql',
          'postgres',
          'sqlite',
          'utf-8-validate',
          'bufferutil',
          'canvas' // NOT SURE WHY THIS IS NOW NEEDED OTHER THAN JEST USES IT (SHOULDN'T MATTER)
        );
      }

      return config;
    }
  }
);
module.exports.env = env;
