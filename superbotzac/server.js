/**
 * This HipChat add-on implementation shows you the basic interactions between HipChat and your add-on, including:
 * What happens when a user installs your add-on
 * How you generate API access tokens
 * How you make REST calls to the HipChat API
 * How you implement Webhooks to listen to messages sent by users
 * How you add HipChat Glances and Views to extend the HipChat UI
 *
 * Before you start, you should read the HipChat API getting started guide: https://developer.atlassian.com/hipchat
 * The comprehensive HipChat API reference can be found here: https://www.hipchat.com/docs/apiv2
 */

const elastic = require('./elastic');
const store = require('./store');
const config = require('./config.json');

const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');
const express = require('express');
const exphbs  = require('express-handlebars');
const bodyParser = require('body-parser');
const bunyan = require('bunyan');
const request = require('request');
const jwtUtil = require('jwt-simple');
const logger = bunyan.createLogger({
  name: 'search-addon',
  level: 'info'
});

const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

/**
 * Your add-on exposes a capabilities descriptor , which tells HipChat how the add-on plans to extend it.
 *
 * This add-on's capability descriptor can be found here: /capabilities.json
 * The variable ${host} is substituted based on the base URL of your add-on.
 */
function substituteVars(file, req, callback) {
  fs.readFile(file, function (err, data) {
    var content = _.template(data, {
      host: config.endpoint,
      name: config.name,
      key: config.name.toLowerCase().replace(' ','')
    });
    callback(content);
  });
}

function sendDescriptor(file, req, res) {
  substituteVars(file, req, function (content) {
    res.set('Content-Type', 'application/json');
    res.send(content);
  });
}

app.get('/descriptor', function (req, res) {
  sendDescriptor('capabilities-descriptor.json', req, res);
});

/**
 * In order for your add-on to be installed in HipChat, it needs to implement the HipChat add-on installation flow.
 * When a user installs or uninstalls your add-on, HipChat makes a REST call to an endpoint specified in the capabilities descriptor:
 *       "installable": {
 *           "allowGlobal": true,
 *           "allowRoom": true,
 *           "callbackUrl": "${host}/installed",
 *           "uninstalledUrl": "${host}/uninstalled"
 *       }
 * At installation, HipChat sends installation data: OAuth ID, shared secret, URLs to use to make REST calls, contextual information.
 * You need to store this information for later use.
 */

app.post('/installed', function (req, res) {
  logger.info(req.query, req.path);

  var installation = req.body;
  var oauthId = installation['oauthId'];

  // Retrieve the capabilities document
  var capabilitiesUrl = installation['capabilitiesUrl'];
  request.get(capabilitiesUrl, function (err, response, body) {
    var capabilities = JSON.parse(body);
    logger.info(capabilities, capabilitiesUrl);

    // Save the token endpoint URL along with the client credentials
    installation.tokenUrl = capabilities['capabilities']['oauth2Provider']['tokenUrl'];

    // Save the API endpoint URL along with the client credentials
    installation.apiUrl = capabilities['capabilities']['hipchatApiProvider']['url'];

    store.addInstallation(installation);

    res.sendStatus(200);
  });

});

app.get('/uninstalled', function (req, res) {
  logger.info(req.query, req.path);
  var redirectUrl = req.query['redirect_url'];
  var installable_url = req.query['installable_url'];

  request.get(installable_url, function (err, response, body) {
    var installation = JSON.parse(body);
    logger.info(installation, installable_url);

    store.removeInstallation(installation)
      .then(() => store.removeAccessToken(installation['oauthId']))
      // Redirect back to HipChat to complete the uninstallation
      .then(() => res.redirect(redirectUrl));
  });
});

/**
 * Making a REST call to HipChat:
 * ------------------------------
 * Your add-on must declare the intention to make REST calls to the HipChat API
 * in its capabilities descriptor, along with which scopes are required:
 *        "hipchatApiConsumer": {
 *            "fromName": "My Add-on",
 *            "scopes": [
 *                "send_notification"
 *            ]
 *        }
 * This will allow your add-on to generate access tokens, required to make REST calls to the HipChat API.
 * To obtain an access token, your add-on makes a REST call the tokenURL provided by HipChat at installation.
 * Access tokens are short-lived, so need to be refreshed periodically.
 */

function isExpired(accessToken) {
  return accessToken.expirationTimeStamp < Date.now();
}

function refreshAccessToken(oauthId, callback) {
  store.getInstallation(oauthId).then(installation => {
    var params = {
      // The token url was discovered through the capabilities document
      uri: installation.tokenUrl,
      // Basic auth with OAuth credentials received on installation
      auth: {
        username: installation['oauthId'],
        password: installation['oauthSecret']
      },
      // OAuth dictates application/x-www-form-urlencoded parameters
      // In terms of scope, you can either to request a subset of the scopes declared in the add-on descriptor
      // or, if you don't, HipChat will use the scopes declared in the descriptor
      form: {
        grant_type: 'client_credentials',
        scope: 'send_notification'
      }
    };
    logger.info(params, installation.tokenUrl);

    request.post(params, function (err, response, body) {
      var accessToken = JSON.parse(body);
      logger.info(accessToken, installation.tokenUrl);

      store.addAccessToken(oauthId, {
        // Add a minute of leeway
        expirationTimeStamp: Date.now() + ((accessToken['expires_in'] - 60) * 1000),
        token: accessToken
      }).then(() => callback(accessToken));
    });
  });
}

function getAccessToken(oauthId, callback) {
  store.getAccessToken(oauthId).then(accessToken => {
    if (!accessToken || isExpired(accessToken)) {
      refreshAccessToken(oauthId, callback);
    } else {
      process.nextTick(function () {
        callback(accessToken.token);
      });
    }
  });
}

