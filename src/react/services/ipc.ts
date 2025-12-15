
// Wrapper to safely access Electron IPC
let ipcRenderer: any = null;

if (typeof window !== 'undefined' && window.require) {
    try {
        const electron = window.require('electron');
        ipcRenderer = electron.ipcRenderer;
    } catch (e) {
        console.error('Electron IPC not available', e);
    }
}

export const ipc = {
    invoke: (channel: string, ...args: any[]) => {
        if (!ipcRenderer) {
            console.warn(`IPC invoke '${channel}' called but ipcRenderer is not available`);
            return Promise.resolve({ success: false, error: 'IPC not available' });
        }
        return ipcRenderer.invoke(channel, ...args);
    },
    on: (channel: string, listener: (event: any, ...args: any[]) => void) => {
        if (!ipcRenderer) return;
        ipcRenderer.on(channel, listener);
    },
    off: (channel: string, listener: (event: any, ...args: any[]) => void) => {
        if (!ipcRenderer) return;
        ipcRenderer.removeListener(channel, listener);
    },
    send: (channel: string, ...args: any[]) => {
        if (!ipcRenderer) return;
        ipcRenderer.send(channel, ...args);
    }
};
