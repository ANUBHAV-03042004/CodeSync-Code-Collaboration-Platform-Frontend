const fs = require('fs');
const path = require('path');

/**
 * Netlify / CI Environment Variable Substitution Script
 * 
 * This script scans the built files in /dist and replaces placeholder strings
 * like %%ANGULAR_API_BASE%% with the actual values from environment variables.
 * 
 * Why here? Netlify's environment variables are available during build time,
 * but Angular's build process doesn't natively inject them into the production
 * bundle unless using complex custom builders. This simple post-build script
 * ensures the production site knows where to find the API Gateway.
 */

const distDir = path.join(__dirname, 'dist', 'codesync-frontend', 'browser');

// Map of placeholders to environment variable names
const replacements = {
  '%%ANGULAR_API_BASE%%': process.env.ANGULAR_API_BASE,
  '%%ANGULAR_WS_COLLAB%%': process.env.ANGULAR_WS_COLLAB,
  '%%ANGULAR_WS_NOTIF%%':  process.env.ANGULAR_WS_NOTIF,
  '%%ANGULAR_WS_EXEC%%':   process.env.ANGULAR_WS_EXEC
};

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      Object.entries(replacements).forEach(([placeholder, value]) => {
        if (content.includes(placeholder)) {
          if (value) {
            console.log(`Replacing ${placeholder} in ${file}`);
            content = content.split(placeholder).join(value);
            changed = true;
          } else {
            console.warn(`WARNING: Placeholder ${placeholder} found but environment variable is NOT SET.`);
          }
        }
      });

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  });
}

console.log('Starting environment variable substitution...');
if (fs.existsSync(distDir)) {
  walkDir(distDir);
  console.log('Substitution complete.');
} else {
  console.error(`Dist directory not found at ${distDir}. Did the build fail?`);
  process.exit(1);
}
