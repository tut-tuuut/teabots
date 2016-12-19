#!/usr/bin/env bash

curl -XPUT 'localhost:9200/bigbrother?pretty' -d'
{
    "settings": {
        "number_of_shards" :   1,
        "number_of_replicas" : 0
    }
}'

curl -XPUT 'localhost:9200/bigbrother/_mapping/tweet?pretty' -d'
{
  "properties" : {
    "author": {
      "type": "string",
      "analyzer": "whitespace"
    },
    "message": {
      "type": "string",
      "analyzer": "french"
    },
    "room": {
      "type": "string",
      "index": "not_analyzed"
    },
    "date": {
      "type": "date",
      "index": "not_analyzed"
    }
  }
}'
