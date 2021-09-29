/**
 * API endpoint for the "installed" lifecycle event.
 * This is called by Jira whenever this plugin is installed by an admin.
 *
 * This is also called when an Admin reinstalls the plugin, or when a Jira instance
 * is recovered from backup, and a few other scenarios.

 * We use this to log such requests on our end, for audit purposes and to provision the tenant.
 * Tenant data is stored in DynamoDB.
 */
import { verifyInstallation } from '../../api/atlassian';
import { createLifecyleRecord } from '../../api/lifecycle';
import { withDB } from '../../database';

export default withDB(async function Installed(req, res) {
  const startTime = Date.now();
  req.context = req.context || {};
  req.context.logId = startTime;

  console.log('INSTALLING');

  return verifyInstallation(req)
    .then(
      async clientInfo => {
        console.log('INSTALLING', clientInfo);
        await createLifecyleRecord({
          addonKey: req.body.key,
          clientId: clientInfo.clientId,
          clientKey: clientInfo.clientKey,
          eventType: 'INSTALLED',
          value: req.body,
          logId: req.context.logId
        });
        return res.json({
          success: true,
          message: clientInfo
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
        'INSTALL FINISHED',
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
