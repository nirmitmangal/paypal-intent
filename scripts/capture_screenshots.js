import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.resolve(__dirname, '../docs/screenshots');
const artifactDir = 'C:\\Users\\nirmi\\.gemini\\antigravity\\brain\\06383e80-dc50-4d0a-a30c-e2eddf62844b\\screenshots';

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

// Find Chrome or Edge executable
const possiblePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const browserExe = possiblePaths.find((p) => fs.existsSync(p));
if (!browserExe) {
  console.error('No Chrome or Edge browser found');
  process.exit(1);
}

console.log(`Using browser: ${browserExe}`);

const userDataDir = path.resolve(__dirname, '../tmp_chrome_profile');
if (!fs.existsSync(userDataDir)) {
  fs.mkdirSync(userDataDir, { recursive: true });
}

const chromeProcess = spawn(browserExe, [
  '--headless=new',
  '--remote-debugging-port=9222',
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
]);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCdpReady() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) return;
    } catch {
      await sleep(300);
    }
  }
  throw new Error('CDP port 9222 not available');
}

async function captureScreens() {
  try {
    await waitForCdpReady();
    console.log('Browser CDP is ready.');

    const newTargetRes = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
    const target = await newTargetRes.json();
    const wsUrl = target.webSocketDebuggerUrl;
    console.log(`Target WebSocket: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const pendingPromises = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pendingPromises.has(data.id)) {
        const { resolve, reject } = pendingPromises.get(data.id);
        pendingPromises.delete(data.id);
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      }
    };

    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        pendingPromises.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');

    const screens = [
      {
        name: '01_homepage_desktop_1440.png',
        url: 'http://localhost:3000/#home',
        width: 1440,
        height: 900,
        deviceScaleFactor: 2,
        isMobile: false,
      },
      {
        name: '01_homepage_desktop.png',
        url: 'http://localhost:3000/#home',
        width: 1440,
        height: 900,
        deviceScaleFactor: 2,
        isMobile: false,
      },
      {
        name: '02_workspace_desktop.png',
        url: 'http://localhost:3000/#workspace',
        width: 1440,
        height: 900,
        deviceScaleFactor: 2,
        isMobile: false,
      },
      {
        name: '03_planning_desktop.png',
        url: 'http://localhost:3000/#planning',
        width: 1440,
        height: 900,
        deviceScaleFactor: 2,
        isMobile: false,
      },
      {
        name: '04_decision_desktop.png',
        url: 'http://localhost:3000/#decision',
        width: 1440,
        height: 900,
        deviceScaleFactor: 2,
        isMobile: false,
      },
      {
        name: '05_discovery_desktop.png',
        url: 'http://localhost:3000/#discovery',
        width: 1440,
        height: 900,
        deviceScaleFactor: 2,
        isMobile: false,
      },
      {
        name: '06_cart_desktop.png',
        url: 'http://localhost:3000/#cart',
        width: 1440,
        height: 900,
        deviceScaleFactor: 2,
        isMobile: false,
      },
      {
        name: '07_payment_desktop.png',
        url: 'http://localhost:3000/#payment',
        width: 1440,
        height: 900,
        deviceScaleFactor: 2,
        isMobile: false,
      },
      {
        name: '08_history_desktop.png',
        url: 'http://localhost:3000/#history',
        width: 1440,
        height: 900,
        deviceScaleFactor: 2,
        isMobile: false,
      },
      {
        name: '09_settings_desktop.png',
        url: 'http://localhost:3000/#settings',
        width: 1440,
        height: 900,
        deviceScaleFactor: 2,
        isMobile: false,
      },
      {
        name: '10_homepage_mobile_390.png',
        url: 'http://localhost:3000/#home',
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        isMobile: true,
      },
      {
        name: '10_homepage_mobile.png',
        url: 'http://localhost:3000/#home',
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        isMobile: true,
      },
      {
        name: '11_cart_mobile.png',
        url: 'http://localhost:3000/#cart',
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        isMobile: true,
      },
    ];

    for (const sc of screens) {
      console.log(`Capturing ${sc.name} at ${sc.url}...`);
      await sendCommand('Emulation.setDeviceMetricsOverride', {
        width: sc.width,
        height: sc.height,
        deviceScaleFactor: sc.deviceScaleFactor || 1,
        mobile: sc.isMobile,
      });

      await sendCommand('Page.navigate', { url: sc.url });
      await sleep(1500); // Allow react and images to render

      const { data } = await sendCommand('Page.captureScreenshot', {
        format: 'png',
      });

      const buffer = Buffer.from(data, 'base64');
      const outPath = path.join(screenshotsDir, sc.name);
      fs.writeFileSync(outPath, buffer);
      const artifactPath = path.join(artifactDir, sc.name);
      fs.writeFileSync(artifactPath, buffer);

      console.log(`Saved: ${outPath} and ${artifactPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
    }

    ws.close();
    console.log('All screenshots captured successfully!');
  } finally {
    try {
      chromeProcess.kill();
    } catch {}
  }
}

captureScreens().catch((err) => {
  console.error('Error during screenshot capture:', err);
  try {
    chromeProcess.kill();
  } catch {}
  process.exit(1);
});
