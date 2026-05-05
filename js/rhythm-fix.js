(() => {
  let rhythm = null;
  let enabled = false;

  const $ = (id) => document.getElementById(id);

  function setStatus(message) {
    const status = $('status-text');
    if (status) status.textContent = message;
  }

  function setButtonState() {
    const button = $('rhythm-toggle');
    if (!button) return;
    button.textContent = enabled ? 'Rhythm on' : 'Rhythm off';
    button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  }

  function makePulse(ctx, master, when, strong = false) {
    const carrier = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const envelope = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    carrier.type = 'sine';
    overtone.type = 'triangle';
    carrier.frequency.setValueAtTime(strong ? 196 : 174, when);
    overtone.frequency.setValueAtTime(strong ? 392 : 348, when);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, when);

    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(strong ? 0.18 : 0.11, when + 0.018);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + 0.32);

    carrier.connect(filter);
    overtone.connect(filter);
    filter.connect(envelope);
    envelope.connect(master);

    carrier.start(when);
    overtone.start(when);
    carrier.stop(when + 0.34);
    overtone.stop(when + 0.34);
  }

  async function startRhythm() {
    if (rhythm) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      setStatus('This browser does not support generated rhythm audio.');
      enabled = false;
      setButtonState();
      return;
    }

    const ctx = new AudioContext();
    await ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);

    let beat = 0;
    const playBeat = () => {
      if (ctx.state === 'suspended') ctx.resume();
      makePulse(ctx, master, ctx.currentTime + 0.01, beat % 4 === 0);
      beat += 1;
    };

    playBeat();
    const timer = window.setInterval(playBeat, 900);
    rhythm = { ctx, timer, master };
    setStatus('Soft rhythm is on. Use your system volume if it feels too quiet.');
  }

  async function stopRhythm() {
    if (!rhythm) return;
    window.clearInterval(rhythm.timer);
    try {
      rhythm.master.gain.setTargetAtTime(0.0001, rhythm.ctx.currentTime, 0.04);
      await new Promise((resolve) => setTimeout(resolve, 90));
      await rhythm.ctx.close();
    } catch (_) {}
    rhythm = null;
    setStatus('Soft rhythm is off.');
  }

  async function toggleRhythm(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    enabled = !enabled;
    setButtonState();

    if (enabled) await startRhythm();
    else await stopRhythm();
  }

  window.addEventListener('DOMContentLoaded', () => {
    const button = $('rhythm-toggle');
    const pause = $('readalong-pause');

    setButtonState();

    if (button) {
      button.addEventListener('click', toggleRhythm, true);
    }

    if (pause) {
      pause.addEventListener('click', async () => {
        enabled = false;
        setButtonState();
        await stopRhythm();
      }, true);
    }
  });
})();
