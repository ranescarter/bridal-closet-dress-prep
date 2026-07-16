export type Meridiem = "AM" | "PM";

export const APPOINTMENT_HOURS = [
  "12",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
];
export const APPOINTMENT_MINUTES = ["00", "15", "30", "45"];

export type AppointmentEditFields = {
  date: string;
  hour12: string;
  minute: string;
  meridiem: Meridiem;
  hasTime: boolean;
};

export function to24HourTime(hour12: string, minute: string, meridiem: Meridiem) {
  let hour = Number(hour12) % 12;
  if (meridiem === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

export function appointmentToIso(
  date: string,
  time24: string | null,
): string | null {
  if (!date) return null;
  if (time24) return new Date(`${date}T${time24}`).toISOString();
  return new Date(`${date}T12:00`).toISOString();
}

export function formatAppointmentFull(value: string | null) {
  if (!value) return "Date & time TBD";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatAppointmentDate(value: string | null) {
  if (!value) return "TBD";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
      new Date(value),
    );
  } catch {
    return "TBD";
  }
}

export function formatAppointmentTime(value: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(
      new Date(value),
    );
  } catch {
    return "—";
  }
}

export function isPastAppointment(value: string | null) {
  if (!value) return false;
  return new Date(value).getTime() < Date.now();
}

export function appointmentSortValue(value: string | null) {
  if (!value) return Number.NEGATIVE_INFINITY;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY;
}

export function formatLastUpdated(value: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

export function appointmentToEditFields(
  value: string | null,
): AppointmentEditFields {
  if (!value) {
    return {
      date: "",
      hour12: "10",
      minute: "00",
      meridiem: "AM",
      hasTime: false,
    };
  }

  const d = new Date(value);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  let hour = d.getHours();
  const meridiem: Meridiem = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  const minute = String(d.getMinutes()).padStart(2, "0");
  const snappedMinute = APPOINTMENT_MINUTES.includes(minute) ? minute : "00";

  return {
    date,
    hour12: String(hour),
    minute: snappedMinute,
    meridiem,
    hasTime: true,
  };
}
