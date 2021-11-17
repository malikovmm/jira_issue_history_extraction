import { authenticate } from '../../api/atlassian';
import { withDB } from '../../database';

export default withDB(async function Test(req, res) {
  const startTime = Date.now();
  req.context = req.context || {};
  req.context.logId = startTime;

  console.log('TEST START');

  return authenticate(req, false, { skipLicense: true })
    .then(() => {
      return res.json({
        success: true
      });
    })
    .catch(e => {
      const { message = e, statusCode = 500 } = e;
      console.log('authenticate error', e);
      return res.status(statusCode).json({
        success: false,
        error: message
      });
    })
    .finally(() => {
      const endTime = Date.now();
      console.log(
        'TEST FINISHED',
        JSON.stringify({
          id: req.context.logId,
          startTime,
          endTime,
          duration: endTime - startTime
        })
      );
    });
});
