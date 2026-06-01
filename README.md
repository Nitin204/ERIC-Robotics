# Insight.IO – ERIC Robotics Dashboard

> Full Stack Developer Assignment Submission

---

## Author Details

| Field | Value |
|---|---|
| **Full Name** | Nitin Gorakh Katore |
| **Contact Number** |7887782951|
| **Email ID** | nitinkatore686@email.com |
| **GitHub Username** | https://github.com/Nitin204 |

---

## Live Preview

Open `index.html` directly in any modern browser — **no build step required**.

---

## Quick Start (Self-Hosted)

### Option 1 – Python (recommended, zero dependencies)

```bash
# Python 3
python3 -m http.server 8080

# Then open:
# http://localhost:8080
```

### Option 2 – Node.js

```bash
npx serve .
# or
npx http-server -p 8080
```

### Option 3 – VS Code Live Server

Install the **Live Server** extension, right-click `index.html` → **Open with Live Server**.

No internet dependencies are required at runtime (Google Fonts load if connected, but the dashboard functions fully offline with system fonts as fallback).

---

## Project Structure

```
insight-io/
├── index.html          # Main dashboard shell
├── src/
│   ├── style.css       # All styling, CSS variables, animations
│   └── app.js          # Canvas rendering, interactivity, controls
├── README.md           # This file
└── assets/             # (reserved for PCD / video files)
```

---

## Features Implemented

### Dashboard Layout (faithful to design)
- **Top status bar** — mission status, battery %, signal strength, failsafe/system indicators, mode toggle
- **Left sidebar** — icon navigation with tooltips (Dashboard, Map, Goals, Zones, Camera, Analytics, Profile)
- **Map View** — full-area 2D warehouse map with highlighted zones, obstacles, navigation nodes, animated path trace, LiDAR-style scan sweep
- **Camera thumbnail** — bottom-left corner, click to open full modal
- **Emergency Stop button** — glowing, animated, fully functional (halts robot movement)
- **Directional pad** — WASD keyboard + clickable on-screen buttons, touch-enabled

### Interactivity
| Feature | Details |
|---|---|
| Mode toggle (AUTO/MANUAL) | Switches mode, shows toast |
| Pause/Resume mission | Freezes robot movement |
| Emergency Stop | Engages/disengages, stops all motion |
| Quick Goal | Activates click-to-waypoint mode |
| Map click | Sets robot position anywhere on map |
| Zoom in/out | Slider + buttons, 0.5×–2.0× |
| Robot movement | WASD keyboard or D-Pad buttons, with rotation |
| Camera modal | Full-screen camera feed with REC indicator, stats |
| Battery drain | Simulated real-time drain with color change |

### Visual Design
- Dark industrial aesthetic matching the original design
- Procedural canvas-rendered warehouse map (no external assets needed)
- Simulated camera feed with perspective grid, yellow safety railing, and scan-line CRT effect
- Animated robot pulse ring, LiDAR scan sweep
- CSS animations: ESTOP glow, compass spin, robot pulse
- Fully responsive (768px, 480px breakpoints)

---

## Technical Approach

### Stack
- **Vanilla HTML/CSS/JavaScript** — zero framework dependencies, runs self-hosted with any static file server
- **HTML5 Canvas API** — procedural map rendering and camera simulation
- **CSS custom properties** — theming via design tokens
- **Google Fonts** (DM Mono + Syne) — loaded externally, graceful offline fallback

### Architecture
The application is split into three clear concerns:

1. **`index.html`** — semantic markup, layout structure, UI component tree
2. **`src/style.css`** — all visual presentation, responsive breakpoints, CSS animations
3. **`src/app.js`** — application state, canvas rendering loop (`requestAnimationFrame`), event handling

The rendering loop runs at native display framerate (~60fps). The map and camera feed are drawn procedurally on each frame, enabling live animations (scan sweep, path trace) without any external assets.

### 3D Map / PCD Integration (extension path)
The `assets/` folder is reserved for `.pcd` files. To extend with real point cloud data:
```javascript
// Drop-in Three.js + PCLjs integration
import * as THREE from 'three';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';
const loader = new PCDLoader();
loader.load('assets/scene.pcd', points => scene.add(points));
```

### Camera Feed Extension
Replace the canvas simulation with a real video element:
```javascript
// Live webcam
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => videoEl.srcObject = stream);

// Or a static video file
// <video src="assets/feed.mp4" autoplay loop muted></video>
```

---

## Design Decisions

- **No build toolchain** — maximises portability; the assignment specifies self-hosted, so removing npm/bundler friction ensures any evaluator can run it with one command
- **Procedural map** — removes dependency on external `.pcd` file for the base submission while demonstrating canvas competency; the extension path above shows how to plug in real PCD data
- **Vanilla JS** — given the scope (single-page dashboard), a framework would add complexity without benefit; the codebase stays readable and maintainable in ~300 lines of JS
- **CSS variables** — all colours/spacing defined once at `:root`, making theming trivial
- **Responsive** — two breakpoints cover tablet and mobile, hiding non-essential panels on small screens while keeping core controls accessible

---

## Bonus Points Addressed

- ✅ **Modular, maintainable code structure** — HTML / CSS / JS cleanly separated; JS split into renderer functions, state object, and event handlers
- ✅ **Clear commit history showing progressive work** — see repository commit log
- 🔜 **ROS integration** — path documented above; `roslib.js` drop-in ready via `assets/` folder

---

*Good luck reviewing — happy to discuss any design or architecture decisions!*
