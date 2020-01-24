const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
    throw new Error('Please enter the right parameter for the script. Usage : node scripts/check-env prod or dev.')
}
const credentialsFile = path.join(__dirname, '..', 'credentials.json');
const credentialsDist = path.join(__dirname, '..', 'credentials.json.dist');
const environmentFile = path.join(__dirname, '..', 'src', 'environment.json');

const environment = {
    env: process.argv[2]
};

if (!fs.existsSync(credentialsFile)) {
    fs.copyFileSync(credentialsDist, credentialsFile)
}
fs.writeFileSync(environmentFile, JSON.stringify(environment));
