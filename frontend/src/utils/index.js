/**
 * @TODO: fill in what this file does and why it exists
 */
import { isEqual, isObject, mapObject, omit, pick } from 'underscore';
import { default as fetch } from '../ap/request';
import { IS_DEV } from '../constants';

export { fetch };

// @TODO: fill in what this function does and why it exists
export function cleanObject(obj) {
  return omit(obj, i => i === '' || i === undefined || i === null);
}

export const compactObject = (obj, mustNotEqual) =>
  pick(obj, val => val !== mustNotEqual);

// @TODO: fill in what this function does and why it exists
// https://stackoverflow.com/questions/19098797/fastest-way-to-flatten-un-flatten-nested-json-objects
export function flatten(data) {
  var result = {};
  function recurse(cur, prop) {
    if (Object(cur) !== cur) {
      result[prop] = cur;
    } else if (Array.isArray(cur)) {
      for (var i = 0, l = cur.length; i < l; i++)
        recurse(cur[i], prop + '[' + i + ']');
      if (l == 0) result[prop] = [];
    } else {
      var isEmpty = true;
      for (var p in cur) {
        isEmpty = false;
        recurse(cur[p], prop ? prop + '.' + p : p);
      }
      if (isEmpty && prop) result[prop] = {};
    }
  }
  recurse(data, '');
  return result;
}

// @TODO: fill in what this function does and why it exists
export function unflatten(data) {
  'use strict';
  if (Object(data) !== data || Array.isArray(data)) return data;
  var regex = /\.?([^.[\]]+)|\[(\d+)\]/g,
    resultholder = {};
  for (var p in data) {
    var cur = resultholder,
      prop = '',
      m;
    while ((m = regex.exec(p))) {
      cur = cur[prop] || (cur[prop] = m[2] ? [] : {});
      prop = m[2] || m[1];
    }
    cur[prop] = data[p];
  }
  return resultholder[''] || resultholder;
}

// @TODO: fill in what this function does and why it exists
export function getHeader(name = '', headers = {}) {
  return headers[name] || headers[name.toLowerCase()];
}

// @TODO: fill in what this function does and why it exists
export function promiseTimeout(fn, maxDurationMS = 50000) {
  return new Promise((resolve, reject) => {
    var timeout = setTimeout(() => {
      timeout = undefined;
      reject('TIMEOUT: getContext');
    }, maxDurationMS);

    return fn(
      (...results) => {
        if (!timeout) {
          return;
        }
        timeout = undefined;
        resolve(...results);
      },
      (...results) => {
        if (!timeout) {
          return;
        }
        timeout = undefined;
        reject(...results);
      }
    );
  });
}

// @TODO: fill in what this function does and why it exists
export async function promiseTimer(fn, id, ...rest) {
  const startTime = Date.now();
  const result = await fn();
  const endTime = Date.now();
  if (IS_DEV) {
    console.log(
      `LOADED ${id} in ${endTime - startTime} milliseconds`,
      {
        startTime,
        endTime,
        duration: endTime - startTime
      },
      ...rest
    );
  }
  return result;
}

/**
 * Deep diff between two object, using underscore
 * @param  {Object} object Object compared
 * @param  {Object} base   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */
export const difference = (object, base) => {
  const changes = (object, base) =>
    pick(
      mapObject(object, (value, key) =>
        !isEqual(value, base[key])
          ? isObject(value) && isObject(base[key])
            ? changes(value, base[key])
            : value
          : null
      ),
      value => value !== null
    );
  return changes(object, base);
};

export function longestCommonStartingPrefix(arr1) {
  const arr = arr1.concat().sort();
  const a1 = arr[0];
  const a2 = arr[arr.length - 1];
  const L = a1.length;
  let i = 0;
  while (i < L && a1.charAt(i) === a2.charAt(i)) i++;
  return a1.substring(0, i);
}

export const setAsString = value =>
  typeof value !== 'string' ? JSON.stringify(value) : value;
