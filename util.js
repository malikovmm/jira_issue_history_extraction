const path = require('path');
const fs = require('fs');

const dotenv = require('dotenv');
const { pick, compact } = require('underscore');

const IS_DEV = process.env.NODE_ENV === 'development';

// Combine .env files and process.env together
function getEnv(stage = 'dev') {
  let env = {};
  const CONFIG_PATH = path.resolve(__dirname);
  const CONFIG_PATHS = compact([
    path.resolve(CONFIG_PATH, '.env'),
    path.resolve(CONFIG_PATH, `.${stage.toLowerCase()}.env`),
    IS_DEV && path.resolve(CONFIG_PATH, `.development.env`),
    IS_DEV &&
      path.resolve(CONFIG_PATH, `.development.${stage.toLowerCase()}.env`)
  ]);

  // Iterate through possible env paths and combine them in order
  let hasOneEnvAtLeast = false;
  CONFIG_PATHS.forEach(envPath => {
    if (fs.existsSync(envPath)) {
      env = {
        ...env,
        ...dotenv.parse(fs.readFileSync(envPath))
      };
      hasOneEnvAtLeast = true;
    }
  });

  if (!hasOneEnvAtLeast) {
    throw new Error(`No ENV files found in: ${CONFIG_PATHS}`);
  }

  // Import the process.env into the configured env
  env = {
    ...pick(env, val => val !== undefined),
    ...pick(process.env, Object.keys(env)),
    STAGE: stage,
    NEXT_PUBLIC_STAGE: stage,
    NEXT_PUBLIC_DEPLOY_URL: 'https://' + [env.SUBDOMAIN, env.DOMAIN].join('.')
  };

  env = {
    ...env,
    NAME: env.NAME || `${env.NAME}-${env.STAGE}`,
    PLUGIN_KEY: env.PLUGIN_KEY || `${env.NAME}-${env.STAGE}`,
    BUCKET_NAME: env.BUCKET_NAME || `${env.NAME}-${env.STAGE}`
  };

  process.env = {
    ...process.env,
    ...env
  };

  return env;
}

module.exports = {
  getEnv
};
