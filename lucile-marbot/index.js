'use strict'
const config = require(__dirname + '/config.js');
const Twit = require('twit');
const HC = require('node-hipchat-plus');

let twitter = new Twit({
  consumer_key: config['twitter_consumer_key'],
  consumer_secret: config['twitter_consumer_secret'],
  access_token: config['twitter_access_token'],
  access_token_secret: config['twitter_access_token_secret'],
  timeout_ms: 60*1000  // optional HTTP request timeout to apply to all requests.
});

let hipchat = new HC(config['hipchat_auth']);
const params = {
  'room_id': config['hipchat_room'],
  'from': config['hipchat_bot'],
  'message_format': 'html',
  'color': 'gray',
  'notify': true
};

const buildCard = (tweet) => {
  return {
    "style": "application",
    "url": `http://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
    "format": "medium",
    "id": tweet.id_str,
    "title": `${tweet.user.name} sur Twitter`,
    "description": {
      "value": tweet.text,
      "format": "html"
    },
    "icon": {
      "url": tweet.user.profile_image_url
    }
  };
};

// Listen to TEA twitter accounts
let stream = twitter.stream('statuses/filter', { track: config['twitter_keywords'] });

console.log('Listening to Twitter, tracking ' + config['twitter_keywords'].join(', ') + '.');
stream.on('tweet', function (tweet) {
  // posting to HipChat
  let content = params;
  content.message = tweet.text;
  content.card = buildCard(tweet);
  hipchat.postMessage(content, function (data, error) {
    if (error) {
      console.error(error);
    }
  });
});
