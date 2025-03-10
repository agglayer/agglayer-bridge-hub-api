type Environment = 'dev' | 'prod' | 'staging';

interface Config {
    environment: Environment;
    port: number;
    logLevel: string;
    mongodb_url: string;
    network_base_urls: {[networkId: string]: string}
}
const networkBaseUrls = (process.env.NETWORK_BASE_URLS as string).split(',')

export const config: Config = {
    // App
    environment: (process.env.NODE_ENV || 'dev') as Environment,
    port: parseInt(process.env.PORT || String(3000)),
    logLevel: process.env.LOG_LEVEL || 'debug',
    mongodb_url: process.env.MONGO_URL || 'mongodb://localhost:27017/bridge-api-hub',
    network_base_urls: {
        0: networkBaseUrls[0]
    }
};