
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { ipc } from '../services/ipc';

interface MainViewProps {
    onStart: () => void;
    onLayoutModeChange: (mode: string) => void;
}

export const MainView: React.FC<MainViewProps> = ({ onStart, onLayoutModeChange }) => {
    const [apiKey, setApiKey] = useState('');
    const [showError, setShowError] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);

    useEffect(() => {
        storage.getApiKey().then(key => setApiKey(key));

        const listener = (event: any, initializing: boolean) => {
            setIsInitializing(initializing);
        };
        ipc.on('session-initializing', listener);

        return () => {
            ipc.off('session-initializing', listener);
        };
    }, []);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setApiKey(val);
        storage.setApiKey(val);
        if (showError) setShowError(false);
    };

    const handleStart = () => {
        if (isInitializing) return;
        if (!apiKey) {
            setShowError(true);
            setTimeout(() => setShowError(false), 1000); // Blink effect handled by CSS class
            return;
        }
        onStart();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleStart();
        }
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }} onKeyDown={handleKeyDown}>
            <div className="welcome" style={{ fontSize: '20px', marginBottom: '6px', fontWeight: 500, marginTop: 'auto' }}>Welcome</div>

            <div className="input-group" style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <input
                    type="password"
                    placeholder="Enter your Gemini API Key"
                    value={apiKey}
                    onChange={handleInput}
                    className={showError ? 'api-key-error' : ''}
                    style={{ flex: 1 }}
                />
                <button
                    onClick={handleStart}
                    className={`start-button ${isInitializing ? 'initializing' : ''}`}
                    disabled={isInitializing}
                >
                    Start <span className="shortcut-hint" style={{ marginLeft: '8px', opacity: 0.7 }}>Ctrl+Enter</span>
                </button>
            </div>

            <p className="description">
                dont have an api key? <span className="link" onClick={() => ipc.invoke('open-external', 'https://cheatingdaddy.com/help/api-key')}>get one here</span>
            </p>
        </div>
    );
};
