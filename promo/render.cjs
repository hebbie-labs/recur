// Usage: NODE_PATH=<dir with playwright> node render.cjs [--still 1.2,3.4] [--fps 60] [--audio out/audio.wav]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const arg = n => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('PAGE ERROR', e));
  page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto('file://' + path.resolve(__dirname, 'showreel.html') + '?render');
  await page.evaluate(() => window.ready);
  const png = t => page.evaluate(t => { window.render(t); return document.getElementById('c').toDataURL('image/png').slice(22); }, t);
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'out/cues.json'), JSON.stringify(await page.evaluate(() => window.CUES)));
  const still = arg('still');
  if (still) {
    for (const t of still.split(',')) fs.writeFileSync(path.join(__dirname, `out/still-${t}.png`), Buffer.from(await png(parseFloat(t)), 'base64'));
    await browser.close(); return;
  }
  const fps = parseInt(arg('fps') || '60'), dur = await page.evaluate(() => window.DUR), n = Math.round(dur * fps);
  const audio = arg('audio'), outFile = arg('out') || path.join(__dirname, 'out/recur-showreel.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    ...(audio ? ['-i', audio] : []), '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
    ...(audio ? ['-c:a', 'aac', '-b:a', '256k', '-shortest'] : []), '-movflags', '+faststart', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0; f < n; f++) {
    const buf = Buffer.from(await png(f / fps), 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 60 === 0) console.log(`frame ${f}/${n}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close(); console.log('done', outFile);
})();
