const fs = require('fs');
const path = require('path');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,

});
readline.stdoutMuted = true;

const buildJsonDistPath = path.join(__dirname, '..', 'build.json.dist');
const buildJsonPath = path.join(__dirname, '..', 'build.json');

if (fs.existsSync(buildJsonPath)) {
    fs.unlinkSync(buildJsonPath);
}

readline._writeToOutput = function _writeToOutput(stringToWrite) {
    if (stringToWrite !== `Keystore password? ` && readline.stdoutMuted)
        readline.output.write("*");
    else
        readline.output.write(stringToWrite);
};

readline.question(`Keystore password? `, (password) => {
    const buildJsonStr = JSON.parse(fs.readFileSync(buildJsonDistPath, 'utf8'));
    buildJsonStr.android.release.storePassword = password;
    buildJsonStr.android.release.password = password;


    fs.writeFileSync(buildJsonPath, JSON.stringify(buildJsonStr));
    readline.history = readline.history.slice(1);
    readline.close();
});
