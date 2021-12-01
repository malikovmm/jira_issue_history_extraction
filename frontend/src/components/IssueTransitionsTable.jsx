import React, { useState, useEffect, useMemo } from 'react';
import { useAsync } from 'react-use';
import useNextLoader from '../hooks/useNextLoader';
import { fetch } from '../ap';

import { DynamicTableStateless } from '@atlaskit/dynamic-table';
import Pagination from './../components/pagination';
const tableHead = {
  cells: [
    {
      key: 'issuekey',
      content: 'issueKey'
    },
    {
      key: 'changedAt',
      content: 'changedAt'
    },
    {
      key: 'numberOfTransitions',
      content: 'numberOfTransitions'
    }
  ]
};
export default function IssueTransitionsTable({ statusId }) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [title, setTitle] = useState('');
  const { value: transitions, error, loading: trLoading } = useAsync(
    async () =>
      fetch(`/api/transitions`, {
        query: {
          page,
          limit,
          statusId
        }
      }).then(data => {
        console.log('data transitions', data);
        setTitle(data.statusObj.name);
        return data;
      }),
    [statusId]
  );
  const rows = useMemo(() => {
    if (trLoading || error) return;
    return transitions.temp2.map((transition, ix) => {
      return {
        key: `row-${ix}`,
        cells: [
          {
            key: `issueKey_${ix}`,
            content: (
              <a
                rel="noreferrer"
                target="_blank"
                href={`${process.env.NEXT_PUBLIC_SERVER_URL}/browse/${transition.issueKey}`}
              >
                {transition.issueKey}
              </a>
            )
          },
          {
            key: `changedAt_${ix}`,
            content: <div>{new Date(transition.changedAt).toUTCString()}</div>
          },
          {
            key: `numberOfTransitions_${ix}`,
            content: <div>{transition.numberOfTransitions}</div>
          }
        ]
      };
    });
  }, [transitions, trLoading]);
  return (
    <div>
      <DynamicTableStateless
        caption={<span>{title}</span>}
        // sortKey={sortKey}
        isLoading={trLoading}
        loadingSpinnerSize={'small'}
        head={tableHead}
        rows={rows}
        // onSort={a => {
        //   setSortKey(a.key);
        //   if (sortOrder.toLowerCase() == 'asc') {
        //     setSortOrder('DESC');
        //   }
        //   if (sortOrder.toLowerCase() == 'desc') {
        //     setSortOrder('ASC');
        //   }
        // }}
      />
      {/* <Pagination
        pageNumber={props.pageNumber}
        pushQuery={pushQuery} //(page,limit) =>
        totalPages={totalPages}
        limit={limit}
      /> */}
    </div>
  );
}