/**
 * Sending messages to HipChat rooms
 * ---------------------------------
 * You send messages to HipChat rooms via a REST call to the room notification endpoint
 * HipChat supports various formats for messages, and here are a few examples:
 */

function sendMessage(oauthId, roomId, message) {
  store.getInstallation(oauthId).then(installation => {
    var notificationUrl = installation.apiUrl + 'room/' + roomId + '/notification';
    getAccessToken(oauthId, function (token) {
      request.post(notificationUrl, {
        auth: {
          bearer: token['access_token']
        },
        json: {
          message: message
        }
      }, function (err, response, body) {
        logger.info(err || response.statusCode, notificationUrl);
        logger.info(response);
      });
    });
  });
}

function sendPrivateMessage(oauthId, user, message) {
    store.getInstallation(oauthId).then(installation => {
        var notificationUrl = installation.apiUrl + 'user/' + user + '/message';
        request.post(notificationUrl, {
            auth: {
                bearer: config.teabotToken
            },
            json: {
              message: message,
              notify: true,
              message_format: 'html'
            }
        }, function (err, response, body) {
            logger.info(err || response.statusCode, notificationUrl);
            logger.info(response);
        });
    });
}

/**
 * Securing your add-on with JWT
 * -----------------------------
 * Whenever HipChat makes a call to your add-on (webhook, glance, views), it passes a JSON Web Token (JWT).
 * Depending on the scenario, it is either passed in the "signed_request" URL parameter, or the "Authorization" HTTP header.
 * This token contains information about the context of the call (OAuth ID, room ID, user ID, etc.)
 * This token is signed, and you should validate the signature, which guarantees that the call really comes from HipChat.
 * You validate the signature using the shared secret sent to your add-on at installation.
 *
 * It is implemented as an Express middleware function which will be executed in the call chain for every request the add-on receives from HipChat
 * It extracts the context of the call from the token (room ID, oauth ID) and adds them to a local variable accessible to the rest of the call chain.
 */

function validateJWT(req, res, next) {
  logger.info('validating JWT');

  //Extract the JWT token
  var encodedJwt = req.query['signed_request']
    || req.headers['authorization'].substring(4)
    || req.headers['Authorization'].substring(4);

  // Decode the base64-encoded token, which contains the oauth ID and room ID (to identify the installation)
  var jwt = jwtUtil.decode(encodedJwt, null, true);
  var oauthId = jwt['iss'];
  var roomId = jwt['context']['room_id'];

  store.getInstallation(oauthId).then(installation => {
    // Validate the token signature using the installation's OAuth secret sent by HipChat during add-on installation
    // (to ensure the call comes from this HipChat installation)
    jwtUtil.decode(encodedJwt, installation.oauthSecret);

    //all good, it's from HipChat, add the context to a local variable
    res.locals.context = { oauthId: oauthId, roomId: roomId };

    // Continue with the rest of the call chain
    logger.info('Valid JWT');
    next();
  }).catch(err => {
    logger.info('Invalid JWT');
    res.sendStatus(403);
  });
}

//
/**
 * Webhooks
 * --------
 * You can listen and respond to messages sent by users where the add-on is installed.
 * You first declare the webhook in the add-on's capabilities descriptor:
 *        "webhook": [
 *           {
 *               "url": "${host}/echo",
 *               "event": "room_message",
 *               "pattern": ".*",
 *               "name": "Echo",
 *               "authentication": "jwt" --> optional, but strongly recommended!
 *           }
 *       ]
 * HipChat will POST the message to a URL specified by your descriptor when a specific regex is met.
 */

app.post('/record',
  validateJWT, //will be executed before the function below, to validate the JWT token
  function (req, res) {
    var oauthId = res.locals.context.oauthId;
    var message = req.body.item.message;

    logger.info({ message: message, q: req.query }, req.path);

    var room = req.body.item.room;
    if ((message.message.split(' ').length >= 2) && (message.message.indexOf('/') !== 0)) {
      // record message
      elastic.saveMessage({
        author: message.from['name'],
        username: message.from['mention_name'],
        message: message.message,
        room: room.name,
        date: message.date
      });
    } else if (message.message.startsWith('/search')) {
      var term = message.message.replace('/search', '').trim();

      if (term !== '') {
        elastic.searchTerm(term)
            .then(content => sendPrivateMessage(oauthId, message.from.id, content));
      } else {
        // room message
        sendMessage(oauthId, room.id, 'Tu peux me demander une recherche en tapant `/search coucou`');
      }
    }

    res.sendStatus(204);
  }
);

/*
 * HipChat sidebar View
 * --------------------
 * When a user clicks on the glance, HipChat opens an iframe in the sidebar, and loads a view (HTML/JavaScript/CSS) from your add-on.
 */

app.get('/sidebar', function (req, res) {
  logger.info(req.query, req.path);
  res.render('sidebar', {
    endpoint: config.endpoint
  });
});

app.post('/search', function (req, res) {
  const search = req.body;
  logger.info(search, req.path);

  elastic.globalSearch(search.query).then(result => {
    console.log('search hits', result);

    res.set('Content-Type', 'application/json');
    res.send(JSON.stringify(result.hits.map(hit => {
      hit['_source']['date'] =  moment(hit['_source']['date']).format('DD MMM, HH:mm');
      return hit;
    })));
  });
});

/*
 * Start the add-on
 */
app.all('*', function (req, res) {
  logger.info({ body: req.body, q: req.query }, req.path);
  res.sendStatus(204);
});

var port = config['localPort'] || 4000;
app.listen(port);
logger.info('HipChat sample add-on started: http://localhost:' + port);
