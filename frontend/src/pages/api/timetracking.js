import { Op } from 'sequelize';
import { authenticate } from '../../api/atlassian';
import { getByField } from '../../api/changeLog';

const issueUpdateHandler = async req => {
  if (!req) throw 'wrong request object';
  //   if (req.query.fields == 'estimate') {}
  //   if (req.query.fields == 'logged') {}
  const { fields } = req.query;
  const reqSpent = fields == 'all' || fields == 'spent';
  const reqEstimate = fields == 'all' || fields == 'estimate';

  const tSpent = reqSpent
    ? await getByField({
        clientKey: req.context.clientInfo.clientKey,
        fieldId: 'timespent',
        order: [['changedAt', 'DESC']],
        toVal: { [Op.ne]: null },
        action: 'update'
      })
    : null;
  const tEstimate = reqEstimate
    ? await getByField({
        clientKey: req.context.clientInfo.clientKey,
        fieldId: 'timeestimate',
        order: [['changedAt', 'DESC']],
        toVal: { [Op.ne]: null },
        action: 'update'
      })
    : null;
  const keyToProp = {};
  if (reqSpent)
    for (let i of tSpent.rows) {
      console.log('~~i.toVal', ~~i.toVal, keyToProp[i.issueKey]);
      if (keyToProp[i.issueKey]) {
        keyToProp[i.issueKey].spent = ~~keyToProp[i.issueKey].spent + ~~i.toVal;
      } else {
        keyToProp[i.issueKey] = { spent: 0 };
      }
    }
  if (reqEstimate)
    for (let i of tEstimate.rows) {
      if (keyToProp[i.issuekey]) {
        keyToProp[i.issueKey].estimate =
          ~~keyToProp[i.issueKey].estimate + ~~i.toVal;
      } else {
        keyToProp[i.issueKey] = { estimate: i.toVal ? Number(i.toVal) : 0 };
      }
    }

  console.log(
    'tSpent,tEstimate>>',
    tSpent,
    tEstimate,
    keyToProp,
    '<<tSpent tEstimate'
  );
  return { tSpent, tEstimate, keyToProp };
};

export default async function timeTracking(req, res) {
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
