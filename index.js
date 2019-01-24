/* 
 * Primary file for the API
 *
*/

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config');
const fs = require('fs');
const _data = require('./lib/data');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');


// Instantiate the HTTP server
const httpServer = http.createServer(function (req, res) {
    unifiedServer(req, res);
});

// Start the HTTP server
httpServer.listen(config.httpPort, function () {
    console.log(`The server is listening on port ${config.httpPort} in ${config.envName} mode`);
});

// Instantiate the HTTPS server
const httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};

const httpsServer = https.createServer(httpsServerOptions, function (req, res) {
    unifiedServer(req, res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, function () {
    console.log(`The server is listening on port ${config.httpsPort} in ${config.envName} mode`);
});

// Unified server- all the server logic for both the http and https server
let unifiedServer = function (req, res) {
     // Get the URL and parse it
     let parsedUrl = url.parse(req.url, true);

     // Get the path
     let path = parsedUrl.pathname;
     let trimmedPath = path.replace(/^\/+|\/+$/g, '');

     // Get the query string as an object
     let queryStringObject = parsedUrl.query;

     // Get the HTTP Method
     let method = req.method.toLowerCase();

     // Get the headers as an object
     let headers = req.headers;

     // Get the payload, if any
     const decoder = new stringDecoder('utf-8');
     let buffer = '';
     req.on('data', function (data) {
         buffer += decoder.write(data);
     });

     req.on('end', function () {
         buffer += decoder.end();

         // Choose the handler this request should go to. If one is not found, use the not found handler
         let chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

         // Construct the data object to send to the handler
         let data = {
             'trimmedPath': trimmedPath,
             'queryStringObject': queryStringObject,
             'method': method,
             'headers': headers,
             'payload': helpers.parseJsonToObject(buffer)
         };

         // Route the request to the handler specified in the router
         chosenHandler(data, function (statusCode, payload) {
             // Use the status code called back by the handler, or default 200
             statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

             // Use the payload called back by the handler, or default to an empty object
             payload = typeof (payload) == 'object' ? payload : {};

             // Convert the payload to a string
             let payloadString = JSON.stringify(payload);

             // Return the response
             res.setHeader('Content-Type', 'application/json');
             res.writeHead(statusCode);
             res.end(payloadString);

             // Log the request path
             console.log("Returning this response: ", statusCode, payloadString);
         });


     });
};



// Define a request router
const router = {
    'ping': handlers.ping,
    'users': handlers.users
}