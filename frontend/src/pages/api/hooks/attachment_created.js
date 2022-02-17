import { authenticate } from '../../../api/atlassian';
import { collectAllowedIds } from '../../../database/models/change';
import { createChange } from '../../../api/changeLog';

const attachmentCreateHndler = async req => {
  if (!req) throw 'wrong request object';
  if (!req.body) throw 'request object must have body';
  if (!req.body.attachment) throw 'request query params must have attachment';
  console.log('attachment created>>>>>>');
  const { jira_issue_id, jira_project_id } = req.query;
  const { accountId } = req.context;
  const { created, content } = req.body.attachment;
  const collectAllowed = collectAllowedIds.includes('attachment');
  const change = {
    changeId: null,
    issueId: jira_issue_id,
    projectId: jira_project_id,
    changedAt: created,
    authorId: accountId,
    field: 'attachment',
    fieldType: 'jira',
    fieldId: 'attachment',
    isComment: false,
    action: 'create',
    clientId: req.context.clientInfo.clientId,
    fromVal: null,
    toVal: collectAllowed ? content : null
  };
  return await createChange(change);
};

export default async function hook(req, res) {
  authenticate(req, false, { skipLicense: true })
    .then(async () => {
      console.log('attachment_created>>>>>>>>>>>');
      await attachmentCreateHndler(req);
      return res.json({
        success: true
      });
    })
    .catch(e => {
      const { message = e, statusCode = 500 } = e;
      console.log('attachment_created > authenticate error', e);
      return res.status(statusCode).json({
        success: false,
        error: message
      });
    });
}
