import { authenticate } from '../../../api/atlassian';

export default async function hook(req, res) {
  authenticate(req, false, { skipLicense: true })
    .then(async () => {
      console.log('worklog_deleted>>>>>', req.body);
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
