import { adminFactory } from "../../factories/admin.js";
import { authedFactory } from "../../factories/authed.js";
import {
  CreateRoomInputSchema,
  CreateRoomOutputSchema,
  DeleteRoomOutputSchema,
  GetRoomOutputSchema,
  ListRoomsInputSchema,
  ListRoomsOutputSchema,
  RoomIdParamsSchema,
  SetMaintenanceInputSchema,
  SetMaintenanceOutputSchema,
  UpdateRoomInputSchema,
  UpdateRoomOutputSchema,
} from "./schemas.js";
import { roomsService } from "./service.js";

export const listRoomsEndpoint = authedFactory.build({
  method: "get",
  input: ListRoomsInputSchema,
  output: ListRoomsOutputSchema,
  handler: () => roomsService.list(),
});

export const getRoomEndpoint = authedFactory.build({
  method: "get",
  input: RoomIdParamsSchema,
  output: GetRoomOutputSchema,
  handler: ({ input }) => roomsService.getById(input.id),
});

export const createRoomEndpoint = adminFactory.build({
  method: "post",
  input: CreateRoomInputSchema,
  output: CreateRoomOutputSchema,
  handler: ({ input }) => roomsService.create(input),
});

export const updateRoomEndpoint = adminFactory.build({
  method: "put",
  input: UpdateRoomInputSchema,
  output: UpdateRoomOutputSchema,
  handler: ({ input }) => {
    const { id, ...rest } = input;
    return roomsService.update(id, rest);
  },
});

export const deleteRoomEndpoint = adminFactory.build({
  method: "delete",
  input: RoomIdParamsSchema,
  output: DeleteRoomOutputSchema,
  handler: ({ input }) => roomsService.delete(input.id),
});

export const setRoomMaintenanceEndpoint = adminFactory.build({
  method: "patch",
  input: SetMaintenanceInputSchema,
  output: SetMaintenanceOutputSchema,
  handler: ({ input }) => roomsService.setMaintenance(input.id, input.underMaintenance),
});
