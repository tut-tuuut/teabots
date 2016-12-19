var elasticsearch = require('elasticsearch');
var esclient = new elasticsearch.Client({
  host: 'localhost:9200'
});

module.exports = esclient;
