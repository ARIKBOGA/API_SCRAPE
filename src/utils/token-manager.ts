import { request, APIRequestContext } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(".env") });

let cachedToken: string | null = null;

export async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;

  const apiContext = await request.newContext();
  const getTokenURI = process.env.TOKEN_URI as string;

  const formBody = new URLSearchParams({
    grant_type: process.env.grant_type || "password",
    client_id: process.env.client_id || "repxpert-GB",
    client_secret: process.env.client_secret || "client_secret",
    username: process.env.username || "username",
    password: process.env.password || "password",
  });

  const tokenResponse = await apiContext.post(getTokenURI, {
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    data: formBody.toString(),
  });

  if (!tokenResponse.ok()) {
    throw new Error(`Failed to get token: ${tokenResponse.status()}`);
  }

  const tokenData = await tokenResponse.json();
  cachedToken = tokenData.access_token;

  await apiContext.dispose();
  return cachedToken;
}
