import { getIssue } from '../api/atlassian';
import { bulkCreateChanges } from '../api/changeLog';
import { collectAllowedIds } from '../database/models/change';

export default async function updateTime(req) {
  const issue = await getIssue(req.context, {
    fields: ['timetracking', 'project'],
    issueKey: req.body.worklog.issueId
  });
  const changes = [
    {
      changeId: req.body.worklog.id,
      issueKey: issue.key,
      projectId: issue.fields.project.id,
      changedAt: req.body.worklog.updated,
      authorId: req.body.worklog.updateAuthor.accountId,
      field: 'timespent',
      fieldType: 'timespent',
      fieldId: 'timespent',
      isComment: false,
      action: 'create',
      clientKey: req.context.clientInfo.clientKey,
      fromVal: null,
      toVal: collectAllowedIds.includes('timespent')
        ? issue.fields.timetracking.timeSpentSeconds
        : null
    }
  ];
  if (issue.fields.timetracking.remainingEstimateSeconds != null) {
    changes.push({
      changeId: req.body.worklog.id,
      issueKey: issue.key,
      projectId: issue.fields.project.id,
      changedAt: req.body.worklog.updated,
      authorId: req.body.worklog.updateAuthor.accountId,
      field: 'timeestimate',
      fieldType: 'timeestimate',
      fieldId: 'timeestimate',
      isComment: false,
      action: 'create',
      clientKey: req.context.clientInfo.clientKey,
      fromVal: null,
      toVal: collectAllowedIds.includes('timeestimate')
        ? issue.fields.timetracking.remainingEstimateSeconds
        : null
    });
  }
  await bulkCreateChanges(changes);
}
