import { getAllIssues, getAllIssueChangelogs } from '../api/atlassian';
export default async function initializeHistory(req) {
  const allIssues = await getAllIssues(req.context, {
    fields: ['comment'],
    expand: ['changelog']
  });
  const preparedchanges = [];
  for (let issue of allIssues.issues) {
    const issuechangelog = await getAllIssueChangelogs(req.context, issue);
    preparedchanges.push(...issuechangelog);
  }
  await bulkCreateChanges(preparedchanges);
}
