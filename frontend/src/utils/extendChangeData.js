import { getIssueKeysByIds, getUsers } from '../api/atlassian';

/**
 * This function has side effects, IT WILL TRANSFORM THE PASSED ARRAY.
 * It extends the elements of the passed array by
 * user data and issue keys. Time fields are converted to a string
 * (if this is not done, there may be problems with converting to JSON )
 * @param rawChanges - changes from db
 * @param context - context from request object (req.context)
 * @returns nothing
 */
export default async function extendChangeData(rawChanges, context) {
  const usersToFetch = new Set();
  const issuesIdsToFetch = new Set();
  for (let i of rawChanges) {
    usersToFetch.add(i.authorId);
    issuesIdsToFetch.add(i.issueId);
    i.changedAt = i.changedAt.toString();
    i.createdAt = i.createdAt.toString();
    i.updatedAt = i.updatedAt.toString();
  }

  const usersRaw = await getUsers(context, {
    accountIds: Array.from(usersToFetch)
  });

  const issueIdToKey = await getIssueKeysByIds(context, {
    issueIds: Array.from(issuesIdsToFetch)
  });

  for (let i of usersRaw.values) {
    rawChanges
      .filter(({ authorId }) => authorId == i.accountId)
      .forEach(it => {
        it.editorData = {
          self: i.self,
          avatarUrls: i.avatarUrls,
          displayName: i.displayName,
          timeZone: i.timeZone
        };
        it.issueKey = issueIdToKey.get(it.issueId);
      });
  }
}
