import React, { useState, useEffect, useMemo } from 'react';
import { DynamicTableStateless } from '@atlaskit/dynamic-table';
import Pagination from './../components/pagination';
import { fetch } from '../ap';
import useNextLoader from '../hooks/useNextLoader';
import { getToken } from '../ap/request';
import { useAsync } from 'react-use';
import AllTransitions from './AllTransitions';

const tableHead = {
  cells: [
    {
      key: 'id',
      content: 'Id',
      isSortable: true
    },
    {
      key: 'issuekey',
      content: 'issuekey'
    }
  ]
};

export default function TransitionsTable(props) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const { value: transitions, error, loading: trLoading } = useAsync(async () =>
    fetch(`/api/transitions`, {
      query: {
        page,
        limit,
        names: true
      }
    }).then(data => {
      console.log('data', data);
      return data;
    })
  );
  useEffect(() => {
    console.log('error tt', error);
  }, [error]);
  if (trLoading) return <div>Loading</div>;
  if (error) return <div>Error</div>;
  return (
    <>
      {Object.entries(transitions).map(([k, v]) => (
        <AllTransitions key={k} statuses={v} projectName={k} />
      ))}
    </>
  );
}
