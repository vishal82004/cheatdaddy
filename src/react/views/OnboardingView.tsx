
import React from 'react';
import { storage } from '../services/storage';

interface OnboardingViewProps {
    onComplete: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
    const handleComplete = async () => {
        await storage.updateConfig('onboarded', true);
        onComplete();
    };

    return (
        <div style={{ padding: '40px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2>Welcome to Cheating Daddy</h2>
            <p className="description" style={{ marginBottom: 30 }}>
                Your AI assistant for interviews and meetings.
            </p>
            <div style={{ marginBottom: 20 }}>
                <p>1. Enter your Gemini API Key</p>
                <p>2. Select your profile (Interview, Sales, etc.)</p>
                <p>3. Start a session</p>
            </div>
            <button onClick={handleComplete} className="start-button" style={{ margin: '0 auto' }}>
                Get Started
            </button>
        </div>
    );
};
