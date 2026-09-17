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


class VetVisitPrepRequest(BaseModel):
    pet: PetContext
    reason_for_visit: str | None = Field(default=None, max_length=2000)
    recent_changes: str | None = Field(default=None, max_length=4000)
    sources: list[AskSource] = Field(default_factory=list, max_length=200)


class VetVisitPrepResponse(BaseModel):
    overview: str
    priority_concerns: list[str]
    current_medications: list[str]
    recent_history: list[str]
    follow_up_items: list[str]
    questions_for_vet: list[str]
    missing_information: list[str]
    source_ids: list[str]


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

VET_VISIT_PREP_PROMPT = """You create a concise pre-visit briefing for a pet owner to review with a veterinarian.

Rules:
1. Use supplied confirmed records as the only source of pet-specific medical facts.
2. The owner's reason for visit and recent changes are owner-reported, not confirmed diagnoses.
3. Never diagnose, prescribe, recommend a dose change, or tell the owner to stop medication.
4. Preserve uncertainty exactly. Suspected, possible, rule-out, and confirmed are not interchangeable.
5. Do not invent dates, test results, medications, doses, symptoms, or veterinary instructions.
6. Keep lists short, specific, and useful during an appointment.
7. Questions for the vet may clarify recorded findings, follow-up, monitoring, or owner-reported changes, but must not assume an unrecorded diagnosis.
8. Put important missing details in missing_information, such as onset, frequency, appetite, drinking, urination, stool, or medication response, only when relevant to the stated visit reason.
9. source_ids must contain only IDs supplied in sources.
10. The overview must clearly distinguish confirmed records from owner-reported information.
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


@router.post("/api/v1/vet-visit-prep", response_model=VetVisitPrepResponse)
def prepare_vet_visit(payload: VetVisitPrepRequest):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key is not configured.")

    context = {
        "pet": payload.pet.model_dump(),
        "owner_reported": {
            "reason_for_visit": payload.reason_for_visit,
            "recent_changes": payload.recent_changes,
        },
        "confirmed_sources": [source.model_dump() for source in payload.sources],
    }

    client = OpenAI(api_key=api_key)
    try:
        response = client.responses.parse(
            model=MODEL,
            input=[
                {"role": "system", "content": VET_VISIT_PREP_PROMPT},
                {"role": "user", "content": json.dumps(context, ensure_ascii=False)},
            ],
            text_format=VetVisitPrepResponse,
        )
        prep = response.output_parsed
        if prep is None:
            raise ValueError("The model did not return a structured briefing.")

        allowed_ids = {source.id for source in payload.sources}
        prep.source_ids = [source_id for source_id in prep.source_ids if source_id in allowed_ids]
        return prep
    except Exception as exc:
        print(f"Vet Visit Prep error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Pawso could not prepare the vet visit right now.",
        )
