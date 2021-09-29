import React from 'react';
import SectionMessage from '@atlaskit/section-message';

export default function LicenseError() {
  return (
    <div style={{ padding: 20 }}>
      <SectionMessage appearance="error" title="Unlicensed App">
        This app is unlicensed. Please contact an administrator to fix.
      </SectionMessage>
    </div>
  );
}
