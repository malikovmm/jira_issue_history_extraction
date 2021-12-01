import { authenticate, getIssue } from '../../../api/atlassian';
import { bulkCreateChanges } from '../../../api/changeLog';
import { ins } from '../../../database';
import { collectAllowedIds } from '../../../database/models/change';

function handleToVal(item) {
  switch (item.field) {
    case 'status': {
      // console.log('item>>', item, '<<<item');
      return item.to;
    }
    case 'timeSpentSeconds': {
      // console.log('timeSpentSeconds>>', item, '<<<timeSpentSeconds');
      return item.timeSpentSeconds;
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
    case 'timeSpentSeconds': {
      return item.fields.timetracking.timeSpentSeconds;
    }
    default: {
      return item.fromString;
    }
  }
}

export default async function hook(req, res) {
  authenticate(req, false, { skipLicense: true })
    .then(async () => {
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
            ? req.body.worklog.timeSpentSeconds
            : null
        }
      ];
      if (issue.fields.timetracking.remainingEstimateSeconds) {
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
