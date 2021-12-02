import { authenticate } from '../../api/atlassian';
import { getByChangedFields } from '../../api/changeLog';

const issueUpdateHandler = async req => {
  if (!req) throw 'wrong request object';
  const fields = await getByChangedFields({
    clientKey: req.context.clientInfo.clientKey,
    attributes: ['issueKey', 'field', 'fieldId'],
    group: ['issueKey', 'field', 'fieldId']
  });
  const fieldToKeys = {}; //{ [fieldId]: name: '', issueKeys: [] };
  for (let i of fields) {
    const keyString =
      i.field == i.fieldId || !i.fieldId ? i.field : `${i.field}(${i.fieldId})`;
    if (fieldToKeys[keyString]) {
      fieldToKeys[keyString].keys.push(i.issueKey);
    } else {
      fieldToKeys[keyString] = {
        field: i.field,
        fieldId: i.fieldId,
        keys: [i.issueKey]
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
      console.log('authenticate error', e);
      return res.status(statusCode).json({
        success: false,
        error: message
      });
    });
}
