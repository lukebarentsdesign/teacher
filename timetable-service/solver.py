"""
CP-SAT timetable solver.

Hard constraints (always satisfied in any FEASIBLE/OPTIMAL solution — this is the whole reason
to use a constraint solver instead of a genetic algorithm, see docs/spec.md section 3a):
  - Every student gets exactly one lesson slot per week.
  - The teacher is never double-booked: at most one student per (week, slot).
  - A student is only ever placed in one of their own pre-filtered candidate slots — protected
    blocks and availability windows are enforced by the caller filtering candidate_slots before
    calling this solver, not re-derived here.
  - FIXED-mode students use the identical slot every week of the term.
  - Room clashes: at most one lesson per (week, slot, room) — redundant while there's only one
    teacher (the teacher-clash constraint already implies it), kept for forward-compatibility
    with a multi-teacher/shared-room future.

Soft constraints (objective — optimized for, not guaranteed):
  - FLUID-mode fairness: for each fluid student, minimize the spread (max usage - min usage)
    across their candidate slots over the term, so no single slot dominates.
  - FLUID-mode rotation: minimize how often a fluid student repeats the exact same slot in two
    consecutive weeks, so "no single day is always missed" (spec section 3) is actively
    encouraged, not just a side effect of fairness.
"""

from ortools.sat.python import cp_model

from models import ScheduledLesson, StudentRequest, TimeSlot, TimetableRequest, TimetableResponse


def _slot_key(slot: TimeSlot) -> tuple[int, str, str]:
    return (slot.day_of_week, slot.start_time, slot.end_time)


def solve_timetable(request: TimetableRequest) -> TimetableResponse:
    model = cp_model.CpModel()
    weeks = range(request.term_weeks)

    # Build the master slot list: the union of every student's candidate slots, deduplicated.
    slot_by_key: dict[tuple[int, str, str], TimeSlot] = {}
    for student in request.students:
        for slot in student.candidate_slots:
            slot_by_key.setdefault(_slot_key(slot), slot)
    all_slots = list(slot_by_key.values())
    slot_index = {_slot_key(slot): i for i, slot in enumerate(all_slots)}

    if not all_slots:
        return TimetableResponse(status="MODEL_INVALID", lessons=[], message="No candidate slots supplied")

    # assign[(student_id, week, slot_i)] = 1 if that student has their lesson at that slot that week.
    assign: dict[tuple[str, int, int], cp_model.IntVar] = {}

    for student in request.students:
        allowed_slot_indices = [slot_index[_slot_key(slot)] for slot in student.candidate_slots]

        if student.scheduling_mode == "FIXED":
            # One choice for the whole term — the same variable is reused across every week
            # so the solver can't pick a different slot in different weeks.
            fixed_choice = {
                slot_i: model.NewBoolVar(f"fixed_{student.id}_{slot_i}") for slot_i in allowed_slot_indices
            }
            model.Add(sum(fixed_choice.values()) == 1)
            for week in weeks:
                for slot_i in allowed_slot_indices:
                    assign[(student.id, week, slot_i)] = fixed_choice[slot_i]
        else:
            for week in weeks:
                week_choice = {
                    slot_i: model.NewBoolVar(f"fluid_{student.id}_{week}_{slot_i}")
                    for slot_i in allowed_slot_indices
                }
                model.Add(sum(week_choice.values()) == 1)
                for slot_i in allowed_slot_indices:
                    assign[(student.id, week, slot_i)] = week_choice[slot_i]

    # Hard constraint: teacher can only teach one student per slot per week.
    for week in weeks:
        for slot_i in range(len(all_slots)):
            occupants = [
                assign[(student.id, week, slot_i)]
                for student in request.students
                if (student.id, week, slot_i) in assign
            ]
            if occupants:
                model.Add(sum(occupants) <= 1)

    # Hard constraint: room clash (redundant given one teacher, kept for forward-compatibility —
    # see module docstring).
    students_by_room: dict[str, list[StudentRequest]] = {}
    for student in request.students:
        if student.room_id:
            students_by_room.setdefault(student.room_id, []).append(student)

    for room_students in students_by_room.values():
        for week in weeks:
            for slot_i in range(len(all_slots)):
                occupants = [
                    assign[(student.id, week, slot_i)]
                    for student in room_students
                    if (student.id, week, slot_i) in assign
                ]
                if len(occupants) > 1:
                    model.Add(sum(occupants) <= 1)

    # --- Soft objective: fairness + rotation for FLUID students only. ---
    penalty_terms: list[cp_model.LinearExpr] = []

    for student in request.students:
        if student.scheduling_mode != "FLUID":
            continue

        allowed_slot_indices = [slot_index[_slot_key(slot)] for slot in student.candidate_slots]
        if len(allowed_slot_indices) < 2:
            continue  # nothing to balance or rotate with a single candidate slot

        # Fairness: minimize (max usage - min usage) across this student's candidate slots.
        usage_vars = []
        for slot_i in allowed_slot_indices:
            usage = model.NewIntVar(0, request.term_weeks, f"usage_{student.id}_{slot_i}")
            model.Add(usage == sum(assign[(student.id, week, slot_i)] for week in weeks))
            usage_vars.append(usage)

        max_usage = model.NewIntVar(0, request.term_weeks, f"max_usage_{student.id}")
        min_usage = model.NewIntVar(0, request.term_weeks, f"min_usage_{student.id}")
        model.AddMaxEquality(max_usage, usage_vars)
        model.AddMinEquality(min_usage, usage_vars)
        spread = model.NewIntVar(0, request.term_weeks, f"spread_{student.id}")
        model.Add(spread == max_usage - min_usage)
        penalty_terms.append(spread)

        # Rotation: penalize repeating the identical slot in two consecutive weeks.
        for week in range(request.term_weeks - 1):
            for slot_i in allowed_slot_indices:
                repeat = model.NewBoolVar(f"repeat_{student.id}_{week}_{slot_i}")
                model.AddMultiplicationEquality(
                    repeat, [assign[(student.id, week, slot_i)], assign[(student.id, week + 1, slot_i)]]
                )
                penalty_terms.append(repeat)

    if penalty_terms:
        model.Minimize(sum(penalty_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = request.max_solve_seconds
    status = solver.Solve(model)

    status_name = solver.StatusName(status)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return TimetableResponse(
            status=status_name,
            lessons=[],
            message="No feasible timetable found with the given constraints — likely too many "
            "students for the available candidate slots.",
        )

    lessons: list[ScheduledLesson] = []
    for student in request.students:
        for week in weeks:
            for slot_i, slot in enumerate(all_slots):
                key = (student.id, week, slot_i)
                if key in assign and solver.Value(assign[key]) == 1:
                    lessons.append(
                        ScheduledLesson(
                            student_id=student.id,
                            week_index=week,
                            day_of_week=slot.day_of_week,
                            start_time=slot.start_time,
                            end_time=slot.end_time,
                            room_id=student.room_id,
                        )
                    )

    return TimetableResponse(status=status_name, lessons=lessons)
