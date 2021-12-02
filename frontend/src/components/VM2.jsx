import React, { useState } from 'react';
import styled from 'styled-components';
import TimeTracking from './TimeTracking';
import TransitionsTable from './TransitionsTable';
import ViewModeButton from './viewModeButton';
import FieldsChanged from './FieldsChanged';

const ModeBar = styled.div`
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 5px;
`;
export default function VM2() {
  const [activeTab, setActiveTab] = useState(1);
  return (
    <div>
      <ModeBar>
        <span>View mode:</span>
        <ViewModeButton
          active={activeTab === 1}
          onClick={() => setActiveTab(1)}
        >
          Transitions table
        </ViewModeButton>
        <ViewModeButton
          active={activeTab === 2}
          onClick={() => setActiveTab(2)}
        >
          Time tracking
        </ViewModeButton>
        <ViewModeButton
          active={activeTab === 3}
          onClick={() => setActiveTab(3)}
        >
          Fields changed
        </ViewModeButton>
      </ModeBar>
      <div>
        {activeTab == 1 && <TransitionsTable />}
        {activeTab == 2 && <TimeTracking />}
        {activeTab == 3 && <FieldsChanged />}
      </div>
    </div>
  );
}
