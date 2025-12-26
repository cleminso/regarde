import {
  saveCredentials,
  loadCredentials,
  clearCredentials,
} from "./utils/storage.js";

/**
 * Gets stored credentials from local storage
 */
export const getStoredCredentials = async () => {
  return await loadCredentials();
};

/**
 * Clears all stored credentials
 */
export const clearStoredCredentials = async () => {
  await clearCredentials();
};
