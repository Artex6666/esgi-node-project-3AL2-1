import type { Routing } from "express-zod-api";

import {
  createRoomEndpoint,
  deleteRoomEndpoint,
  getRoomEndpoint,
  listRoomsEndpoint,
  roomPlanningEndpoint,
  setRoomMaintenanceEndpoint,
  updateRoomEndpoint,
} from "./endpoints.js";

export const roomsRouting: Routing = {
  get: listRoomsEndpoint,
  post: createRoomEndpoint,
  ":id": {
    get: getRoomEndpoint,
    put: updateRoomEndpoint,
    delete: deleteRoomEndpoint,
    maintenance: setRoomMaintenanceEndpoint,
    planning: roomPlanningEndpoint,
  },
};
