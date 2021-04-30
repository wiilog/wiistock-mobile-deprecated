'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const ifaces = os.networkInterfaces();
const file = require(path.join('../', 'src', 'dev-credentials.json'));

const availableIPv4Addresses = Object
    .values(ifaces)
    .map((ifaceValues) => (ifaceValues && ifaceValues.find(({family}) => family === 'IPv4')))
    .filter((ifaceValue) => ifaceValue && !ifaceValue.internal)
    .map(({address}) => address);

if(availableIPv4Addresses.length === 0) {
    throw new Error('IP of the local server not found');
} else {
    writeAddress("http://" + availableIPv4Addresses[0]);
}

function writeAddress(address) {
    file.localAddress = address;
    fs.writeFile(path.join(__dirname, '../', 'src', 'dev-credentials.json'), JSON.stringify(file, null, 2), (err) => {
        if (err) {
            return console.log(err);
        }
        console.log(`Writing local address ${address} into dev-credentials.json file`);
    });
}
