const synth = typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis : null;

function speak(text) {
  if (!synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85;
  u.pitch = 1.1;
  synth.speak(u);
}

export function speakLetter(character) {
  speak(character);
}

export function speakWord(word) {
  speak(word);
}

export function speakLetterAndWord(character, word) {
  speak(`${character} is for ${word}`);
}
