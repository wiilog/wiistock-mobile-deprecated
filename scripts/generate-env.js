const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
    throw new Error('Please enter the right parameter for the script. Usage : node scripts/check-env prod or dev.')
}
const environment = {
    env: process.argv[2]
};

fs.writeFileSync(path.join(__dirname, '..', 'src', 'environment.json'), JSON.stringify(environment));
