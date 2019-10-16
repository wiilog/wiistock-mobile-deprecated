const path = require('path');
const useDefaultConfig = require('@ionic/app-scripts/config/webpack.config.js');
const env = process.env.IONIC_ENV;


if (env !== 'prod' && env !== 'dev') {
    // Default to dev config
    useDefaultConfig[env] = useDefaultConfig['dev'];
}


useDefaultConfig[env].resolve.alias = {
    "@app": path.resolve('./src/app/'),
    "@assets": path.resolve('./src/assets/'),
    "@pages": path.resolve('./src/pages/'),
    "@services": path.resolve('./src/services/'),
    "@providers": path.resolve('./src/providers/'),
    "@theme": path.resolve('./src/theme/')
};

module.exports = () => useDefaultConfig;
