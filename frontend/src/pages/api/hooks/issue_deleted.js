import { authenticate } from '../../../api/atlassian';
import { createChange } from '../../../api/changeLog';

const issueDeleteHandler = async req => {
  if (!req) throw 'wrong request object';
  if (!req.body) throw 'request object must have body';
  if (!req.body.issue) throw 'body must have issue object';
  if (!req.body.user) throw 'body must have user object';
  const {
    id: issueId,
    fields: {
      updated,
      project: { id: projectId }
    }
  } = req.body.issue;
  const { accountId } = req.body.user;

  const change = {
    changeId: null,
    issueId: issueId,
    projectId: projectId,
    changedAt: updated,
    authorId: accountId,
    field: 'issue',
    fieldType: 'jira',
    fieldId: 'issue',
    isComment: false,
    action: 'delete',
    clientId: req.context.clientInfo.clientId,
    fromVal: null,
    toVal: null
  };
  return await createChange(change);
};

export default async function hook(req, res) {
  authenticate(req, false, { skipLicense: true })
    .then(async () => {
      console.log('issue_deleted>>>>>>>>>>>');
      await issueDeleteHandler(req);
      return res.json({
        success: true
      });
    })
    .catch(e => {
      const { message = e, statusCode = 500 } = e;
      console.log('issue_deleted > authenticate error', e);
      return res.status(statusCode).json({
        success: false,
        error: message
      });
    });
}
