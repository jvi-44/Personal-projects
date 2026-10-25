"""Build the course videos: narration (Piper TTS) → manifests → frames (studio.html via render.js) → MP4 + WebVTT.

python3 tools/video/make.py [--jobs 3] [--only id,id] [--skip-existing]
Needs: piper-tts and a voice model (PIPER_VOICE, default tools/video/voices/en_US-lessac-high.onnx),
ffmpeg, node + playwright. Outputs go to site/media/video/<id>.{mp4,vtt,jpg}.
"""
import argparse, concurrent.futures as cf, http.server, json, os, re, subprocess, sys, threading, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "content"))
from videos import VIDEOS  # noqa: E402
try:
    from photos import PHOTOS  # noqa: E402
except ImportError:
    PHOTOS = {}

BUILD = os.path.join(ROOT, "tools", "video", "build")
OUT = os.path.join(ROOT, "site", "media", "video")
VOICE = os.environ.get("PIPER_VOICE", os.path.join(ROOT, "tools", "video", "voices", "en_US-lessac-high.onnx"))
PORT = 8777
LEAD, TAIL = 0.35, 0.75  # silence before / after each scene's narration (s)
MIN_SCENE = {"title": 4.5, "terrain": 9.0, "globe": 6.0, "diagram": 7.0, "chart": 8.0}

# spoken-only respellings so the voice pronounces place names and terms sensibly (captions keep the real spelling)
SAY = {
    "Funafuti": "Foona-footy", "Fogafale": "Fonga-fahlay", "Fongafale": "Fonga-fahlay", "Te Namo": "Tay Nahmo",
    "falekaupule": "fahlay-cow-poolay", "pulaka": "poo-lahka", "Falepili": "Fahlay-peelee", "motu": "moh-too",
    "Tuvalu": "Too-vahloo", "Tuvaluans": "Too-vahloo-ans", "Nanumea": "Nahnoo-mayah", "Ghyben–Herzberg": "Gibben Hertsberg",
    "Hau'ofa": "How-oh-fah", "Baldacchino": "Bal-dah-keeno", "Grydehøj": "Grith-hoy", "nisos": "nee-sos",
    "Oeno": "Oh-eeno", "Ducie": "Doosee", "Pitkern": "Pit-kern", "Mangareva": "Manga-rayva", "makatea": "mahka-tay-ah",
    "Dusicyon": "Doo-sissy-on", "warrah": "worra", "Yaghan": "Yah-gan", "Usborne": "Uzz-born", "tussac": "tussock",
    "Tristão da Cunha": "Trish-tow da Coon-ya", "Tristan da Cunha": "Tristan da Coon-ya", "Repetto": "Reh-petto", "Lavarello": "Lava-rello",
    "Nesospiza": "Nesso-spiza", "Walvis": "Walvis", "Etendeka": "Eten-dekka",
    "Surtsey": "Surts-ay", "Surtseyan": "Surts-ay-an", "Heimaey": "Hay-mah-ay", "Eldfell": "Eld-fell", "Vestmannaeyjar": "Vest-mana-ay-yar",
    "palagonite": "pa-lag-o-nite", "diatreme": "dye-a-treem",
    "Socotra": "Sock-otra", "Soqotri": "Sock-otree", "Haggeher": "Hag-heh-her", "Hadibo": "Hah-dee-bo", "Dhofar": "Doe-far",
    "Hoq": "Hock", "Periplus": "Perry-plus", "Erythraean": "Erry-three-an", "Diksam": "Dik-sam", "Firmihin": "Fir-mee-hin", "Homhil": "Hom-hil",
    "Abd al Kuri": "Abd al Koo-ree", "Chapala": "Chah-pah-la", "Megh": "Mayg", "Mahra": "Mah-ra",
    "Kiritimati": "Kiss-mass", "Rapa Iti": "Rahpa Eetee", "Grydehøj's": "Grith-hoy's", "Magnússon": "Mag-noosson",
}


def speakable(text):
    for k in sorted(SAY, key=len, reverse=True):
        text = re.sub(rf"(?<![\w-]){re.escape(k)}(?![\w-])", SAY[k], text)
    return text.replace("–", " to ").replace("—", ", ")


def cues_for(text, start, length):
    """Split narration into caption chunks timed in proportion to their length."""
    parts = []
    for sent in re.split(r"(?<=[.!?])(?<! [A-Z]\.)(?<!\b[A-Z][a-z]\.)\s+(?=[A-Z0-9\"'‘“])", text.strip()):
        while len(sent) > 92:
            cut = max(sent.rfind(", ", 0, 92), sent.rfind("; ", 0, 92), sent.rfind(": ", 0, 92))
            if cut < 30:
                cut = sent.rfind(" ", 0, 88)
            parts.append(sent[:cut + 1].strip()); sent = sent[cut + 1:].strip()
        if sent:
            parts.append(sent)
    total = sum(len(p) for p in parts) or 1
    out, t = [], start
    for p in parts:
        d = length * len(p) / total
        out.append(dict(start=round(t, 3), end=round(t + d, 3), text=p)); t += d
    return out


