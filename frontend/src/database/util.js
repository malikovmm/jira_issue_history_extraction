import { Op, col } from 'sequelize';
import moment from 'moment';

export const whereLike = (fieldName, values) =>
  [].concat(values).map(value => ({
    [fieldName]: {
      [Op.like]: `%${value}%`
    }
  }));

export const sortOrder = options => {
  const {
    replace = false,
    defaultSort,
    defaultSortOrder = 'DESC',
    sort,
    sortOrder,
    sorts // allowable sorts array
  } = options || {};

  const order = [];

  if ((sort && !sorts) || (sorts && sorts.indexOf(sort) !== -1)) {
    order.push([typeof sort === 'string' ? col(sort) : sort, sortOrder]);
  }

  if (defaultSort && (!replace || !sort)) {
    order.push([defaultSort, defaultSortOrder]);
  }

  return order;
};

export const getPagination = options => {
  const { maxLimit = 50 } = options || {};
  var { offset, limit = maxLimit } = options || {};

  offset = parseInt(offset || 0, 10);
  limit = parseInt(limit || maxLimit, 10);

  if (limit > maxLimit) {
    limit = maxLimit;
  }

  if (offset < 0) {
    offset = 0;
  }

  return {
    offset,
    limit
  };
};

export const getDateRangeWhere = ({ fieldName, startDate, endDate }) => {
  startDate = startDate
    ? moment.utc(startDate).startOf('day').format()
    : startDate;
  endDate = endDate ? moment.utc(endDate).endOf('day').format() : endDate;
  if (startDate && endDate) {
    return {
      [fieldName]: {
        [Op.lte]: endDate,
        [Op.gte]: startDate
      }
    };
  } else if (startDate) {
    return {
      [fieldName]: {
        [Op.gte]: startDate
      }
    };
  } else if (endDate) {
    return {
      [fieldName]: {
        [Op.lte]: endDate
      }
    };
  } else {
    return {};
  }
};
