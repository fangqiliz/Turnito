import { z } from 'zod'

export const getNotificationsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z.coerce.boolean().default(false),
})

export const uuidParam = z.object({
  id: z.string().uuid(),
})

export const markMultipleAsReadBody = z.object({
  notificationIds: z.array(z.string().uuid()).min(1),
})
