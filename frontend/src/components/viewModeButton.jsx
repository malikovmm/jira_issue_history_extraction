import React from 'react';
import styled from 'styled-components';
const ViewButton = styled.button`
  background: ${props => (props.active ? '#0052cc' : '#f4f5f7')};
  color: ${props => (props.active ? '#f4f5f7' : '#0052cc')};
  font-size: 16px;
  border-radius: 3px;
  transition: all 0.3s;
  outline: none;
  border: none;
  padding: 7px 15px;
  font-weight: 600;
  &:hover {
    background: #deebffe5;
    color: #0052cc;
  }
  &:active {
    background: #0052cc;
    color: #f4f5f7;
  }
`;
export default function ViewModeButton(props) {
  // const [active, setactive] = useState(false)
  return (
    <ViewButton active={props.active} onClick={props.onClick}>
      {props.children}
    </ViewButton>
  );
}
