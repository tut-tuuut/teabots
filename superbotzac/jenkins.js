"use strict";

const config = require('./config.json');
const request = require('request');
const jenkinsBaseUrl = config.jenkins.apiUrl;
const defaultOptions = {
    json: true,
    agentOptions: {
        rejectUnauthorized: false
    },
    auth: {
        user: config.jenkins.user,
        password: config.jenkins.token
    }
};

function guid() {
    function _p8(s) {
        var p = (Math.random().toString(16)+"000000000").substr(2,8);
        return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
    }
    return _p8() + _p8(true) + _p8(true) + _p8();
}

module.exports = {
    getJobs() {
        return new Promise((resolve, reject) => {
            request.get(`${jenkinsBaseUrl}/api/json`, defaultOptions, (err, response, body) => {
                if (err) {
                    return reject(err);
                }

                return resolve(body.jobs);
            });
        });
    },
    getJobStatus(url) {
        return new Promise((resolve, reject) => {
            request.get(`${url}/api/json`, defaultOptions, (err, response, body) => {
                if (err) {
                    return reject(err);
                }

                return resolve(body);
            });
        });
    },
    buildJob(url, params = []) {
        return new Promise((resolve, reject) => {
            var apiUrl = `${url}/build`;
            if (params.length > 0) {
                apiUrl = `${url}/buildWithParameters`;
                var options = Object.assign(defaultOptions, {
                    qs: params
                });
            }

            request.post(apiUrl, (options || defaultOptions), (err, response, body) => {
                if (err) {
                    return reject(err);
                }
                if (response.statusCode !== 200 && response.statusCode !== 201) {
                    return reject({code: response.statusCode, message: response.statusMessage});
                }

                return resolve(body);
            });
        });
    },
    buildCard(job) {
        var cardOptions = {
            style: "application",
            format: "medium",
            id: guid(),
            url: job.url,
            title: job.displayName,
            description: job.description,
            attributes: []
        };
        var status = 'Unknown';
        if (job.lastBuild) {
            if (job.lastCompletedBuild.number === job.lastBuild.number) {
                status = 'Success';
            }
            if (job.lastFailedBuild && job.lastFailedBuild.number === job.lastBuild.number) {
                status = 'Failed';
            }
            if (job.color.endsWith('anime')) {
                status = 'Running';
            }
            cardOptions.attributes.push({
                label: "Last build",
                value: {
                    label: status,
                    url: job.lastBuild.url
                }
            });
        }
        if (job.lastFailedBuild) {
            cardOptions.attributes.push({
                label: "Last failed build",
                value: {
                    label: "value1",
                    url: job.lastFailedBuild.url
                }
            });
        }

        return cardOptions;
    }
};
