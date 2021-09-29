const { resolve } = require('path');

const { Component, utils } = require('@serverless/core');
const traverse = require('traverse');
const { path } = require('ramda');

const { getEnv } = require('./util');

async function getTemplate(inputs, envConfig = {}) {
  const componentPackageJson = await utils.readFile(
    resolve(__dirname, `./serverless/serverless.yml`)
  );
  const resolvedTemplate = await resolveObject(componentPackageJson, {
    ...inputs,
    env: envConfig
  });

  return resolvedTemplate;
}

function resolveObject(object, context) {
  const regex = /\${(\w*:?[\w\d.-]+)}/g;

  const resolvedObject = traverse(object).forEach(function (value) {
    const matches = typeof value === 'string' ? value.match(regex) : null;
    if (matches) {
      let newValue = value;
      for (const match of matches) {
        const referencedPropertyPath = match
          .substring(2, match.length - 1)
          .split('.');
        const referencedPropertyValue = path(referencedPropertyPath, context);

        if (referencedPropertyValue === undefined) {
          continue;
        }

        if (match === value) {
          newValue = referencedPropertyValue;
        } else if (typeof referencedPropertyValue === 'string') {
          newValue = newValue.replace(match, referencedPropertyValue);
        } else {
          continue;
        }
      }
      this.update(newValue);
    }
  });

  return resolvedObject;
}

class Deploy extends Component {
  async default(inputs = {}) {
    const { stage = process.env.STAGE || 'dev' } = inputs;

    inputs = {
      ...inputs,
      stage
    };

    process.env.STAGE = stage;

    const template = await this.load('@serverless/template', `${stage}`);

    return await template({
      template: await getTemplate({ ...inputs }, getEnv(stage)),
      ...inputs
    });
  }

  async remove(inputs = {}) {
    const { stage = process.env.STAGE || 'dev' } = inputs;

    process.env.STAGE = stage;

    const template = await this.load('@serverless/template', `${stage}`);

    await template.remove();

    return {};
  }

  async run(inputs = {}) {
    const { stage = process.env.STAGE || 'dev' } = inputs;

    process.env.STAGE = stage;

    const template = await this.load('@serverless/template', `${stage}`);

    await template.run({
      template: await getTemplate({ ...inputs }),
      ...inputs
    });
  }
}

module.exports = Deploy;
