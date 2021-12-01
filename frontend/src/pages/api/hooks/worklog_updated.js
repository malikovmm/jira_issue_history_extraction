import { authenticate, getIssue } from '../../../api/atlassian';

export default async function hook(req, res) {
  authenticate(req, false, { skipLicense: true })
    .then(async () => {
      const issue = await getIssue(req.context, {
        fields: ['timetracking', 'project'],
        expand: ['changelog'],
        issueKey: req.body.worklog.issueId
      });

      const collectAllowed = collectAllowedIds.includes('timeSpentSeconds');
      // console.log('worklog_updated>>>>>', req.body, ins(issue));
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
