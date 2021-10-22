/**
 * API endpoint for the "uninstalled" lifecycle event.
 * This is called by Jira whenever this plugin is uninstalled by an admin.
 *
 * We use this to log such requests on our end, for audit purposes and cleanup.
 * NOTE: this endpoint is pretty unreliable in the sense that there are many cases
 *       where this is not called by Atlassian for various reasons.
 */
import { verifyInstallation } from '../../api/atlassian';
import { createLifecyleRecord } from '../../api/lifecycle';
import { withDB } from '../../database';

export default withDB(async function Uninstalled(req, res) {
  const startTime = Date.now();
  req.context = req.context || {};
  req.context.logId = startTime;

  console.log('UNINSTALLING');

  return verifyInstallation(req)
    .then(
      async clientInfo => {
        console.log('UNINSTALLING', clientInfo);
        await createLifecyleRecord({
          addonKey: req.body.key,
          clientId: clientInfo.clientId,
          clientKey: clientInfo.clientKey,
          eventType: 'INSTALLED',
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
    .finally(response => {
      const endTime = Date.now();
      console.log(
        'UNINSTALL FINISHED',
        JSON.stringify({
          id: req.context.logId,
          startTime,
          endTime,
          duration: endTime - startTime
        })
      );
      return response;
    });
});
