import React from 'react';
import styled from 'styled-components';
const ViewButton = styled.button`
  background: ${props => (props.active ? '#505f79' : '#f4f5f7')};
  color: ${props => (props.active ? '#f4f5f7' : '#505f79')};
  font-size: 18px;
  border-radius: 3px;
  transition: all 0.3s;
  outline: none;
  border: 1px solid #505f79;
  &:hover {
    background: #505f79;
    color: #f4f5f7;
  }
  &:active {
    background: #505f79;
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
