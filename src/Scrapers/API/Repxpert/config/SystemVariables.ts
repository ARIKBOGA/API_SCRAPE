import * as os from "os";

const OS = os.platform();
export const usernameEnvKey = OS === "win32" ? "email" : "username";
