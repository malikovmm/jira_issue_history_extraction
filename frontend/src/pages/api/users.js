import { authenticate } from '../../api/atlassian';
import { getUsers } from '../../api/atlassian';
import { getUserIds } from '../../api/changeLog';

export const getAllUsers = async req => {
  if (!req) throw 'wrong request object';
  const { count, rows: userIds } = await getUserIds({
    clientId: req.context.clientInfo.clientId
  });
  if (!count) {
    console.log('getAllUsers COUNT IS 0');
  }
  const usersRaw = await getUsers(req.context, {
    accountIds: Array.from(userIds.map(it => it.authorId))
  });

  const forselect = usersRaw.values.map(user => {
    return {
      label: user.displayName,
      value: user.accountId
    };
  });
  return forselect;
};

export default async function hook(req, res) {
  authenticate(req, false, { skipLicense: true })
    .then(async () => {
      // [{label:,value:}]
      const forselect = await getAllUsers(req);
      return res.json(forselect);
    })
    .catch(e => {
      const { message = e, statusCode = 500 } = e;
      console.log('users.js > authenticate error', e);
      return res.status(statusCode).json({
        success: false,
        error: message
      });
    });
}
