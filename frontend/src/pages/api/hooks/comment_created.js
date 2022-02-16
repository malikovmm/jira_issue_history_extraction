import { authenticate } from '../../../api/atlassian';
import { createChange } from '../../../api/changeLog';
import { ins } from '../../../utils';

const commentCreatedHandler = async req => {
  if (!req) throw 'wrong request object';
  if (!req.body) throw 'request object must have body';
  if (!req.body.comment) throw 'body must have comment';
  if (!req.body.issue) throw 'body must have issue';
  const comment = req.body.comment;
  const { id: issueId } = req.body.issue;
  console.log('req.body', ins(req.body));
  return await createChange({
    changeId: comment.id,
    issueId: issueId,
    projectId: req.body.issue.fields.project.id,
    changedAt: comment.created,
    authorId: comment.author.accountId,
    field: 'comment',
    fieldType: 'comment',
    fieldId: 'comment',
    isComment: true,
    action: 'create',
    clientKey: req.context.clientInfo.clientKey
  });
};

export default async function hook(req, res) {
  authenticate(req, false, { skipLicense: true })
    .then(async () => {
      await commentCreatedHandler(req);
      return res.json({
        success: true
      });
    })
    .catch(e => {
      const { message = e, statusCode = 500 } = e;
      console.log('comment_created > authenticate error', e);
      return res.status(statusCode).json({
        success: false,
        error: message
      });
    });
}
