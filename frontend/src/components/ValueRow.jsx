import React from 'react';
import styled from 'styled-components';
import BreadcrumbsControlled from './BreadcrumbsControlled';
const ValueContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 9fr;
  margin-top: 10px;
`;
const KeysContainer = styled.div``;
const Title = styled.div`
  display: flex;
  align-items: center;
`;
const ColoredSpan = styled.span`
  color: #0052cc;
  margin-left: 5px;
`;
const BreadcrumbsContainer = styled.div`
  align-items: center;
  display: flex;
  gap: 5px;
`;
const TotalContainer = styled.div`
  min-width: fit-content;
`;
export default function ValueRow(props) {
  return (
    <ValueContainer>
      <Title>
        {props.title}{' '}
        {props.titleColored && <ColoredSpan>{props.titleColored}</ColoredSpan>}
      </Title>
      <KeysContainer>
        <BreadcrumbsContainer>
          <TotalContainer>
            {props.totalColored && (
              <ColoredSpan>{props.totalColored}</ColoredSpan>
            )}{' '}
            {props.totalText}({' '}
          </TotalContainer>
          <BreadcrumbsControlled keys={props.keys} />)
        </BreadcrumbsContainer>
      </KeysContainer>
    </ValueContainer>
  );
}
