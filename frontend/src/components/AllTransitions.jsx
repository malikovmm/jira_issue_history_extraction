import React from 'react';
import styled from 'styled-components';
import IssueTransitionsTable from './IssueTransitionsTable';
const ProjectName = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #0052cc;
  border-bottom: 1px solid #0052cc;
  margin: 20px 0 0 0;
  padding-bottom: 10px;
`;
export default function AllTransitions({ statuses, projectName }) {
  // console.log('statuses', statuses);
  return (
    <div>
      <ProjectName>Project {projectName}</ProjectName>
      {statuses.map(s => (
        <IssueTransitionsTable statusId={s.id} key={s.id} />
      ))}
    </div>
  );
}
