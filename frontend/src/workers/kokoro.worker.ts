import { KokoroTTS } from "kokoro-js";

let tts: KokoroTTS | null = null;

async function initModel() {
  if (!tts) {
    self.postMessage({ status: "loading", message: "Loading TTS model..." });
    try {
      tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-ONNX", {
        dtype: "q8",
        progress_callback: (progress) => {
          self.postMessage({ 
            status: "progress", 
            progress: Math.round((progress.loaded / progress.total) * 100)
          });
        }
      });
      self.postMessage({ status: "ready" });
    } catch (error) {
      self.postMessage({ 
        status: "error", 
        message: error instanceof Error ? error.message : "Failed to load TTS model" 
      });
    }
  }
}

async function generateAudio(text: string, voiceId: string) {
  if (!tts) {
    throw new Error("Model not initialized");
  }

  try {
    self.postMessage({ status: "generating", message: "Generating audio..." });
    const audio = await tts.generate(text, { voice: voiceId });
    const audioBuffer = await audio.toArrayBuffer();
    self.postMessage({ 
      status: "complete", 
      audio: audioBuffer 
    });
  } catch (error) {
    self.postMessage({ 
      status: "error", 
      message: error instanceof Error ? error.message : "Failed to generate audio" 
    });
  }
}

self.addEventListener("message", async (event) => {
  const { type, data } = event.data;

  switch (type) {
    case "init":
      await initModel();
      break;

    case "generate":
      if (!tts) {
        await initModel();
      }
      await generateAudio(data.text, data.voiceId);
      break;
  }
});
