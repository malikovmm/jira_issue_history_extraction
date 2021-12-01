import React, { useState } from 'react';
import styled from 'styled-components';
import TimeTracking from './TimeTracking';
import TransitionsTable from './TransitionsTable';
import ViewModeButton from './viewModeButton';

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
          TransitionsTable
        </ViewModeButton>
        <ViewModeButton
          active={activeTab === 2}
          onClick={() => setActiveTab(2)}
        >
          TimeTracking
        </ViewModeButton>
      </ModeBar>
      <div>
        {activeTab == 1 && <TransitionsTable />}
        {activeTab == 2 && <TimeTracking />}
      </div>
    </div>
  );
}
