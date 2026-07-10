from models import StudentRequest, TimeSlot, TimetableRequest
from solver import solve_timetable


def _request(students):
    return TimetableRequest(teacher_id="t1", term_weeks=6, students=students)


def test_fixed_student_uses_the_same_slot_every_week():
    request = _request(
        [
            StudentRequest(
                id="s1",
                name="Alice",
                scheduling_mode="FIXED",
                lesson_duration_mins=30,
                candidate_slots=[TimeSlot(day_of_week=1, start_time="16:00", end_time="16:30")],
            )
        ]
    )
    response = solve_timetable(request)
    assert response.status == "OPTIMAL"

    slots_used = {(l.day_of_week, l.start_time) for l in response.lessons}
    assert slots_used == {(1, "16:00")}
    assert len(response.lessons) == request.term_weeks


def test_teacher_is_never_double_booked():
    request = _request(
        [
            StudentRequest(
                id="s1",
                name="Alice",
                scheduling_mode="FIXED",
                lesson_duration_mins=30,
                candidate_slots=[TimeSlot(day_of_week=1, start_time="16:00", end_time="16:30")],
            ),
            StudentRequest(
                id="s3",
                name="Carla",
                scheduling_mode="FIXED",
                lesson_duration_mins=30,
                # Deliberately overlaps with Alice's only option — the solver must resolve
                # this by using Carla's second candidate slot instead, never by clashing.
                candidate_slots=[
                    TimeSlot(day_of_week=1, start_time="16:00", end_time="16:30"),
                    TimeSlot(day_of_week=2, start_time="09:00", end_time="09:30"),
                ],
            ),
        ]
    )
    response = solve_timetable(request)
    assert response.status == "OPTIMAL"

    by_week_slot: dict[tuple[int, int, str], list[str]] = {}
    for lesson in response.lessons:
        key = (lesson.week_index, lesson.day_of_week, lesson.start_time)
        by_week_slot.setdefault(key, []).append(lesson.student_id)

    clashes = {k: v for k, v in by_week_slot.items() if len(v) > 1}
    assert not clashes, f"Teacher double-booked: {clashes}"


def test_fluid_student_rotates_across_all_candidate_slots():
    request = _request(
        [
            StudentRequest(
                id="s2",
                name="Bob",
                scheduling_mode="FLUID",
                lesson_duration_mins=30,
                candidate_slots=[
                    TimeSlot(day_of_week=1, start_time="16:30", end_time="17:00"),
                    TimeSlot(day_of_week=3, start_time="16:00", end_time="16:30"),
                    TimeSlot(day_of_week=5, start_time="16:00", end_time="16:30"),
                ],
            )
        ]
    )
    response = solve_timetable(request)
    assert response.status == "OPTIMAL"

    used_days = {lesson.day_of_week for lesson in response.lessons}
    assert used_days == {1, 3, 5}, "Fluid student should rotate across every candidate slot"


def test_fluid_usage_stays_balanced_across_weeks():
    request = _request(
        [
            StudentRequest(
                id="s2",
                name="Bob",
                scheduling_mode="FLUID",
                lesson_duration_mins=30,
                candidate_slots=[
                    TimeSlot(day_of_week=1, start_time="16:30", end_time="17:00"),
                    TimeSlot(day_of_week=3, start_time="16:00", end_time="16:30"),
                    TimeSlot(day_of_week=5, start_time="16:00", end_time="16:30"),
                ],
            )
        ]
    )
    response = solve_timetable(request)

    counts: dict[int, int] = {}
    for lesson in response.lessons:
        counts[lesson.day_of_week] = counts.get(lesson.day_of_week, 0) + 1

    assert max(counts.values()) - min(counts.values()) <= 1


def test_infeasible_when_more_fixed_students_than_slots_share_one_candidate():
    request = _request(
        [
            StudentRequest(
                id=f"s{i}",
                name=f"Student {i}",
                scheduling_mode="FIXED",
                lesson_duration_mins=30,
                candidate_slots=[TimeSlot(day_of_week=1, start_time="16:00", end_time="16:30")],
            )
            for i in range(3)
        ]
    )
    response = solve_timetable(request)
    assert response.status == "INFEASIBLE"
    assert response.lessons == []
