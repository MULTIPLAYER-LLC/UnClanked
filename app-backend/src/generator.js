import Mustache from 'mustache';
import he from 'he';
import { Ollama } from 'ollama';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://192.168.1.22:11434';
const ollama = new Ollama({ host: OLLAMA_HOST }); // quiet

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
  const res = await ollama.generate({
    model: 'qwen3:1.7b',
    prompt: he.decode(Mustache.render(PROMPT, { method, path, body, accept, custom })),
    raw: true,
    stream: false,
    keep_alive: "12h",
    options: { temperature: 1, num_ctx: 4_096, num_predict: 2_048 }
  });
  return res;
}
