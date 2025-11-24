"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const envalid_1 = require("envalid");
(0, dotenv_1.config)();
exports.env = (0, envalid_1.cleanEnv)(process.env, {
    NODE_ENV: (0, envalid_1.str)({ default: 'development' }),
    LOG_LEVEL: (0, envalid_1.str)({ default: 'info' }),
    SERVICE_BASE_URL: (0, envalid_1.str)({ default: 'http://localhost' }),
    GATEWAY_PORT: (0, envalid_1.num)({ default: 3000 }),
    ORCHESTRATOR_PORT: (0, envalid_1.num)({ default: 4000 }),
    DATABASE_URL: (0, envalid_1.str)({ default: 'postgresql://postgres:postgres@localhost:5432/wa_platform?schema=public' }),
});
