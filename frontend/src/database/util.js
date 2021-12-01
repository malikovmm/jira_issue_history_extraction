import { Op, col } from 'sequelize';
import moment from 'moment';
import { fielsList } from './models/change';
import { inspect } from 'util';
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

export const getValidatedOrder = (sortKey, sortOrder) => {
  if (!fielsList.includes(sortKey)) {
    return false;
  }
  if (!sortOrder.toLowerCase() == 'asc' || !sortOrder.toLowerCase() == 'desc') {
    return false;
  }
  return [[sortKey.toUpperCase(), sortOrder.toUpperCase()]];
};
export const getValidatedSortKey = sortKey => {
  if (!sortKey || !fielsList.includes(sortKey)) {
    return undefined;
  }
  return sortKey;
};
export const getValidatedSortOrder = sortOrder => {
  if (
    !sortOrder ||
    !sortOrder.toLowerCase() == 'asc' ||
    !sortOrder.toLowerCase() == 'desc'
  ) {
    return undefined;
  }
  return sortOrder;
};

export const getCommentAction = comment =>
  comment.created == comment.updated ? 'create' : 'update';
export const getHistoryAction = item => {
  if (item.field == 'status') console.log('getHistoryAction status', item);
  if (!item.fromString && !!item.toString) return 'create';
  if (!!item.fromString && !!item.toString) return 'update';
  if (!!item.fromString && !item.toString) return 'delete';
};
/**
 * YYYY-MM-DDTHH:mm 0000 -> YYYY-MM-DDTHH:mm:00 0000
 * @param {*} date
 */
export const addSecondsToTime = date => {
  if (!date) return;
  const splited = date.split(' ');
  return [splited[0] + ':00', splited[1]].join(' ');
};

export const ins = obj =>
  inspect(obj, {
    showHidden: true,
    depth: null,
    colors: true,
    maxArrayLength: null
  });
