/**
 * Cloudflare Worker for AI Alimjang Generator
 * 
 * This worker handles:
 * 1. Serving static assets (if configured for that)
 * 2. Proxying requests to OpenAI API using a secret API key
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle the AI generation endpoint
    if (url.pathname === '/generateAlimjang' && request.method === 'POST') {
      return handleGenerateAlimjang(request, env);
    }

    // Default behavior: let Cloudflare handle static assets (or return 404 if not configured)
    // If you are using Cloudflare Pages or a separate static site, this part might not be needed.
    return fetch(request);
  }
};

async function handleGenerateAlimjang(request, env) {
  const { childName, keywords, referenceText, images } = await request.json();

  if (!env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "OpenAI API Key is not configured on the server." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const imageContents = images.map(imgData => ({
      type: "image_url",
      image_url: { url: imgData }
    }));

    const prompt = `
      당신은 따뜻하고 세심한 어린이집 선생님입니다. 
      다음 정보를 바탕으로 학부모님께 보낼 알림장 문장을 작성해주세요.

      1. 아이 이름: ${childName}
      2. 상황 키워드: ${keywords}
      3. 참조할 기존 문장/말투: ${referenceText}

      [지침]
      - 첨부된 사진(있는 경우)의 분위기와 아이의 표정을 설명에 녹여주세요.
      - 키워드를 자연스럽게 문장으로 풀어주세요.
      - 말투는 정중하면서도 다정하게, 학부모님이 안심하고 기분 좋아지도록 작성해주세요.
      - 너무 길지 않게, 하지만 진정성이 느껴지도록 작성해주세요.
      - '참조할 기존 문장'이 있다면 그 말투나 형식을 최대한 반영해주세요.
      - 한국어로 답변해주세요.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              ...imageContents
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return new Response(JSON.stringify({ text: data.choices[0].message.content }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
