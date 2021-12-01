import React, { useState } from 'react';
import styled from 'styled-components';

import { DateTimePicker } from '@atlaskit/datetime-picker';
import Textfield from '@atlaskit/textfield';
import { AsyncSelect } from '@atlaskit/select';
import { fetch } from '../ap';

const FilterBarStyled = styled.div``;
const FilterButton = styled.button`
  outline: none;
  border: none;

  background: #0052cc;
  color: white;
  font-weight: 600;
  border-radius: 3px;
  font-size: 18px;
  padding: 3px 20px;
  margin: 0 auto;
  &:hover {
    background: rgba(0, 82, 204, 0.8);
  }
`;
const FilterRow = styled.div`
  display: flex;
  gap: 5px;
`;
const FilterForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 10px;
`;
const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex-grow: 1;
`;
const FieldTitle = styled.p`
  color: #6b778c;
  font-weight: 600;
  margin: 0;
`;
export default function FilterBar(props) {
  const [issueKeyFilter, setIssueKeyFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const { pushQuery } = props;
  const onChangeHandler = (value, setter) => {
    return e => {
      setter(e.target.value);
    };
  };
  return (
    <FilterBarStyled>
      <FilterForm
        onSubmit={e => {
          e.preventDefault();
          pushQuery(null, null, {
            issueKey: issueKeyFilter,
            user: userFilter,
            field: fieldFilter,
            dateFrom: dateFromFilter,
            dateTo: dateToFilter
          });
        }}
      >
        <FilterRow>
          <Field>
            <FieldTitle>Issue key</FieldTitle>
            <Textfield
              onChange={onChangeHandler(issueKeyFilter, setIssueKeyFilter)}
            />
          </Field>
          <Field>
            <FieldTitle>User</FieldTitle>
            <AsyncSelect
              inputId="async-select-example"
              cacheOptions
              defaultOptions
              loadOptions={_search => {
                return new Promise(resolve => {
                  fetch('api/users').then(res => {
                    resolve([{ label: 'Any', value: '' }, ...res]);
                  });
                });
              }} // [{label:,value:}]
              onChange={({ label: _label, value }) => {
                setUserFilter(value);
              }}
            />
            {/* <Textfield
                    onChange={onChangeHandler(userFilter, setUserFilter)}
                  /> */}
          </Field>
          <Field>
            <FieldTitle>Field</FieldTitle>

            <Textfield
              onChange={onChangeHandler(fieldFilter, setFieldFilter)}
            />
          </Field>
        </FilterRow>
        <FilterRow>
          <Field>
            <FieldTitle>Date from</FieldTitle>
            <DateTimePicker
              onChange={e => {
                setDateFromFilter(e.split('+')[0]);
              }}
            />
          </Field>
          <Field>
            <FieldTitle>Date to</FieldTitle>
            <DateTimePicker
              onChange={e => {
                setDateToFilter(e.split('+')[0]);
              }}
            />
          </Field>
        </FilterRow>
        <FilterButton>Apply filters</FilterButton>
      </FilterForm>
    </FilterBarStyled>
  );
}
