import { createContext } from 'react';
import DataLoader from 'dataloader';
import { flatten, uniq } from 'underscore';

import { fetch } from '../utils';

export const IssueContext = createContext({
  data: [],
  search: undefined
});

export const formatIssueRecord = record => {
  if (record) {
    if (
      record.fields &&
      record.fields.project &&
      record.fields.project.avatarUrls &&
      record.fields.project.avatarUrls['48x48']
    ) {
      record.avatarUrl = record.fields.project.avatarUrls['48x48'];
    }
  }
  return record;
};

export const issueLoader = new DataLoader(
  async keys => {
    return fetch('/rest/api/3/search', {
      method: 'POST',
      body: JSON.stringify({
        jql: `issue IN (${keys.join(',')})`,
        maxResults: 100
      })
    }).then(response => {
      return response && response.issues
        ? response.issues.map(user => formatIssueRecord(user))
        : keys.map(() => null);
    });
  },
  {
    maxBatchSize: 100
  }
);

export function searchIssue(query) {
  return fetch('/rest/api/3/issue/picker', {
    search: {
      query,
      currentJQL: '',
      currentProjectId: undefined
    }
  })
    .then(response =>
      uniq(
        flatten(response.sections.map(({ issues }) => issues)),
        false,
        ({ id }) => id
      )
    )
    .then(issues =>
      issues.map(value => {
        issueLoader.prime(value.id, value);
        return formatIssueRecord(value);
      })
    );
}
