import { createContext } from 'react';
import DataLoader from 'dataloader';

import { fetch } from '../utils';

export const UserContext = createContext({
  data: [],
  search: undefined
});

export const formatUserRecord = record => {
  if (record) {
    if (record.avatarUrls && record.avatarUrls['48x48']) {
      record.avatarUrl = record.avatarUrls['48x48'];
    }
    record.accountType =
      record.accountType ||
      (record.accountId.indexOf('gm') === -1 ? 'atlassian' : 'customer');
  }
  return record;
};

export const userLoader = new DataLoader(
  async keys => {
    return fetch('/rest/api/3/user/bulk', {
      method: 'GET',
      query: {
        accountId: keys,
        maxResults: 128
      }
    }).then(response => {
      return response && response.values
        ? response.values.map(user => formatUserRecord(user))
        : keys.map(() => null);
    });
  },
  {
    maxBatchSize: 128
  }
);

export function searchUser(query) {
  return fetch('/rest/api/3/user/search', {
    search: {
      query
    }
  }).then(response =>
    response
      .map(value => {
        userLoader.prime(value.accountId, value);
        return formatUserRecord(value);
      })
      .filter(record => !!record && record.accountType !== 'app')
  );
}
