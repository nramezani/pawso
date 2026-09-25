function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function formatLocalDateInput(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseLocalDateTime(dateValue: string, timeValue = '12:00') {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue.trim());
  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeValue.trim());

  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes
  ) {
    return null;
  }

  return date;
}

export function isValidLocalDate(value: string) {
  return parseLocalDateTime(value) !== null;
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value ?? 0);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

export function formatDateInputInTimeZone(date = new Date(), timeZone = 'UTC') {
  const value = zonedParts(date, timeZone);
  return `${value.year}-${pad(value.month)}-${pad(value.day)}`;
}

export function getHourInTimeZone(date = new Date(), timeZone = 'UTC') {
  try {
    return zonedParts(date, timeZone).hour;
  } catch {
    return date.getHours();
  }
}

export function addDaysToDateInput(dateValue: string, days: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) return dateValue;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function parseDateTimeInTimeZone(
  dateValue: string,
  timeValue: string,
  timeZone: string
) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue.trim());
  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeValue.trim());
  if (!dateMatch || !timeMatch) return null;

  const target = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
  };
  const validation = new Date(
    Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute)
  );
  if (
    validation.getUTCFullYear() !== target.year ||
    validation.getUTCMonth() !== target.month - 1 ||
    validation.getUTCDate() !== target.day
  ) {
    return null;
  }

  const targetUtc = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute
  );
  let guess = targetUtc;
  // Two passes resolve the UTC offset on both sides of most DST boundaries.
  for (let index = 0; index < 2; index += 1) {
    const actual = zonedParts(new Date(guess), timeZone);
    const representedUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second
    );
    guess -= representedUtc - targetUtc;
  }

  const result = new Date(guess);
  const roundTrip = zonedParts(result, timeZone);
  if (
    roundTrip.year !== target.year ||
    roundTrip.month !== target.month ||
    roundTrip.day !== target.day ||
    roundTrip.hour !== target.hour ||
    roundTrip.minute !== target.minute
  ) {
    // This is normally a nonexistent local time during the spring DST jump.
    return null;
  }
  return result;
}

export function getDayBoundsInTimeZone(date = new Date(), timeZone = 'UTC') {
  const dateValue = formatDateInputInTimeZone(date, timeZone);
  const nextDateValue = addDaysToDateInput(dateValue, 1);
  return {
    dateValue,
    start: parseDateTimeInTimeZone(dateValue, '00:00', timeZone),
    end: parseDateTimeInTimeZone(nextDateValue, '00:00', timeZone),
  };
}
