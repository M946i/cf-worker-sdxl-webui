export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/generate-image" && request.method === 'POST') {
      return await handleGenerateImageRequest(request, env);
    }

    return new Response(renderHtml(), {
      headers: { 'Content-Type': 'text/html' },
    });
  },
};

// 处理图像生成请求
async function handleGenerateImageRequest(request, env) {
  const body = await request.json();

  if (!body.prompt || body.prompt.trim().length === 0) {
    return new Response('Prompt is required', { status: 400 });
  }

  const inputs = {
    prompt: body.prompt,
    negative_prompt: body.negative_prompt || undefined,
    height: body.height || undefined,
    width: body.width || undefined,
    num_steps: body.num_steps || undefined,
    guidance: body.guidance || undefined,
    strength: body.strength || undefined,
    seed: body.seed || undefined,
  };

  const response = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', inputs);

  return new Response(response, {
    headers: {
      'Content-Type': 'image/png',
    },
  });
}

// 返回美化后的 HTML 页面
function renderHtml() {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stable Diffusion Image Generator</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f0f0f0;
        color: #333;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }

      .container {
        background-color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        width: 500px;
      }

      h1 {
        text-align: center;
        margin-bottom: 20px;
      }

      label {
        display: block;
        margin-top: 10px;
        font-weight: bold;
      }

      input, textarea {
        width: 95%;
        padding: 10px;
        margin-top: 5px;
        border: 1px solid #ddd;
        border-radius: 5px;
        margin-bottom: 10px;
      }

      button {
        width: 100%;
        padding: 10px;
        background-color: #007BFF;
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        cursor: pointer;
      }

      button:hover {
        background-color: #0056b3;
      }

      .optional-label {
        font-size: 0.9em;
        color: gray;
      }

      #loading {
        display: none;
        margin-top: 20px;
        text-align: center;
        font-size: 16px;
        color: #007BFF;
      }

      #generatedImage {
        margin-top: 20px;
        max-width: 100%;
        border-radius: 10px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>AI Image Generator</h1>

      <form id="imageForm">
        <label for="prompt">Image Description (Prompt):</label>
        <textarea id="prompt" name="prompt" rows="3" required placeholder="Enter your prompt here..."></textarea>

        <label for="negative_prompt">Negative Prompt <span class="optional-label">(optional)</span>:</label>
        <input type="text" id="negative_prompt" name="negative_prompt" placeholder="Elements to avoid">

        <label for="height">Height <span class="optional-label">(optional, 256-2048px)</span>:</label>
        <input type="number" id="height" name="height" placeholder="1024" min="256" max="2048">

        <label for="width">Width <span class="optional-label">(optional, 256-2048px)</span>:</label>
        <input type="number" id="width" name="width" placeholder="1024" min="256" max="2048">

        <label for="num_steps">Number of Steps <span class="optional-label">(optional, max 20)</span>:</label>
        <input type="number" id="num_steps" name="num_steps" placeholder="20" min="1" max="20">

        <label for="guidance">Guidance Scale <span class="optional-label">(optional, default 7.5)</span>:</label>
        <input type="number" id="guidance" name="guidance" step="0.1" placeholder="7.5" min="0" max="20">

        <label for="strength">Strength <span class="optional-label">(optional, 0-1)</span>:</label>
        <input type="number" id="strength" name="strength" step="0.1" placeholder="1" min="0" max="1">

        <label for="seed">Seed <span class="optional-label">(optional)</span>:</label>
        <input type="number" id="seed" name="seed" placeholder="Random">

        <button type="submit">Generate Image</button>
      </form>

      <p id="loading">Generating your image, please wait...</p>
      <img id="generatedImage" src="" alt="Generated Image" style="display:none;"/>

    </div>

    <script>
      const form = document.getElementById('imageForm');
      const loadingText = document.getElementById('loading');
      const generatedImage = document.getElementById('generatedImage');

      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // 获取用户输入的内容
        const prompt = document.getElementById('prompt').value;
        const negative_prompt = document.getElementById('negative_prompt').value || null;
        const height = document.getElementById('height').value || null;
        const width = document.getElementById('width').value || null;
        const num_steps = document.getElementById('num_steps').value || null;
        const guidance = document.getElementById('guidance').value || null;
        const strength = document.getElementById('strength').value || null;
        const seed = document.getElementById('seed').value || null;

        // 显示加载提示
        loadingText.style.display = 'block';
        generatedImage.style.display = 'none';

        try {
          const response = await fetch('/generate-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt,
              negative_prompt,
              height: height ? parseInt(height, 10) : null,
              width: width ? parseInt(width, 10) : null,
              num_steps: num_steps ? parseInt(num_steps, 10) : null,
              guidance: guidance ? parseFloat(guidance) : null,
              strength: strength ? parseFloat(strength) : null,
              seed: seed ? parseInt(seed, 10) : null,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate image');
          }

          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);

          generatedImage.src = imageUrl;
          generatedImage.style.display = 'block';
        } catch (error) {
          alert(error.message);
        } finally {
          // 隐藏加载提示
          loadingText.style.display = 'none';
        }
      });
    </script>
  </body>
  </html>
  `;
}