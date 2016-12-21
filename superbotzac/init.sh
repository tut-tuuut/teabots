#!/usr/bin/env bash

curl -XDELETE 'localhost:9200/bigbrother'

curl -XPUT 'localhost:9200/bigbrother' -d'
{
  "settings": {
    "number_of_shards" :   1,
    "number_of_replicas" : 0,
    "analysis": {
      "filter": {
        "french_elision": {
          "type": "elision",
          "articles_case": true,
          "articles": [
            "l", "m", "t", "qu", "n", "s",
            "j", "d", "c", "jusqu", "quoiqu",
            "lorsqu", "puisqu"
          ]
        },
        "french_stop": {
          "type": "stop",
          "stopwords": "stopwords/french.txt"
        },
        "french_stemmer": {
          "type": "stemmer",
          "language": "light_french"
        }
      },
      "analyzer": {
        "custom_french": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "asciifolding",
            "french_elision",
            "lowercase",
            "french_stop",
            "french_stemmer"
          ]
        },
        "french_names": {
          "type": "custom",
          "tokenizer": "whitespace",
          "filter": ["lowercase", "asciifolding"]
        },
        "room_names": {
          "type": "custom",
          "tokenizer": "keyword",
          "filter": ["lowercase", "asciifolding"]
        }
      }
    }
  }
}'

curl -XPUT 'localhost:9200/bigbrother/_mapping/message?pretty' -d'
{
  "properties" : {
    "author": {
      "type": "string",
      "analyzer": "french_names",
      "boost": 2
    },
    "username": {
      "type": "string",
      "index": "not_analyzed"
    },
    "message": {
      "type": "string",
      "analyzer": "custom_french",
      "boost": 2
    },
    "room": {
      "type": "string",
      "analyzer": "room_names",
      "fields": {
        "raw": { "type": "string", "index": "not_analyzed" }
      }
    },
    "date": {
      "type": "date",
      "index": "not_analyzed"
    }
  }
}'
