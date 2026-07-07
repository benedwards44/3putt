import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const OUT = '/Users/benjedwards/Git/3putt/assets/images';
mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------------------
// The mark: flagstick with pennant, ball and hole. Drawn on a 1024 canvas.
// `mono` renders everything in a single colour (for Android monochrome/splash).
// ---------------------------------------------------------------------------
function mark({ mono = null } = {}) {
  const stick = mono ?? '#FFFFFF';
  const flag = mono ?? '#FFFFFF';
  const ball = mono ?? '#FFFFFF';
  const hole = mono ?? 'rgba(4,32,18,0.55)';
  const shadow = mono ? 'none' : 'rgba(4,32,18,0.28)';
  return `
    <!-- hole -->
    <ellipse cx="470" cy="806" rx="185" ry="46" fill="${hole}"/>
    <!-- ball shadow -->
    ${shadow === 'none' ? '' : `<ellipse cx="756" cy="806" rx="78" ry="20" fill="${shadow}"/>`}
    <!-- flagstick, leaning slightly right into the hole -->
    <rect x="448" y="168" width="30" height="648" rx="15" fill="${stick}" transform="rotate(3 463 492)"/>
    <!-- pennant -->
    <path d="M 487 180 L 786 262 Q 806 268 786 274 L 487 356 Z" fill="${flag}"/>
    <!-- ball -->
    <circle cx="752" cy="742" r="66" fill="${ball}"/>
    ${
      mono
        ? ''
        : `<circle cx="734" cy="724" r="5" fill="rgba(10,60,35,0.13)"/>
           <circle cx="760" cy="720" r="5" fill="rgba(10,60,35,0.13)"/>
           <circle cx="746" cy="744" r="5" fill="rgba(10,60,35,0.13)"/>
           <circle cx="772" cy="742" r="5" fill="rgba(10,60,35,0.13)"/>
           <circle cx="734" cy="764" r="5" fill="rgba(10,60,35,0.13)"/>
           <circle cx="760" cy="766" r="5" fill="rgba(10,60,35,0.13)"/>`
    }`;
}

const background = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#219A5F"/>
      <stop offset="1" stop-color="#0D5C33"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.28" r="0.75">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>`;

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${body}</svg>`;

// Full app icon: gradient background + mark (iOS masks its own corners)
const appIcon = svg(`${background}${mark()}`);

// Android adaptive foreground: transparent, mark shrunk into the ~66% safe zone
const androidForeground = svg(
  `<g transform="translate(512 512) scale(0.62) translate(-512 -512)">${mark()}</g>`
);

// Android monochrome: single-colour silhouette, same safe zone
const androidMono = svg(
  `<g transform="translate(512 512) scale(0.62) translate(-512 -512)">${mark({ mono: '#FFFFFF' })}</g>`
);

// Splash: white mark on transparent (splash background colour comes from app.json)
const splash = svg(mark({ mono: '#FFFFFF' }));

const jobs = [
  ['icon.png', appIcon, 1024],
  ['android-icon-foreground.png', androidForeground, 1024],
  ['android-icon-monochrome.png', androidMono, 1024],
  ['splash-icon.png', splash, 512],
  ['favicon.png', appIcon, 48],
];

for (const [name, source, size] of jobs) {
  await sharp(Buffer.from(source)).resize(size, size).png().toFile(`${OUT}/${name}`);
  console.log('wrote', name, `${size}x${size}`);
}
