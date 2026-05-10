const fs = require('fs');

const envFile = `export const environment = {
  production: true,
  apiBase:                '${process.env.ANGULAR_API_BASE || ''}',
  wsCollabEndpoint:       '${process.env.ANGULAR_WS_COLLAB || ''}',
  wsNotificationEndpoint: '${process.env.ANGULAR_WS_NOTIF || ''}',
  wsExecutionEndpoint:    '${process.env.ANGULAR_WS_EXEC || ''}'
};`;

fs.writeFileSync('./src/environments/environment.prod.ts', envFile);
console.log('Successfully generated environment.prod.ts with secrets.');
