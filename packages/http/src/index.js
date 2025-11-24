"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpPost = httpPost;
const undici_1 = require("undici");
const logger_1 = require("@wa/logger");
async function httpPost(url, body) {
    const res = await (0, undici_1.request)(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
    });
    const json = await res.body.json();
    logger_1.logger.debug({ url, status: res.statusCode }, 'httpPost');
    return json;
}
