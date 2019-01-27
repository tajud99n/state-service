/*
 * Create and export configuration variables
 *
*/

// Container for all the environments
let enviroments = {};

// Staging (default) environment
enviroments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'hashingSecret': 'ThisIsASecret',
    'maxChecks': 5,
    'twilio': {
        'accountSid': 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken': '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone': '+15005550006'
    }
};

// Production environment
enviroments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'ThisIsASecret',
    'maxChecks': 5,
    'twilio': {
        'accountSid': '',
        'authToken': '',
        'fromPhone': ''
    }
};

// Determine which environment was passed as a command-line argument
let currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not, default to staging
let environmentToExport = typeof(enviroments[currentEnvironment]) == 'object' ? enviroments[currentEnvironment] : enviroments.staging;

// Export the module
module.exports = environmentToExport;