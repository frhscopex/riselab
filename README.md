# RiseLab Frontend

Welcome to the frontend repository for the **RiseLab** landing page and API gateway. This directory contains the high-fidelity UI constructed using raw HTML, CSS, and vanilla JavaScript for a bloat-free, ultra-performant experience.

## Architecture without Slop

This frontend utilizes native CSS variables and custom utility classes inspired by modern frameworks, but without the dependency overhead. 

- **`index.html`**: Core semantic structure, mobile-responsive layout, and interactive sections.
- **`index.css`**: Global styles, fluid typography, glassmorphism utilities (`.glass-panel`), and custom intersection-observer reveal animations (`.fade-in-up`, `.reveal`).
- **`script.js`**: Lightweight interactivity including smooth scrolling, scroll-reveal observers, and the API Playground logic.

## API Playground Integration

The interactive API Playground dynamically fetches data from the RiseLab backend layer. 

By default, the frontend attempts to reach the backend at `http://localhost:4000/api`. If the backend is unreachable or CORS fails, the playground gracefully falls back to using embedded mock data to ensure a continuous demonstration experience.

### Configuring the Backend URL

To update the backend URL for production, open `script.js` and modify the `baseUrl` variable within the `updatePlayground` function:

```javascript
// script.js (Line 96)
const baseUrl = 'https://api.yourdomain.com/v1'; // Update this to your production API
```

## Running Locally

To serve the frontend locally, you can use any static file server. For example:

**Using Python:**
```bash
python3 -m http.server 3000
```

**Using Node.js / npx:**
```bash
npx serve -l 3000
```

Navigate to `http://localhost:3000` to view the landing page.

## Mobile Responsiveness

The UI is optimized for edge-to-edge rendering on mobile devices (`max-width: 600px`). The Comparison Table uses horizontal scrolling natively, and the Hero Section reorganizes its grid into a vertical stack for optimal readability.
