"use strict";

const moment = require('moment');
const elasticsearch = require('elasticsearch');

const esClient = new elasticsearch.Client({
  host: 'localhost:9200'
  //host: 'tea-elasticsearch:9200'
});

const INDEX_NAME = 'bigbrother';
const MESSAGE_TYPE_NAME = 'message';

const DATE_FORMAT = "YYYY-MM-DD[T]HH:mm:ss.SSSZ";
const DIALOG_RANGE_IN_MINUTES = 3;

module.exports = {
  getMessage(id) {
    return new Promise((resolve, reject) => {
      esClient.get({
        "index": INDEX_NAME,
        "type": MESSAGE_TYPE_NAME,
        "id": id
      }, function (error, res) {
        if (error) {
          return reject(error);
        }
        resolve(res);
      });
    });
  },

  saveMessage(message) {
    return new Promise((resolve, reject) => {
      esClient.index({
        "index": INDEX_NAME,
        "type": MESSAGE_TYPE_NAME,
        "body": message
      }, (error, response) => {
        if (error) {
          return reject(error);
        }
        resolve(response);
      });
    });
  },

  globalSearch(query, limit) {
    limit = limit || 10;
    return new Promise((resolve, reject) => {
      esClient.search({
        "index": INDEX_NAME,
        "type": MESSAGE_TYPE_NAME,
        "body": {
          "query": {
            "bool": {
              "should" : [
                {
                  "match" : { "message" : query }
                },
                {
                  "match" : { "author" : query }
                },
                {
                  "match" : { "username" : query }
                },
                {
                  "match" : { "room" : query }
                }
              ],
              "minimum_should_match" : 1
            }
          }
        },
        "size": limit
      }, (error, response) => {
        if (error) {
          return reject(error);
        }
        resolve(response.hits);
      });
    });
  },

  buildDialogFromMessageId(messageId) {
    return this.getMessage(messageId).then(message => {
      const messageDate = moment(message['_source']['date']);
      return esClient.search({
        "index": INDEX_NAME,
        "type": MESSAGE_TYPE_NAME,
        "body": {
          "query": {
            "bool": {
              "must": [
                {
                  "term": {
                    "room.raw": message['_source']['room']
                  }
                },
                {
                  "range" : {
                    "date" : {
                      "gte" : messageDate.subtract(DIALOG_RANGE_IN_MINUTES, 'minutes').format(DATE_FORMAT),
                      "lt" : messageDate.add(DIALOG_RANGE_IN_MINUTES * 2, 'minutes').format(DATE_FORMAT),
                      "format": "date_time"
                    }
                  }
                }
              ]
            }
          },
          "sort": { "date": { "order": "asc" } }
        }
      });
    }).then(results => results.hits);
  },

  getTopChattersOfMonth() {
    return esClient.search({
      "index": INDEX_NAME,
      "type": MESSAGE_TYPE_NAME,
      "body": {
        "size": 0,
        "query": {
          "range" : {
            "date": {
              "gte": "now-1M/d",
              "lt": "now"
            }
          }
        },
        "aggs": {
          "top-chatters": {
            "terms": {
              "field": "username"
            }
          }
        }
      }
    }).then(response => {
      const buckets = response.aggregations['top-chatters'].buckets;
      return buckets.map(bucket => ({ username: bucket['key'], total: bucket['doc_count'] }));
    });
  }
};
