
import React, { useEffect, useRef, useState } from 'react';
import { ipc } from '../services/ipc';
import { captureService } from '../services/capture';

interface AssistantViewProps {
    responses: string[];
    currentResponseIndex: number;
    selectedProfile: string;
    onSendText: (text: string) => void;
    shouldAnimateResponse: boolean;
    onResponseIndexChanged: (index: number) => void;
    onAnimationComplete: () => void;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
    responses,
    currentResponseIndex,
    selectedProfile,
    onSendText,
    shouldAnimateResponse,
    onResponseIndexChanged,
    onAnimationComplete
}) => {
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [responses, currentResponseIndex]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        onSendText(inputValue);
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const currentResponse = responses[currentResponseIndex] || '';

    return (
        <div className="assistant-view" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px' }}>
            <div className="responses-container" style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
                {/* Markdown rendering would go here. For now just text. */}
                {currentResponse ? (
                    <div className="response-message">
                        {currentResponse}
                    </div>
                ) : (
                    <div className="empty-state">Waiting for input...</div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="input-area" style={{ display: 'flex', gap: '8px' }}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a follow-up..."
                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-background)', color: 'var(--text-color)' }}
                />
                <button onClick={handleSend} className="btn">Send</button>
            </div>

            {/* Navigation controls if multiple responses exist */}
            {responses.length > 1 && (
                <div className="navigation-controls" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '8px' }}>
                    <button
                        disabled={currentResponseIndex <= 0}
                        onClick={() => onResponseIndexChanged(currentResponseIndex - 1)}
                        className="btn icon-button"
                    >
                        &lt;
                    </button>
                    <span>{currentResponseIndex + 1} / {responses.length}</span>
                    <button
                        disabled={currentResponseIndex >= responses.length - 1}
                        onClick={() => onResponseIndexChanged(currentResponseIndex + 1)}
                        className="btn icon-button"
                    >
                        &gt;
                    </button>
                </div>
            )}
        </div>
    );
};
