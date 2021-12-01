import React, { useState, useEffect } from 'react';
import { useAsync } from 'react-use';
import { fetch } from '../ap';

export default function TimeTracking(props) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const { value: transitions, error, loading: trLoading } = useAsync(async () =>
    fetch(`/api/timetracking`, {
      query: {
        fields: 'all'
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

  return <div>time logged:</div>;
}
