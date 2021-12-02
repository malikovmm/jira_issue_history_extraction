import {
  authenticate,
  getAllStatuses,
  searchProjects
} from '../../api/atlassian';
import { getByField } from '../../api/changeLog';

const getTransitions = async req => {
  if (!req) throw 'wrong request object';
  // console.log('getTransitions req.query', req.query, req.context);
  const statuses = await getAllStatuses(req.context);
  if (req.query.names == 'true') {
    const projects = await searchProjects(req.context, {
      id: statuses.map(it => it.scope.project.id)
    });
    const projToStatuses = {};
    for (let i of projects.values) {
      const projectStatuses = statuses.filter(
        it => it.scope.project.id == i.id
      );
      projToStatuses[i.name] = projectStatuses;
    }
    return projToStatuses;
  }
  const queryOptions = {
    clientKey: req.context.clientInfo.clientKey,
    fieldId: 'status',
    order: [['changedAt', 'ASC']],
    toVal: req.query.statusId
  };

  const transitions = await getByField(queryOptions);
  // console.log('transitions', transitions);
  const temp2 = [];
  const statusObj = statuses.find(it => it.id == req.query.statusId);
  for (let i of transitions.rows) {
    const defaultItem = {
      action: i.action,
      issueKey: i.issueKey,
      toVal: statusObj.name,
      changedAt: i.changedAt,
      numberOfTransitions: 1 // number of transitions to this status (i.toVal)
    };
    const last = temp2.find(it => it.issueKey == i.issueKey);
    if (last) {
      // console.log('last, i', last, i);
      if (last.changedAt.toString() != i.changedAt.toString()) {
        last.numberOfTransitions += 1;
      }
      last.changedAt = i.changedAt;
    } else {
      temp2.push(defaultItem);
    }
  }
  return { c: transitions.count, temp2, statusObj };
};

export default async function transitions(req, res) {
  authenticate(req, false, { skipLicense: true })
    .then(async () => {
      const transitions = await getTransitions(req);
      return res.json(transitions);
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
