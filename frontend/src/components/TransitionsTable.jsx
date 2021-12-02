import React, { useState, useEffect } from 'react';
import { fetch } from '../ap';
import { useAsync } from 'react-use';
import AllTransitions from './AllTransitions';

export default function TransitionsTable() {
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
