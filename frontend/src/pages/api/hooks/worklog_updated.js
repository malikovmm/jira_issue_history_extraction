import { authenticate } from '../../../api/atlassian';
import updateTime from '../../../api/updateTime';

export default async function hook(req, res) {
  authenticate(req, false, { skipLicense: true })
    .then(async () => {
      await updateTime(req);
      return res.json({
        success: true
      });
    })
    .catch(e => {
      const { message = e, statusCode = 500 } = e;
      console.log('worklog_updated > authenticate error', e);
      return res.status(statusCode).json({
        success: false,
        error: message
      });
    });
}
