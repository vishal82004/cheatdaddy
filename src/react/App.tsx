
import React, { useState, useEffect } from 'react';
import { AppHeader } from './components/AppHeader';
import { MainView } from './views/MainView';
import { AssistantView } from './views/AssistantView';
import { OnboardingView } from './views/OnboardingView';
import { storage } from './services/storage';
import { ipc } from './services/ipc';
import { captureService } from './services/capture';

// Defines the structure of the application
// We will gradually move logic from CheatingDaddyApp.js here

export default function App() {
    const [currentView, setCurrentView] = useState('main');
    const [statusText, setStatusText] = useState('');
    const [startTime, setStartTime] = useState<number | null>(null);
    const [responses, setResponses] = useState<string[]>([]);
    const [currentResponseIndex, setCurrentResponseIndex] = useState(-1);
    const [shouldAnimateResponse, setShouldAnimateResponse] = useState(false);
    const [isClickThrough, setIsClickThrough] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState('interview');
    const [selectedLanguage, setSelectedLanguage] = useState('en-US');
    const [selectedScreenshotInterval, setSelectedScreenshotInterval] = useState('5');
    const [selectedImageQuality, setSelectedImageQuality] = useState('medium');

    useEffect(() => {
        // Load storage
        const loadStorage = async () => {
            const prefs = await storage.getPreferences();
            const config = await storage.getConfig();
            if (!config.onboarded) setCurrentView('onboarding');

            setSelectedProfile(prefs.selectedProfile || 'interview');
            setSelectedLanguage(prefs.selectedLanguage || 'en-US');
            setSelectedScreenshotInterval(prefs.selectedScreenshotInterval || '5');
            setSelectedImageQuality(prefs.selectedImageQuality || 'medium');
        };
        loadStorage();

        // IPC Listeners
        ipc.on('new-response', (_, response) => {
            setResponses(prev => {
                const newRes = [...prev, response];
                setCurrentResponseIndex(newRes.length - 1);
                return newRes;
            });
            setShouldAnimateResponse(true);
        });

        ipc.on('update-response', (_, response) => {
            setResponses(prev => {
                if (prev.length === 0) return [response];
                const newRes = [...prev];
                newRes[newRes.length - 1] = response;
                return newRes;
            });
        });

        ipc.on('update-status', (_, status) => setStatusText(status));
        ipc.on('click-through-toggled', (_, enabled) => setIsClickThrough(enabled));

        // Expose global methods for Electron shortcuts
        (window as any).cheatingDaddy = {
            handleShortcut: (key: string) => {
                // Logic moved from renderer.js handleShortcut
                if (key === 'ctrl+enter' || key === 'cmd+enter') {
                    if (currentView === 'main') {
                        handleStart();
                    } else {
                        captureService.captureManualScreenshot();
                    }
                }
            },
            getCurrentView: () => currentView,
            getLayoutMode: () => 'normal', // Default or fetch from pref
            setStatus: (status: string) => setStatusText(status),
        };

        return () => {
            // Cleanup listeners if needed
            delete (window as any).cheatingDaddy;
        };
    }, [currentView]); // Re-bind when currentView changes

    useEffect(() => {
        // Notify main process of view change
        ipc.send('view-changed', currentView);
    }, [currentView]);

    const handleStart = async () => {
        const apiKey = await storage.getApiKey();
        if (!apiKey) return; // MainView handles error UI

        const prefs = await storage.getPreferences();
        const profile = prefs.selectedProfile || 'interview';
        const language = prefs.selectedLanguage || 'en-US';
        const interval = prefs.selectedScreenshotInterval || '5';
        const quality = prefs.selectedImageQuality || 'medium';

        await captureService.initializeGemini(profile, language);
        await captureService.startCapture(interval, quality);

        setResponses([]);
        setCurrentResponseIndex(-1);
        setStartTime(Date.now());
        setCurrentView('assistant');
    };

    const handleStop = async () => {
        await captureService.stopCapture();
        ipc.invoke('close-session');
        setStartTime(null);
        setCurrentView('main');
    };

    const handleSendText = async (text: string) => {
        const result = await captureService.sendTextMessage(text);
        if (!result.success) setStatusText('Error sending message');
        else setStatusText('Message sent...');
    };

    const renderView = () => {
        switch (currentView) {
            case 'main':
                return <MainView onStart={handleStart} onLayoutModeChange={() => { }} />;
            case 'assistant':
                return <AssistantView
                    responses={responses}
                    currentResponseIndex={currentResponseIndex}
                    selectedProfile={selectedProfile}
                    onSendText={handleSendText}
                    shouldAnimateResponse={shouldAnimateResponse}
                    onResponseIndexChanged={setCurrentResponseIndex}
                    onAnimationComplete={() => setShouldAnimateResponse(false)}
                />;
            case 'customize':
            case 'history':
            case 'help':
            case 'onboarding':
                return <OnboardingView onComplete={() => setCurrentView('main')} />;
            default:
                return <div>Unknown View</div>;
        }
    };

    return (
        <div className="window-container" style={{ height: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
            <AppHeader
                currentView={currentView}
                onViewChange={setCurrentView}
                statusText={statusText}
                startTime={startTime}
                isClickThrough={isClickThrough}
                onHideToggle={() => ipc.invoke('toggle-window-visibility')}
                onClose={currentView === 'assistant' ? handleStop : () => ipc.invoke('quit-application')}
                onBack={() => setCurrentView('main')}
            />
            <div className="main-content" style={{ flex: 1, overflow: 'hidden', background: 'var(--main-content-background)' }}>
                {renderView()}
            </div>
        </div>
    );
}
