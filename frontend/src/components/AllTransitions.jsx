import React, { useState, useEffect, useMemo } from 'react';
import { useAsync } from 'react-use';
import styled from 'styled-components';
import useNextLoader from '../hooks/useNextLoader';
import IssueTransitionsTable from './IssueTransitionsTable';
const ProjectName = styled.h2`
  font-size: 24px;
  font-weight: 600;
`;
export default function AllTransitions({ statuses, projectName }) {
  const loading = useNextLoader();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  console.log('statuses', statuses);
  return (
    <div>
      <ProjectName>{projectName}</ProjectName>
      {statuses.map(s => (
        <IssueTransitionsTable statusId={s.id} key={s.id} />
      ))}
    </div>
  );
}
