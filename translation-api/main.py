import os
import asyncio
from fastapi import FastAPI, Body, Header, HTTPException
from typing import Annotated
from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer
import torch

app = FastAPI()

print("⏳ Loading M2M100 model... (this may take 30-60s on first startup)")
tokenizer = M2M100Tokenizer.from_pretrained("facebook/m2m100_418M")
model = M2M100ForConditionalGeneration.from_pretrained(
    "facebook/m2m100_418M",
    torch_dtype=torch.float16,
    device_map="auto"
)
print("✅ M2M100 model loaded successfully!")

TRANSLATION_API_KEY = os.environ.get("TRANSLATION_API_KEY", "default-dev-key")

# Limit concurrent translations to prevent OOM
semaphore = asyncio.Semaphore(2)

@app.post("/translate")
async def translate(
    payload: dict = Body(...),
    translation_api_key: Annotated[str | None, Header()] = None
):
    if translation_api_key != TRANSLATION_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid API Key")

    text = payload.get("text", "")
    src = payload.get("source_lang", "en")
    tgt = payload.get("target_lang", "en")

    if not text or src == tgt:
        return {"translation": text}

    async with semaphore:
        tokenizer.src_lang = src
        encoded = tokenizer(text, return_tensors="pt").to(model.device)
        generated = model.generate(**encoded, forced_bos_token_id=tokenizer.get_lang_id(tgt))
        translated = tokenizer.batch_decode(generated, skip_special_tokens=True)[0]
        return {"translation": translated}
