import fs from "fs/promises";
import path from "path";
import os from "os";

const AUTH_FILE_PATH = path.join(os.homedir(), ".local/share/regarde/auth.json");

export interface AuthCredentials {
    accountID: string;
    secret: string;
}

export const ensureAuthDir = async () => {
    const dir = path.dirname(AUTH_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
};

export const saveCredentials = async (creds: string) => {
    await ensureAuthDir();
    await fs.writeFile(AUTH_FILE_PATH, creds, "utf-8");
};

export const loadCredentials = async (): Promise<string | null> => {
    try {
        await ensureAuthDir();
        const content = await fs.readFile(AUTH_FILE_PATH, "utf-8");
        return content;
    } catch (error) {
        return null;
    }
};

export const clearCredentials = async () => {
    try {
        await fs.unlink(AUTH_FILE_PATH);
    } catch (e) {
        // ignore
    }
};

export const authStorage = {
    set: saveCredentials,
    get: loadCredentials,
    clear: clearCredentials
};
