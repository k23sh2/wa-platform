"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageSchema = exports.MessageCreateSchema = void 0;
const zod_1 = require("zod");
exports.MessageCreateSchema = zod_1.z.object({
    userId: zod_1.z.string().cuid(),
    text: zod_1.z.string().min(1).max(1000)
});
exports.MessageSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    userId: zod_1.z.string().cuid(),
    text: zod_1.z.string(),
    createdAt: zod_1.z.string()
});
