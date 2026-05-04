import { ez } from "express-zod-api";
import { z } from "zod";

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  images: z.array(z.string()),
  type: z.string(),
  capacity: z.int().min(15).max(30),
  accessible: z.boolean(),
  underMaintenance: z.boolean(),
  createdAt: ez.dateOut(),
});

export const ListRoomsInputSchema = z.object({});
export const ListRoomsOutputSchema = z.object({ items: z.array(RoomSchema) });

export const RoomIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const GetRoomOutputSchema = RoomSchema;

export const CreateRoomInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  images: z.array(z.string().min(1).max(2048)).max(20).default([]),
  type: z.string().min(1).max(50),
  capacity: z.int().min(15).max(30),
  accessible: z.boolean().default(false),
});
export const CreateRoomOutputSchema = RoomSchema;

export const UpdateRoomInputSchema = RoomIdParamsSchema.extend({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(2000).optional(),
  images: z.array(z.string().min(1).max(2048)).max(20).optional(),
  type: z.string().min(1).max(50).optional(),
  capacity: z.int().min(15).max(30).optional(),
  accessible: z.boolean().optional(),
});
export const UpdateRoomOutputSchema = RoomSchema;

export const DeleteRoomOutputSchema = z.object({ id: z.string() });

export const SetMaintenanceInputSchema = RoomIdParamsSchema.extend({
  underMaintenance: z.boolean(),
});
export const SetMaintenanceOutputSchema = RoomSchema;

export const RoomPlanningInputSchema = RoomIdParamsSchema.extend({
  from: ez.dateIn().optional(),
  to: ez.dateIn().optional(),
});

export const RoomPlanningSessionSchema = z.object({
  id: z.string(),
  startsAt: ez.dateOut(),
  endsAt: ez.dateOut(),
  priceCents: z.int().nonnegative(),
  movie: z.object({
    id: z.string(),
    title: z.string(),
    durationMin: z.int().positive(),
  }),
});

export const RoomPlanningOutputSchema = z.object({
  roomId: z.string(),
  items: z.array(RoomPlanningSessionSchema),
});
