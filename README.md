# SaashPlay

The ultimate zero-latency co-watching platform. Synchronize perfectly, chat clearly, entirely peer-to-peer.

## How to Run the Project

This project is split into two parts: the **Client** (Frontend) and the **Server** (Backend Signaling). You must run *both* for the application to work.

### 1. Start the Server (Backend)
Open a new terminal window in VS Code, navigate to the `server` folder, and start the backend:
```bash
cd server
npm install
npm run dev
```
*The server will start running on `http://localhost:3001`.*

### 2. Start the Client (Frontend)
Open a **second, separate terminal window**, navigate to the `client` folder, and start the frontend:
```bash
cd client
npm install
npm run dev
```
*The client will start running on `http://localhost:5173`.*

### 3. Open the App
Hold `Ctrl` and click the `http://localhost:5173` link in your terminal, or open your browser and go to:
**[http://localhost:5173](http://localhost:5173)**

---

### How to Test with Two People on One Computer
To test the synchronization yourself:
1. Open a regular browser window and go to `http://localhost:5173`. Create a room as the Host.
2. Open an **Incognito/Private window** (or a completely different browser) and go to `http://localhost:5173`. Join the room using the 6-character code as the Guest.
3. Upload the *exact same video file* on both windows to watch the sync in action!
