/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express  = require('express'),
  app        = express(),
  fs         = require('fs'),
  path       = require('path'),
  bluemix    = require('./config/bluemix'),
  extend     = require('util')._extend,
  watson     = require('watson-developer-cloud'),
  twilo      = require('twilio');

// Bootstrap application settings
require('./config/express')(app);

// if bluemix credentials exists, then override local
var credentials =  extend({
  password : 'cfLgpNvMmBFd',
  url : 'https://gateway.watsonplatform.net/dialog/api',
  username : '74142551-c024-4a47-9c05-8ad43771e2b6',
  version: 'v1'
}, bluemix.getServiceCreds('dialog')); // VCAP_SERVICES


var dialog_id_in_json = (function() {
  try {
    var dialogsFile = path.join(path.dirname(__filename), 'dialogs', 'dialog-id.json');
    var obj = JSON.parse(fs.readFileSync(dialogsFile));
    return obj[Object.keys(obj)[0]].id;
  } catch (e) {
  }
})();


var dialog_id = process.env.DIALOG_ID || dialog_id_in_json || '<missing-dialog-id>';

// Create the service wrapper
var dialog = watson.dialog(credentials);

app.post('/conversation', function(req, res, next) {

  var params = extend({ dialog_id: dialog_id }, req.body);
  dialog.conversation(params, function(err, results) {
    if (err)
        return next(err);
    else {
      console.log(results);
      res.json({ dialog_id: dialog_id, conversation: results});
    }
  });

});


app.get('/twilio', function(req, res, next) {

    // Twilio Credentials
    // Your accountSid and authToken from twilio.com/user/account
    var accountSid = 'AC55a75faf007138fcaabeba87a02409a4';
    var authToken = "868b5b8ef031c9740913e48c201994c9";
    var client = require('twilio')(accountSid, authToken);

    var params = extend({ dialog_id: dialog_id}, req.body);
    console.log(req.body);

    dialog.conversation(params, function(err, results) {
        res.json({ dialog_id: dialog_id, conversation : results});
    });
});
app.post('/profile', function(req, res, next) {
  var params = req.body;
  dialog.getProfile(params, function(err, results) {
    if (err)
      return next(err);
    else
      res.json(results);
  });
});


// error-handler settings
require('./config/error-handler')(app);

var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);
