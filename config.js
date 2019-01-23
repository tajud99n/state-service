/* 
 * Create and export configuration variables
 *
*/

// Container for all the environments
let enviroments = {};

// Staging (default) environment
enviroments.staging = {
    'port': 3000,
    'envName': 'staging'
};

// Production environment
enviroments.production = {
    'port': 5000,
    'envName': 'production'
}

// Determine which environment was passed as a command-line argument
let currentEnvironment = typeof (process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not, default to staging
let environmentToExport = typeof (enviroments[currentEnvironment]) == 'object' ? enviroments[currentEnvironment] : enviroments.staging;

// Export the module
module.exports = environmentToExport;