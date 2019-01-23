/* 
 * Primary file for the API
 *
*/

// Dependencies
const http = require('http');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;

// The server should respond to all request with a string
const server = http.createServer(function (req, res) {
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
            'payload': buffer
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
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the request path
            console.log("Returning this response: ", statusCode, payloadString);
        });

        
    });
});

// Start the server, and have it listen on port 3000
server.listen(3000, function () {
    console.log("The server is listening on port 3000 now");
});

// Define the handlers
let handlers = {};

// Sample handler
handlers.sample = function (data, callback) {
    // Callback a http status code, and a payload object
    callback(406, {'name': 'sample handler'});
};

// Not found handler
handlers.notFound = function (data, callback) {
    callback(404);
};

// Define a request router
const router = {
    'sample': handlers.sample
}