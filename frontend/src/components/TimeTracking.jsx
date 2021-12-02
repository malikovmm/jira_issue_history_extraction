import React, { useState, useEffect } from 'react';
import { useAsync } from 'react-use';
import { fetch } from '../ap';
import { formatSeconds } from '../utils';
import ValueRow from './ValueRow';

export default function TimeTracking() {
  const [estimateKeys, setEstimateKeys] = useState([]);
  const [logged, setLogged] = useState('0m');
  const [loggedKeys, setLoggedKeys] = useState([]);
  const { error, loading: trLoading } = useAsync(async () =>
    fetch(`/api/timetracking`, {
      query: {
        fields: 'all'
      }
    }).then(data => {
      // console.log('data', data);
      setLoggedKeys(data.tSpentKeys);
      setLogged(formatSeconds(data.sumTotal.spent));
      setEstimateKeys(data.tEstimateKeys);
      return data;
    })
  );
  useEffect(() => {
    if (error) console.log('error TimeTracking', error);
  }, [error]);

  if (trLoading) return <div>Loading</div>;
  if (error) return <div>Error</div>;

  return (
    <>
      <ValueRow
        title="Time logged"
        titleColored={logged}
        totalColored={loggedKeys.length}
        totalText={'Tickets total'}
        keys={loggedKeys}
      />
      <ValueRow
        title="Estimate changed:"
        totalColored={estimateKeys.length}
        totalText={'Tickets total'}
        keys={estimateKeys}
      />
    </>
  );
}
