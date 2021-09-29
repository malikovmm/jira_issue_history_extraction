import { useContext } from 'react';
import { useAsync } from 'react-use';
import { APContext, fetch } from '../ap';
import { getAddonDetails } from '../api/atlassian';
import { hostRequest } from '../api/oauth';
import { withServerSideAuth } from '../middleware/authenticate';

export default function ModulePage(props) {
  const AP = useContext(APContext);

  const clientProjects = useAsync(() => fetch('/rest/api/3/project'));
  const apiRequest = useAsync(() => fetch('/api/test'));

  return (
    <div>
      <div style={{ marginBottom: 10 }}>LOCATION: {props.location}</div>
      <div style={{ marginBottom: 10 }}>USER: {JSON.stringify(AP.user)}</div>
      {props.projectsAsUser && (
        <div style={{ marginBottom: 10 }}>
          projectsAsUserFromServer:{' '}
          {JSON.stringify(props.projectsAsUser.map(project => project.key))}
        </div>
      )}
      {props.addonDetails && (
        <div style={{ marginBottom: 10 }}>
          addonDetailsAsServer: {JSON.stringify(props.addonDetails)}
        </div>
      )}
      <div style={{ marginBottom: 10 }}>
        projectsAsUserClient:{' '}
        {clientProjects.value &&
          JSON.stringify(clientProjects.value.map(project => project.key))}
      </div>
      <div style={{ marginBottom: 10 }}>
        apiRequest: {apiRequest && JSON.stringify(apiRequest)}
      </div>
    </div>
  );
}

/* 
  // This additional wrapping is just to support all forms of access
  // Should Look like this when requiring ServerSide Wrap
  export const getServerSideProps = withServerSideAuth(context => {
    return {
      props: {}
    }
  })
 */
export const getServerSideProps = context => {
  const { query } = context;
  if (query.jwt) {
    return withServerSideAuth(getServerSidePropsModule)(context);
  } else {
    return getServerSidePropsModule(context);
  }
};

async function getServerSidePropsModule(ctx) {
  const { req, query } = ctx;

  const props = {
    location: query.location
  };

  if (req.context.clientInfo) {
    props.projectsAsUser = await hostRequest(req.context.clientInfo.value, {
      accountId: req.context.accountId,
      url: '/rest/api/3/project'
    });
    props.addonDetails = await getAddonDetails(req.context);
  }

  return {
    props
  };
}
