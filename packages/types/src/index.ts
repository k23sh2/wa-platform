import { z } from 'zod';

export const MessageCreateSchema = z.object({
  userId: z.string().cuid(),
  text: z.string().min(1).max(1000),
});
export type MessageCreate = z.infer<typeof MessageCreateSchema>;

export const MessageSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  text: z.string(),
  createdAt: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;
