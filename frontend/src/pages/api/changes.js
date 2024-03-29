import { authenticate } from '../../api/atlassian';

import { withDB } from '../../database';

export default withDB(async function Test(req, res) {
  const startTime = Date.now();
  req.context = req.context || {};
  req.context.logId = startTime;

  return authenticate(req, false, { skipLicense: true })
    .then(async () => {
      return res.json({
        success: true
      });
    })
    .catch(e => {
      const { message = e, statusCode = 500 } = e;
      console.log('changes.js > authenticate error', e);
      return res.status(statusCode).json({
        success: false,
        error: message
      });
    });
});
