/*
 * Request handlers
 *
 */

// Dependencies
let _data = require('./data');
let helpers = require('./helpers');

// Define the handlers
const handlers = {};

// Ping handler
handlers.ping = function (data, callback) {
    callback(200);
};

// Not found handler
handlers.notFound = function (data, callback) {
    callback(404);
};

// Users
handlers.users = function (data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for the users submethods
handlers._users = {};

// Users - POST
// Required data: firstname, lastname, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function (data, callback) {
    // Check that all required fields are filled out
    let firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    let lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 11 ? data.payload.phone.trim() : false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    let tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;
    
    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure that the user doesnt already exist
        _data.read('users', phone, function (err, data) {
            if (err) {
                // Hash the password
                let hashedPassword = helpers.hash(password);

                if (hashedPassword) {
                    // Create the user object
                    let userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    };

                    // Store the user
                    _data.create('users', phone, userObject, function (err) {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {
                                'Error': 'Could not create the new user'
                            });
                        }
                    });
                } else {
                    callback(500, {'Error': 'Could not hash the user\'s password'});
                }

            } else {
                // User already exists
                callback(400, { 'Error': 'A user with that phone number already exists' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required fields' });
    }
};

// Users - GET
// Required data: phone
// Optional data: none
handlers._users.get = function (data, callback) {
    // Check that the phone number is valid
    let phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 11 ? data.queryStringObject.phone.trim() : false;

    if (phone) {
        // Get the token from the headers
        let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
            if (tokenIsValid) {
                // Lookup the user
                _data.read('users', phone, function (err, data) {
                    if (!err && data) {
                        // Remove the user password from the user before returning it to the requester
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(400);
                    }
                });
            } else {
                callback(403, {'Error': 'Missing required token in header, or token is invalid'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};

// Users - PUT
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = function (data, callback) {
    // Check for the required field
    let phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 11 ? data.payload.phone.trim() : false;
    
    // Check for the optional fields
    let firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    let lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if the phone is invalid
    if (phone) {
        // Error if nothing is sent to update
        if (firstName || lastName || password) {
            let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

            // Verify that the given token is valid for the phone number
            handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
                if (tokenIsValid) {
                    // Lookup the user
                    _data.read('users', phone, function (err, userData) {
                        if (!err && userData) {
                            // Update the fields necessary
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                userData.hashedPassword = helpers.hash(password);
                            }

                            // Store the new updates
                            _data.update('users', phone, userData, function (err) {
                                if (!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, {
                                        'Error': 'Could not update the user'
                                    });
                                }
                            });
                        } else {
                            callback(400, {
                                'Error': 'The specified user does not exist'
                            });
                        }
                    });
                } else {
                    callback(403, {
                        'Error': 'Missing required token in header, or token is invalid'
                    });
                }
            });
            
        } else {
            callback(400, {'Error': 'Missing fields to update'});
        }
    }
};

// Users - DELETE
// Required field: phone
// @TODO Cleanup (delete) any other data files associated with this user
handlers._users.delete = function (data, callback) {
    // Check that the phone is valid
     let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 11 ? data.queryStringObject.phone.trim() : false;

    if (phone) {
         // Get the token from the headers
         let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

         // Verify that the given token is valid for the phone number
         handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
             if (tokenIsValid) {
                // Lookup the user
                _data.read('users', phone, function (err, data) {
                    if (!err && data) {
                        // Delete user
                        _data.delete('users', phone, function (err) {
                            if (!err) {
                                callback(200);
                            } else {
                                callback(500, {
                                    'Error': 'Could not delete specified user'
                                });
                            }
                        });
                    } else {
                        callback(400, {
                            'Error': 'Could not find users'
                        });
                    }
                });
             } else {
                 callback(403, {
                     'Error': 'Missing required token in header, or token is invalid'
                 });
             }
         });
     } else {
         callback(400, {
             'Error': 'Missing required field'
         });
     }
};

// Tokens
handlers.tokens = function (data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - POST
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function (data, callback) {
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 11 ? data.payload.phone.trim() : false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone && password) {
        // Lookup the user who matches that phone number
        _data.read('users', phone, function (err, userData) {
            if (!err && userData) {
               // hash the sent password and compare it with one stored
                let hashedPassword = helpers.hash(password);
                
                if (hashedPassword == userData.hashedPassword) {
                    // Create a new token with a random name. Set expiration time to 1 hour in the future
                    let tokenId = helpers.createRandomString(20);
                    let expires = Date.now() + 1000 * 60 * 60;

                    const tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, function (err) {
                       if (!err) {
                           callback(200, tokenObject);
                       } else {
                           callback(500, {'Error': 'Token could not be created'});
                       } 
                    });
                } else {
                    callback(400, {'Error': 'Invalid Password'});
                }
            } else {
                callback(400, {'Error': 'Could not find the specified user'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required fields'});
    }
};

// Tokens - GET
// Required data: id
// Optional data: none
handlers._tokens.get = function (data, callback) {
   // Check that the id is valid
   let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

   if (id) {
       // Lookup the token
       _data.read('tokens', id, function (err, tokenData) {
           if (!err && tokenData) {
               callback(200, tokenData);
           } else {
               callback(400);
           }
       });
   } else {
       callback(400, {
           'Error': 'Missing required field'
       });
   }
};

// Tokens - PUT
// Required data: id, extend
// Optional  data: none
handlers._tokens.put = function (data, callback) {
    let id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    let extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;

    if (id && extend) {
        // Lookup the token
        _data.read('tokens', id, function (err, tokenData) {
           if (!err && tokenData) {
               // Check to the make sure the token isn't already expired
               if (tokenData.expires > Date.now()) {
                   // Set the expiration an hour from now
                   tokenData.expires = Date.now() + 1000 * 60 * 60;

                   // Store the new updates
                   _data.update('tokens', id, tokenData, function (err) {
                       if (!err) {
                           callback(200);
                       } else {
                           callback(500, { 'Error': 'Could not update the token\'s expiration' });
                       }
                   });
               } else {
                   callback(400, {'Error': 'The token has already expired, and cannot be extended'});
               }
           } else {
               callback(400, { 'Error': 'Specified token does not exist' });
           } 
        });
    } else {
        callback(400, {'Error': 'Missing required field(S) or field(s) are invalid'});
    }
    
};

// Tokens - DELETE
// Required data: id
// Optional data: none
handlers._tokens.delete = function (data, callback) {
     // Check that the id is valid
     let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

     if (id) {
         // Lookup the token
         _data.read('tokens', id, function (err, data) {
             if (!err && data) {
                 // Delete user
                 _data.delete('tokens', id, function (err) {
                     if (!err) {
                         callback(200);
                     } else {
                         callback(500, {
                             'Error': 'Could not delete specified token'
                         });
                     }
                 });
             } else {
                 callback(400, {
                     'Error': 'token do not exist'
                 });
             }
         });
     } else {
         callback(400, {
             'Error': 'Missing required field'
         });
     }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function (id, phone, callback) {
    // Lookup the token
    _data.read('tokens', id, function (err, tokenData) {
        if (!err && tokenData) {
            // Check that the token is for the given user and has not expired
            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};



// Export the module
module.exports = handlers;