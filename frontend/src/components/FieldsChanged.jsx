import React, { useEffect, useState } from 'react';
import ValueRow from './ValueRow';

import { useAsync } from 'react-use';
import { fetch } from '../ap';

export default function FieldsChanged() {
  const [fieldEntries, setFieldEntries] = useState([]);
  const { error, loading } = useAsync(async () =>
    fetch(`/api/fieldsChanged`, {
      // query: {
      //   fields: 'all'
      // }
    }).then(data => {
      console.log('data', data);
      setFieldEntries(Object.entries(data.fieldToKeys));
      return data;
    })
  );
  useEffect(() => {
    if (error) console.log('error FieldsChanged', error);
  }, [error]);
  // useEffect(() => {
  //   if (fieldEntries) console.log('fieldEntries FieldsChanged', fieldEntries);
  // }, [fieldEntries]);

  if (loading) return <div>Loading</div>;
  if (error) return <div>Error</div>;

  return (
    <>
      {fieldEntries.map(([k, v]) => (
        <ValueRow
          title={k}
          totalColored={v.keys.length}
          totalText={'Tickets '}
          keys={v.keys}
          key={k}
        />
      ))}
    </>
  );
}
