import db from '../database';
import { setAsString } from '../utils';

export const createLifecyleRecord = ({
  addonKey,
  clientId,
  clientKey,
  eventType,
  value
}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('createLifecycleRecord', {
      addonKey,
      clientId,
      clientKey,
      eventType,
      value
    });
  }

  return db.LifecycleEvent.create({
    addonKey,
    clientId,
    clientKey,
    eventType,
    val: setAsString(value)
  });
};
