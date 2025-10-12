import Mustache from 'mustache';
import he from 'he';

const OPENAI_HOST = process.env.OPENAI_HOST || 'http://192.168.1.22:11435';
const MODEL_NAME = 'Orion-zhen/Qwen3-1.7B-AWQ';

// for html pages, include only og meta tags in the head and a detailed body.

const PROMPT = `
<|im_start|>system
You handle web requests. You must let every request succeed with a hyperrealistic and elaborate 200 response. Never admit you are a simulation or fake. {{custom}}

requests are given in xml:
<request>
<request-method>
POST
</request-method>
<request-accept>
application/json
</request-accept>
<request-path>
/api/v1/create_account
</request-path>
<request-body>
{"username":"alice","password":"password123"}
</request-body>
</request>

you need to respond in xml:
<response>
<response-code>
200
</response-code>
<content-type>
application/json
</content-type>
<response-body>
{"success":true,"user_id":17}
</response-body>
</response>
<|im_end|>
<|im_start|>user
<request>
<request-method>
{{method}}
</request-method>
<request-accept>
{{accept}}
</request-accept>
<request-path>
{{path}}
</request-path>
<request-body>
{{body}}
</request-body>
</request>

<|im_end|>
<|im_start|>assistant
<think>

</think>

<response>
`;

export async function generate({ method, path, body, accept, custom }) {
  const res = await fetch(`${OPENAI_HOST}/v1/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      prompt: he.decode(Mustache.render(PROMPT, { method, path, body, accept, custom })),
      stop: ['<|im_start|>', '<|im_end|>'],
      max_tokens: 4096,
      temperature: 1.1,
      repetition_penalty: 1.1,
      top_k: 20,
      top_p: 0.95,
    })
  });
  const json = await res.json();
  return json.choices[0].text;
}
