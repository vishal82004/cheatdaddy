
import { ipc } from './ipc';
import { storage } from './storage';

const isLinux = navigator.platform.toLowerCase().includes('linux');
const isMacOS = navigator.platform.toLowerCase().includes('mac');
const SAMPLE_RATE = 24000;
const AUDIO_CHUNK_DURATION = 0.1;
const BUFFER_SIZE = 4096;

function convertFloat32ToInt16(float32Array: Float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

const MANUAL_SCREENSHOT_PROMPT = `Help me on this page, give me the answer no bs, complete answer.
So if its a code question, give me the approach in few bullet points, then the entire code. Also if theres anything else i need to know, tell me.
If its a question about the website, give me the answer no bs, complete answer.
If its a mcq question, give me the answer no bs, complete answer.`;

class CaptureService {
    private mediaStream: MediaStream | null = null;
    private screenshotInterval: any = null;
    private audioContext: AudioContext | null = null;
    private audioProcessor: ScriptProcessorNode | null = null;
    private micAudioProcessor: ScriptProcessorNode | null = null;
    private hiddenVideo: HTMLVideoElement | null = null;
    private offscreenCanvas: HTMLCanvasElement | null = null;
    private currentImageQuality: string = 'medium';

    async initializeGemini(profile = 'interview', language = 'en-US') {
        const apiKey = await storage.getApiKey();
        if (apiKey) {
            const prefs = await storage.getPreferences();
            const success = await ipc.invoke('initialize-gemini', apiKey, prefs.customPrompt || '', profile, language);
            return success;
        }
        return false;
    }

    async startCapture(screenshotIntervalSeconds: string, imageQuality: string) {
        this.currentImageQuality = imageQuality;
        const prefs = await storage.getPreferences();
        const audioMode = prefs.audioMode || 'speaker_only';

        try {
            if (isMacOS) {
                const audioResult = await ipc.invoke('start-macos-audio');
                if (!audioResult.success) throw new Error('Failed to start macOS audio: ' + audioResult.error);

                this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { frameRate: 1, width: { ideal: 1920 }, height: { ideal: 1080 } },
                    audio: false
                });

                if (audioMode === 'mic_only' || audioMode === 'both') {
                    await this.startMic(audioMode);
                }
            } else if (isLinux) {
                try {
                    this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
                        video: { frameRate: 1, width: { ideal: 1920 }, height: { ideal: 1080 } },
                        audio: {
                            sampleRate: SAMPLE_RATE, channelCount: 1,
                            echoCancellation: false, noiseSuppression: false, autoGainControl: false
                        }
                    });
                    this.setupAudioProcessing(this.mediaStream, 'send-audio-content');
                } catch (e) {
                    console.warn('Linux system audio failed, fallback to video only', e);
                    this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
                        video: { frameRate: 1, width: { ideal: 1920 }, height: { ideal: 1080 } },
                        audio: false
                    });
                }

                if (audioMode === 'mic_only' || audioMode === 'both') {
                    await this.startMic(audioMode);
                }
            } else {
                // Windows
                this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { frameRate: 1, width: { ideal: 1920 }, height: { ideal: 1080 } },
                    audio: {
                        sampleRate: SAMPLE_RATE, channelCount: 1,
                        echoCancellation: true, noiseSuppression: true, autoGainControl: true
                    }
                });

                this.setupAudioProcessing(this.mediaStream, 'send-audio-content');

                if (audioMode === 'mic_only' || audioMode === 'both') {
                    await this.startMic(audioMode);
                }
            }

            console.log('Capture started');
        } catch (err) {
            console.error('Error starting capture:', err);
        }
    }

    async startMic(audioMode: string) {
        try {
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: SAMPLE_RATE, channelCount: 1,
                    echoCancellation: true, noiseSuppression: true, autoGainControl: true
                },
                video: false
            });
            this.setupMicProcessing(micStream);
        } catch (e) {
            console.warn('Mic access failed', e);
        }
    }

    private setupAudioProcessing(stream: MediaStream, ipcChannel: string) {
        this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
        const source = this.audioContext.createMediaStreamSource(stream);
        this.audioProcessor = this.audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

        let audioBuffer: number[] = [];
        const samplesPerChunk = SAMPLE_RATE * AUDIO_CHUNK_DURATION;

        this.audioProcessor.onaudioprocess = async (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            audioBuffer.push(...Array.from(inputData));

            while (audioBuffer.length >= samplesPerChunk) {
                const chunk = audioBuffer.splice(0, samplesPerChunk);
                const pcmData16 = convertFloat32ToInt16(new Float32Array(chunk));
                const base64Data = arrayBufferToBase64(pcmData16.buffer);

                await ipc.invoke(ipcChannel, {
                    data: base64Data,
                    mimeType: 'audio/pcm;rate=24000',
                });
            }
        };

        source.connect(this.audioProcessor);
        this.audioProcessor.connect(this.audioContext.destination);
    }

    private setupMicProcessing(stream: MediaStream) {
        const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
        const source = ctx.createMediaStreamSource(stream);
        this.micAudioProcessor = ctx.createScriptProcessor(BUFFER_SIZE, 1, 1);

        let audioBuffer: number[] = [];
        const samplesPerChunk = SAMPLE_RATE * AUDIO_CHUNK_DURATION;

        this.micAudioProcessor.onaudioprocess = async (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            audioBuffer.push(...Array.from(inputData));

            while (audioBuffer.length >= samplesPerChunk) {
                const chunk = audioBuffer.splice(0, samplesPerChunk);
                const pcmData16 = convertFloat32ToInt16(new Float32Array(chunk));
                const base64Data = arrayBufferToBase64(pcmData16.buffer);

                await ipc.invoke('send-mic-audio-content', {
                    data: base64Data,
                    mimeType: 'audio/pcm;rate=24000',
                });
            }
        };
        source.connect(this.micAudioProcessor);
        this.micAudioProcessor.connect(ctx.destination);
    }

    async stopCapture() {
        if (this.screenshotInterval) clearInterval(this.screenshotInterval);
        if (this.audioProcessor) {
            this.audioProcessor.disconnect();
            this.audioProcessor = null;
        }
        if (this.micAudioProcessor) {
            this.micAudioProcessor.disconnect();
            this.micAudioProcessor = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.mediaStream?.getTracks().forEach(t => t.stop());
        this.mediaStream = null;

        if (isMacOS) {
            ipc.invoke('stop-macos-audio');
        }

        this.hiddenVideo = null;
    }

    async captureManualScreenshot() {
        console.log('Capture manual screenshot triggered');
        if (!this.mediaStream) {
            console.warn('No media stream for screenshot');
            return;
        }

        if (!this.hiddenVideo) {
            this.hiddenVideo = document.createElement('video');
            this.hiddenVideo.srcObject = this.mediaStream;
            this.hiddenVideo.muted = true;
            this.hiddenVideo.playsInline = true;
            await this.hiddenVideo.play();
            await new Promise<void>(resolve => {
                if (this.hiddenVideo!.readyState >= 2) return resolve();
                this.hiddenVideo!.onloadedmetadata = () => resolve();
            });
            this.offscreenCanvas = document.createElement('canvas');
            this.offscreenCanvas.width = this.hiddenVideo.videoWidth;
            this.offscreenCanvas.height = this.hiddenVideo.videoHeight;
        }

        if (this.hiddenVideo.readyState < 2) return;

        const ctx = this.offscreenCanvas!.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(this.hiddenVideo, 0, 0, this.offscreenCanvas!.width, this.offscreenCanvas!.height);

        let qualityValue = 0.7;
        if (this.currentImageQuality === 'high') qualityValue = 0.9;
        if (this.currentImageQuality === 'low') qualityValue = 0.5;

        this.offscreenCanvas!.toBlob(async (blob) => {
            if (!blob) return;
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64data = (reader.result as string).split(',')[1];
                const result = await ipc.invoke('send-image-content', {
                    data: base64data,
                    prompt: MANUAL_SCREENSHOT_PROMPT
                });
                if (!result.success) {
                    console.error('Failed to send image:', result.error);
                }
            };
            reader.readAsDataURL(blob);
        }, 'image/jpeg', qualityValue);
    }

    async sendTextMessage(text: string) {
        return ipc.invoke('send-text-message', text);
    }
}

export const captureService = new CaptureService();
(window as any).captureManualScreenshot = () => captureService.captureManualScreenshot();
