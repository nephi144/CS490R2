// src/utils/pitchUtils.js

export function noteToMidi(note) {
  const noteMap = {
    "C": 0,
    "C#": 1,
    "Db": 1,
    "D": 2,
    "D#": 3,
    "Eb": 3,
    "E": 4,
    "F": 5,
    "F#": 6,
    "Gb": 6,
    "G": 7,
    "G#": 8,
    "Ab": 8,
    "A": 9,
    "A#": 10,
    "Bb": 10,
    "B": 11,
  };

  const pitch = note.slice(0, -1);
  const octave = parseInt(note.slice(-1), 10);

  return (octave + 1) * 12 + noteMap[pitch];
}

export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function noteToFreq(note) {
  return midiToFreq(noteToMidi(note));
}