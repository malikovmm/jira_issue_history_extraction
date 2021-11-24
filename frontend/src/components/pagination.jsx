import React, { forwardRef } from 'react';
import styled from 'styled-components';

import AKPagination from '@atlaskit/pagination';
import Button from '@atlaskit/button';

import ChevronLeftIcon from '@atlaskit/icon/glyph/chevron-left';
import ChevronRightIcon from '@atlaskit/icon/glyph/chevron-right';

const CustomButton = styled(Button)`
  &.pagination {
    background-color: transparent;
  }
`;
const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;
export default function Pagination(props) {
  const handlePagingClick = page => {
    if (page > props.totalPages) return;
    if (page < 1) return;
    props.pushQuery(page, props.limit);
  };
  const renderPrevNextButton = next => {
    return forwardRef(function RenderPrevButton(RenderPrevButtonProps, ref) {
      const toNumberPage = next ? props.pageNumber + 1 : props.pageNumber - 1;
      const Button = (
        <CustomButton
          ref={ref}
          className={
            next ? 'pagination pagination-next' : 'pagination pagination-prev'
          }
          onClick={() => handlePagingClick(toNumberPage)}
          iconAfter={
            next ? (
              <ChevronRightIcon size="medium" />
            ) : (
              <ChevronLeftIcon size="medium" />
            )
          }
          isDisabled={
            next ? pages.length === props.pageNumber : props.pageNumber === 1
          }
        />
      );
      return Button;
    });
  };

  const renderLinks = forwardRef(function RenderLinks(renderLinksProps, ref) {
    const { page: pageLink } = renderLinksProps;
    const isSelected = pageLink === props.pageNumber;
    const button = isSelected ? (
      <Button
        ref={ref}
        className="pagination pagination-page"
        onClick={() => handlePagingClick(pageLink)}
        isSelected={isSelected}
      >
        {pageLink}
      </Button>
    ) : (
      <CustomButton
        ref={ref}
        className="pagination pagination-page"
        onClick={() => handlePagingClick(pageLink)}
        isSelected={isSelected}
      >
        {pageLink}
      </CustomButton>
    );
    return button;
  });

  const pages = () => {
    return Array.from(Array(props.totalPages)).map((val, i) => i + 1);
  };
  return (
    <PaginationContainer>
      <AKPagination
        components={{
          Page: renderLinks,
          Previous: renderPrevNextButton(false),
          Next: renderPrevNextButton(true)
        }}
        selectedIndex={props.pageNumber - 1}
        pages={pages()}
      />
    </PaginationContainer>
  );
}
