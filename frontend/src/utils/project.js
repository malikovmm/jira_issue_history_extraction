import { hostRequest } from '../api/oauth';

export async function getProjectIdByKey(projectKey, clientInfo) {
  const { value } = clientInfo;
  return hostRequest(value, {
    method: 'GET',
    url: `/rest/api/3/project/${projectKey}`
  }).then(response => {
    return response && response.id ? response.id : undefined;
  });
}