def tts(voice, text, path):
    import wave as w
    with w.open(path, "wb") as wf:
        voice.synthesize_wav(speakable(text), wf)
    with w.open(path) as wf:
        return wf.getnframes() / wf.getframerate(), wf.getframerate()


def prepare(vid, voice):
    v = VIDEOS[vid]
    adir = os.path.join(BUILD, "audio", vid); os.makedirs(adir, exist_ok=True)
    scenes, t, chunks, rate = [], 0.0, [], 22050
    for i, s in enumerate(v["scenes"]):
        wav = os.path.join(adir, f"{i:02d}.wav")
        alen, rate = tts(voice, s["say"], wav)
        dur = max(LEAD + alen + TAIL, MIN_SCENE.get(s["type"], 0))
        sc = {k: val for k, val in s.items() if k != "say"}
        sc.update(start=round(t, 3), dur=round(dur, 3), cues=cues_for(s["say"], t + LEAD, alen))
        scenes.append(sc)
        with wave.open(wav) as wf:
            a = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16)
        seg = np.zeros(int(round(dur * rate)), dtype=np.int16)
        o = int(LEAD * rate); seg[o:o + len(a)] = a[: len(seg) - o]
        chunks.append(seg); t += dur
    audio = os.path.join(BUILD, "audio", f"{vid}.wav")
    with wave.open(audio, "wb") as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(rate); wf.writeframes(np.concatenate(chunks).tobytes())
    photos = {p: PHOTOS[p] for p in {s.get("photo") for s in v["scenes"]} if p and p in PHOTOS}
    dems = json.load(open(os.path.join(ROOT, "site", "data", "dem", "meta.json")))
    man = dict(id=vid, bar=v["bar"], dur=round(t, 3), scenes=scenes,
               photos={k: dict(credit=val["credit"]) for k, val in photos.items()},
               dems={d["id"]: d for d in dems})
    mpath = os.path.join(BUILD, "manifests", f"{vid}.json"); os.makedirs(os.path.dirname(mpath), exist_ok=True)
    json.dump(man, open(mpath, "w"), ensure_ascii=False)
    return man


def vtt(man, path):
    def ts(x):
        h, r = divmod(x, 3600); m, s = divmod(r, 60)
        return f"{int(h):02d}:{int(m):02d}:{s:06.3f}"
    lines = ["WEBVTT", ""]
    for s in man["scenes"]:
        for c in s["cues"]:
            lines += [f"{ts(c['start'])} --> {ts(c['end'])}", c["text"], ""]
    open(path, "w").write("\n".join(lines))


def render(vid, man):
    silent = os.path.join(BUILD, f"{vid}.silent.mp4")
    subprocess.run(["node", os.path.join(ROOT, "tools", "video", "render.js"), f"/tools/video/build/manifests/{vid}.json", silent, "15", str(PORT)],
                   check=True, env={**os.environ, "NODE_PATH": subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip()})
    out = os.path.join(OUT, f"{vid}.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", silent, "-i", os.path.join(BUILD, "audio", f"{vid}.wav"),
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "64k", "-ac", "1", "-shortest", "-movflags", "+faststart", out], check=True)
    first = man["scenes"][0]
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(min(first["dur"] - 0.2, 2.2)), "-i", silent, "-frames:v", "1", "-q:v", "4",
                    os.path.join(OUT, f"{vid}.jpg")], check=True)
    vtt(man, os.path.join(OUT, f"{vid}.vtt"))
    os.remove(silent)
    return out


def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
        def log_message(self, *a): pass
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Quiet)
    threading.Thread(target=srv.serve_forever, daemon=True).start()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--jobs", type=int, default=3)
    ap.add_argument("--only", default="")
    ap.add_argument("--skip-existing", action="store_true")
    a = ap.parse_args()
    from piper import PiperVoice
    voice = PiperVoice.load(VOICE)
    os.makedirs(OUT, exist_ok=True)
    ids = [x for x in (a.only.split(",") if a.only else VIDEOS) if x]
    if a.skip_existing:
        ids = [x for x in ids if not os.path.exists(os.path.join(OUT, f"{x}.mp4"))]
    mans = {}
    for vid in ids:
        mans[vid] = prepare(vid, voice)
        print(f"narration {vid}: {mans[vid]['dur']:.1f} s", flush=True)
    serve()
    with cf.ThreadPoolExecutor(a.jobs) as ex:
        for f in cf.as_completed([ex.submit(render, vid, mans[vid]) for vid in ids]):
            print("built", f.result(), flush=True)
    index = {}
    for vid in VIDEOS:
        mp = os.path.join(BUILD, "manifests", f"{vid}.json")
        if os.path.exists(mp) and os.path.exists(os.path.join(OUT, f"{vid}.mp4")):
            m = json.load(open(mp))
            index[vid] = dict(dur=m["dur"], transcript=" ".join(s["say"] for s in VIDEOS[vid]["scenes"]), photos=sorted(m["photos"]))
    json.dump(index, open(os.path.join(OUT, "index.json"), "w"), ensure_ascii=False)


if __name__ == "__main__":
    main()
