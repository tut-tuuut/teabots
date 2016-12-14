var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
});

app.post('/installed', function (req, res) {
    logger.info(req.query, req.path);

    var installation = req.body;
    var oauthId = installation['oauthId'];
    installationStore[oauthId] = installation;

    // Retrieve the capabilities document
    var capabilitiesUrl = installation['capabilitiesUrl'];
    request.get(capabilitiesUrl, function (err, response, body) {
        var capabilities = JSON.parse(body);
        logger.info(capabilities, capabilitiesUrl);

        // Save the token endpoint URL along with the client credentials
        installation.tokenUrl = capabilities['capabilities']['oauth2Provider']['tokenUrl'];

        // Save the API endpoint URL along with the client credentials
        installation.apiUrl = capabilities['capabilities']['hipchatApiProvider']['url'];

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

        delete installationStore[installation['oauthId']];
        delete accessTokenStore[installation['oauthId']];

        // Redirect back to HipChat to complete the uninstallation
        res.redirect(redirectUrl);
    });
});


module.exports = app;
