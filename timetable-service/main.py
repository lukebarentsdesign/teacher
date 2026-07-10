"""
Timetable generation microservice — Google OR-Tools CP-SAT, kept as a separate Python service
rather than embedded in the Next.js/TypeScript app (see docs/spec.md section 3a for why).

Run locally:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8001

Not yet wired into the main Next.js app (src/lib/timetable.ts still does its own simpler,
one-student-at-a-time conflict checking) — this service jointly solves for every student at
once, which is the actual upgrade this brings once integrated.
"""

from fastapi import FastAPI, HTTPException

from models import TimetableRequest, TimetableResponse
from solver import solve_timetable

app = FastAPI(title="Learnio Timetable Service", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/generate-timetable", response_model=TimetableResponse)
def generate_timetable(request: TimetableRequest) -> TimetableResponse:
    if not request.students:
        raise HTTPException(status_code=400, detail="At least one student is required")

    return solve_timetable(request)
