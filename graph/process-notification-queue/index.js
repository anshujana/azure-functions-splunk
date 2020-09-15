/*
Copyright 2020 Splunk Inc. 

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const graph = require('../helpers/graph');
const splunk = require('../helpers/splunk');

module.exports = async function (context, notificationQueueItem) {
    context.log('Queue trigger function processed work item', JSON.stringify(notificationQueueItem));

    let sourcetype = splunk.getSourcetype(notificationQueueItem);
    await graph.getResource(notificationQueueItem)
        .then((resource) => {
            let payload = {
                "event": JSON.stringify(resource),
                "sourcetype": sourcetype,
                "time": graph.getResourceTime(resource)
            }
            return payload;
        })
        .then((payload) => {
            splunk.sendToHEC(payload)
            .catch((err) => {
                context.log.error(`Error posting to Splunk HTTP Event Collector: ${err}`);
                return err;
            });
        })
        .catch((err) => {
            context.log.error(`Error: ${JSON.stringify(err, null, 4)}`);
            throw err;
        });
};