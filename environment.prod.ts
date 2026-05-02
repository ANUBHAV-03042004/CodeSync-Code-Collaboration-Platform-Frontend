// API URLs are injected at build time via GitHub Secrets.
// Set these secrets in: GitHub repo → Settings → Secrets → Actions
export const environment = {
  production: true,
  apiBase:                '%%API_BASE%%',
  wsCollabEndpoint:       '%%WS_COLLAB%%',
  wsNotificationEndpoint: '%%WS_NOTIF%%',
  wsExecutionEndpoint:    '%%WS_EXEC%%'
};
