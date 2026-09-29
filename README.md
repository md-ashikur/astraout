# 🚀 AstraOut: NASA Lunar & Martian Outpost Simulator
### *Junior Astronaut Mission Trainer & 3D Planetary Habitat Engineering*

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r186-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

An interactive, high-fidelity 3D space survival and habitat simulation built for the **NASA Space Apps Challenge**. Command a planetary outpost on the **Moon (Base Alpha)** or **Mars (Outpost Prime)**, balance life-critical ECLSS subsystems, manage radiation shielding against solar flares, deploy rovers for resource extraction, and direct a crew of four specialized astronauts.

---

## 📋 Table of Contents
1. [Prerequisites & System Requirements](#-prerequisites--system-requirements)
2. [Step-by-Step Installation](#-step-by-step-installation)
3. [Running the Application](#-running-the-application)
4. [Controls & How to Play](#-controls--how-to-play)
5. [The Outpost Crew & Their Roles](#-the-outpost-crew--their-roles)
6. [Core Subsystems & NASA Technologies](#-core-subsystems--nasa-technologies)
7. [Project Architecture](#-project-architecture)
8. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 💻 Prerequisites & System Requirements

Before running the project, make sure your computer has the following installed:

| Requirement | Minimum Version | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.18.0`+ | `v20.x` or `v22.x` (LTS) | [Download Node.js](https://nodejs.org/) |
| **Package Manager** | `yarn 1.22.x` or `npm 9.x`+ | `yarn` | Built with Yarn package manager |
| **Web Browser** | WebGL 2.0 compatible | Chrome, Brave, Edge, Firefox, Safari | Hardware acceleration enabled |
| **Operating System** | macOS, Linux, or Windows 10/11 | Any | Cross-platform |

> [!TIP]
> To verify your Node.js and Yarn installation, open your terminal and run:
> ```bash
> node -v
> yarn -v
> # or if using npm:
> npm -v
> ```

---

## 📦 Step-by-Step Installation

### 1. Clone or Open the Repository
Open your terminal and navigate to the project directory:
```bash
cd /path/to/nasa-project-test
```

### 2. Install Project Dependencies
Install all required packages using **Yarn** (recommended) or **npm**:

```bash
# Using Yarn (Recommended)
yarn install

# Or using npm
npm install
```

#### What gets installed:
- **`next` (v16.3)**: React framework with App Router, Turbopack, and SSR/SSG.
- **`react` & `react-dom` (v19.2)**: Core UI rendering engine.
- **`three` & `@react-three/fiber`**: WebGL 3D rendering pipeline for the planetary surface and outpost modules.
- **`@react-three/drei`**: Camera controls, 3D HTML overlays, stars, shadows, and lighting helpers.
- **`lucide-react`**: Vector icons for flight instruments, gauges, and telemetry.
- **`canvas-confetti`**: Mission milestone celebrations.
- **`tailwindcss` (v4)**: Modern styling and HUD layout design.
- **`typescript` (v5)**: Strict static type checking.

---

## 🚀 Running the Application

### Development Mode (Local Server)
Start the local Next.js development server:

```bash
yarn dev
# or: npm run dev
```

Once started, open your web browser and navigate to:
```
http://localhost:3000
```

The dev server features hot module replacement (HMR), so code edits refresh automatically.

---

### Production Build & Launch
To test the optimized production build locally:

```bash
# 1. Compile and bundle the application
yarn build
# or: npm run build

# 2. Run the production server
yarn start
# or: npm run start
```

### Linting & Code Verification
Check for any type or linting issues:
```bash
# Run ESLint
yarn lint

# Run TypeScript type check
npx tsc --noEmit
```

---

## 🎮 Controls & How to Play

### 3D Camera Controls
- **Orbit Rotation**: Click and drag with the left mouse button across the 3D surface.
- **Pan View**: Right-click and drag (or two-finger drag on trackpads).
- **Zoom In / Out**: Mouse scroll wheel or use the `+ Zoom` / `- Zoom` toolbar buttons.
- **Quick Preset Views**: Use the camera toolbar at the top of the viewport:
  - `🌐 Orbit`: Full outpost overview.
  - `🏠 Habitat`: Zoom into the pressurized Hab Dome and airlock.
  - `🌱 Crops`: Focus on the bio-regenerative hydroponic greenhouse.
  - `🚜 Rover`: Lock onto the surface patrol rover.
  - `👨‍🚀 Crew`: Glide camera to the selected astronaut's duty station.
  - `⚡ Solar`: Center on the Ultraflex photovoltaic array.
  - `📡 Comms`: Inspect the high-gain deep space antenna.
  - `🏷️ Popups: HOVER / ALL`: Toggle between a clean, unobstructed 3D view (popups appear only on hover/click) and seeing all module markers at once.

---

## 👨‍🚀 The Outpost Crew & Their Roles

The outpost is staffed by four astronauts, each stationed at a key facility with distinct NASA mission responsibilities:

| Astronaut | Role | Station | Primary Responsibility & Gameplay Effect |
| :--- | :--- | :--- | :--- |
| **Commander Elena Vance**<br>`👨‍🚀 Cyan / Gold Suit` | **Commander** | Command Hub / Hab Airlock | **Outpost Operations & Morale**: Coordinates emergency protocols, oversees habitation pressure (101.3 kPa), and maintains crew psychological resilience. |
| **Marcus Cole**<br>`👨‍🔧 Amber Suit` | **Systems Engineer** | Solar Array & Fission Junction | **Power Grid Optimization**: Manages day/night power switching between Ultraflex Solar and the Kilopower Nuclear Fission reactor; repairs electrical junctions. |
| **Dr. Maya Lin**<br>`👩‍🌾 Emerald Suit` | **Astrobiologist** | Hydroponic Bio-Greenhouse | **Food & O₂ Recycling**: Cultivates dwarf wheat and microgreens; optimizes LED PAR grow spectrums to yield fresh rations and scrub atmospheric CO₂. |
| **Dr. Tariq Al-Mansoor**<br>`👨‍⚕️ Purple Suit` | **Flight Surgeon** | ECLSS Bay & Cryo Reservoirs | **Bio-Telemetry & Radiation Treatment**: Tracks accumulated astronaut radiation doses (mSv), monitors crew fatigue, and administers medical countermeasures. |

> [!NOTE]
> **Inspecting Crew Members**: Click on any astronaut in the 3D scene or select them from the **Crew** sidebar on the right. The camera will smoothly focus on their station, displaying their real-time vitals. Click **`📋 BIO & ROLES`** to open the comprehensive crew management deck to assign rest, maintenance, or shelter orders.

---

## ⚙️ Core Subsystems & NASA Technologies

### 1. Power Generation (Day vs. Night)
- **Ultraflex Photovoltaic Arrays**: High-efficiency solar arrays generate **+12 kW** during daylight, but produce **0 kW** during cryogenic night or dust storms.
- **Kilopower Nuclear Fission (KRUSTY)**: NASA Stirling-engine space nuclear reactor providing continuous **+10 kW** 24/7 baseload power, independent of sunlight.

### 2. Environmental Control & Life Support (ECLSS)
- **Sabatier Carbon Dioxide Reduction Reactor**: Combines waste crew CO₂ with hydrogen to produce water and methane, generating breathable oxygen (+12.4 g/hr).
- **Amine Thermal Scrubbers**: Solid-amine vacuum-desorbed CO₂ scrubbers to keep atmospheric CO₂ safely below 1,800 ppm.
- **Cryogenic Reservoirs**: Thermal vacuum dewars storing liquid oxygen (LOX at 90 K) and purified potable water reserves.

### 3. Radiation Mitigation & In-Situ Resource Utilization (ISRU)
- **Sintered Regolith Shielding**: Microwaves local Moon/Mars soil into solid protective ceramic blocks. 45–50 cm of sintered basalt blocks >85% of cosmic rays and SPE radiation.
- **Emergency Storm Shelter**: High-density hydrogen-rich water-jacketed retreat bunker. Must be activated when solar proton events (SPE flares) occur.
- **Surface Patrol Rover**: Dispatched across impact craters to prospect for subsurface water ice and gather raw mineral regolith.

---

## 📂 Project Architecture

```
nasa-project-test/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout, HTML headers & font loading
│   │   ├── page.tsx               # Main simulation orchestration & Game HUD
│   │   └── globals.css            # Base Tailwind styles & custom animations
│   ├── audio/
│   │   └── sound-synthesizer.ts   # Zero-asset procedural Web Audio synthesizer
│   ├── components/
│   │   ├── alerts/                # Threat banners & hazard notifications
│   │   ├── control-deck/          # Subsystem controls & Crew Management Modal
│   │   ├── debrief/               # Mission end-game score & sustainability report
│   │   ├── education/             # NASA Cadet Field Manual & STEM facts
│   │   ├── flight-log/            # Real-time event ticker & Capcom transmission log
│   │   ├── game-3d/
│   │   │   ├── mini-outpost-scene.tsx  # Three.js outpost model, modules, rover & crew
│   │   │   ├── planet-scene.tsx        # Planetary backdrop rendering
│   │   │   ├── planet-select-scene.tsx # Moon vs Mars selection globe
│   │   │   └── home-scene.tsx          # Cinematic main menu 3D scene
│   │   ├── header/                # Mission telemetry bar, Sol clock, weather pill
│   │   └── telemetry/             # Battery, water, ECLSS, and O₂ dials
│   └── engine/
│       ├── simulation-types.ts    # TypeScript definitions for state, crew, modules
│       ├── simulation-core.ts     # Game tick loop, physics & resource calculations
│       ├── power-subsystem.ts     # Solar angles, fission baseline, battery capacity
│       ├── life-support-subsystem.ts # O₂ consumption, CO₂ scrubber rates, water loops
│       ├── radiation-subsystem.ts # SPE solar flare spikes, regolith shielding formulas
│       ├── agriculture-subsystem.ts # PAR grow light efficiency & hydroponic crop yield
│       ├── event-subsystem.ts     # Dust storms, solar flares & micrometeoroid events
│       └── default-scenarios.ts   # Initial conditions for Moon Base Alpha & Mars Prime
├── package.json                   # Dependencies, engines & scripts
├── tsconfig.json                  # Strict TypeScript configuration
└── README.md                      # Project manual & documentation
```

---

## 🛠️ Troubleshooting & FAQ

### 1. `Error: Port 3000 is already in use`
Another dev server or app is occupying port 3000. You can either:
- Let Next.js run on an alternate port automatically (e.g. port 3001).
- Or kill the process using port 3000:
  ```bash
  # macOS / Linux:
  lsof -ti:3000 | xargs kill -9
  ```

### 2. Black Screen or 3D Outpost Not Loading
- Ensure **Hardware Acceleration** is enabled in your browser settings (`Settings` -> `System` -> `Use graphics acceleration when available`).
- Update your graphics card drivers.
- Check browser console (`F12` or `Cmd + Option + I`) for WebGL context warnings.

### 3. Audio Effects Not Playing
- Modern browsers block auto-playing audio until the user interacts with the page. Click anywhere on the screen or click the **Guide / Sound** button in the top navigation bar to initialize the Web Audio API context.

### 4. Overlapping 3D Popup Labels
- By default, module labels and telemetry cards only show when you hover or click on an object to ensure an unobstructed 3D view.
- You can toggle between hover mode and all-labels mode anytime using the **`🏷️ Popups: HOVER / ALL`** button in the camera toolbar.

---

## 📜 Educational References & NASA Technology Roadmap
- **NASA MOXIE** (*Mars Oxygen In-Situ Resource Utilization Experiment*): [NASA JPL MOXIE](https://mars.nasa.gov/mars2020/spacecraft/instruments/moxie/)
- **NASA Kilopower Project** (*KRUSTY - Kilowatt Reactor Using Stirling Technology*): [NASA Glenn Research Center](https://www.nasa.gov/directorates/stmd/game-changing-development-program/kilopower/)
- **NASA ECLSS** (*Environmental Control and Life Support System*): [NASA Marshall Space Flight Center](https://www.nasa.gov/international-space-station/space-station-environmental-control-and-life-support-system/)
- **NASA Regolith Sintering for Space Construction**: [NASA Technical Reports Server](https://ntrs.nasa.gov/)

---

*Developed for the NASA International Space Apps Challenge • Built with Next.js 16, React 19, and Three.js.*
