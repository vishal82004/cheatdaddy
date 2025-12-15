
import { ipc } from './ipc';

export const storage = {
    // Config
    async getConfig() {
        const result = await ipc.invoke('storage:get-config');
        return result.success ? result.data : {};
    },
    async setConfig(config: any) {
        return ipc.invoke('storage:set-config', config);
    },
    async updateConfig(key: string, value: any) {
        return ipc.invoke('storage:update-config', key, value);
    },

    // Credentials
    async getCredentials() {
        const result = await ipc.invoke('storage:get-credentials');
        return result.success ? result.data : {};
    },
    async setCredentials(credentials: any) {
        return ipc.invoke('storage:set-credentials', credentials);
    },
    async getApiKey() {
        const result = await ipc.invoke('storage:get-api-key');
        return result.success ? result.data : '';
    },
    async setApiKey(apiKey: string) {
        const result = await ipc.invoke('storage:set-api-key', apiKey);
        return result.success;
    },

    // Preferences
    async getPreferences() {
        const result = await ipc.invoke('storage:get-preferences');
        return result.success ? result.data : {};
    },
    async setPreferences(preferences: any) {
        return ipc.invoke('storage:set-preferences', preferences);
    },
    async updatePreference(key: string, value: any) {
        return ipc.invoke('storage:update-preference', key, value);
    },

    // Keybinds (if needed)
    // ...
};
