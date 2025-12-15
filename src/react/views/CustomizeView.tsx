
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';

interface CustomizeViewProps {
    onBack: () => void;
}

export const CustomizeView: React.FC<CustomizeViewProps> = ({ onBack }) => {
    const [selectedProfile, setSelectedProfile] = useState('interview');
    const [selectedLanguage, setSelectedLanguage] = useState('en-US');

    useEffect(() => {
        const load = async () => {
            const prefs = await storage.getPreferences();
            setSelectedProfile(prefs.selectedProfile || 'interview');
            setSelectedLanguage(prefs.selectedLanguage || 'en-US');
        };
        load();
    }, []);

    const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedProfile(val);
        storage.updatePreference('selectedProfile', val);
    };

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedLanguage(val);
        storage.updatePreference('selectedLanguage', val);
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Customize</h2>
            <div style={{ marginBottom: 15 }}>
                <label>Profile</label>
                <select value={selectedProfile} onChange={handleProfileChange} className="btn" style={{ marginLeft: 10 }}>
                    <option value="interview">Job Interview</option>
                    <option value="sales">Sales Call</option>
                    <option value="meeting">Business Meeting</option>
                    <option value="exam">Exam Assistant</option>
                </select>
            </div>
            <div style={{ marginBottom: 15 }}>
                <label>Language</label>
                <select value={selectedLanguage} onChange={handleLanguageChange} className="btn" style={{ marginLeft: 10 }}>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                </select>
            </div>
            <button onClick={onBack} className="btn">Back</button>
        </div>
    );
};
