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

module.exports = {
  getMessage(id) {
    return new Promise((resolve, reject) => {
      esClient.get({
        index: INDEX_NAME,
        type: MESSAGE_TYPE_NAME,
        id: id
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
        index: INDEX_NAME,
        type: MESSAGE_TYPE_NAME,
        body: message
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
        index: INDEX_NAME,
        q: query,
        size: limit
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
        index: INDEX_NAME,
        body: {
          "query": {
            "bool": {
              "must": [
                {
                  "term": {
                    "room": message['_source']['room']
                  }
                },
                {
                  "range" : {
                    "date" : {
                      "gte" : messageDate.subtract(2, 'minutes').format(DATE_FORMAT),
                      "lt" : messageDate.add(4, 'minutes').format(DATE_FORMAT),
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

  searchTerm(term) {
    return esClient.search({
      index: INDEX_NAME,
      q: term,
      size: 10
    }).then(resp => {
      var hits = resp.hits.hits;
      if (hits.length === 0) {
        return `Désolé aucun résultat ne correspond à votre recherche "${term}"`;
      } else {
        var nbResults = resp.hits.total;
        if (nbResults > 10) {
          var content = `Voici les 10 premiers résultats de votre recherche "${term}" :<br/>`;
        } else {
          var content = `Voici les ${nbResults} résultats de votre recherche "${term}" :<br/>`;
        }

        hits = hits.map(hit => {
          var message = hit._source.message.replace(term, '<b>' + term + '</b>');
          var date = new Date(hit._source.date);

          return `<td>${hit._source.author} <i>(@${hit._source.username})</i></td>
<td>${date.toUTCString()}</td>
<td>${message}</td>`;
        });
        content += `<table><tr>${hits.join('</tr><tr>')}</tr></table>`;
        return content;
      }
    }, err => {
      console.trace(err.message);
      return `Une erreur est survenue :( => ${err.message}`;
    });
  }
};
