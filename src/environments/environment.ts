/**
 * LOCAL DEVELOPMENT — all traffic goes through the API Gateway on port 8080.
 *
 * Gateway routes:
 *   /api/v1/auth/**          → auth-service        (no JwtAuthFilter)
 *   /oauth2/**               → auth-service OAuth2  (no JwtAuthFilter)
 *   /login/oauth2/**         → auth-service OAuth2  (no JwtAuthFilter)
 *   /api/v1/projects/**      → project-service      (+ JwtAuthFilter)
 *   /api/v1/files/**         → file-service         (+ JwtAuthFilter)
 *   /api/v1/sessions/**      → collab-service       (+ JwtAuthFilter)
 *   /ws/collab/**            → collab-service WS    (no JwtAuthFilter)
 *   /api/v1/executions/**    → execution-service    (+ JwtAuthFilter)
 *   /ws/execution/**         → execution-service WS (no JwtAuthFilter)
 *   /api/v1/versions/**      → version-service      (+ JwtAuthFilter)
 *   /api/v1/comments/**      → comment-service      (+ JwtAuthFilter)
 *   /api/v1/notifications/** → notification-service (+ JwtAuthFilter)
 *   /ws/notifications/**     → notification-service WS (no JwtAuthFilter)
 */
export const environment = {
  production: false,

  // Single entry point — the Spring Cloud Gateway
  apiBase: 'http://localhost:8080',

  // WebSocket endpoints (STOMP over SockJS) — also via the Gateway
  wsCollabEndpoint:        'http://localhost:8080/ws/collab/websocket',
  wsNotificationEndpoint:  'http://localhost:8080/ws/notifications/websocket',
  wsExecutionEndpoint:     'http://localhost:8080/ws/execution/websocket',
};
