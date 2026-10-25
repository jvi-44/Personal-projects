// Render one video manifest to a silent H.264 MP4 by stepping the studio page frame by frame.
// node tools/video/render.js <manifest-url-path> <out.mp4> [fps] [port]
const { chromium } = require("playwright");
const { spawn } = require("child_process");

(async () => {
  const [manifest, out, fpsArg, portArg] = process.argv.slice(2);
  const fps = +(fpsArg || 15), port = +(portArg || 8777);
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--disable-web-security"] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`http://localhost:${port}/tools/video/studio.html?m=${encodeURIComponent(manifest)}`);
  await page.evaluate(() => window.studioReady);
  const dur = await page.evaluate(() => window.VIDEO_DUR);
  if (errs.length) console.error("page errors:", errs.join(" | "));
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "27", "-pix_fmt", "yuv420p", "-r", String(fps), out], { stdio: ["pipe", "inherit", "inherit"] });
  const n = Math.ceil(dur * fps);
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => window.renderAt(t), i / fps);
    const buf = await page.screenshot({ type: "jpeg", quality: 90 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 300 === 0) console.log(`${out}: frame ${i}/${n} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await browser.close();
  console.log(`${out}: done ${n} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})().catch((e) => { console.error(e); process.exit(1); });
