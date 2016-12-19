"use strict";

const elasticsearch = require('elasticsearch');
const esClient = new elasticsearch.Client({
  host: 'localhost:9200'
});

const INDEX_NAME = 'bigbrother';

module.exports = {
  saveMessage(message) {
    return new Promise((resolve, reject) => {
      esClient.index({
        index: INDEX_NAME,
        type: 'message',
        body: message
      }, (error, response) => {
        if (error) {
          return reject(error);
        }
        resolve(response);
      });
    });
  },

  globalSearch(query) {
    return new Promise((resolve, reject) => {
      esClient.search({
        index: INDEX_NAME,
        q: query
      }, (error, response) => {
        if (error) {
          return reject(error);
        }
        resolve(response);
      });
    });
  }
};
