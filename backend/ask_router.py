import json
import os
from typing import Literal

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from openai import OpenAI
from pydantic import BaseModel, Field

load_dotenv()

router = APIRouter()

MODEL = "gpt-5.6-luna"


class PetContext(BaseModel):
    id: str
    name: str
    species: str | None = None
    breed: str | None = None
    conditions: str | None = None
    allergies: str | None = None


class AskSource(BaseModel):
    id: str
    label: str
    source_type: str
    date: str | None = None
    text: str


class AskRequest(BaseModel):
    pet: PetContext
    question: str = Field(min_length=1, max_length=1000)
    sources: list[AskSource] = Field(default_factory=list, max_length=200)


class AskResponse(BaseModel):
    answer: str
    source_ids: list[str]
    answer_type: Literal[
        "record_summary",
        "record_lookup",
        "general_guidance",
        "insufficient_information",
    ]
    safety_category: Literal["normal", "medical_caution", "urgent"]


URGENT_TERMS = (
    "difficulty breathing",
    "trouble breathing",
    "can't breathe",
    "cannot breathe",
    "collapsed",
    "collapse",
    "seizure",
    "seizing",
    "unable to urinate",
    "can't urinate",
    "cannot urinate",
    "severe bleeding",
    "poison",
    "poisoning",
    "toxin",
)


SYSTEM_PROMPT = """You are Pawso, an AI pet-care record assistant.

Your task is to answer questions using the pet context and confirmed records supplied in the request.

Rules:
1. Treat supplied records as the only source of pet-specific facts.
2. Never invent dates, diagnoses, medications, doses, test results, follow-ups, or veterinary instructions.
3. Preserve uncertainty exactly. Suspected, possible, rule-out, and confirmed are not interchangeable.
4. Do not diagnose, prescribe, recommend changing a medication dose, tell the owner to stop medication, or replace veterinary care.
5. You may summarize confirmed records, identify what a supplied veterinary record says, list recorded medications, and explain what information is missing.
6. For each pet-specific factual claim, use only source IDs that actually support it.
7. source_ids must contain only IDs present in the supplied source list.
8. If the supplied records do not support the answer, say so clearly and use answer_type="insufficient_information".
9. General educational guidance must be clearly described as general, not as a fact about this pet.
10. Be concise, calm, and non-alarmist.
11. If the question describes an obvious emergency, safety_category must be "urgent" and the answer should advise prompt veterinary/emergency evaluation without trying to diagnose.
"""


@router.post("/api/v1/ask", response_model=AskResponse)
def ask_pawso(payload: AskRequest):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key is not configured.")

    question_lower = payload.question.lower()
    urgent_match = any(term in question_lower for term in URGENT_TERMS)

    context = {
        "pet": payload.pet.model_dump(),
        "sources": [source.model_dump() for source in payload.sources],
        "question": payload.question,
    }

    client = OpenAI(api_key=api_key)

    try:
        response = client.responses.parse(
            model=MODEL,
            input=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": json.dumps(context, ensure_ascii=False),
                },
            ],
            text_format=AskResponse,
        )

        answer = response.output_parsed
        if answer is None:
            raise ValueError("The model did not return a structured answer.")

        allowed_ids = {source.id for source in payload.sources}
        answer.source_ids = [
            source_id for source_id in answer.source_ids if source_id in allowed_ids
        ]

        if urgent_match:
            answer.safety_category = "urgent"

        return answer
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Ask Pawso error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Pawso could not answer from the pet record right now.",
        )
