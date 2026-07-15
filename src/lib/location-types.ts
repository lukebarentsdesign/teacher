export const LOCATION_TYPE_VALUES = [
  "SCHOOL",
  "STUDENT_HOME",
  "TEACHER_BASE",
  "HIRED_VENUE",
  "ONLINE",
  "OTHER",
] as const;

export type LocationTypeValue = (typeof LOCATION_TYPE_VALUES)[number];

export const BUILT_IN_LOCATION_TYPE_OPTIONS: { value: LocationTypeValue; label: string }[] = [
  { value: "SCHOOL", label: "School" },
  { value: "STUDENT_HOME", label: "Student's home" },
  { value: "TEACHER_BASE", label: "My own base" },
  { value: "HIRED_VENUE", label: "Hired venue" },
  { value: "ONLINE", label: "Online" },
  { value: "OTHER", label: "Other" },
];

export const LOCATION_TYPE_CATEGORY_LABELS: Record<LocationTypeValue, string> = {
  SCHOOL: "School",
  STUDENT_HOME: "Student home",
  TEACHER_BASE: "Teacher base",
  HIRED_VENUE: "Hired venue",
  ONLINE: "Online",
  OTHER: "Other",
};

export type LocationTypeOptionChoice = {
  id: string;
  label: string;
  locationType: LocationTypeValue;
};

export function locationTypeDisplayName(location: {
  locationType: string;
  customLocationType?: string | null;
}) {
  return (
    location.customLocationType ||
    BUILT_IN_LOCATION_TYPE_OPTIONS.find((option) => option.value === location.locationType)?.label ||
    location.locationType
  );
}

export function locationTypeSelectValue(location: {
  locationType: string;
  customLocationType?: string | null;
}, options: LocationTypeOptionChoice[]) {
  if (!location.customLocationType) return location.locationType;

  const matchingOption = options.find(
    (option) =>
      option.label.toLowerCase() === location.customLocationType?.toLowerCase() &&
      option.locationType === location.locationType
  );

  if (matchingOption) return `custom:${matchingOption.id}`;

  return `current:${location.locationType}:${encodeURIComponent(location.customLocationType)}`;
}

export const INVOICING_TARGET_VALUES = ["PARENT", "SCHOOL"] as const;
export type InvoicingTargetValue = (typeof INVOICING_TARGET_VALUES)[number];

export const BUILT_IN_INVOICING_TARGET_OPTIONS: {
  value: string;
  label: string;
  invoicingTarget: InvoicingTargetValue;
}[] = [
  { value: "builtin:STUDENT", label: "Student", invoicingTarget: "PARENT" },
  { value: "PARENT", label: "Parent", invoicingTarget: "PARENT" },
  { value: "SCHOOL", label: "School / venue", invoicingTarget: "SCHOOL" },
  { value: "builtin:OTHER", label: "Other", invoicingTarget: "PARENT" },
];

export const INVOICING_TARGET_CATEGORY_LABELS: Record<InvoicingTargetValue, string> = {
  PARENT: "Parent/student payer",
  SCHOOL: "School/venue payer",
};

export type InvoicingTargetOptionChoice = {
  id: string;
  label: string;
  invoicingTarget: InvoicingTargetValue;
};

export function invoicingTargetDisplayName(location: {
  invoicingTarget: string;
  customInvoicingTarget?: string | null;
}) {
  return (
    location.customInvoicingTarget ||
    BUILT_IN_INVOICING_TARGET_OPTIONS.find((option) => option.value === location.invoicingTarget)?.label ||
    location.invoicingTarget
  );
}

export function invoicingTargetSelectValue(location: {
  invoicingTarget: string;
  customInvoicingTarget?: string | null;
}, options: InvoicingTargetOptionChoice[]) {
  if (!location.customInvoicingTarget) return location.invoicingTarget;

  const builtIn = BUILT_IN_INVOICING_TARGET_OPTIONS.find(
    (option) =>
      option.label.toLowerCase() === location.customInvoicingTarget?.toLowerCase() &&
      option.invoicingTarget === location.invoicingTarget
  );
  if (builtIn) return builtIn.value;

  const matchingOption = options.find(
    (option) =>
      option.label.toLowerCase() === location.customInvoicingTarget?.toLowerCase() &&
      option.invoicingTarget === location.invoicingTarget
  );

  if (matchingOption) return `custom:${matchingOption.id}`;

  return `current:${location.invoicingTarget}:${encodeURIComponent(location.customInvoicingTarget)}`;
}