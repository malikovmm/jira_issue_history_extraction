import { authenticate } from '../../../api/atlassian';
import { bulkCreateChanges } from '../../../api/changeLog';
import { getHistoryAction } from '../../../database/util';

const issueUpdateHandler = async req => {
  if (!req) throw 'wrong request object';
  if (!req.body) throw 'request object must have body';
  if (!req.body.changelog) throw 'body must have changelog object';
  if (!req.body.issue) throw 'body must have issue object';
  if (!req.body.user) throw 'body must have user object';
  const changelog = req.body.changelog;
  const {
    key: issueKey,
    fields: { updated }
  } = req.body.issue;
  const { accountId } = req.body.user;
  const changes = changelog.items.map(it => {
    return {
      changeId: changelog.id,
      issueKey: issueKey,
      changedAt: updated,
      authorId: accountId,
      field: it.field,
      fieldType: it.fieldtype,
      fieldId: it.fieldId,
      isComment: false,
      action: getHistoryAction(it),
      clientKey: req.context.clientInfo.clientKey
    };
  });
  return await bulkCreateChanges(changes);
};

export default async function hook(req, res) {
  authenticate(req, false, { skipLicense: true })
    .then(async () => {
      await issueUpdateHandler(req);
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
