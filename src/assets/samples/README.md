# Sample Assets

Place the following WAV files in this directory before building:

| File | Description |
|------|-------------|
| `kick.wav` | Kick drum / bass drum sample |
| `snare.wav` | Snare drum / clap sample |
| `hat.wav` | Hi-hat / cymbal sample |
| `perc.wav` | Generic percussion sample |

## Requirements
- Format: WAV (PCM 16-bit, 44.1 kHz recommended)
- Duration: short one-shot samples (< 2 seconds each)
- These files are referenced via `require()` in `src/audio/AudioPlaybackService.ts`

## Placeholder behaviour
If the WAV files are absent, `AudioPlaybackService.loadSamples()` will log
a warning per missing sample and playback will be silent but otherwise
functional (no crash).
