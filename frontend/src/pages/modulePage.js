import { useContext, useState, useEffect } from 'react';
import { useAsync } from 'react-use';
import styled from 'styled-components';
import { APContext, fetch as _fetch } from '../ap';
import {
  getAddonDetails,
  getProjectDetails,
  getAllIssues,
  getAllIssueChangelogs
} from '../api/atlassian';
import { withServerSideAuth } from '../middleware/authenticate';
import { countChanges } from './../api/changeLog';
import Router from 'next/router';
import { inspect } from 'util';
const DataContainer = styled.div`
  height: 100vh;
`;
const KeyButton = styled.span`
  padding: 5px;
  border: 2px solid gray;
  border-radius: 4px;
  cursor: pointer;
`;

const Row = ({ objKey, value, ix }) => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <div key={ix} style={{ margin: '20px 0' }}>
        <KeyButton onClick={() => setVisible(!visible)}>
          {ix + 1} - ({objKey}):
        </KeyButton>
        {visible && <pre>{JSON.stringify(value, null, 2)}</pre>}
      </div>
    </>
  );
};

export default function ModulePage(props) {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const start = () => {
      console.log('start loading');
      setLoading(true);
    };
    const end = () => {
      console.log('findished loading');
      setLoading(false);
    };
    Router.events.on('routeChangeStart', start);
    Router.events.on('routeChangeComplete', end);
    Router.events.on('routeChangeError', end);
    return () => {
      Router.events.off('routeChangeStart', start);
      Router.events.off('routeChangeComplete', end);
      Router.events.off('routeChangeError', end);
    };
  }, []);
  const [value, setValue] = useState('');
  const [loadedchangelogs, setLoadedchangelogs] = useState([]);
  const AP = useContext(APContext);
  const clientProjects = useAsync(() => _fetch('/rest/api/3/project'));
  const apiRequest = useAsync(() => _fetch('/api/test'));
  const otherpropstemp = JSON.parse(JSON.stringify(props));
  otherpropstemp.projectsAsUser = null;
  otherpropstemp.location = null;
  otherpropstemp.addonDetails = null;

  return (
    <>
      {!loading ? (
        <DataContainer>
          <div style={{ marginBottom: 10 }}>LOCATION: {props.location}</div>
          <div style={{ marginBottom: 10 }}>
            USER: {JSON.stringify(AP.user)}
          </div>
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
          <br />
          <br />
          <input
            type="text"
            placeholder="Enter issue key"
            value={value}
            onChange={e => setValue(e.target.value)}
          />
          <button
            onClick={async () => {
              const response = await _fetch(
                `/rest/api/3/issue/${value}/changelog`
              );
              console.log('response', response);
              setLoadedchangelogs(response);
            }}
          >
            Search
          </button>
          <div>
            otherProps:{' '}
            <div>
              <Row ix={22} objKey={'objKey'} value={loadedchangelogs} />
              {Object.entries(otherpropstemp)
                .filter(it => it[1])
                .map(([objKey, value], ix) => (
                  <Row key={ix} ix={ix} objKey={objKey} value={value} />
                ))}
            </div>
          </div>
        </DataContainer>
      ) : (
        <div>Loading...</div>
      )}
    </>
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

const ins = obj =>
  inspect(obj, { showHidden: true, depth: null, colors: true });

async function getServerSidePropsModule(ctx) {
  const { req, query } = ctx;

  const props = {
    location: query.location
  };
  const rowsQuantity = await countChanges();

  if (req.context.clientInfo) {
    if (!rowsQuantity != 0) {
      props.projectsAsUser = await getProjectDetails(req.context);

      const issues = await getAllIssues(req.context);
      props.preparedchanges = [];
      for (let issue of issues.issues) {
        const issuechangelog = await getAllIssueChangelogs(req.context, issue);
        props.preparedchanges.push(...issuechangelog);
      }
      console.log('issues>>>>>', props.preparedchanges.length);
      props.issues = issues;
    }
    props.addonDetails = await getAddonDetails(req.context);
  }
  return {
    props
  };
}
