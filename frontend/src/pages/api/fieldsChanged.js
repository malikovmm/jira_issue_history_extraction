import { authenticate, getIssueKeysByIds } from '../../api/atlassian';
import { getByChangedFields } from '../../api/changeLog';

const issueUpdateHandler = async req => {
  if (!req) throw 'wrong request object';
  const fields = await getByChangedFields({
    clientId: req.context.clientInfo.clientId,
    attributes: ['issueId', 'field', 'fieldId'],
    group: ['issueId', 'field', 'fieldId']
  });
  const ids = fields.map(it => it.issueId);
  const issueIdsToKeys = await getIssueKeysByIds(req.context, {
    issueIds: ids
  });
  const fieldToKeys = {}; //{ [fieldId]: name: '', issueIds: [] };
  for (let i of fields) {
    const keyString =
      i.field == i.fieldId || !i.fieldId ? i.field : `${i.field}(${i.fieldId})`;
    if (fieldToKeys[keyString]) {
      fieldToKeys[keyString].keys.push(issueIdsToKeys.get(i.issueId));
    } else {
      fieldToKeys[keyString] = {
        field: i.field,
        fieldId: i.fieldId,
        keys: [issueIdsToKeys.get(i.issueId)]
      };
    }
  }
  return { fieldToKeys };
};

export default async function fieldChanges(req, res) {
  authenticate(req, false, { skipLicense: true })
    .then(async () => {
      const result = await issueUpdateHandler(req);
      return res.json(result);
    })
    .catch(e => {
      const { message = e, statusCode = 500 } = e;
      console.log('function fieldChanges > authenticate error', e);
      return res.status(statusCode).json({
        success: false,
        error: message
      });
    });
}
