import { authenticate } from '../../../api/atlassian';
import { bulkCreateChanges } from '../../../api/changeLog';
import { collectAllowedIds } from '../../../database/models/change';
import { getHistoryAction, ins } from '../../../utils';

const ignoreFieldsIds = ['attachment'];

function handleToVal(item) {
  switch (item.field) {
    case 'status': {
      // console.log('item>>', item, '<<<item');
      return item.to;
    }
    default: {
      // console.log('handleField default');
      return item.toString;
    }
  }
}

function handleFromVal(item) {
  switch (item.field) {
    case 'status': {
      return item.from;
    }
    default: {
      return item.fromString;
    }
  }
}
const issueUpdateHandler = async req => {
  if (!req) throw 'wrong request object';
  if (!req.body) throw 'request object must have body';
  if (!req.body.changelog) throw 'body must have changelog object';
  if (!req.body.issue) throw 'body must have issue object';
  if (!req.body.user) throw 'body must have user object';
  const changelog = req.body.changelog;
  const {
    id: issueId,
    fields: {
      updated,
      project: { id: projectId }
    }
  } = req.body.issue;
  const { accountId } = req.body.user;
  const changes = changelog.items
    .filter(it => !ignoreFieldsIds.includes(it.fieldId))
    .map(it => {
      const collectAllowed = collectAllowedIds.includes(it.fieldId);
      return {
        changeId: changelog.id,
        issueId: issueId,
        projectId: projectId,
        changedAt: updated,
        authorId: accountId,
        field: it.field,
        fieldType: it.fieldtype,
        fieldId: it.fieldId,
        isComment: false,
        action: getHistoryAction(it),
        clientId: req.context.clientInfo.clientId,
        fromVal: collectAllowed ? handleFromVal(it) : null,
        toVal: collectAllowed ? handleToVal(it) : null
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
      console.log('issue_updated > authenticate error', e);
      return res.status(statusCode).json({
        success: false,
        error: message
      });
    });
}
