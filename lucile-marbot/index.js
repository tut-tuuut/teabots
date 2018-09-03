'use strict';

const config = require(__dirname + '/config.js');
const Twit = require('twit');
const request = require('request-promise-native');

let twitter = new Twit({
    consumer_key: config['twitter_consumer_key'],
    consumer_secret: config['twitter_consumer_secret'],
    access_token: config['twitter_access_token'],
    access_token_secret: config['twitter_access_token_secret'],
    timeout_ms: 60 * 1000  // optional HTTP request timeout to apply to all requests.
});

const postMessage = tweet => {
    request({
        method: 'POST',
        uri: config['slack_webhook_url'],
        body: {
            text: `http://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
        },
        json: true
    })
    .catch(function (err) {
        console.log(err);
    });
};

// Listen to TEA twitter accounts
let stream = twitter.stream('statuses/filter', {track: config['twitter_keywords']});

console.log('Listening to Twitter, tracking ' + config['twitter_keywords'].join(', ') + '.');
stream.on('tweet', postMessage);
