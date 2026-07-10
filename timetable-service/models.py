from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class SchedulingMode(str, Enum):
    FIXED = "FIXED"
    FLUID = "FLUID"


class TimeSlot(BaseModel):
    day_of_week: int = Field(ge=0, le=6, description="0=Sunday .. 6=Saturday")
    start_time: str = Field(description="HH:MM, 24h")
    end_time: str = Field(description="HH:MM, 24h")


class ProtectedBlock(TimeSlot):
    label: Optional[str] = None


class RoomConstraint(BaseModel):
    id: str
    name: str


class StudentRequest(BaseModel):
    id: str
    name: str
    scheduling_mode: SchedulingMode
    lesson_duration_mins: int = Field(gt=0)
    # Candidate slots this student's lesson could occupy — the caller (the Next.js app) is
    # expected to have already filtered these against protected blocks and teacher availability,
    # matching the filterAvailableSlots convention in src/lib/scheduling.ts on the TS side. The
    # solver doesn't re-derive candidates from raw availability; it only chooses among what it's given.
    candidate_slots: list[TimeSlot]
    room_id: Optional[str] = None


class TimetableRequest(BaseModel):
    teacher_id: str
    term_weeks: int = Field(gt=0, le=52, default=12)
    availability: list[TimeSlot] = []
    protected_blocks: list[ProtectedBlock] = []
    rooms: list[RoomConstraint] = []
    students: list[StudentRequest]
    max_solve_seconds: float = Field(gt=0, le=60, default=10.0)


class ScheduledLesson(BaseModel):
    student_id: str
    week_index: int
    day_of_week: int
    start_time: str
    end_time: str
    room_id: Optional[str] = None


class TimetableResponse(BaseModel):
    status: str  # "OPTIMAL" | "FEASIBLE" | "INFEASIBLE" | "MODEL_INVALID" | "UNKNOWN"
    lessons: list[ScheduledLesson]
    message: Optional[str] = None
