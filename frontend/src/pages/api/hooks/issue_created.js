import { authenticate } from '../../../api/atlassian';
import { bulkCreateChanges } from '../../../api/changeLog';
import { getHistoryAction } from '../../../database/util';

export default async function hook(req, res) {
  authenticate(req, false, { skipLicense: true })
    .then(async () => {
      console.log('issue_created>>>>>>>>>>>');
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
    });
}
