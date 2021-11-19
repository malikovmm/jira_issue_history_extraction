import {
  useContext,
  useState,
  useEffect,
  forwardRef,
  useMemo,
  useCallback
} from 'react';
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

import Link from 'next/link';
import AKPagination from '@atlaskit/pagination';
import Button from '@atlaskit/button';
import URI from 'urijs';

import ChevronLeftIcon from '@atlaskit/icon/glyph/chevron-left';
import ChevronRightIcon from '@atlaskit/icon/glyph/chevron-right';
import {
  bulkCreateChanges,
  countChanges,
  getChanges
} from './../api/changeLog';
import Router, { useRouter } from 'next/router';
import { inspect } from 'util';
import { getToken } from '../ap/request';
const DataContainer = styled.div`
  height: 100vh;
`;
const KeyButton = styled.span`
  padding: 5px;
  border: 2px solid gray;
  border-radius: 4px;
  cursor: pointer;
`;

const CustomButton = styled(Button)`
  &.pagination {
    background-color: transparent;
  }
`;

const Row = ({ objKey, value, ix }) => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <div key={ix} style={{ margin: '20px 0' }}>
        <KeyButton onClick={() => setVisible(!visible)}>
          {ix + 1} - ({objKey}):
        </KeyButton>
        {visible &&
          value.map(it => (
            <div key={it.id}>
              {Object.entries(it).map(([k, v], ix) => (
                <div key={v.toString() + ix}>
                  <span>{k}</span> : <p>{v.toString()}</p>
                </div>
              ))}
            </div>
          ))}
        {/* {visible && <pre>{JSON.stringify(value, null, 2)}</pre>} */}
      </div>
    </>
  );
};
export default function ModulePage(props) {
  const [loading, setLoading] = useState(false);
  const [jwt, setJwt] = useState('');
  const { pathname, query, isReady, push } = useRouter();
  const search = { page: 1 };

  useEffect(() => {
    getToken().then(data => {
      setJwt(data);
    });
  }, []);
  const toPage = useMemo(
    () =>
      URI(pathname)
        .search(search || {})
        .toString(),
    [pathname, search]
  );
  const router = useRouter();

  const [value, setValue] = useState('');
  const [loadedchangelogs, setLoadedchangelogs] = useState([]);
  const AP = useContext(APContext);
  const clientProjects = useAsync(() => _fetch('/rest/api/3/project'));
  const apiRequest = useAsync(() => _fetch('/api/test'));
  const otherpropstemp = JSON.parse(JSON.stringify(props));
  otherpropstemp.projectsAsUser = null;
  otherpropstemp.location = null;
  otherpropstemp.addonDetails = null;
  const onPageClick = undefined;
  const handlePagingClick = useCallback(
    page => {
      if (onPageClick) {
        return onPageClick(page);
      }
    },
    [onPageClick]
  );
  const renderPrevNextButton = next => {
    return forwardRef(function RenderPrevButton(props, ref) {
      const toNumberPage = next ? page + 1 : page - 1;
      const href = toPage
        ? URI(toPage)
            .setSearch({ page: toNumberPage })
            .setSearch({ jwt: jwt })
            .toString()
        : undefined;
      const Button = (
        <CustomButton
          ref={ref}
          href={href}
          className={
            next ? 'pagination pagination-next' : 'pagination pagination-prev'
          }
          onClick={() => handlePagingClick(toNumberPage)}
          iconAfter={
            next ? (
              <ChevronRightIcon size="medium" />
            ) : (
              <ChevronLeftIcon size="medium" />
            )
          }
          isDisabled={next ? pages.length === page : page === 1}
        />
      );
      return href ? <Link href={href}>{Button}</Link> : Button;
    });
  };

  const renderLinks = forwardRef(function RenderLinks(props, ref) {
    const { page: pageLink } = props;
    const href = toPage
      ? URI(toPage).setSearch({ page: pageLink }).toString()
      : undefined;
    const isSelected = pageLink === page;
    const button = isSelected ? (
      <Button
        ref={ref}
        href={href}
        className="pagination pagination-page"
        onClick={() => handlePagingClick(pageLink)}
        isSelected={isSelected}
      >
        {pageLink}
      </Button>
    ) : (
      <CustomButton
        ref={ref}
        href={href}
        className="pagination pagination-page"
        onClick={() => handlePagingClick(pageLink)}
        isSelected={isSelected}
      >
        {pageLink}
      </CustomButton>
    );
    return href ? <Link href={href}>{button}</Link> : button;
  });
  const totalPages = 2;
  const page = 1;
  const pages = useMemo(
    () => Array.from(Array(totalPages)).map((val, i) => i + 1),
    [totalPages]
  );
  return (
    <>
      <DataContainer>
        <div style={{ marginBottom: 10 }}>LOCATION: {props.location}</div>
        {props.query && (
          <div style={{ marginBottom: 10 }}>
            query: {JSON.stringify(props.query)}
          </div>
        )}
        <div style={{ marginBottom: 10 }}>USER: {JSON.stringify(AP.user)}</div>
        {/* {props.projectsAsUser && (
            <div style={{ marginBottom: 10 }}>
              projectsAsUserFromServer:{' '}
              {JSON.stringify(props.projectsAsUser.map(project => project.key))}
            </div>
          )}
          {props.addonDetails && (
            <div style={{ marginBottom: 10 }}>
              addonDetailsAsServer: {JSON.stringify(props.addonDetails)}
            </div>
          )} */}
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
            setLoadedchangelogs(response);
          }}
        >
          Search
        </button>
        <button
          onClick={() => {
            router.query['pageNumber'] = '2';
            router.query['limit'] = '20';
            router.query['jwt'] = jwt;
            router.push({ pathname: router.pathname, query: router.query });
          }}
        >
          page+
        </button>
        <button
          onClick={() => {
            router.query['pageNumber'] = '1';
            router.query['limit'] = '20';
            router.query['jwt'] = jwt;
            router.push({ pathname: router.pathname, query: router.query });
          }}
        >
          page-
        </button>
        <AKPagination
          components={{
            Page: renderLinks,
            Previous: renderPrevNextButton(false),
            Next: renderPrevNextButton(true)
          }}
          selectedIndex={page - 1}
          pages={pages}
        />
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
    console.log('>>>>>>>>>>>>>>>>WITH JWT');
    return withServerSideAuth(getServerSidePropsModule)(context);
  } else {
    console.log('>>>>>>>>>>>>>>>>WITHOUT JWT');
    return getServerSidePropsModule(context);
  }
};

