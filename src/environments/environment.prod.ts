/**
 * PRODUCTION — replace %%VARIABLES%% via Netlify / CI environment variable substitution
 * before deploying, or set them in Netlify Dashboard → Site Settings → Environment Variables.
 *
 * Required variables:
 *   ANGULAR_API_BASE    e.g. https://gateway.apps.openshift.com
 *   ANGULAR_WS_COLLAB   e.g. https://gateway.apps.openshift.com/ws/collab/websocket
 *   ANGULAR_WS_NOTIF    e.g. https://gateway.apps.openshift.com/ws/notifications/websocket
 *   ANGULAR_WS_EXEC     e.g. https://gateway.apps.openshift.com/ws/execution/websocket
 *
 * Gateway URL reference (same routes as dev, just different host):
 *   POST   %%ANGULAR_API_BASE%%/api/v1/auth/login
 *   POST   %%ANGULAR_API_BASE%%/api/v1/auth/register
 *   POST   %%ANGULAR_API_BASE%%/api/v1/auth/logout
 *   POST   %%ANGULAR_API_BASE%%/api/v1/auth/refresh
 *   POST   %%ANGULAR_API_BASE%%/api/v1/auth/validate
 *   GET    %%ANGULAR_API_BASE%%/api/v1/auth/session/status
 *   GET    %%ANGULAR_API_BASE%%/api/v1/auth/profile
 *   PUT    %%ANGULAR_API_BASE%%/api/v1/auth/profile
 *   PUT    %%ANGULAR_API_BASE%%/api/v1/auth/password
 *   GET    %%ANGULAR_API_BASE%%/api/v1/auth/search?q=...
 *   GET    %%ANGULAR_API_BASE%%/api/v1/auth/{userId}
 *   POST   %%ANGULAR_API_BASE%%/api/v1/auth/deactivate
 *   POST   %%ANGULAR_API_BASE%%/api/v1/auth/forgot-password
 *   GET    %%ANGULAR_API_BASE%%/api/v1/auth/reset-password/validate?token=...
 *   POST   %%ANGULAR_API_BASE%%/api/v1/auth/reset-password
 *   GET    %%ANGULAR_API_BASE%%/api/v1/auth/admin/users
 *   PUT    %%ANGULAR_API_BASE%%/api/v1/auth/admin/users/{id}/reactivate
 *   DELETE %%ANGULAR_API_BASE%%/api/v1/auth/admin/users/{id}
 *   GET    %%ANGULAR_API_BASE%%/oauth2/authorization/github   ← browser redirect
 *   GET    %%ANGULAR_API_BASE%%/oauth2/authorization/google   ← browser redirect
 */
export const environment = {
  production: true,
  apiBase:               '%%ANGULAR_API_BASE%%',
  wsCollabEndpoint:      '%%ANGULAR_WS_COLLAB%%',
  wsNotificationEndpoint:'%%ANGULAR_WS_NOTIF%%',
  wsExecutionEndpoint:   '%%ANGULAR_WS_EXEC%%',
};
