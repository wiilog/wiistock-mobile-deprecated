const fs = require('fs');
const path = require('path');

const credentialsFile = path.join(__dirname, '..', 'src', 'dev-credentials.json');
const credentialsDist = path.join(__dirname, '..', 'src', 'dev-credentials.json.dist');

if (!fs.existsSync(credentialsFile)) {
    fs.copyFileSync(credentialsDist, credentialsFile)
}
