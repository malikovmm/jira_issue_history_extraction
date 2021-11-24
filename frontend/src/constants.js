export const IS_SERVER = typeof window === 'undefined';

export const IS_DEV =
  process.env.NODE_ENV === 'development' || process.env.STAGE !== 'prod';

export const IS_IFRAME = !IS_SERVER && window.parent !== window;

export const HAS_AP = !IS_SERVER && !!window.AP;

export const HAS_AP_JIRA = HAS_AP && !!window.AP.jira;

export const HAS_AP_REQUEST = HAS_AP && !!window.AP.request;

export const HAS_AP_DIALOG = HAS_AP && !!window.AP.dialog;

export const HAS_AP_DIALOG_CUSTOM_DATA =
  HAS_AP_DIALOG && !!window.AP.dialog.getCustomData;

export const HAS_AP_DIALOG_CLOSE = HAS_AP_DIALOG && !!window.AP.dialog.close;

export const HAS_AP_EVENTS = HAS_AP && !!window.AP.events;

export const HAS_AP_CONTEXT =
  HAS_AP && !!window.AP.context && !!window.AP.context.getContext;

export const HAS_AP_TOKEN =
  HAS_AP && !!window.AP.context && !!window.AP.context.getToken;

export const HAS_AP_LOCATION = HAS_AP && !!window.AP.getLocation;

export const HAS_AP_HISTORY = HAS_AP && !!window.AP.history;

export const HAS_AP_USER =
  HAS_AP && !!window.AP.user && window.AP.user.getCurrentUser;

export const SKIP_LICENSE = /no-license/.test(process.env.AC_OPTS);

export const DEFAULT_CHANGES_ON_PAGE = 15;
