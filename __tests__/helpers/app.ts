import request from "supertest";
import app from "../../src/app.js";

type SupertestApp = Parameters<typeof request>[0];

const appLike = app as unknown as SupertestApp;

export const requestApp = (): ReturnType<typeof request> => request(appLike);

export const requestAgent = (): ReturnType<typeof request.agent> =>
  request.agent(appLike);