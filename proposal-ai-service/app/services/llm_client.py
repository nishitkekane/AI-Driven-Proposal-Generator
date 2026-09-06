import asyncio
import logging
import httpx
from typing import Any
from app.config import settings
from app.services.llm_exceptions import LLMRequestError, LLMResponseError

logger = logging.getLogger(__name__)

FALLBACK_MODEL = "llama-3.3-70b-versatile"
_JSON_MODE_MODELS = {"llama-3.3-70b-versatile", "gemini-2.5-flash", "meta-llama/llama-4-scout-17b-16e-instruct"}

class LLMClient:
    def __init__(self) -> None:
        pass

    @property
    def api_key(self) -> str:
        return settings.groq_api_key

    @property
    def base_url(self) -> str:
        # Strip trailing slashes and normalize endpoint path
        url = settings.base_url.strip().rstrip("/")
        if url.endswith("/chat/completions"):
            url = url[:-len("/chat/completions")]
        return url

    @property
    def model(self) -> str:
        return settings.model

    @property
    def timeout(self) -> int:
        return settings.request_timeout

    async def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_retries: int = 4,
    ) -> str:
        api_key = self.api_key
        if not api_key:
            raise LLMRequestError("No Groq API key configured in settings.")

        current_model = self.model
        # Sanitize known non-Groq model names
        if not current_model or current_model.startswith("openai/") or current_model == "openai/gpt-oss-120b":
            logger.info("Overriding model '%s' with default Groq model '%s'", current_model, FALLBACK_MODEL)
            current_model = FALLBACK_MODEL

        payload: dict[str, Any] = {
            "model": current_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
        }

        if current_model in _JSON_MODE_MODELS:
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/nishitkekane/Smart-Proposal-Generator",
            "X-Title": "Smart Proposal Generator",
        }

        endpoint = f"{self.base_url}/chat/completions"
        attempt = 0
        fallback_attempted = False

        # Open a single client instance for all retry attempts
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            while attempt < max_retries:
                try:
                    response = await client.post(
                        endpoint,
                        headers=headers,
                        json=payload,
                    )

                    if response.status_code == 429:
                        attempt += 1
                        retry_after_str = response.headers.get("retry-after")
                        delay = float(retry_after_str) if retry_after_str else (2.0 ** attempt)
                        logger.warning(
                            "Rate limit (429) hit. Attempt %d/%d. Waiting %.2fs...",
                            attempt, max_retries, delay
                        )
                        await asyncio.sleep(delay)
                        continue

                    response.raise_for_status()
                    data = response.json()
                    
                    try:
                        return data["choices"][0]["message"]["content"]
                    except (KeyError, IndexError, TypeError) as ex:
                        raise LLMResponseError(f"Unexpected API response structure: {data}") from ex

                except httpx.HTTPStatusError as ex:
                    if ex.response.status_code == 429:
                        attempt += 1
                        await asyncio.sleep(2.0 ** attempt)
                        continue

                    # Fallback on 404 (Model Not Found) if we haven't tried the fallback model yet
                    if ex.response.status_code == 404 and not fallback_attempted and payload["model"] != FALLBACK_MODEL:
                        logger.warning(
                            "Groq returned 404 for model '%s'. Retrying with fallback model '%s'...",
                            payload["model"], FALLBACK_MODEL
                        )
                        payload["model"] = FALLBACK_MODEL
                        if FALLBACK_MODEL in _JSON_MODE_MODELS:
                            payload["response_format"] = {"type": "json_object"}
                        fallback_attempted = True
                        attempt += 1
                        await asyncio.sleep(1.0)
                        continue

                    logger.error("HTTP error from LLM provider: %s — Response: %s", ex, ex.response.text if ex.response else "No body")
                    raise LLMRequestError(f"HTTP error: {ex}") from ex

                except httpx.HTTPError as ex:
                    attempt += 1
                    delay = 2.0 ** attempt
                    logger.warning("Connection error: %s. Retrying in %.2fs...", ex, delay)
                    await asyncio.sleep(delay)

        raise LLMRequestError(f"Failed to communicate with LLM after {max_retries} retries due to rate limiting or networking issues.")