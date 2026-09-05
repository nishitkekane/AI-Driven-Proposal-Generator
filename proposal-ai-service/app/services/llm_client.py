import asyncio
import logging
import httpx
from typing import Any
from app.config import settings
from app.services.llm_exceptions import LLMRequestError, LLMResponseError

logger = logging.getLogger(__name__)

class LLMClient:
    def __init__(self) -> None:
        self.base_url = settings.base_url.rstrip("/")
        self.model = settings.model
        self.timeout = settings.request_timeout
        self.api_key = settings.groq_api_key

    async def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_retries: int = 4,
    ) -> str:
        if not self.api_key:
            raise LLMRequestError("No Groq API key configured in settings.")

        # Models that are known to support structured JSON mode on Groq
        _JSON_MODE_MODELS = {"llama-3.3-70b-versatile", "gemini-2.5-flash", "meta-llama/llama-4-scout-17b-16e-instruct"}

        payload: dict[str, Any] = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
        }

        # Only add response_format for models that support it;
        # openai/gpt-oss-120b on Groq does NOT support json_object mode.
        if self.model in _JSON_MODE_MODELS:
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/nishitkekane/Smart-Proposal-Generator",
            "X-Title": "Smart Proposal Generator",
        }

        attempt = 0
        while attempt < max_retries:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                    )

                    if response.status_code == 429:
                        attempt += 1
                        # Extract Retry-After header if available (typically in seconds)
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
                    return data["choices"][0]["message"]["content"]

            except httpx.HTTPStatusError as ex:
                if ex.response.status_code == 429:
                    # Already handled above, but just in case
                    continue
                logger.error("HTTP error: %s", ex)
                raise LLMRequestError(f"HTTP error: {ex}") from ex
            except httpx.HTTPError as ex:
                attempt += 1
                delay = 2.0 ** attempt
                logger.warning("Connection error: %s. Retrying in %.2fs...", ex, delay)
                await asyncio.sleep(delay)

        raise LLMRequestError(f"Failed to communicate with LLM after {max_retries} retries due to rate limiting or networking issues.")