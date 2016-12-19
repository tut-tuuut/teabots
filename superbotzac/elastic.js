var elasticsearch = require('elasticsearch');
var esclient = new elasticsearch.Client({
  host: 'localhost:9200'
});

//esClient.indices.putMapping({
//  "index": "messages",
//  "type": "message",
//  "body": {
//    "properties": {
//      "author": {
//        "type": "string",
//        "analyzer": "whitespace"
//      },
//      "message": {
//        "type": "string",
//        "analyzer": "french"
//      },
//      "room": {
//        "type": "string",
//        "index": "not_analyzed"
//      },
//      "date": {
//        "type": "date",
//        "index": "not_analyzed"
//      }
//    }
//  }
//}, function (error) {
//  if (error) {
//    console.log(error);
//  }
//  console.log('mapping done');
//});

module.exports = esclient;
