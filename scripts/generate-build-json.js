const fs = require('fs');
const path = require('path');
const readline = require('readline');

const buildJsonDistPath = path.join(__dirname, '..', 'build.json.dist');
const buildJsonPath = path.join(__dirname, '..', 'build.json');
const keyPasswordPath = path.join(__dirname, '..', 'wiistock-key-password.json');

if (fs.existsSync(buildJsonPath)) {
    fs.unlinkSync(buildJsonPath);
}

try {
    const {password} = JSON.parse(fs.readFileSync(keyPasswordPath, 'utf8'));

    writeBuildJson(password);
}
catch (ignore) {
    const readlineUtils = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    readlineUtils._writeToOutput = function _writeToOutput(stringToWrite) {
        if (stringToWrite !== `Keystore password? ` && readlineUtils.stdoutMuted)
            readlineUtils.output.write("*");
        else
            readlineUtils.output.write(stringToWrite);
    };

    readlineUtils.question(`Keystore password? `, (password) => {
        readlineUtils.stdoutMuted = true;

        writeBuildJson(password);

        readlineUtils.history = readlineUtils.history.slice(1);
        readlineUtils.close();
    });
}

function writeBuildJson(password) {

    const buildJsonStr = JSON.parse(fs.readFileSync(buildJsonDistPath, 'utf8'));
    buildJsonStr.android.release.storePassword = password;
    buildJsonStr.android.release.password = password;

    fs.writeFileSync(keyPasswordPath, JSON.stringify({password}));
    fs.writeFileSync(buildJsonPath, JSON.stringify(buildJsonStr));
}
