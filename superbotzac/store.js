"use strict";

const Memcached = require('memcached');

const memcached = new Memcached('127.0.0.1:11211');

const INSTALLATION_STORE_KEY = 'installationStore';
const ACCESS_TOKEN_STORE_KEY = 'accessTokenStore';

function getFromStore(key) {
  return new Promise((resolve, reject) => {
    memcached.get(key, (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(data);
    })
  });
}

function createInStore(key, value) {
  return new Promise((resolve, reject) => {
    memcached.set(key, value, 0, err => {
      if (err) {
        return reject(err);
      }
      resolve(value);
    })
  });
}

function createInstallationStore() {
  return createInStore(INSTALLATION_STORE_KEY, {});
}

function createAccessTokenStore() {
  return createInStore(ACCESS_TOKEN_STORE_KEY, {});
}

function getInstallationStore() {
  return getFromStore(INSTALLATION_STORE_KEY).then(store => {
    if (!store) {
      return createInstallationStore();
    }
    return store;
  });
}

function getAccessTokenStore() {
  return getFromStore(ACCESS_TOKEN_STORE_KEY).then(store => {
    if (!store) {
      return createAccessTokenStore();
    }
    return store;
  });
}

module.exports = {
  addInstallation(installation) {
    return getInstallationStore().then(store => store[installation['oauthId']] = installation);
  },

  getInstallation(oauthId) {
    return getInstallationStore().then(store => store[oauthId]);
  },

  removeInstallation(installation) {
    return getInstallationStore().then(store => {
      delete store[installation['oauthId']];
      memcached.replace('INSTALLATION_STORE_KEY', store, 0, err => {
        if (err) {
          return Promise.reject(err);
        }
        return Promise.resolve();
      });
    });
  },

  addAccessToken(oauthId, token) {
    return getAccessTokenStore().then(store => store[oauthId] = token);
  },

  getAccessToken(oauthId) {
    return getAccessTokenStore().then(store => store[oauthId]);
  },

  removeAccessToken(oauthId) {
    return getAccessTokenStore().then(store => {
      delete store[oauthId];
      memcached.replace('ACCESS_TOKEN_STORE_KEY', store, 0, err => {
        if (err) {
          return Promise.reject(err);
        }
        return Promise.resolve();
      });
    });
  }
};
