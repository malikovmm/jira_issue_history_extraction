import { authenticate } from '../../../api/atlassian';
import { createChange } from '../../../api/changeLog';
import { collectAllowedIds } from '../../../database/models/change';

const attachmentDeleteHandler = async req => {
  if (!req) throw 'wrong request object';
  if (!req.body) throw 'request object must have body';
  if (!req.body.attachment) throw 'request query params must have attachment';

  const { jira_issue_key, jira_issue_id, jira_project_id } = req.query;
  const { accountId, clientKey } = req.context;
  const {
    created,
    content,
    author: { accountId: authorAccountId }
  } = req.body.attachment;
  const collectAllowed = collectAllowedIds.includes('attachment');
  const change = {
    changeId: null,
    issueId: jira_issue_id,
    projectId: jira_project_id,
    changedAt: created,
    authorId: accountId || authorAccountId,
    field: 'attachment',
    fieldType: 'jira',
    fieldId: 'attachment',
    isComment: false,
    action: 'delete',
    clientKey: clientKey,
    fromVal: collectAllowed ? content : null,
    toVal: null
  };
  console.log('>', change);

  return await createChange(change);
};

export default async function hook(req, res) {
  authenticate(req, false, { skipLicense: true })
    .then(async () => {
      console.log('attachment_deleted >>>>>>>>>>>');
      await attachmentDeleteHandler(req);
      return res.json({
        success: true
      });
    })
    .catch(e => {
      const { message = e, statusCode = 500 } = e;
      console.log('attachment del > authenticate error', e);
      return res.status(statusCode).json({
        success: false,
        error: message
      });
    });
}
