import * as os from "os";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(".env") });

export const OS = os.platform();
let key: string = "username";

switch (OS) {
  case "win32":
    key = "email";
    break;
}

const requestBody = new URLSearchParams({
  grant_type: process.env.grant_type || "password",
  client_id: process.env.client_id || "repxpert-spa",
  client_secret: process.env.client_secret || "client_secret",
  username: process.env?.[key] || "username",
  password: process.env.password || "password",
});