// const ins = obj =>
//   inspect(obj, { showHidden: true, depth: null, colors: true });

async function getServerSidePropsModule(ctx) {
  const { req, query } = ctx;
  const { pageNumber = 1, limit = 20 } = query;

  // // try {
  const props = {};
  const rowsQuantity = await countChanges();
  // console.log('req.context', req.context);
  if (req.context && req.context.clientInfo) {
    if (rowsQuantity == 0) {
      props.projectsAsUser = await getProjectDetails(req.context);

      const issues = await getAllIssues(req.context);
      props.preparedchanges = [];

      for (let issue of issues.issues) {
        const issuechangelog = await getAllIssueChangelogs(req.context, issue);
        props.preparedchanges.push(...issuechangelog);
      }
      console.log('preparedchanges>>>>>', props.preparedchanges.length);
      props.issues = issues;
      await bulkCreateChanges(props.preparedchanges);
    } else {
      console.log('query', query);
      props.changes = await getChanges({
        pageNumber: Number(pageNumber) ?? null,
        limit: Number(limit) ?? null
      });
      for (let i of props.changes) {
        i.changedAt = i.changedAt.toString();
        i.createdAt = i.createdAt.toString();
        i.updatedAt = i.updatedAt.toString();
      }
    }
    // console.log('changes', props.changes);
    console.log('changes len', props.changes.length);
    props.addonDetails = await getAddonDetails(req.context);
  }
  return {
    props
  };
  // } catch (e) {
  // const { req, query } = ctx;
  // console.log('ctx>>>>>>', ctx, '<<<<<<ctx');
  // console.log('req>>>>>>', req, '<<<<<<req');
  // console.log('req.context>>>>>>', req.context, '<<<<<<req.context');

  // const props = { location: 'none' };
  // // props.projectsAsUser = await getProjectDetails(req.context);
  // return { props };
  // }
}
