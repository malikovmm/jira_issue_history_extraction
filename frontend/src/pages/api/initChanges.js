import { authenticate, getUsers } from '../../api/atlassian';
import { bulkCreateChanges, getChanges } from '../../api/changeLog';
import { getAllIssues, getAllIssueChangelogs } from '../../api/atlassian';

import { DEFAULT_CHANGES_ON_PAGE } from '../../constants';
import {
  getValidatedOrder,
  getValidatedSortKey,
  getValidatedSortOrder
} from '../../utils';

const doInit = async req => {
  try {
    if (!req) throw 'wrong request object';
    let allIssues;
    try {
      allIssues = await getAllIssues(req.context, {
        fields: ['comment', 'project'],
        expand: ['changelog']
      });
    } catch (ie) {
      console.log(ie);
      console.log('getAllIssues error', ie);
    }
    const preparedchanges = [];
    try {
      for (let issue of allIssues.issues) {
        const issuechangelog = await getAllIssueChangelogs(req.context, issue);
        preparedchanges.push(...issuechangelog);
      }
    } catch (aice) {
      console.log('getAllIssueChangelogs error', aice);
    }
    try {
      await bulkCreateChanges(preparedchanges);
    } catch (be) {
      console.log('bulkCreateChanges error', be);
    }
  } catch (e) {
    // console.log(e);
    console.log(e.message);
    console.log(e.name);
    console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^');
    console.log('INIT ERROR');
  }
};

export default async function initHistory(req, res) {
  authenticate(req, false, { skipLicense: true })
    .then(async () => {
      await doInit(req);
      const {
        pageNumber = 1,
        limit = DEFAULT_CHANGES_ON_PAGE,
        sortKey,
        sortOrder
      } = req.query;
      const order = {};
      getValidatedSortKey(sortKey) && (order.sortKey = sortKey);
      getValidatedSortOrder(sortOrder) && (order.sortOrder = sortOrder);
      const { count, rows: rawChanges } = await getChanges({
        pageNumber,
        limit,
        order: getValidatedOrder(order.sortKey, order.sortOrder),
        clientKey: req.context.clientInfo.clientKey
      });

      const usersToFetch = new Set();
      for (let i of rawChanges) {
        usersToFetch.add(i.authorId);
        i.changedAt = i.changedAt.toString();
        i.createdAt = i.createdAt.toString();
        i.updatedAt = i.updatedAt.toString();
      }

      const usersRaw = await getUsers(req.context, {
        accountIds: Array.from(usersToFetch)
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
          });
      }

      return res.json({ count, rows: rawChanges });
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
