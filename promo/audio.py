#!/usr/bin/env python3
"""Synthesizes the showreel soundtrack (128 BPM, 32 beats = 15s) from out/cues.json. Pure stdlib."""
import json, math, random, struct, wave, os, sys
here = os.path.dirname(os.path.abspath(__file__))
cues = json.load(open(os.path.join(here, 'out/cues.json')))
SR = 44100; BEAT = cues['beat']; DUR = 32 * BEAT; N = int(DUR * SR) + SR // 2
dry = [[0.0] * N, [0.0] * N]; wet = [[0.0] * N, [0.0] * N]
rnd = random.Random(7)
TAU = 2 * math.pi
def pent(i, base=220.0):
    return base * 2 ** (([0, 3, 5, 7, 10][i % 5] + 12 * (i // 5)) / 12)
def put(buf, t0, samples, gain=1.0, pan=0.0):
    i0 = int(t0 * SR); gl = gain * (1 - max(0, pan)); gr = gain * (1 + min(0, pan))
    for k, v in enumerate(samples):
        i = i0 + k
        if 0 <= i < N: buf[0][i] += v * gl; buf[1][i] += v * gr
def env(n, a, d):  # attack a samples, exp decay
    return [min(1, k / max(1, a)) * math.exp(-k / d) for k in range(n)]
def kick(vol=1.0):
    n = int(.34 * SR); out = []; ph = 0.0
    for k in range(n):
        t = k / SR; f = 45 + 110 * math.exp(-t * 28); ph += TAU * f / SR
        out.append((math.sin(ph) * math.exp(-t * 9) + (.5 * math.exp(-t * 400) * rnd.uniform(-1, 1))) * vol)
    return out
def noise_burst(dur, decay, hp=0.7, vol=1.0):
    n = int(dur * SR); prev = 0.0; out = []
    for k in range(n):
        x = rnd.uniform(-1, 1); y = x - hp * prev; prev = x
        out.append(y * math.exp(-k / SR * decay) * vol)
    return out
def clap(vol=1.0):
    a = noise_burst(.22, 22, .85, vol); b = noise_burst(.012, 200, .85, vol)
    out = a[:]
    for off in (0, int(.011 * SR), int(.022 * SR)):
        for k, v in enumerate(b):
            if off + k < len(out): out[off + k] += v * .8
    return out
def hat(vol=.5, d=70): return noise_burst(.08, d, .98, vol)
def tone(freq, dur, wave_='sine', vol=1.0, a=.004, d=6.0, slide=0.0):
    n = int(dur * SR); out = []; ph = 0.0
    for k in range(n):
        t = k / SR; f = freq * (1 + slide * t); ph += TAU * f / SR
        if wave_ == 'sine': w = math.sin(ph)
        elif wave_ == 'square': w = (1 if math.sin(ph) > 0 else -1) * .5 + .5 * math.sin(ph)
        elif wave_ == 'saw': w = 2 * ((ph / TAU) % 1) - 1
        else: w = math.asin(math.sin(ph)) * 2 / math.pi
        out.append(w * min(1, t / a) * math.exp(-t * d) * vol)
    return out
def lp(x, a):  # one pole low-pass
    y = 0.0; o = []
    for v in x: y += a * (v - y); o.append(y)
    return o
def bass(freq, dur, vol=.8):
    return lp(tone(freq, dur, 'saw', vol, .004, 4.0), .08)
def riser(dur, vol=.5):
    n = int(dur * SR); out = []; ph = 0.0; prev = 0.0; lpv = 0.0
    for k in range(n):
        t = k / n; x = rnd.uniform(-1, 1); y = x - .6 * prev; prev = x
        a = .03 + .5 * t * t; lpv += a * (y - lpv)
        ph += TAU * (200 + 1800 * t * t) / SR
        out.append((lpv * 1.2 + .25 * math.sin(ph)) * (t ** 1.7) * vol)
    return out
def impact():
    n = int(2.2 * SR); out = []; ph = 0.0
    for k in range(n):
        t = k / SR; ph += TAU * (34 + 90 * math.exp(-t * 6)) / SR
        out.append(math.sin(ph) * math.exp(-t * 1.6) * 1.0 + .35 * rnd.uniform(-1, 1) * math.exp(-t * 3.2) * (1 - math.exp(-t * 60)))
    return out
def pad(freqs, dur, vol=.12):
    n = int(dur * SR); out = [0.0] * n
    for f in freqs:
        for det in (.996, 1.004):
            ph = rnd.random() * TAU
            for k in range(n):
                ph += TAU * f * det / SR; out[k] += (2 * ((ph / TAU) % 1) - 1) * vol / (len(freqs) * 2)
    out = lp(out, .05)
    return [v * min(1, k / (.5 * SR)) * min(1, (n - k) / (.4 * SR)) for k, v in enumerate(out)]

B = lambda b: b * BEAT
# ---- S1: landing blips + impact ----
for i, t in enumerate(cues['land']):
    put(dry, t, tone(pent(i + 5, 220), .09, 'square', .22, .002, 38), .55, (rnd.random() - .5) * .6)
    put(dry, t, noise_burst(.02, 300, .9, .15), .5)
put(dry, B(3), impact(), .9); put(dry, B(3), kick(1.1))
for b in range(0, 3): put(dry, B(b), tone(55, .3, 'sine', .5, .01, 9), .6)
# ---- S2: drums + step hits ----
for b in range(4, 26):
    if not (24 <= b < 26): put(dry, B(b), kick(.95))
for b in range(5, 24, 2): put(dry, B(b), clap(.6))
for b in range(6, 24):
    put(dry, B(b + .5), hat(.35)); 
for b in range(8, 12): put(dry, B(b + .25), hat(.18)); put(dry, B(b + .75), hat(.18))
steps = [0, 1, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6 + 2 / 3, 6 + 4 / 3]
for i, sb in enumerate(steps):
    put(dry, B(4 + sb), tone(pent(i, 110), .22, 'saw', .35, .002, 14), .6)
    put(dry, B(4 + sb), noise_burst(.1, 60, .9, .4), .6)
# ---- bass line from beat 8 ----
root = [55, 55, 65.41, 49]  # A1 A1 C2 G1
for b in range(8, 26):
    if 24 <= b < 26: continue
    f = root[(b // 2) % 4]
    put(dry, B(b + .5), bass(f, B(.45), .55), .7); put(dry, B(b + .75), bass(f * 2, B(.2), .3), .7)
# ---- S3a checks, S3b shares ----
for i, t in enumerate(cues['checks']):
    for k, m in enumerate((1, 1.5)):
        put(wet, t, tone(pent(i + 7, 220) * m, .35, 'sine', .35, .002, 9), .8, (i % 3 - 1) * .4)
    put(dry, t, tone(pent(i + 7, 220) * 2, .12, 'triangle', .25, .002, 25), .7)
for i, t in enumerate(cues['share']):
    put(wet, t, tone(pent(i * 1 + 9, 220), .5, 'sine', .4, .002, 6), .8)
    put(wet, t, tone(pent(i + 9, 220) * 2.01, .35, 'sine', .22, .002, 8), .8)
    put(dry, t, tone(pent(i + 2, 110), .3, 'saw', .22, .003, 12), .6)
# arp over S3b / S4 start
for s in range(0, 16):
    t = B(16) + s * BEAT / 4
    put(wet, t, tone(pent([0, 2, 4, 3, 5, 7, 6, 8][s % 8] + 5, 220), .16, 'square', .16, .002, 22), .6, (s % 2 - .5))
# ---- S4: calendar ticks, whoosh, riser ----
for i, t in enumerate(cues['cal']):
    put(dry, t, tone(pent(i // 2 + 8, 220), .06, 'square', .15, .001, 60), .6, (i % 2 - .5) * .5)
put(dry, B(20) + 1.0, noise_burst(.8, 4, .9, .6), .7)
put(dry, B(22), riser(B(4), .7), .9)
# breakdown tom hits 24..26
for i in range(8): put(dry, B(24 + i * .25), tone(120 - i * 6, .18, 'sine', .5, .003, 14), .7)
# ---- S5: impact, pad, letters, typing ----
put(dry, B(26), impact(), 1.0); put(dry, B(26), kick(1.2)); put(dry, B(26), clap(.7)); put(dry, B(26), noise_burst(1.6, 2.5, .95, .5), .8)
put(dry, B(26), bass(55, B(3), .9), .9)
put(wet, B(26) + .02, pad([220, 261.63, 329.63, 440], B(6) - .02, .5), 1.0)
for i, t in enumerate(cues['letters']):
    put(dry, t, tone(pent(i // 3 + 10, 220), .07, 'square', .15, .001, 45), .5, (rnd.random() - .5) * .8)
for i, t in enumerate(cues['type']):
    put(dry, t, noise_burst(.03, 200, .9, .3), .45); put(dry, t, tone(1800 + 40 * (i % 5), .02, 'square', .1, .001, 150), .45)
# finale sparkle + dissolve whoosh
for i in range(6): put(wet, B(29) + i * .07, tone(pent(i + 14, 220) * 2, .5, 'sine', .22, .002, 7), .8)
put(dry, B(30.6), noise_burst(.7, 5, .95, .35), .5)
# ---- reverb on the wet bus (3 combs + lowpass) ----
for ch in range(2):
    src = wet[ch]; out = [0.0] * N
    for dly, fb in ((.113, .42), (.171, .38), (.239, .33)):
        d = int((dly + ch * .007) * SR); buf = [0.0] * N; lpz = 0.0
        for i in range(N):
            x = src[i] + (buf[i - d] if i >= d else 0.0) * fb
            lpz += .35 * (x - lpz); buf[i] = lpz; out[i] += lpz * .6
    for i in range(N): dry[ch][i] += src[i] * .8 + out[i]
# ---- master: sidechain-ish duck is skipped; soft clip + fade ends, normalise ----
fade_in = int(.01 * SR); fade_out = int(.35 * SR); total = int(DUR * SR)
pk = 0.0
for ch in range(2):
    for i in range(N):
        v = math.tanh(dry[ch][i] * 1.1)
        if i < fade_in: v *= i / fade_in
        if i > total - fade_out: v *= max(0.0, (total - i) / fade_out)
        if i >= total: v = 0.0
        dry[ch][i] = v; pk = max(pk, abs(v))
g = .89 / pk
with wave.open(os.path.join(here, 'out/audio.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(b''.join(struct.pack('<hh', int(dry[0][i] * g * 32767), int(dry[1][i] * g * 32767)) for i in range(total)))
print('wrote out/audio.wav', round(total / SR, 2), 's')
