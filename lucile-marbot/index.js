'use strict'
const config = require(__dirname + '/config.test.js');
const Twit = require('twit');
const HC = require('node-hipchat');

let twitter = new Twit({
  consumer_key: config['twitter_consumer_key'],
  consumer_secret: config['twitter_consumer_secret'],
  access_token: config['twitter_access_token'],
  access_token_secret: config['twitter_access_token_secret'],
  timeout_ms: 60*1000  // optional HTTP request timeout to apply to all requests.
});

let hipchat = new HC(config['hipchat_key']);
const params = {
  'room': config['hipchat_room'],
  'from': config['hipchat_bot'],
  'color': 'gray',
  'notify': 0
};

// Listen to TEA twitter accounts
let stream = twitter.stream('statuses/filter', { track: config['twitter_keywords'] });

console.log('Listening to Twitter, tracking ' + config['twitter_keywords'].join(', ') + '.');
stream.on('tweet', function (tweet) {
  // posting to HipChat
  let content = params;
  content.message = tweet.text;
  hipchat.postMessage(params, null);
});
