# Local repair chat

The standard advisor runs bundled JavaScript and makes no model requests. Visitors can opt into Qwen2.5-1.5B-Instruct-q4f16_1-MLC through WebLLM 0.2.79. Budget approximately 1 GB of download data; the runtime configuration lists approximately 1.63 GB of GPU memory use. The interface recommends at least 2 GB available. Browser support and memory limits vary.

Activation downloads executable runtime code from esm.run and model/runtime assets from the hosting locations configured by WebLLM (including Hugging Face and GitHub). Hosts receive ordinary asset requests, including network metadata. Customer messages are passed to browser inference, never a cloud chat endpoint. Browser storage can cache assets but may evict them.

The deterministic assessment runs first. Active level-3 hazards skip model inference; routine model responses are labeled as explanations of possible causes. Generated explanations can be wrong and are not diagnoses. Deterministic urgency guidance remains visible separately.

Source references: https://github.com/mlc-ai/web-llm and its supported-model configuration. The pinned adapter refuses to substitute a larger model if the configured ID is absent.

Verify with Node's test runner, build with `node scripts/build.mjs --origin https://napaautorepairnj.com/`, and run `scripts/verify-helper.mjs` with Playwright. Browser UI tests replace the GPU adapter; a real model-loading smoke test is an additional check, not established by those tests.
