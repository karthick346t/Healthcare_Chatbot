from fastapi import FastAPI, Body, Header, HTTPException
from typing import Annotated
from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer

app = FastAPI()
tokenizer = M2M100Tokenizer.from_pretrained("facebook/m2m100_418M")
model = M2M100ForConditionalGeneration.from_pretrained("facebook/m2m100_418M")

import os
TRANSLATION_API_KEY = os.environ.get("TRANSLATION_API_KEY", "default-dev-key")

@app.post("/translate")
async def translate(
    payload: dict = Body(...),
    translation_api_key: Annotated[str | None, Header()] = None
):
    if translation_api_key != TRANSLATION_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid API Key")

    text = payload["text"]
    src = payload["source_lang"]
    tgt = payload["target_lang"]
    tokenizer.src_lang = src
    encoded = tokenizer(text, return_tensors="pt")
    generated = model.generate(**encoded, forced_bos_token_id=tokenizer.get_lang_id(tgt))
    translated = tokenizer.batch_decode(generated, skip_special_tokens=True)[0]
    return {"translation": translated}
