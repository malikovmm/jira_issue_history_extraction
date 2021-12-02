import React from 'react';
import Breadcrumbs, { BreadcrumbsItem } from '@atlaskit/breadcrumbs';

export default function BreadcrumbsControlled(props) {
  return (
    <Breadcrumbs itemsBeforeCollapse={3} itemsAfterCollapse={2}>
      {props.keys.map(it => (
        <BreadcrumbsItem
          text={it}
          key={it}
          href={`${process.env.NEXT_PUBLIC_SERVER_URL}/browse/${it}`}
          target="_blank"
        />
      ))}
    </Breadcrumbs>
  );
}
