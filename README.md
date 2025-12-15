# Cheating Daddy (React Version)

A powerful, AI-powered desktop assistant for interviews, meetings, and exams. Now rebuilt with **React + Vite**.

## 🚀 Recent Changes (React Migration)

The frontend has been completely migrated from Lit to **React 18** for better maintainability, performance, and developer experience.

### Key Improvements
- **Modern Tech Stack**: Switched to **React 18**, **TypeScript**, and **Vite** for lightning-fast builds (~1s).
- **Architecture**:
    - **Component-Based**: UI Logic split into `MainView`, `AssistantView`, `AppHeader`, etc.
    - **Services**: Core logic refactored into singleton services (`CaptureService`, `StorageService`, `IPCService`).
    - **Global Bridge**: Seamless integration between Electron main process and React renderer via `window.cheatingDaddy`.
- **Features Preserved**:
    - **Media Capture**: Full screen and system audio capture (Windows/macOS/Linux).
    - **Global Shortcuts**: `Ctrl+Enter` for manual analysis, `Ctrl+M` for click-through.
    - **Customization**: Profile switching, theme support, and custom prompts.

## 🛠️ Build & Run

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Development**:
    ```bash
    npm start
    ```
    This builds the React app with Vite and launches Electron.

3.  **Build for Production**:
    ```bash
    npm run make
    ```

## 📦 Project Structure

```
src/
├── react/              # New React Source
│   ├── components/     # Reusable UI Components
│   ├── views/          # Main Application Views
│   ├── services/       # Core Logic (Capture, Storage, IPC)
│   ├── App.tsx         # Main Route Handler
│   └── main.tsx        # Entry Point
├── utils/              # Electron Main Process Utils
├── index.js            # Electron Entry Point
└── index.html          # HTML Entry Point
```
