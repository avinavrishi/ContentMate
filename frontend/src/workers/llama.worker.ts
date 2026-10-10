import {
  AutoTokenizer,
  AutoModelForCausalLM,
  TextStreamer,
  InterruptableStoppingCriteria,
} from "@huggingface/transformers";

/**
 * Helper function to perform feature detection for WebGPU
 */
async function check() {
  console.log('Checking WebGPU support...');
  try {
    if (!navigator.gpu) {
      console.error('WebGPU not available in navigator');
      throw new Error("WebGPU is not supported in this browser");
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      console.error('No WebGPU adapter found');
      throw new Error("WebGPU is not supported (no adapter found)");
    }
    console.log('WebGPU check passed');
  } catch (e) {
    console.error('WebGPU check failed:', e);
    self.postMessage({
      status: "error",
      data: e instanceof Error ? e.message : "WebGPU not supported",
    });
    throw e; // Re-throw to prevent further execution
  }
}

/**
 * This class uses the Singleton pattern to enable lazy-loading of the pipeline
 */
class TextGenerationPipeline {
  static model_id = "onnx-community/Llama-3.2-3B-Instruct-onnx-web";
  static tokenizer: any;
  static model: any;

  static async getInstance(progress_callback: ((x: any) => void) | undefined = undefined) {
    this.tokenizer ??= AutoTokenizer.from_pretrained(this.model_id, {
      progress_callback,
    });

    this.model ??= AutoModelForCausalLM.from_pretrained(this.model_id, {
      dtype: "q4f16",
      device: "webgpu",
      progress_callback,
    });

    return Promise.all([this.tokenizer, this.model]);
  }
}

const stopping_criteria = new InterruptableStoppingCriteria();
let past_key_values_cache: any = null;

async function generate(messages: any[]) {
  // Retrieve the text-generation pipeline.
  const [tokenizer, model] = await TextGenerationPipeline.getInstance();

  const inputs = tokenizer.apply_chat_template(messages, {
    add_generation_prompt: true,
    return_dict: true,
  });

  let startTime: number | undefined;
  let numTokens = 0;
  let tps: number | undefined;

  const token_callback_function = (tokens: bigint[]) => {
    startTime ??= performance.now();

    if (numTokens++ > 0) {
      tps = (numTokens / (performance.now() - startTime)) * 1000;
    }
  };

  const callback_function = (output: string) => {
    self.postMessage({
      status: "update",
      output,
      tps,
      numTokens,
    });
  };

  const streamer = new TextStreamer(tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function,
    token_callback_function,
  });

  // Tell the main thread we are starting
  self.postMessage({ status: "start" });

  const { past_key_values, sequences } = await model.generate({
    ...inputs,
    max_new_tokens: 2048,
    streamer,
    stopping_criteria,
    return_dict_in_generate: true,
  });

  past_key_values_cache = past_key_values;

  const decoded = tokenizer.batch_decode(sequences, {
    skip_special_tokens: true,
  });

  // Send the output back to the main thread
  self.postMessage({
    status: "complete",
    output: decoded,
  });
}

async function load() {
  console.log('Starting Llama model load...');
  self.postMessage({
    status: "loading",
    data: "Loading Llama model..."
  });

  try {
    // First check WebGPU support
    await check();

    console.log('Loading Llama pipeline...');
    // Load the pipeline and save it for future use.
    const [tokenizer, model] = await TextGenerationPipeline.getInstance((progressData: any) => {
      console.log('Load progress:', progressData);
      // Format progress data properly
      if (progressData.status === 'progress') {
        self.postMessage({
          status: "progress",
          data: {
            file: progressData.file || 'model',
            progress: Math.round((progressData.loaded / progressData.total) * 100)
          }
        });
      } else {
        self.postMessage(progressData);
      }
    });

    console.log('Pipeline loaded, warming up model...');
    self.postMessage({
      status: "loading",
      data: "Compiling shaders and warming up model..."
    });

    // Run model with dummy input to compile shaders
    const inputs = tokenizer("a");
    await model.generate({ ...inputs, max_new_tokens: 1 });
    console.log('Model ready!');
    self.postMessage({ status: "ready" });
  } catch (error) {
    console.error('Error in Llama load:', error);
    self.postMessage({
      status: "error",
      data: error instanceof Error ? error.message : "Failed to load model"
    });
  }
}

// Listen for messages from the main thread
self.addEventListener("message", async (e) => {
  const { type, data } = e.data;

  switch (type) {
    case "check":
      check();
      break;

    case "load":
      load();
      break;

    case "generate":
      stopping_criteria.reset();
      generate(data);
      break;

    case "interrupt":
      stopping_criteria.interrupt();
      break;

    case "reset":
      past_key_values_cache = null;
      stopping_criteria.reset();
      break;
  }
}); 