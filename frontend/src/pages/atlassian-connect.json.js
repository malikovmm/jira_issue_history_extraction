/**
 * The public facing endpoint for the atlassian-connect.json file.
 *
 * This file is read by Jira when the plugin is installed and dictates which parts
 * of the UI we integrate with.
 * We dynamically resolve the template file and inject values based on the local environment.
 *
 * NOTE: Changing this file or the templates/atlassian-connect.json file itself does not
 *       force Jira to reload them. You must re-install the pluging after making such changes.
 */
import { compact, template } from 'underscore';

const atlassianConectTemplate = template(
  JSON.stringify(require('../templates/atlassian-connect.json'))
);

export default function AtlassianConnect() {
  return null;
}

AtlassianConnect.getInitialProps = ({ res }) => {
  if (!res) {
    return {};
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  if (process.env.NODE_ENV !== 'development') {
    res.setHeader('Cache-Control', `max-age=${60 * 60}`);
  }

  const propertyAlias = process.env.STAGE !== 'prod' ? process.env.STAGE : '';

  res.write(
    JSON.stringify(
      JSON.parse(
        atlassianConectTemplate({
          ...process.env,
          localBaseUrl: process.env.NEXT_PUBLIC_DEPLOY_URL,
          pluginKey: process.env.PLUGIN_KEY,
          stage: process.env.STAGE,
          propertyAlias,
          name: compact([process.env.PLUGIN_NAME, propertyAlias]).join('-'),
          description: process.env.PLUGIN_DESCRIPTION
        })
      ),
      null,
      2
    )
  );
  res.end();
  return {}; // it never reaches here but required as getInitialProps need to return object.
};
