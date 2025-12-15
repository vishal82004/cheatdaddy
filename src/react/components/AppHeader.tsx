
import React, { useState, useEffect } from 'react';
import { ipc } from '../services/ipc';
// import { storage } from '../services/storage'; // if needed

interface AppHeaderProps {
    currentView: string;
    onViewChange: (view: string) => void;
    statusText: string;
    startTime: number | null;
    isClickThrough?: boolean;
    onHideToggle?: () => void;
    onClose?: () => void;
    onBack?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
    currentView,
    onViewChange,
    statusText,
    startTime,
    isClickThrough,
    onHideToggle,
    onClose,
    onBack
}) => {
    const [elapsedTime, setElapsedTime] = useState('');
    const [updateAvailable, setUpdateAvailable] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (currentView === 'assistant' && startTime) {
            const updateTime = () => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                if (elapsed >= 60) {
                    const minutes = Math.floor(elapsed / 60);
                    const seconds = elapsed % 60;
                    setElapsedTime(`${minutes}m ${seconds}s`);
                } else {
                    setElapsedTime(`${elapsed}s`);
                }
            };
            updateTime();
            interval = setInterval(updateTime, 1000);
        }
        return () => clearInterval(interval);
    }, [currentView, startTime]);

    // Update check logic omitted for brevity, can be added later

    const getViewTitle = () => {
        const titles: Record<string, string> = {
            onboarding: 'Welcome to Cheating Daddy',
            main: 'Cheating Daddy',
            customize: 'Customize',
            help: 'Help & Shortcuts',
            history: 'Conversation History',
            advanced: 'Advanced Tools',
            assistant: 'Cheating Daddy',
        };
        return titles[currentView] || 'Cheating Daddy';
    };

    const isNavigationView = ['customize', 'help', 'history', 'advanced'].includes(currentView);

    return (
        <div className="header" style={{
            display: 'flex',
            alignItems: 'center',
            padding: 'var(--header-padding)',
            background: 'var(--header-background)',
            borderBottom: '1px solid var(--border-color)',
            WebkitAppRegion: 'drag' as any
        }}>
            <div className="header-title" style={{ flex: 1, fontWeight: 500, color: 'var(--text-color)' }}>
                {getViewTitle()}
            </div>
            <div className="header-actions" style={{ display: 'flex', gap: 'var(--header-gap)', alignItems: 'center', WebkitAppRegion: 'no-drag' as any }}>
                {currentView === 'assistant' && (
                    <>
                        <span style={{ fontSize: 'var(--header-font-size-small)', color: 'var(--text-secondary)' }}>{elapsedTime}</span>
                        <span style={{ fontSize: 'var(--header-font-size-small)', color: 'var(--text-secondary)' }}>{statusText}</span>
                        {isClickThrough && <span className="click-through-indicator">click-through</span>}
                    </>
                )}

                {currentView === 'main' && (
                    <>
                        <button className="icon-button" onClick={() => onViewChange('history')} title="History">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" /></svg>
                        </button>
                        <button className="icon-button" onClick={() => onViewChange('customize')} title="Customize">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" /></svg>
                        </button>
                        <button className="icon-button" onClick={() => onViewChange('help')}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.94 6.94a.75.75 0 1 1-1.061-1.061 3 3 0 1 1 2.871 5.026v.345a.75.75 0 0 1-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 1 0 8.94 6.94ZM10 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
                        </button>
                    </>
                )}

                {currentView === 'assistant' ? (
                    <>
                        <button onClick={onHideToggle} className="btn" style={{ fontSize: '12px' }}>
                            Hide <span className="key" style={{ pointerEvents: 'none' }}>Ctrl</span> <span className="key">\</span>
                        </button>
                        <button onClick={onClose} className="icon-button">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                        </button>
                    </>
                ) : (
                    <button onClick={isNavigationView ? onBack : onClose} className="icon-button">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                    </button>
                )}
            </div>
        </div>
    );
};
