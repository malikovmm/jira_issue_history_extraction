import { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { getUsers } from '../api/atlassian';
import { withServerSideAuth } from '../middleware/authenticate';
import { fetch } from '../ap';
import Select from '@atlaskit/select';
import Pagination from './../components/pagination';
import { countClientChanges, getChanges } from './../api/changeLog';
import { useRouter } from 'next/router';
import { inspect } from 'util';
import { getToken } from '../ap/request';
import { DynamicTableStateless } from '@atlaskit/dynamic-table';
import Avatar from '@atlaskit/avatar';
import Lozenge from '@atlaskit/lozenge';
import { DEFAULT_CHANGES_ON_PAGE } from '../constants';
// import {
//   getValidatedOrder,
//   getValidatedSortKey,
//   getValidatedSortOrder
// } from '../database/util';
import FilterBar from '../components/FilterBar';
import useNextLoader from '../hooks/useNextLoader';
import ViewModeButton from '../components/viewModeButton';
import VM2 from '../components/VM2';
import {
  getValidatedOrder,
  getValidatedSortKey,
  getValidatedSortOrder
} from '../utils';
const tableHead = {
  cells: [
    {
      key: 'id',
      content: 'Id',
      isSortable: true
    },
    {
      key: 'editor',
      content: 'Editor'
    },
    {
      key: 'issueKey',
      content: 'Issue',
      isSortable: true
    },
    {
      key: 'field',
      content: 'Field',
      isSortable: true
    },
    {
      key: 'changedAt',
      content: 'Changed at',
      isSortable: true
    },
    {
      key: 'action',
      content: 'Action',
      isSortable: true
    }
  ]
};
const limitOptions = [
  { label: '10', value: 10 },
  { label: '15', value: 15 },
  { label: '20', value: 20 },
  { label: '25', value: 25 },
  { label: '30', value: 30 },
  { label: '35', value: 35 },
  { label: '40', value: 40 }
];

const DataContainer = styled.div`
  width: 80%;
  margin: 0 auto;
`;
const IssueLink = styled.a``;
const TableContainer = styled.div``;
const UserCell = styled.div`
  display: flex;
  align-items: center;
`;
const UserName = styled.span`
  margin-left: 5px;
`;
const FieldContainer = styled.span``;
const ChangedContainer = styled.span``;

const LozengeActionWrapper = props => {
  const lozengeProps = {};
  switch (props.action) {
    case 'create': {
      lozengeProps.appearance = 'success';
      break;
    }
    case 'delete': {
      lozengeProps.appearance = 'removed';
      break;
    }
    case 'update': {
      lozengeProps.appearance = 'new';
      break;
    }
    default: {
      throw 'props must be create or delete or update';
    }
  }

  return <Lozenge {...lozengeProps}>{props.children}</Lozenge>;
};
const createRows = (doInit, changes, stateChanges) => {
  const mapCb = change => ({
    key: `row-${change.id}`,
    cells: [
      {
        key: `id_${change.id}`,
        content: <div>{change.id}</div>
      },
      {
        key: `user_${change.id}`,
        content: (
          <UserCell>
            <Avatar
              appearance="circle"
              src={change.editorData.avatarUrls['24x24']}
              size="small"
              name={change.editorData.displayName}
            />
            <UserName>{change.editorData.displayName}</UserName>
          </UserCell>
        )
      },
      {
        key: `issue_${change.id}`,
        content: (
          <IssueLink
            target="_blank"
            href={`${process.env.NEXT_PUBLIC_SERVER_URL}/browse/${change.issueKey}`}
          >
            {change.issueKey}
          </IssueLink>
        )
      },
      {
        key: `field_${change.id}`,
        content: <FieldContainer>{change.field}</FieldContainer>
      },
      {
        key: `chngedat_${change.id}`,
        content: (
          <ChangedContainer>
            {new Date(change.changedAt).toUTCString()}
          </ChangedContainer>
        )
      },
      {
        key: `action_${change.id}`,
        content: (
          <LozengeActionWrapper action={change.action}>
            {change.action}
          </LozengeActionWrapper>
        )
      }
    ]
  });
  if (!doInit && changes) {
    return changes.map(mapCb);
  } else {
    return stateChanges.map(mapCb);
  }
};
const ModeBar = styled.div`
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 5px;
`;
export default function ModulePage(props) {
  console.log('props>>>', props);
  const [sortKey, setSortKey] = useState(props.sortKey || 'id');
  const [sortOrder, setSortOrder] = useState(props.sortOrder || 'ASC');
  const [limit, setLimit] = useState(props.limit);
  const router = useRouter();
  // const [routerLoading, setRouterLoading] = useState(false);
  const routerLoading = useNextLoader();
  const [fetching, setFetching] = useState(false);
  const [initChanges, setInitChanges] = useState([]);
  const [changescount, setChangescount] = useState(1);
  const [viewMode, setViewMode] = useState(1); // 1 - full | 2 - by values

  /**
   *
   * @param {*} page
   * @param {*} limit
   * @param {*} filterData: [{filter:value},{...},...]
   * {
        issueKey: issueKeyFilter,
        user: userFilter,
        field: fieldFilter,
        dateFrom: dateFromFilter,
        dateTo: dateToFilter
      }
   */
  const pushQuery = (page, limit, filterData = null) => {
    getToken().then(jwt => {
      if (!page) router.query['pageNumber'] = ~~router.query['pageNumber'] || 1;
      else router.query['pageNumber'] = page;
      if (!limit)
        router.query['limit'] =
          ~~router.query['limit'] || DEFAULT_CHANGES_ON_PAGE;
      else router.query['limit'] = limit;
      router.query['jwt'] = jwt;
      router.query['sortKey'] = sortKey;
      router.query['sortOrder'] = sortOrder;
      if (filterData) {
        if (filterData.issueKey != undefined) {
          router.query['issueKey'] = filterData.issueKey;
        }
        if (filterData.user != undefined) {
          router.query['user'] = filterData.user;
        }
        if (filterData.field != undefined) {
          router.query['field'] = filterData.field;
        }
        if (filterData.dateFrom != undefined) {
          router.query['dateFrom'] = filterData.dateFrom;
        }
        if (filterData.dateTo != undefined) {
          router.query['dateTo'] = filterData.dateTo;
        }
      }
      router.push({ pathname: router.pathname, query: router.query });
    });
  };

  const totalPages = useMemo(() => {
    const count = props.changesTotal ? props.changesTotal : changescount;

    const totalPages = Math.ceil(count / limit) ? Math.ceil(count / limit) : 1;
    return totalPages;
  }, [props.changesTotal, limit, changescount]);

  useEffect(() => {
    pushQuery(null, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortKey, sortOrder, limit]);
  useEffect(() => {
    setChangescount(props.changesTotal);
  }, [props.changesTotal]);

  useEffect(() => {
    if (props.doInit) {
      setFetching(true);
      fetch('/api/initChanges', {
        method: 'GET'
      })
        .then(it => {
          setInitChanges(it.rows);
          setChangescount(it.count);
        })
        .catch(error => {
          setInitChanges([]);
          console.log('Failed to fetch initChanges', error);
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [props.doInit, props.changes]);

  const rows = createRows(props.doInit, props.changes, initChanges);

  return (
    <>
      <DataContainer>
        <ModeBar>
          <span>View mode:</span>
          <ViewModeButton
            active={viewMode === 1}
            onClick={() => setViewMode(1)}
          >
            Full
          </ViewModeButton>
          <ViewModeButton
            active={viewMode === 2}
            onClick={() => setViewMode(2)}
          >
            By values
          </ViewModeButton>
        </ModeBar>
        {viewMode == 1 && (
          <>
            <FilterBar pushQuery={pushQuery} />
            <TableContainer>
              <DynamicTableStateless
                caption={
                  <span>
                    {props.doInit && fetching
                      ? 'The first launch may take a few minutes, please wait...'
                      : 'Change list'}
                  </span>
                }
                sortKey={sortKey}
                isLoading={routerLoading || fetching}
                loadingSpinnerSize={'small'}
                head={tableHead}
                rows={rows}
                onSort={a => {
                  setSortKey(a.key);
                  if (sortOrder.toLowerCase() == 'asc') {
                    setSortOrder('DESC');
                  }
                  if (sortOrder.toLowerCase() == 'desc') {
                    setSortOrder('ASC');
                  }
                }}
              />
            </TableContainer>
            <Pagination
              pageNumber={props.pageNumber}
              pushQuery={pushQuery}
              totalPages={totalPages}
              limit={limit}
            />
            <Select
              options={limitOptions}
              value={limit}
              onChange={a => {
                setLimit(a.value);
              }}
              placeholder="Choose a limit"
            />
          </>
        )}
        {viewMode == 2 && (
          <>
            <div>
              <VM2 />
            </div>
          </>
        )}
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
    return withServerSideAuth(getServerSidePropsModule)(context);
  } else {
    return getServerSidePropsModule(context);
  }
};

// eslint-disable-next-line no-unused-vars
const ins = obj =>
  inspect(obj, { showHidden: true, depth: null, colors: true });

async function getServerSidePropsModule(ctx) {
  const { req, query } = ctx;
  const {
    pageNumber = 1,
    limit = DEFAULT_CHANGES_ON_PAGE,
    sortKey,
    sortOrder,
    issueKey,
    user,
    field,
    dateFrom,
    dateTo
  } = query;

  const props = {
    pageNumber: Number(pageNumber) || 1,
    limit: Number(limit) || DEFAULT_CHANGES_ON_PAGE
  };
  try {
    getValidatedSortKey(sortKey) && (props.sortKey = sortKey);
    getValidatedSortOrder(sortOrder) && (props.sortOrder = sortOrder);

    if (req.context && req.context.clientInfo) {
      const { count: rawChangesCount, rows: rawChanges } = await getChanges({
        pageNumber: props.pageNumber,
        limit: props.limit,
        order: getValidatedOrder(sortKey, sortOrder),
        clientKey: req.context.clientInfo.clientKey,

        issueKey,
        authorId: user,
        field,
        dateFrom: dateFrom,
        dateTo: dateTo
      });
      props.changesTotal = rawChangesCount;
      if (req.context.clientInfo.clientKey && rawChangesCount == 0) {
        const clientChanges = await countClientChanges({
          clientKey: req.context.clientInfo.clientKey
        });
        if (clientChanges == 0) props.doInit = true;
      } else {
        props.doInit = false;
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
        props.changes = rawChanges;
      }
    }
    // console.log('returned', props);
    return {
      props
    };
  } catch (error) {
    console.log('MODULE ERROR>>>>>>>>', error);
    return {
      props
    };
  }
}
