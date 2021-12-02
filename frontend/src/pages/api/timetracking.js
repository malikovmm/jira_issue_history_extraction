import { Op } from 'sequelize';
import { authenticate } from '../../api/atlassian';
import { getByField } from '../../api/changeLog';

//TODO: It can be more optimizated
const issueUpdateHandler = async req => {
  if (!req) throw 'wrong request object';
  const { fields } = req.query;
  const reqSpent = fields == 'all' || fields == 'spent';
  const reqEstimate = fields == 'all' || fields == 'estimate';

  const tSpent = reqSpent
    ? await getByField({
        clientKey: req.context.clientInfo.clientKey,
        fieldId: 'timespent',
        order: [['changedAt', 'ASC']],
        toVal: { [Op.ne]: null },
        action: { [Op.or]: ['update', 'create'] }
      })
    : {};
  const tEstimate = reqEstimate
    ? await getByField({
        clientKey: req.context.clientInfo.clientKey,
        fieldId: 'timeestimate',
        order: [['changedAt', 'ASC']],
        toVal: { [Op.ne]: null },
        action: 'update'
      })
    : {};
  const tEstimateEdited = tEstimate.rows.filter(it => it.fromVal != it.toVal);
  const tEstimateKeys = Array.from(
    new Set(tEstimateEdited.map(it => it.issueKey))
  );

  const keyToTime = {};
  if (reqSpent)
    for (let i of tSpent.rows) {
      if (keyToTime[i.issueKey]) {
        keyToTime[i.issueKey].spent = ~~i.toVal;
      } else {
        keyToTime[i.issueKey] = {
          ...keyToTime[i.issueKey],
          spent: ~~i.toVal
        };
      }
    }
  if (reqEstimate)
    for (let i of tEstimateEdited) {
      if (keyToTime[i.issuekey]) {
        keyToTime[i.issueKey].estimate = ~~i.toVal;
      } else {
        keyToTime[i.issueKey] = {
          ...keyToTime[i.issueKey],
          estimate: ~~i.toVal
        };
      }
    }
  const keyToTimeEntries = Object.entries(keyToTime);
  const sumTotal = keyToTimeEntries.reduce(
    (acc, [k, v]) => {
      console.log(k, v, acc);
      acc.spent += ~~v.spent;
      acc.estimate += ~~v.estimate;
      return acc;
    },
    { spent: 0, estimate: 0 }
  );
  const tSpentKeys = keyToTimeEntries.reduce((acc, [k, v]) => {
    if (v.spent && k) acc.push(k);
    return acc;
  }, []);
  return {
    sumTotal,
    tSpentKeys,
    tEstimateKeys
  };
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
