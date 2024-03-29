import { authenticate } from '../../../api/atlassian';
import { createChange } from '../../../api/changeLog';
import { collectAllowedIds } from '../../../database/models/change';

const commentDeletedHandler = async req => {
  if (!req) throw 'wrong request object';
  if (!req.body) throw 'request object must have body';
  if (!req.body.comment) throw 'body must have comment';
  if (!req.body.issue) throw 'body must have issue';
  const comment = req.body.comment;
  const { id: issueId } = req.body.issue;

  return await createChange({
    changeId: comment.id,
    issueId: issueId,
    projectId: issue.fields.project.id,
    changedAt: Date.now(),
    authorId: comment.updateAuthor.accountId,
    field: 'comment',
    fieldType: 'comment',
    fieldId: 'comment',
    isComment: true,
    action: 'delete',
    clientId: req.context.clientInfo.clientId
  });
};

export default async function hook(req, res) {
  authenticate(req, false, { skipLicense: true })
    .then(async () => {
      await commentDeletedHandler(req);
      return res.json({
        success: true
      });
    })
    .catch(e => {
      const { message = e, statusCode = 500 } = e;
      console.log('comment_deleted > authenticate error', e);
      return res.status(statusCode).json({
        success: false,
        error: message
      });
    });
}
