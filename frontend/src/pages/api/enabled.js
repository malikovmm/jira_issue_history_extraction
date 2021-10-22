/**
 * API endpoint for the "enabled" lifecycle event.
 * This is called by Jira whenever this plugin is enabled by an admin
 * (after having been disabled before).
 *
 * We use this to log such requests on our end, for audit purposes.
 */
import { authenticate, saveClientInfo } from '../../api/atlassian';
import { createLifecyleRecord } from '../../api/lifecycle';
import { withDB } from '../../database';

export default withDB(async function Enabled(req, res) {
  const startTime = Date.now();
  req.context = req.context || {};
  req.context.logId = startTime;

  console.log('ENABLING');

  return authenticate(req, false, { skipLicense: true })
    .then(async ({ clientInfo }) => {
      return saveClientInfo({
        logId: req.context.logId,
        clientId: clientInfo.clientId,
        // we use clientInfo.clientKey here because enabled should not be trying to change clientKey
        clientKey: clientInfo.clientKey,
        value: {
          ...clientInfo.value,
          ...req.body
        }
      });
    })
    .then(
      async clientInfo => {
        await createLifecyleRecord({
          addonKey: req.body.key,
          clientId: clientInfo.clientId,
          clientKey: clientInfo.clientKey,
          eventType: 'ENABLED',
          value: req.body,
          logId: req.context.logId
        });
        return res.json({
          success: true
        });
      },
      error => {
        const { statusCode = 401, message } = error;
        console.log('error', error);
        return res.status(statusCode).json({
          success: false,
          message
        });
      }
    )
    .catch(e => {
      const { message = e, statusCode = 500 } = e;
      res.status(statusCode).json({
        success: false,
        error: message
      });
    })
    .finally(() => {
      const endTime = Date.now();
      console.log(
        'ENABLE FINISHED',
        JSON.stringify({
          id: req.context.logId,
          startTime,
          endTime,
          duration: endTime - startTime
        })
      );
    });
});
