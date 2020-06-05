const fs = require('fs');
const path = require('path');
const os = require('os');
const shell = require('shelljs');
const ifaces = os.networkInterfaces();

const isProdEnv = process.argv && (process.argv.length > 2 ? process.argv[2] === 'prod' : '') || false;

const availableIPv4Addresses = Object
    .values(ifaces)
    .map((ifaceValues) => (ifaceValues && ifaceValues.find(({family}) => (family === 'IPv4'))))
    .filter((ifaceValue) => (ifaceValue && !ifaceValue.internal))
    .map(({address}) => address);

const [ip] = availableIPv4Addresses;

const networkSecurityConfigDirectoryPath = [__dirname, '..', 'resources', 'android', 'xml'];
const networkSecurityConfigDirectory = path.join(...networkSecurityConfigDirectoryPath);
const networkSecurityConfigFile = path.join(...networkSecurityConfigDirectoryPath, 'network_security_config.xml');

shell.mkdir('-p', networkSecurityConfigDirectory);

const networkSecurityConfigXml = (
    `<?xml version="1.0" encoding="utf-8"?>
    <network-security-config>
        <domain-config cleartextTrafficPermitted="true">
            <domain includeSubdomains="true">localhost</domain>
            ${!isProdEnv && ip ? ('<domain includeSubdomains="true">' + ip + '</domain>') : ''}
        </domain-config>
    </network-security-config>`
);


if (fs.existsSync(networkSecurityConfigFile)) {
    fs.unlinkSync(networkSecurityConfigFile)
}

fs.writeFile(networkSecurityConfigFile, networkSecurityConfigXml, (err) => {
    if (err) {
        throw err;
    }

    console.log('network_security_config.xml generated !')
});
