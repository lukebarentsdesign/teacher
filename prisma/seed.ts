import {
  BillingModel,
  CancellationAction,
  ChargeUnit,
  ContactPref,
  GroupBookingStatus,
  InvoicingTarget,
  LedgerOperation,
  LedgerReason,
  LessonStatus,
  LocationType,
  PaymentStatus,
  PlatformSubscriptionStatus,
  PrismaClient,
  Prisma,
  PrivateTuitionRequestStatus,
  PromoDiscountType,
  ResourceType,
  SchedulingMode,
  StudentCurriculumSectionStatus,
  StudentCurriculumStatus,
  StudentSource,
  StudentStatus,
  TaxHandling,
  TeacherArchetype,
  TeacherRole,
  VenueFeeBillingMode,
  VenueFeeType,
  Visibility,
  WaitlistStatus,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function atTime(date: Date, hours: number, minutes = 0) {
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function dateOnly(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

async function purgeTeacherData(teacherId: string) {
  const locationIds = (
    await prisma.teacherLocationLink.findMany({
      where: { teacherId },
      select: { locationId: true },
    })
  ).map((link) => link.locationId);

  await prisma.assignment.deleteMany({ where: { teacherId } });
  await prisma.resource.deleteMany({ where: { teacherId } });
  await prisma.maintenanceReminder.deleteMany({ where: { teacherId } });
  await prisma.coverAssignment.deleteMany({
    where: {
      OR: [{ originalInstructorId: teacherId }, { coveringInstructorId: teacherId }],
    },
  });
  await prisma.unavailability.deleteMany({ where: { teacherId } });
  await prisma.incidentLog.deleteMany({ where: { teacherId } });
  await prisma.expense.deleteMany({ where: { teacherId } });
  await prisma.mileageLog.deleteMany({ where: { teacherId } });
  await prisma.locationTravelTime.deleteMany({ where: { teacherId } });
  await prisma.timetableWaitlist.deleteMany({ where: { teacherId } });
  await prisma.privateTuitionRequest.deleteMany({ where: { teacherId } });
  await prisma.lesson.deleteMany({ where: { teacherId } });
  await prisma.groupClass.deleteMany({ where: { teacherId } });
  await prisma.assessment.deleteMany({ where: { teacherId } });
  await prisma.package.deleteMany({ where: { teacherId } });
  await prisma.student.deleteMany({ where: { teacherId } });
  await prisma.payer.deleteMany({ where: { teacherId } });
  await prisma.addOn.deleteMany({ where: { teacherId } });
  await prisma.course.deleteMany({ where: { teacherId } });
  await prisma.courseItem.deleteMany({ where: { teacherId } });
  await prisma.curriculumTemplate.deleteMany({ where: { teacherId } });
  await prisma.sessionPlanTemplate.deleteMany({ where: { teacherId } });
  await prisma.instructorCertification.deleteMany({ where: { teacherId } });
  await prisma.cancellationPolicy.deleteMany({ where: { teacherId } });
  await prisma.giftCard.deleteMany({ where: { teacherId } });
  await prisma.promoCode.deleteMany({ where: { teacherId } });
  await prisma.embedConfig.deleteMany({ where: { teacherId } });
  await prisma.contract.deleteMany({ where: { teacherId } });
  await prisma.lessonType.deleteMany({ where: { teacherId } });
  await prisma.subject.deleteMany({ where: { teacherId } });
  await prisma.outOfScopeSignup.deleteMany({ where: { teacherId } });
  await prisma.teacherLocationLink.deleteMany({ where: { teacherId } });

  if (locationIds.length > 0) {
    await prisma.loanableItem.deleteMany({
      where: { locationId: { in: locationIds } },
    });
    await prisma.teachingLocation.deleteMany({
      where: { id: { in: locationIds } },
    });
  }

  await prisma.loanableItem.deleteMany({ where: { teacherId } });
  await prisma.termCalendar.deleteMany({ where: { teacherId } });
}

async function main() {
  const email = process.env.SEED_TEACHER_EMAIL ?? "teacher@example.com";
  const password = process.env.SEED_TEACHER_PASSWORD ?? "changeme123";
  const name = process.env.SEED_TEACHER_NAME ?? "Teacher";

  const passwordHash = await bcrypt.hash(password, 10);

  const teacherUserId = "seed-teacher-user-id";
  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      emailVerified: true,
      updatedAt: new Date(),
    },
    create: {
      id: teacherUserId,
      name,
      email,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.account.upsert({
    where: { id: "seed-teacher-account-id" },
    update: { password: passwordHash },
    create: {
      id: "seed-teacher-account-id",
      accountId: teacherUserId,
      providerId: "credential",
      userId: teacherUserId,
      password: passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Teacher.id MUST equal the Better Auth user.id — the whole app treats session.user.id as the
  // teacher's own id (see the databaseHooks note in src/auth.ts). An older seed created the Teacher
  // with an auto-cuid, breaking that invariant; if such a row exists, drop it so we can recreate it
  // with the aligned id.
  const existingTeacher = await prisma.teacher.findUnique({ where: { email } });
  if (existingTeacher && existingTeacher.id !== teacherUserId) {
    await purgeTeacherData(existingTeacher.id);
    await prisma.teacher.delete({ where: { id: existingTeacher.id } });
  }

  const teacher = await prisma.teacher.upsert({
    where: { id: teacherUserId },
    update: { name, email, passwordHash, userId: teacherUserId },
    create: { id: teacherUserId, name, email, passwordHash, userId: teacherUserId },
  });

  await purgeTeacherData(teacher.id);

  // Clear existing organizations and invites to allow seed re-runs
  await prisma.organisationInvite.deleteMany({});
  await prisma.organisation.deleteMany({});

  const coverPasswordHash = await bcrypt.hash("cover12345", 10);
  const coverUserId = "seed-cover-user-id";
  
  await prisma.user.upsert({
    where: { email: "cover.teacher@example.com" },
    update: {
      name: "Alex Cover",
      emailVerified: true,
      updatedAt: new Date(),
    },
    create: {
      id: coverUserId,
      name: "Alex Cover",
      email: "cover.teacher@example.com",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.account.upsert({
    where: { id: "seed-cover-account-id" },
    update: { password: coverPasswordHash },
    create: {
      id: "seed-cover-account-id",
      accountId: coverUserId,
      providerId: "credential",
      userId: coverUserId,
      password: coverPasswordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const existingCover = await prisma.teacher.findUnique({ where: { email: "cover.teacher@example.com" } });
  if (existingCover && existingCover.id !== coverUserId) {
    await purgeTeacherData(existingCover.id);
    await prisma.teacher.delete({ where: { id: existingCover.id } });
  }

  const coverTeacher = await prisma.teacher.upsert({
    where: { id: coverUserId },
    update: {
      name: "Alex Cover",
      passwordHash: coverPasswordHash,
      userId: coverUserId,
      teachesGroups: true,
      controlsOwnSchedule: true,
      archetype: TeacherArchetype.GROUP_INDEPENDENT,
      onboardingCompletedAt: addDays(new Date(), -90),
      role: TeacherRole.INSTRUCTOR,
    },
    create: {
      id: coverUserId,
      name: "Alex Cover",
      email: "cover.teacher@example.com",
      passwordHash: coverPasswordHash,
      userId: coverUserId,
      teachesGroups: true,
      controlsOwnSchedule: true,
      archetype: TeacherArchetype.GROUP_INDEPENDENT,
      onboardingCompletedAt: addDays(new Date(), -90),
      role: TeacherRole.INSTRUCTOR,
    },
  });

  const organisation = await prisma.organisation.create({
    data: { name: "Learnio Collective" },
  });

  await prisma.teacher.update({
    where: { id: teacher.id },
    data: {
      name,
      phone: "07700 900123",
      platformStatus: PlatformSubscriptionStatus.ACTIVE,
      personalBrandColor: "#0d7377",
      teachesGroups: true,
      controlsOwnSchedule: true,
      archetype: TeacherArchetype.GROUP_INDEPENDENT,
      onboardingCompletedAt: addDays(new Date(), -30),
      dismissedCards: {
        connectStripe: addDays(new Date(), -8).toISOString(),
        addCourse: addDays(new Date(), -2).toISOString(),
      },
      emergencyContactName: "Sam Teacher",
      emergencyContactPhone: "07700 900999",
      emergencyContactEmail: "sam@example.com",
      organisationId: organisation.id,
      role: TeacherRole.OWNER,
      autoApplyCreditToNextPayment: true,
    },
  });

  await prisma.teacher.update({
    where: { id: coverTeacher.id },
    data: {
      organisationId: organisation.id,
      role: TeacherRole.INSTRUCTOR,
    },
  });

  await prisma.organisationInvite.create({
    data: {
      organisationId: organisation.id,
      invitedByTeacherId: teacher.id,
      token: "seed-org-invite-token",
      acceptedAt: addDays(new Date(), -21),
    },
  });

  const termCalendar = await prisma.termCalendar.create({
    data: {
      teacherId: teacher.id,
      name: "2026 to 2027 Standard Terms",
      terms: {
        create: [
          {
            name: "Autumn",
            startDate: new Date("2026-09-07T00:00:00.000Z"),
            endDate: new Date("2026-12-18T00:00:00.000Z"),
          },
          {
            name: "Spring",
            startDate: new Date("2027-01-05T00:00:00.000Z"),
            endDate: new Date("2027-03-26T00:00:00.000Z"),
          },
          {
            name: "Summer",
            startDate: new Date("2027-04-12T00:00:00.000Z"),
            endDate: new Date("2027-07-20T00:00:00.000Z"),
          },
        ],
        createMany: undefined,
      },
      holidays: {
        create: [
          {
            name: "Autumn half term",
            startDate: new Date("2026-10-26T00:00:00.000Z"),
            endDate: new Date("2026-10-30T00:00:00.000Z"),
          },
          {
            name: "Spring half term",
            startDate: new Date("2027-02-15T00:00:00.000Z"),
            endDate: new Date("2027-02-19T00:00:00.000Z"),
          },
        ],
      },
    },
  });

  const lessonTypes = {
    flute: await prisma.lessonType.create({
      data: {
        teacherId: teacher.id,
        name: "Flute 1:1",
        description: "Weekly one-to-one flute tuition",
        defaultDurationMinutes: 45,
        defaultFee: new Prisma.Decimal("28.00"),
      },
    }),
    piano: await prisma.lessonType.create({
      data: {
        teacherId: teacher.id,
        name: "Piano 1:1",
        description: "Weekly piano lessons",
        defaultDurationMinutes: 60,
        defaultFee: new Prisma.Decimal("35.00"),
      },
    }),
    theory: await prisma.lessonType.create({
      data: {
        teacherId: teacher.id,
        name: "Music Theory Support",
        description: "Targeted support for grade theory exams",
        defaultDurationMinutes: 30,
        defaultFee: new Prisma.Decimal("20.00"),
      },
    }),
    group: await prisma.lessonType.create({
      data: {
        teacherId: teacher.id,
        name: "Junior Ensemble",
        description: "Small-group ensemble coaching",
        defaultDurationMinutes: 60,
        defaultFee: new Prisma.Decimal("18.00"),
      },
    }),
  };

  const subjects = {
    flute: await prisma.subject.create({
      data: { teacherId: teacher.id, name: "Flute" },
    }),
    piano: await prisma.subject.create({
      data: { teacherId: teacher.id, name: "Piano" },
    }),
    theory: await prisma.subject.create({
      data: { teacherId: teacher.id, name: "Music Theory" },
    }),
    ensemble: await prisma.subject.create({
      data: { teacherId: teacher.id, name: "Ensemble" },
    }),
  };

  const locations = {
    school: await prisma.teachingLocation.create({
      data: {
        name: "Ashdown Primary",
        locationType: LocationType.SCHOOL,
        address: "12 School Lane, Bristol",
        invoicingTarget: InvoicingTarget.PARENT,
        termStart: new Date("2026-09-07T00:00:00.000Z"),
        termEnd: new Date("2027-07-20T00:00:00.000Z"),
        termCalendarId: termCalendar.id,
        primaryColor: "#0d7377",
        secondaryColor: "#d8f3f1",
        accessNotes: "Sign in at reception. Music room code 4512.",
        displayToken: "seed-display-ashdown",
        lessonTypes: {
          connect: [{ id: lessonTypes.flute.id }, { id: lessonTypes.group.id }],
        },
      },
    }),
    homeVisit: await prisma.teachingLocation.create({
      data: {
        name: "Home Visits",
        locationType: LocationType.STUDENT_HOME,
        address: "Mobile across South Bristol",
        invoicingTarget: InvoicingTarget.PARENT,
        primaryColor: "#475569",
        accessNotes: "Travel with music stand and portable speaker.",
        lessonTypes: {
          connect: [{ id: lessonTypes.flute.id }, { id: lessonTypes.piano.id }],
        },
      },
    }),
    studio: await prisma.teachingLocation.create({
      data: {
        name: "Harbour Studio",
        locationType: LocationType.TEACHER_BASE,
        address: "Harbour Road, Bristol",
        invoicingTarget: InvoicingTarget.PARENT,
        primaryColor: "#166534",
        accessNotes: "Free parking after 5pm. Alarm panel by side door.",
        lessonTypes: {
          connect: [
            { id: lessonTypes.flute.id },
            { id: lessonTypes.piano.id },
            { id: lessonTypes.theory.id },
          ],
        },
      },
    }),
    online: await prisma.teachingLocation.create({
      data: {
        name: "Online Studio",
        locationType: LocationType.ONLINE,
        address: "Zoom / Google Meet",
        invoicingTarget: InvoicingTarget.PARENT,
        primaryColor: "#0284c7",
        accessNotes: "Keep backup Teams link ready.",
        lessonTypes: {
          connect: [{ id: lessonTypes.theory.id }, { id: lessonTypes.piano.id }],
        },
      },
    }),
    venue: await prisma.teachingLocation.create({
      data: {
        name: "St Mark's Hall",
        locationType: LocationType.HIRED_VENUE,
        address: "17 Church Street, Bristol",
        invoicingTarget: InvoicingTarget.PARENT,
        primaryColor: "#c2410c",
        accessNotes: "Heating switch in rear cupboard.",
        lessonTypes: {
          connect: [{ id: lessonTypes.group.id }, { id: lessonTypes.flute.id }],
        },
      },
    }),
  };

  const rooms = {
    schoolMusic: await prisma.room.create({
      data: {
        locationId: locations.school.id,
        label: "Music Room",
        features: { piano: true, whiteboard: true },
        openHours: [
          { dayOfWeek: 1, openTime: "09:00", closeTime: "16:30" },
          { dayOfWeek: 3, openTime: "09:00", closeTime: "16:30" },
        ],
      },
    }),
    studioA: await prisma.room.create({
      data: {
        locationId: locations.studio.id,
        label: "Studio A",
        features: { uprightPiano: true, mirrors: false },
        openHours: [
          { dayOfWeek: 1, openTime: "14:00", closeTime: "20:00" },
          { dayOfWeek: 2, openTime: "14:00", closeTime: "20:00" },
          { dayOfWeek: 4, openTime: "14:00", closeTime: "20:00" },
        ],
      },
    }),
    hallMain: await prisma.room.create({
      data: {
        locationId: locations.venue.id,
        label: "Main Hall",
        features: { chairs: 20, storage: true },
        openHours: [{ dayOfWeek: 2, openTime: "16:00", closeTime: "21:00" }],
      },
    }),
  };

  await prisma.teacherLocationLink.createMany({
    data: [
      {
        teacherId: teacher.id,
        locationId: locations.school.id,
        schedulingMode: SchedulingMode.FLUID,
        taxHandling: TaxHandling.PAYE_VIA_SCHOOL,
        availability: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "15:00" },
          { dayOfWeek: 3, startTime: "09:00", endTime: "15:00" },
        ],
        protectedBlocks: [{ dayOfWeek: 1, startTime: "12:00", endTime: "12:30", label: "Lunch" }],
      },
      {
        teacherId: teacher.id,
        locationId: locations.homeVisit.id,
        schedulingMode: SchedulingMode.FIXED,
        taxHandling: TaxHandling.SELF_EMPLOYED,
        availability: [
          { dayOfWeek: 2, startTime: "15:30", endTime: "19:30" },
          { dayOfWeek: 4, startTime: "15:30", endTime: "19:30" },
        ],
        protectedBlocks: [],
      },
      {
        teacherId: teacher.id,
        locationId: locations.studio.id,
        schedulingMode: SchedulingMode.FIXED,
        taxHandling: TaxHandling.SELF_EMPLOYED,
        // Includes a Saturday slot deliberately — dayOfWeek is 0-6 (Sun-Sat) everywhere in this
        // model, not Mon-Fri-only; every other seeded location happened to use weekday-only
        // examples, which made the demo data LOOK weekday-restricted even though nothing enforces
        // that. This proves weekend teaching works end-to-end (availability, generator, calendar).
        availability: [
          { dayOfWeek: 1, startTime: "15:00", endTime: "20:00" },
          { dayOfWeek: 2, startTime: "15:00", endTime: "20:00" },
          { dayOfWeek: 4, startTime: "15:00", endTime: "20:00" },
          { dayOfWeek: 6, startTime: "09:00", endTime: "13:00" },
        ],
        protectedBlocks: [{ dayOfWeek: 4, startTime: "17:00", endTime: "17:30", label: "Travel" }],
      },
      {
        teacherId: teacher.id,
        locationId: locations.online.id,
        schedulingMode: SchedulingMode.FIXED,
        taxHandling: TaxHandling.SELF_EMPLOYED,
        availability: [{ dayOfWeek: 5, startTime: "10:00", endTime: "16:00" }],
        protectedBlocks: [],
      },
      {
        teacherId: teacher.id,
        locationId: locations.venue.id,
        schedulingMode: SchedulingMode.FIXED,
        taxHandling: TaxHandling.SELF_EMPLOYED,
        availability: [{ dayOfWeek: 2, startTime: "16:00", endTime: "20:30" }],
        protectedBlocks: [],
      },
    ],
  });

  await prisma.venueFeeArrangement.createMany({
    data: [
      {
        locationId: locations.venue.id,
        feeType: VenueFeeType.FLAT_PER_SESSION,
        amount: new Prisma.Decimal("18.00"),
        billingMode: VenueFeeBillingMode.ABSORBED_INTO_FEE,
        notes: "Tuesday evening hall hire",
      },
      {
        locationId: locations.studio.id,
        feeType: VenueFeeType.PERIOD_RENTAL,
        amount: new Prisma.Decimal("140.00"),
        billingMode: VenueFeeBillingMode.ITEMISED_TO_PAYER,
        notes: "Monthly piano tuning and room overhead",
      },
    ],
  });

  await prisma.lessonTypeLocationPricing.createMany({
    data: [
      {
        lessonTypeId: lessonTypes.flute.id,
        locationId: locations.school.id,
        fee: new Prisma.Decimal("30.00"),
      },
      {
        lessonTypeId: lessonTypes.flute.id,
        locationId: locations.studio.id,
        fee: new Prisma.Decimal("32.00"),
      },
      {
        lessonTypeId: lessonTypes.piano.id,
        locationId: locations.studio.id,
        fee: new Prisma.Decimal("36.00"),
      },
      {
        lessonTypeId: lessonTypes.theory.id,
        locationId: locations.online.id,
        fee: new Prisma.Decimal("22.00"),
      },
    ],
  });

  const payers = {
    bennettFamily: await prisma.payer.create({
      data: {
        teacherId: teacher.id,
        name: "Rachel Bennett",
        email: "rachel.bennett@example.com",
        phone: "07700 100001",
        accessCode: "410001",
        contactPref: ContactPref.EMAIL,
        notes: "Prefers invoices by email. Address: 11 Park View, Bristol.",
      },
    }),
    clarkeFamily: await prisma.payer.create({
      data: {
        teacherId: teacher.id,
        name: "Martin Clarke",
        email: "martin.clarke@example.com",
        phone: "07700 100002",
        accessCode: "410002",
        contactPref: ContactPref.WHATSAPP,
        notes: "Split billing with co-parent.",
      },
    }),
    clarkeCopayer: await prisma.payer.create({
      data: {
        teacherId: teacher.id,
        name: "Priya Clarke",
        email: "priya.clarke@example.com",
        phone: "07700 100003",
        accessCode: "410003",
        contactPref: ContactPref.SMS,
      },
    }),
    adultStudent: await prisma.payer.create({
      data: {
        teacherId: teacher.id,
        name: "Elliot Stone",
        email: "elliot.stone@example.com",
        phone: "07700 100004",
        accessCode: "410004",
        isSelf: true,
        contactPref: ContactPref.EMAIL,
      },
    }),
    emergencyOnly: await prisma.payer.create({
      data: {
        teacherId: teacher.id,
        name: "Lena Morris",
        email: "lena.morris@example.com",
        phone: "07700 100005",
        accessCode: "410005",
        isEmergencyContactOnly: true,
        notes: "Emergency contact for school-billed child.",
      },
    }),
  };

  const students = {
    ava: await prisma.student.create({
      data: {
        teacherId: teacher.id,
        name: "Ava Bennett",
        dob: new Date("2014-05-20T00:00:00.000Z"),
        discipline: "Flute",
        source: StudentSource.HOME,
        locationId: locations.studio.id,
        igCardId: "IG-AVA-001",
        referredBy: "School office",
        status: StudentStatus.ACTIVE,
        shareBalanceWithStudent: false,
        subjects: { connect: [{ id: subjects.flute.id }, { id: subjects.theory.id }] },
      },
    }),
    noah: await prisma.student.create({
      data: {
        teacherId: teacher.id,
        name: "Noah Clarke",
        dob: new Date("2012-02-11T00:00:00.000Z"),
        discipline: "Piano",
        source: StudentSource.HOME,
        locationId: locations.homeVisit.id,
        igCardId: "IG-NOAH-002",
        referredBy: "Friend referral",
        status: StudentStatus.ACTIVE,
        subjects: { connect: [{ id: subjects.piano.id }] },
      },
    }),
    mia: await prisma.student.create({
      data: {
        teacherId: teacher.id,
        name: "Mia Evans",
        dob: new Date("2008-08-30T00:00:00.000Z"),
        discipline: "Music Theory",
        source: StudentSource.COLLEGE,
        locationId: locations.online.id,
        igCardId: "IG-MIA-003",
        hasIndependentAccess: true,
        studentAccessCode: "510003",
        studentAccessCodeUpdatedAt: addDays(new Date(), -7),
        shareBalanceWithStudent: true,
        status: StudentStatus.ACTIVE,
        subjects: { connect: [{ id: subjects.theory.id }] },
      },
    }),
    leo: await prisma.student.create({
      data: {
        teacherId: teacher.id,
        name: "Leo Morris",
        dob: new Date("2015-11-18T00:00:00.000Z"),
        discipline: "Flute",
        source: StudentSource.SCHOOL_INQUIRY,
        locationId: locations.school.id,
        referredBy: "Mrs Harding",
        status: StudentStatus.PENDING_REVIEW,
        requestedLessonTypeId: lessonTypes.flute.id,
        subjects: { connect: [{ id: subjects.flute.id }] },
      },
    }),
    ruby: await prisma.student.create({
      data: {
        teacherId: teacher.id,
        name: "Ruby Stone",
        dob: new Date("2002-03-14T00:00:00.000Z"),
        discipline: "Piano",
        source: StudentSource.HOME,
        locationId: locations.studio.id,
        hasIndependentAccess: true,
        studentAccessCode: "510005",
        studentAccessCodeUpdatedAt: addDays(new Date(), -4),
        shareBalanceWithStudent: true,
        status: StudentStatus.ACTIVE,
        subjects: { connect: [{ id: subjects.piano.id }] },
      },
    }),
    declined: await prisma.student.create({
      data: {
        teacherId: teacher.id,
        name: "Toby Reed",
        dob: new Date("2016-09-09T00:00:00.000Z"),
        discipline: "Flute",
        source: StudentSource.SCHOOL_INQUIRY,
        locationId: locations.school.id,
        status: StudentStatus.DECLINED,
        requestedLessonTypeId: lessonTypes.group.id,
      },
    }),
  };

  await prisma.studentPayerLink.createMany({
    data: [
      {
        studentId: students.ava.id,
        payerId: payers.bennettFamily.id,
        isPrimary: true,
      },
      {
        studentId: students.noah.id,
        payerId: payers.clarkeFamily.id,
        isPrimary: true,
        splitPercent: new Prisma.Decimal("60.00"),
      },
      {
        studentId: students.noah.id,
        payerId: payers.clarkeCopayer.id,
        isPrimary: false,
        splitPercent: new Prisma.Decimal("40.00"),
      },
      {
        studentId: students.mia.id,
        payerId: payers.clarkeFamily.id,
        isPrimary: true,
      },
      {
        studentId: students.ruby.id,
        payerId: payers.adultStudent.id,
        isPrimary: true,
      },
      {
        studentId: students.leo.id,
        payerId: payers.emergencyOnly.id,
        isPrimary: false,
      },
    ],
  });

  const contracts = {
    v1: await prisma.contract.create({
      data: {
        teacherId: teacher.id,
        version: 1,
        content: "Version 1: monthly smoothing applies across term breaks. Cancellations require notice.",
      },
    }),
    v2: await prisma.contract.create({
      data: {
        teacherId: teacher.id,
        version: 2,
        content:
          "Version 2: subscriptions are billed monthly, make-up lessons are tracked separately, and late cancellations may incur a partial charge.",
      },
    }),
  };

  await prisma.contractAcceptance.createMany({
    data: [
      {
        payerId: payers.bennettFamily.id,
        contractId: contracts.v2.id,
        contractVersion: 2,
        contractSnapshot: contracts.v2.content,
        typedName: "Rachel Bennett",
        acceptedAt: addDays(new Date(), -20),
        ipAddress: "127.0.0.1",
      },
      {
        payerId: payers.clarkeFamily.id,
        contractId: contracts.v1.id,
        contractVersion: 1,
        contractSnapshot: contracts.v1.content,
        typedName: "Martin Clarke",
        acceptedAt: addDays(new Date(), -60),
        ipAddress: "127.0.0.1",
      },
      {
        payerId: payers.adultStudent.id,
        contractId: contracts.v2.id,
        contractVersion: 2,
        contractSnapshot: contracts.v2.content,
        typedName: "Elliot Stone",
        acceptedAt: addDays(new Date(), -14),
        ipAddress: "127.0.0.1",
      },
    ],
  });

  const subscriptions = {
    ava: await prisma.subscription.create({
      data: {
        studentId: students.ava.id,
        payerId: payers.bennettFamily.id,
        annualFee: new Prisma.Decimal("1344.00"),
        billingModel: BillingModel.SMOOTHED_SUBSCRIPTION,
        startDate: new Date("2026-09-07T00:00:00.000Z"),
      },
    }),
    noah: await prisma.subscription.create({
      data: {
        studentId: students.noah.id,
        payerId: payers.clarkeFamily.id,
        annualFee: new Prisma.Decimal("1560.00"),
        billingModel: BillingModel.PER_LESSON,
        startDate: new Date("2026-09-07T00:00:00.000Z"),
        creditAppliedNextPeriod: new Prisma.Decimal("15.00"),
      },
    }),
    mia: await prisma.subscription.create({
      data: {
        studentId: students.mia.id,
        payerId: payers.clarkeFamily.id,
        annualFee: new Prisma.Decimal("720.00"),
        billingModel: BillingModel.TERMLY,
        startDate: new Date("2026-09-14T00:00:00.000Z"),
      },
    }),
    ruby: await prisma.subscription.create({
      data: {
        studentId: students.ruby.id,
        payerId: payers.adultStudent.id,
        annualFee: new Prisma.Decimal("1680.00"),
        billingModel: BillingModel.HOURLY,
        startDate: new Date("2026-09-10T00:00:00.000Z"),
      },
    }),
  };

  await prisma.ledgerEntry.createMany({
    data: [
      {
        subscriptionId: subscriptions.ava.id,
        amount: new Prisma.Decimal("112.00"),
        operation: LedgerOperation.CREDIT,
        reason: LedgerReason.PAYMENT,
        date: addDays(new Date(), -28),
        note: "September payment",
      },
      {
        subscriptionId: subscriptions.ava.id,
        amount: new Prisma.Decimal("28.00"),
        operation: LedgerOperation.DEBIT,
        reason: LedgerReason.LESSON_DELIVERED,
        date: addDays(new Date(), -21),
        note: "Delivered at Harbour Studio",
      },
      {
        subscriptionId: subscriptions.noah.id,
        amount: new Prisma.Decimal("35.00"),
        operation: LedgerOperation.CREDIT,
        reason: LedgerReason.PAYMENT,
        date: addDays(new Date(), -18),
        note: "Manual transfer",
      },
      {
        subscriptionId: subscriptions.noah.id,
        amount: new Prisma.Decimal("35.00"),
        operation: LedgerOperation.DEBIT,
        reason: LedgerReason.LESSON_DELIVERED,
        date: addDays(new Date(), -12),
        note: "Home visit lesson",
      },
      {
        subscriptionId: subscriptions.noah.id,
        amount: new Prisma.Decimal("35.00"),
        operation: LedgerOperation.CREDIT,
        reason: LedgerReason.MAKE_UP_CREDIT_ISSUED,
        date: addDays(new Date(), -5),
        note: "No-show, make-up owed",
      },
      {
        subscriptionId: subscriptions.mia.id,
        amount: new Prisma.Decimal("180.00"),
        operation: LedgerOperation.CREDIT,
        reason: LedgerReason.PAYMENT,
        date: addDays(new Date(), -32),
        note: "Autumn term instalment",
      },
      {
        subscriptionId: subscriptions.mia.id,
        amount: new Prisma.Decimal("20.00"),
        operation: LedgerOperation.DEBIT,
        reason: LedgerReason.LATE_CANCELLATION_CHARGE,
        date: addDays(new Date(), -7),
        note: "Late cancellation per policy",
      },
      {
        subscriptionId: subscriptions.ruby.id,
        amount: new Prisma.Decimal("140.00"),
        operation: LedgerOperation.CREDIT,
        reason: LedgerReason.PAYMENT,
        date: addDays(new Date(), -30),
        note: "Monthly card payment",
      },
      {
        subscriptionId: subscriptions.ruby.id,
        amount: new Prisma.Decimal("35.00"),
        operation: LedgerOperation.DEBIT,
        reason: LedgerReason.LESSON_DELIVERED,
        date: addDays(new Date(), -23),
        note: "Studio piano lesson",
      },
    ],
  });

  await prisma.payment.createMany({
    data: [
      {
        subscriptionId: subscriptions.ava.id,
        stripePaymentId: "seed-pay-ava-001",
        amount: new Prisma.Decimal("112.00"),
        status: PaymentStatus.SUCCEEDED,
        date: addDays(new Date(), -28),
      },
      {
        subscriptionId: subscriptions.mia.id,
        stripePaymentId: "seed-pay-mia-001",
        amount: new Prisma.Decimal("180.00"),
        status: PaymentStatus.SUCCEEDED,
        date: addDays(new Date(), -32),
      },
      {
        subscriptionId: subscriptions.ruby.id,
        stripePaymentId: "seed-pay-ruby-001",
        amount: new Prisma.Decimal("140.00"),
        status: PaymentStatus.PENDING,
        date: addDays(new Date(), -1),
      },
    ],
  });

  const packageDeal = await prisma.package.create({
    data: {
      studentId: students.ava.id,
      teacherId: teacher.id,
      totalLessons: 10,
      lessonsRemaining: 6,
      price: new Prisma.Decimal("240.00"),
    },
  });

  const lessonDates = {
    past1: atTime(addDays(new Date(), -21), 16, 0),
    past2: atTime(addDays(new Date(), -12), 17, 30),
    past3: atTime(addDays(new Date(), -7), 11, 0),
    noShow: atTime(addDays(new Date(), -5), 18, 0),
    future1: atTime(addDays(new Date(), 2), 16, 0),
    future2: atTime(addDays(new Date(), 3), 17, 30),
    futureOnline: atTime(addDays(new Date(), 5), 10, 0),
    makeup: atTime(addDays(new Date(), 9), 18, 0),
  };

  const lessons = {
    avaPast: await prisma.lesson.create({
      data: {
        studentId: students.ava.id,
        teacherId: teacher.id,
        locationId: locations.studio.id,
        roomId: rooms.studioA.id,
        subscriptionId: subscriptions.ava.id,
        scheduledAt: lessonDates.past1,
        durationMins: 45,
      },
    }),
    noahPast: await prisma.lesson.create({
      data: {
        studentId: students.noah.id,
        teacherId: teacher.id,
        locationId: locations.homeVisit.id,
        subscriptionId: subscriptions.noah.id,
        scheduledAt: lessonDates.past2,
        durationMins: 60,
      },
    }),
    miaCancelled: await prisma.lesson.create({
      data: {
        studentId: students.mia.id,
        teacherId: teacher.id,
        locationId: locations.online.id,
        subscriptionId: subscriptions.mia.id,
        scheduledAt: lessonDates.past3,
        durationMins: 30,
        status: LessonStatus.CANCELLED_BY_STUDENT,
        meetingUrl: "https://meet.example.com/theory-review",
      },
    }),
    noahNoShow: await prisma.lesson.create({
      data: {
        studentId: students.noah.id,
        teacherId: teacher.id,
        locationId: locations.homeVisit.id,
        subscriptionId: subscriptions.noah.id,
        scheduledAt: lessonDates.noShow,
        durationMins: 60,
        noShowReason: "Family forgot about schedule change",
        noShowConfirmed: true,
      },
    }),
    avaFuture: await prisma.lesson.create({
      data: {
        studentId: students.ava.id,
        teacherId: teacher.id,
        locationId: locations.school.id,
        roomId: rooms.schoolMusic.id,
        subscriptionId: subscriptions.ava.id,
        scheduledAt: lessonDates.future1,
        durationMins: 45,
      },
    }),
    rubyFuture: await prisma.lesson.create({
      data: {
        studentId: students.ruby.id,
        teacherId: teacher.id,
        locationId: locations.studio.id,
        roomId: rooms.studioA.id,
        subscriptionId: subscriptions.ruby.id,
        scheduledAt: lessonDates.future2,
        durationMins: 60,
      },
    }),
    miaOnlineFuture: await prisma.lesson.create({
      data: {
        studentId: students.mia.id,
        teacherId: teacher.id,
        locationId: locations.online.id,
        subscriptionId: subscriptions.mia.id,
        scheduledAt: lessonDates.futureOnline,
        durationMins: 30,
        meetingUrl: "https://meet.example.com/future-theory",
      },
    }),
    avaPackageMakeup: await prisma.lesson.create({
      data: {
        studentId: students.ava.id,
        teacherId: teacher.id,
        locationId: locations.studio.id,
        roomId: rooms.studioA.id,
        packageId: packageDeal.id,
        scheduledAt: lessonDates.makeup,
        durationMins: 45,
        hoursCounted: false,
      },
    }),
  };

  await prisma.makeUpLesson.create({
    data: {
      originalLessonId: lessons.noahNoShow.id,
      makeUpLessonId: lessons.avaPackageMakeup.id,
      studentId: students.noah.id,
      requestedAt: addDays(new Date(), -5),
      confirmedAt: addDays(new Date(), -1),
    },
  });

  await prisma.lessonNote.createMany({
    data: [
      {
        lessonId: lessons.avaPast.id,
        content: "Worked on breath support and articulation. Set scales for D major.",
      },
      {
        lessonId: lessons.noahPast.id,
        content: "Started broken chords in G. Practice LH balance this week.",
      },
    ],
  });

  await prisma.checkIn.createMany({
    data: [
      {
        lessonId: lessons.avaPast.id,
        studentId: students.ava.id,
        signedInAt: addDays(new Date(), -21),
        signedOutAt: addDays(new Date(), -21),
      },
      {
        lessonId: lessons.noahPast.id,
        studentId: students.noah.id,
        signedInAt: addDays(new Date(), -12),
        signedOutAt: addDays(new Date(), -12),
      },
    ],
  });

  await prisma.loneWorkerCheckIn.create({
    data: {
      lessonId: lessons.noahPast.id,
      checkedInAt: lessonDates.past2,
      checkedOutAt: addDays(lessonDates.past2, 0),
      expectedEndAt: atTime(addDays(new Date(), -12), 18, 30),
      graceMinutes: 15,
    },
  });

  await prisma.lessonFeedback.create({
    data: {
      lessonId: lessons.avaPast.id,
      payerId: payers.bennettFamily.id,
      rating: 5,
      comments: "Clear notes and a lovely progress summary.",
    },
  });

  const ensemble = await prisma.groupClass.create({
    data: {
      teacherId: teacher.id,
      locationId: locations.venue.id,
      roomId: rooms.hallMain.id,
      name: "Tuesday Junior Ensemble",
      discipline: "Ensemble",
      subjectId: subjects.ensemble.id,
      dayOfWeek: 2,
      startTime: "17:00",
      endTime: "18:00",
      capacity: 2,
    },
  });

  await prisma.groupClassMember.createMany({
    data: [
      { groupClassId: ensemble.id, studentId: students.ava.id },
      { groupClassId: ensemble.id, studentId: students.noah.id },
    ],
  });

  await prisma.groupSessionBooking.createMany({
    data: [
      {
        groupClassId: ensemble.id,
        studentId: students.ava.id,
        sessionDate: dateOnly(addDays(new Date(), 7)),
        status: GroupBookingStatus.CONFIRMED,
      },
      {
        groupClassId: ensemble.id,
        studentId: students.noah.id,
        sessionDate: dateOnly(addDays(new Date(), 7)),
        status: GroupBookingStatus.CONFIRMED,
      },
      {
        groupClassId: ensemble.id,
        studentId: students.mia.id,
        sessionDate: dateOnly(addDays(new Date(), 7)),
        status: GroupBookingStatus.WAITLISTED,
      },
    ],
  });

  await prisma.checkIn.create({
    data: {
      groupClassId: ensemble.id,
      studentId: students.ava.id,
      signedInAt: addDays(new Date(), -14),
      signedOutAt: addDays(new Date(), -14),
    },
  });

  const addOns = {
    accompanist: await prisma.addOn.create({
      data: {
        teacherId: teacher.id,
        name: "Accompanist rehearsal",
        price: new Prisma.Decimal("15.00"),
        chargeUnit: ChargeUnit.PER_BOOKING,
        visibility: Visibility.PUBLIC,
      },
    }),
    scorePack: await prisma.addOn.create({
      data: {
        teacherId: teacher.id,
        name: "Printed score pack",
        price: new Prisma.Decimal("6.00"),
        chargeUnit: ChargeUnit.PER_BOOKING,
        visibility: Visibility.PRIVATE,
      },
    }),
  };

  await prisma.addOnBooking.createMany({
    data: [
      {
        addOnId: addOns.accompanist.id,
        lessonId: lessons.avaFuture.id,
        quantity: 1,
        priceAtTime: new Prisma.Decimal("15.00"),
      },
      {
        addOnId: addOns.scorePack.id,
        groupClassId: ensemble.id,
        quantity: 2,
        priceAtTime: new Prisma.Decimal("6.00"),
      },
    ],
  });

  const curriculumTemplate = await prisma.curriculumTemplate.create({
    data: {
      teacherId: teacher.id,
      title: "Flute Grade 1 Path",
      subject: "Flute",
      description: "A reusable beginner flute pathway.",
      isPublished: true,
      lessonTypeId: lessonTypes.flute.id,
      sections: {
        create: [
          {
            order: 1,
            title: "Posture and tone",
            description: "Embouchure, breathing, posture",
            estimatedLessons: 4,
          },
          {
            order: 2,
            title: "D major basics",
            description: "Scale, arpeggio, first study",
            estimatedLessons: 6,
          },
        ],
      },
    },
    include: { sections: true },
  });

  const importedCurriculum = await prisma.studentCurriculum.create({
    data: {
      studentId: students.ava.id,
      templateId: curriculumTemplate.id,
      title: "Ava Grade 1 Track",
      subject: "Flute",
      startedDate: addDays(new Date(), -40),
      status: StudentCurriculumStatus.ACTIVE,
      sections: {
        create: curriculumTemplate.sections.map((section, index) => ({
          order: index + 1,
          title: section.title,
          description: section.description,
          estimatedLessons: section.estimatedLessons,
          status:
            index === 0
              ? StudentCurriculumSectionStatus.COMPLETED
              : StudentCurriculumSectionStatus.IN_PROGRESS,
          completedDate: index === 0 ? addDays(new Date(), -10) : null,
          notes: index === 0 ? "Good tone and hand position." : "Need steadier tonguing.",
        })),
      },
    },
    include: { sections: true },
  });

  await prisma.lessonNote.update({
    where: { lessonId: lessons.avaPast.id },
    data: {
      studentCurriculumSectionId: importedCurriculum.sections[1]?.id,
    },
  });

  await prisma.resource.createMany({
    data: [
      {
        teacherId: teacher.id,
        type: ResourceType.DOCUMENT,
        title: "Ava warm-up sheet",
        url: "https://example.com/resources/ava-warmup.pdf",
        description: "Breathing and long-note warm-up",
        studentId: students.ava.id,
      },
      {
        teacherId: teacher.id,
        type: ResourceType.AUDIO,
        title: "Ensemble backing track",
        url: "https://example.com/resources/ensemble-backing.mp3",
        description: "Practice tempo version",
        lessonId: lessons.avaPast.id,
      },
      {
        teacherId: teacher.id,
        type: ResourceType.VIDEO,
        title: "Theory recap video",
        url: "https://example.com/resources/theory-video",
        description: "Cadence recap",
        studentId: students.mia.id,
      },
    ],
  });

  const assignmentResource = await prisma.resource.create({
    data: {
      teacherId: teacher.id,
      type: ResourceType.DOCUMENT,
      title: "Noah broken chords sheet",
      url: "https://example.com/resources/noah-broken-chords.pdf",
      description: "Weekly homework support sheet",
      studentId: students.noah.id,
    },
  });

  await prisma.assignment.createMany({
    data: [
      {
        studentId: students.noah.id,
        teacherId: teacher.id,
        title: "Broken chord routine",
        instructions: "Practice hands separately, then together at 60bpm.",
        target: "Three clean repetitions by next week",
        assignedDate: addDays(new Date(), -12),
        reviewDate: addDays(new Date(), -5),
        resourceId: assignmentResource.id,
      },
      {
        studentId: students.mia.id,
        teacherId: teacher.id,
        title: "Cadence recognition",
        instructions: "Label perfect and imperfect cadences in the worksheet.",
        target: "Score at least 8/10",
        assignedDate: addDays(new Date(), -4),
        reviewDate: addDays(new Date(), 3),
        status: "REVIEWED_DONE",
      },
    ],
  });

  const teacherOwnedInstrument = await prisma.loanableItem.create({
    data: {
      name: "Beginner flute",
      type: "Instrument",
      condition: "Good",
      value: new Prisma.Decimal("260.00"),
      teacherId: teacher.id,
    },
  });

  const venueMusicStand = await prisma.loanableItem.create({
    data: {
      name: "Folding music stand",
      type: "Equipment",
      condition: "Fair",
      value: new Prisma.Decimal("24.00"),
      locationId: locations.venue.id,
    },
  });

  await prisma.loan.create({
    data: {
      itemId: teacherOwnedInstrument.id,
      studentId: students.ava.id,
      checkedOutDate: addDays(new Date(), -20),
      dueBackDate: addDays(new Date(), 14),
      conditionNotes: "Issued with cleaning rod and case.",
    },
  });

  await prisma.maintenanceReminder.createMany({
    data: [
      {
        teacherId: teacher.id,
        loanableItemId: teacherOwnedInstrument.id,
        itemDescription: "Flute repad check",
        dueDate: addDays(new Date(), 45),
      },
      {
        teacherId: teacher.id,
        loanableItemId: venueMusicStand.id,
        itemDescription: "Tighten stand joints",
        dueDate: addDays(new Date(), 10),
      },
    ],
  });

  await prisma.assessment.createMany({
    data: [
      {
        studentId: students.ava.id,
        teacherId: teacher.id,
        level: "Grade 1 ready",
        date: addDays(new Date(), -15),
        canContinue: true,
        appointmentAt: atTime(addDays(new Date(), 20), 15, 0),
        roomId: rooms.schoolMusic.id,
        examBoard: "ABRSM",
        examFee: new Prisma.Decimal("48.00"),
      },
      {
        studentId: students.noah.id,
        teacherId: teacher.id,
        level: "Prep test passed",
        date: addDays(new Date(), -45),
        canContinue: true,
      },
    ],
  });

  await prisma.instructorCertification.createMany({
    data: [
      {
        teacherId: teacher.id,
        certType: "Enhanced DBS",
        certNumber: "DBS-2026-001",
        issuedDate: addDays(new Date(), -180),
        expiryDate: addDays(new Date(), 550),
        reminderDaysBefore: 45,
      },
      {
        teacherId: teacher.id,
        certType: "First Aid",
        certNumber: "FA-2025-117",
        issuedDate: addDays(new Date(), -220),
        expiryDate: addDays(new Date(), 140),
        reminderDaysBefore: 30,
      },
    ],
  });

  await prisma.studentMedicalNote.createMany({
    data: [
      {
        studentId: students.ava.id,
        note: "Mild asthma. Allow time to settle breathing before long phrases.",
      },
      {
        studentId: students.noah.id,
        note: "Sensitive to loud sudden sounds.",
        severity: "MEDIUM",
      },
    ],
  });

  await prisma.incidentLog.create({
    data: {
      teacherId: teacher.id,
      studentId: students.noah.id,
      lessonId: lessons.noahPast.id,
      date: addDays(new Date(), -12),
      description: "Arrived late due to traffic; guardian informed and lesson end time adjusted.",
      actionTaken: "Added travel buffer to route planning.",
      reportedToWhom: "Guardian",
    },
  });

  await prisma.cancellationPolicy.createMany({
    data: [
      {
        teacherId: teacher.id,
        noticeHoursRequired: 24,
        lateCancelAction: CancellationAction.CREDIT,
        noShowAction: CancellationAction.FORFEIT,
      },
      {
        teacherId: teacher.id,
        locationId: locations.online.id,
        noticeHoursRequired: 12,
        lateCancelAction: CancellationAction.PARTIAL_CHARGE,
        noShowAction: CancellationAction.FULL_CHARGE,
        partialChargePercent: 50,
      },
    ],
  });

  await prisma.giftCard.create({
    data: {
      teacherId: teacher.id,
      code: "GIFT-SEED-25",
      initialValue: new Prisma.Decimal("50.00"),
      remainingBalance: new Prisma.Decimal("20.00"),
      purchasedByPayerId: payers.bennettFamily.id,
    },
  });

  await prisma.promoCode.createMany({
    data: [
      {
        teacherId: teacher.id,
        code: "WELCOME10",
        discountType: PromoDiscountType.PERCENT,
        value: new Prisma.Decimal("10.00"),
        validFrom: addDays(new Date(), -30),
        validTo: addDays(new Date(), 60),
        usageLimit: 25,
        timesUsed: 3,
        lessonTypeId: lessonTypes.flute.id,
      },
      {
        teacherId: teacher.id,
        code: "THEORY5",
        discountType: PromoDiscountType.FIXED,
        value: new Prisma.Decimal("5.00"),
        validFrom: addDays(new Date(), -15),
        validTo: addDays(new Date(), 30),
        timesUsed: 1,
        lessonTypeId: lessonTypes.theory.id,
      },
    ],
  });

  await prisma.embedConfig.create({
    data: {
      teacherId: teacher.id,
      label: "Website onboarding form",
      locationId: locations.studio.id,
      brandColor: "#0d7377",
      embedToken: "seed-embed-token",
      allowedLessonTypes: {
        connect: [{ id: lessonTypes.flute.id }, { id: lessonTypes.piano.id }],
      },
    },
  });

  const course = await prisma.course.create({
    data: {
      teacherId: teacher.id,
      title: "Flute Foundations",
      description: "Self-paced beginner support course.",
      price: new Prisma.Decimal("45.00"),
      isPublished: true,
      items: {
        create: [
          {
            teacherId: teacher.id,
            title: "Welcome video",
            description: "How to use the course",
            mediaType: "VIDEO",
            mediaUrl: "https://example.com/course/flute-foundations/welcome",
            order: 1,
            lessonTypeId: lessonTypes.flute.id,
          },
          {
            teacherId: teacher.id,
            title: "Finger chart PDF",
            description: "Printable finger chart",
            mediaType: "DOCUMENT",
            mediaUrl: "https://example.com/course/flute-foundations/finger-chart.pdf",
            order: 2,
            lessonTypeId: lessonTypes.flute.id,
          },
          {
            teacherId: teacher.id,
            title: "Tone track",
            description: "Practice-along tone builder",
            mediaType: "AUDIO",
            mediaUrl: "https://example.com/course/flute-foundations/tone-track.mp3",
            order: 3,
            lessonTypeId: lessonTypes.flute.id,
          },
        ],
      },
    },
  });

  await prisma.coursePurchase.create({
    data: {
      courseId: course.id,
      payerId: payers.bennettFamily.id,
      amountPaid: new Prisma.Decimal("45.00"),
      purchasedAt: addDays(new Date(), -8),
    },
  });

  await prisma.sessionPlanTemplate.create({
    data: {
      teacherId: teacher.id,
      title: "Junior ensemble rehearsal format",
      content: "Warm-up, blend work, sectionals, full run, reflection.",
    },
  });

  await prisma.sessionPlan.createMany({
    data: [
      {
        lessonId: lessons.avaFuture.id,
        title: "Ava exam prep",
        content: "Run scales, two contrasting pieces, then sight-reading.",
        createdBy: teacher.id,
        publishedAt: addDays(new Date(), -1),
      },
      {
        groupClassId: ensemble.id,
        title: "Tuesday ensemble rehearsal",
        content: "Work on entries, then rehearse final piece with count-in.",
        createdBy: teacher.id,
        publishedAt: addDays(new Date(), -1),
      },
    ],
  });

  await prisma.outOfScopeSignup.create({
    data: {
      teacherId: teacher.id,
      email: "employed.teacher@example.com",
      freeTextAnswer: "Interested if employed-instructor timetabling becomes supported.",
    },
  });

  await prisma.privateTuitionRequest.create({
    data: {
      studentId: students.leo.id,
      teacherId: teacher.id,
      sourceLocationId: locations.school.id,
      status: PrivateTuitionRequestStatus.PENDING,
      requestedAt: addDays(new Date(), -6),
    },
  });

  await prisma.expense.createMany({
    data: [
      {
        teacherId: teacher.id,
        amount: new Prisma.Decimal("19.50"),
        category: "Reeds and accessories",
        date: addDays(new Date(), -18),
        note: "Studio consumables",
      },
      {
        teacherId: teacher.id,
        amount: new Prisma.Decimal("48.00"),
        category: "Hall hire",
        date: addDays(new Date(), -11),
        note: "St Mark's rehearsal fee",
      },
      {
        teacherId: teacher.id,
        amount: new Prisma.Decimal("12.99"),
        category: "Printing",
        date: addDays(new Date(), -4),
        note: "Course worksheets",
      },
    ],
  });

  await prisma.mileageLog.createMany({
    data: [
      {
        teacherId: teacher.id,
        date: addDays(new Date(), -12),
        miles: new Prisma.Decimal("6.4"),
        fromLocationId: locations.studio.id,
        toLocationId: locations.homeVisit.id,
        purpose: "Travel to Noah home visit",
      },
      {
        teacherId: teacher.id,
        date: addDays(new Date(), -7),
        miles: new Prisma.Decimal("4.2"),
        fromLocationId: locations.homeVisit.id,
        toLocationId: locations.venue.id,
        purpose: "Travel to ensemble rehearsal",
      },
    ],
  });

  await prisma.locationTravelTime.createMany({
    data: [
      {
        teacherId: teacher.id,
        fromLocationId: locations.studio.id,
        toLocationId: locations.homeVisit.id,
        minutes: 22,
      },
      {
        teacherId: teacher.id,
        fromLocationId: locations.homeVisit.id,
        toLocationId: locations.venue.id,
        minutes: 18,
      },
      {
        teacherId: teacher.id,
        fromLocationId: locations.school.id,
        toLocationId: locations.studio.id,
        minutes: 14,
      },
    ],
  });

  await prisma.timetableWaitlist.createMany({
    data: [
      {
        teacherId: teacher.id,
        lessonTypeId: lessonTypes.group.id,
        locationId: locations.venue.id,
        contactName: "Grace Howard",
        contactEmail: "grace.howard@example.com",
        contactPhone: "07700 200001",
        notes: "Would prefer Tuesday after school.",
        status: WaitlistStatus.WAITING,
      },
      {
        teacherId: teacher.id,
        lessonTypeId: lessonTypes.piano.id,
        locationId: locations.studio.id,
        contactName: "Ben Iqbal",
        contactEmail: "ben.iqbal@example.com",
        notes: "Previously contacted, waiting for September slot.",
        status: WaitlistStatus.CONTACTED,
      },
      {
        teacherId: teacher.id,
        lessonTypeId: lessonTypes.flute.id,
        locationId: locations.school.id,
        contactName: "Nina Short",
        contactPhone: "07700 200003",
        status: WaitlistStatus.CONVERTED,
      },
    ],
  });

  await prisma.unavailability.createMany({
    data: [
      {
        teacherId: teacher.id,
        locationId: locations.school.id,
        startDatetime: atTime(addDays(new Date(), 14), 9, 0),
        endDatetime: atTime(addDays(new Date(), 14), 15, 0),
        reason: "Inset day cover not needed",
        confirmedAt: addDays(new Date(), -1),
      },
      {
        teacherId: teacher.id,
        startDatetime: atTime(addDays(new Date(), 30), 0, 0),
        endDatetime: atTime(addDays(new Date(), 34), 23, 59),
        reason: "Half-term leave",
      },
    ],
  });

  await prisma.coverAssignment.create({
    data: {
      originalInstructorId: teacher.id,
      coveringInstructorId: coverTeacher.id,
      lessonId: lessons.rubyFuture.id,
      reason: "Teacher away at exam moderation day",
    },
  });

  console.log(`Seeded teacher: ${teacher.email} (password: ${password})`);
  console.log("Created a broad demo dataset for billing, scheduling, onboarding, parent, and operations flows.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
