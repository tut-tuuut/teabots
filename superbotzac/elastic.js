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
