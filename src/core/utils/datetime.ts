import type { ManipulateType, UnitType } from "dayjs";
import dayjs from "dayjs";

export type DateConfigType = string | number | Date;
export type DateUnitType = UnitType;
export type DateManipulateType = ManipulateType;

/**
 * Add the specified number of unit to the given date.
 * @param value
 * @param date
 * @param unit
 */
export const addDate = (value: number, date?: DateConfigType, unit: DateManipulateType = "day"): Date =>
  dayjs(date).add(value, unit).toDate();

/**
 * Add the specified number of minutes to the given date.
 * @param value
 * @param date
 */
export const addMinutes = (value: number, date?: DateConfigType): Date => addDate(value, date, "minutes");

/**
 * Add the specified number of hours to the given date.
 * @param value
 * @param date
 */
export const addHours = (value: number, date?: DateConfigType): Date => addDate(value, date, "hours");

/**
 * Add the specified number of days to the given date.
 * @param value
 * @param date
 */
export const addDays = (value: number, date?: DateConfigType): Date => addDate(value, date, "days");

/**
 * Add the specified number of months to the given date.
 * @param value
 * @param date
 */
export const addMonths = (value: number, date?: DateConfigType): Date => addDate(value, date, "months");

/**
 * Add the specified number of years to the given date.
 * @param value
 * @param date
 */
export const addYears = (value: number, date?: DateConfigType): Date => addDate(value, date, "years");

/**
 * Format the date
 * @param value
 * @param format
 */
export const formatDate = (value: DateConfigType, format: string): string => {
  const date = typeof value === "number" ? value * 1000 : value;
  return dayjs(date).format(format);
};

/**
 * Get the seconds timestamp of the given date.
 * @param date
 */
export const getUnixTime = (date?: DateConfigType): number => dayjs(date).valueOf();

/**
 * Get the date of the month of the given date.
 * @param date
 * @param unit
 */
export const getDate = (date?: DateConfigType, unit: DateUnitType = "date"): number => dayjs(date).get(unit);

/**
 * Get the month of the given date. (starts from 0 as January)
 * @param date
 */
export const getMonth = (date?: DateConfigType): number => getDate(date, "month");

/**
 * Get the day of the week by given date. (Sunday is 0, Saturday is 6)
 * @param date
 */
export const getDay = (date?: DateConfigType): number => getDate(date, "day");

/**
 * Get the hours of the given date.
 * @param date
 */
export const getHours = (date?: DateConfigType): number => getDate(date, "hour");

/**
 * Get the minutes of the given date.
 * @param date
 */
export const getMinutes = (date?: DateConfigType): number => getDate(date, "minute");

/**
 * Get the seconds of the given date.
 * @param date
 */
export const getSeconds = (date?: DateConfigType): number => getDate(date, "second");

/**
 * Get the number of full unit periods between two dates.
 * @param dateLeft
 * @param dateRight
 * @param unit
 */
export const differenceInDate = (dateLeft: DateConfigType, dateRight: DateConfigType, unit: DateUnitType): number => {
  return dayjs(dateLeft).diff(dateRight, unit);
};

/**
 * Get the number of full day periods between two dates.
 * @param dateLeft
 * @param dateRight
 */
export const differenceInDays = (dateLeft: DateConfigType, dateRight: DateConfigType): number => {
  return differenceInDate(dateLeft, dateRight, "days");
};

// convert time US "Dec 1, 2023, 12:23 PM"
export function convertTimeUS(value: DateConfigType): string {
  const date = formatDate(value.toLocaleString("en-US"), "MMM DD, YYYY");
  const time = formatDate(value, "HH:mm A");
  return `${date}, ${time}`;
}

/**
 * Convert time difference between two dates into a human-readable format.
 * @param current
 * @param previous
 * @returns
 */
export const timeDifference = (current: Date, previous: Date): string => {
  switch (true) {
    case differenceInDate(current, previous, "y") > 0: {
      return `${differenceInDate(current, previous, "y")} year(s) ago`;
    }
    case differenceInDate(current, previous, "M") > 0: {
      return `${differenceInDate(current, previous, "M")} month(s) ago`;
    }
    case differenceInDate(current, previous, "d") > 0: {
      return `${differenceInDate(current, previous, "d")} day(s) ago`;
    }
    case differenceInDate(current, previous, "h") > 0: {
      return `${differenceInDate(current, previous, "h")} hour(s) ago`;
    }
    case differenceInDate(current, previous, "m") > 0: {
      return `${differenceInDate(current, previous, "m")} minute(s) ago`;
    }
    default: {
      return `${differenceInDate(current, previous, "s")} second(s) ago`;
    }
  }
};

/**
 * Get the number of full hour periods between two dates.
 * @param dateLeft
 * @param dateRight
 */
export const differenceInHours = (dateLeft: DateConfigType, dateRight: DateConfigType): number => {
  return differenceInDate(dateLeft, dateRight, "hours");
};

/**
 * Get if two dates is same day or not.
 * @param value
 * @param compareValue
 */
export const isSameDay = (value: number, compareValue?: number): boolean => {
  return dayjs(value).isSame(dayjs(compareValue), "day");
};
/**
 * Calculate days between two date excluding weekends
 * @param fromDate
 * @param numberOfDay
 */
export function calculateTimeIncludeWeekendDays(fromDate: Date, numberOfDay: number): number {
  let numberOfDayIncludeWeekend = 0;
  let currentDay = fromDate;
  while (numberOfDay > 0) {
    numberOfDayIncludeWeekend++;
    numberOfDay--;
    currentDay = addDays(1, currentDay);
    numberOfDay += currentDay.getDay() == 6 || currentDay.getDay() == 0 ? 1 : 0;
  }
  return numberOfDayIncludeWeekend;
}

/**
 * Convert timestamp to date time with format 'Jun 13, 2022 11:19 AM'
 *
 * * */

export const convertUnixToDate = (unixTimestamp, withSurFix = true, format24h = false) => {
  // convert unix timestamp to milliseconds
  const timeDate = unixTimestamp ? unixTimestamp * 1000 : 0;

  try {
    const now: Date = new Date();
    const dateObject: Date = new Date(timeDate);
    const timeDiff = now.valueOf() - dateObject.valueOf();
    if (timeDiff <= 60000) {
      return "Just now";
    } else if (timeDiff > 60000 && timeDiff <= 60000 * 60) {
      const minutesDiff = Math.round(timeDiff / 60000);
      return `${minutesDiff} ${minutesDiff > 1 ? "minutes" : "minute"} ago`;
    } else if (timeDiff > 60000 * 60 && timeDiff <= 60000 * 60 * 24) {
      const hoursDiff = Math.round(timeDiff / (60000 * 60));
      return `${hoursDiff} ${hoursDiff > 1 ? "hours" : "hour"} ago`;
    }

    const year = dateObject.getFullYear();
    const month = ("0" + (dateObject.getMonth() + 1)).slice(-2);
    const monthString = {
      "01": "Jan",
      "02": "Feb",
      "03": "Mar",
      "04": "Apr",
      "05": "May",
      "06": "Jun",
      "07": "Jul",
      "08": "Aug",
      "09": "Sep",
      10: "Oct",
      11: "Nov",
      12: "Dec",
    };
    const date = ("0" + dateObject.getDate()).slice(-2);
    let hours = ("0" + dateObject.getHours()).slice(-2);
    const minutes = ("0" + dateObject.getMinutes()).slice(-2);
    let surFix12h = "";
    // const seconds = ('0' + date_ob.getSeconds()).slice(-2)
    if (!format24h) {
      surFix12h = parseInt(hours, 10) >= 12 ? "PM" : "AM";
      hours = (+hours % 12).toString();
    }
    if (withSurFix) {
      return `${monthString[month]} ${date}, ${year} ${hours}:${minutes} ${surFix12h}`;
    }

    return `${date}-${month}-${year}`;
  } catch (e) {
    return new Date().toLocaleDateString();
  }
};

/**
 * Format date to format Aug 11, 2022
 * @param date must be timestamps
 * @param dayNumeric set option day to numeric
 * @returns <string> date after format: Aug 11, 2022
 */
export const convertDate = (date: string | number, dayNumeric?: boolean): string => {
  const createDate = new Date(date).toLocaleDateString("en-us", {
    month: "short",
    day: dayNumeric ? "numeric" : "2-digit",
    year: "numeric",
  });
  return createDate;
};

/**
 * Format date to format Aug 11, 2022
 * @param date
 * @returns <string> date after format: Aug 11, 2022
 */
export const dateFilter = (type: string, dateType = "YYYY-MM-DD"): { from: string; to: string } => {
  let from: string;
  let to: string;
  if (type === "today") {
    from = dayjs().format(dateType);
    to = from;
  } else if (type === "yesterday") {
    from = dayjs(addDays(-1)).format(dateType);
    to = dayjs().format(dateType);
  } else if (type === "last7days") {
    from = dayjs(addDays(-7)).format(dateType);
    to = dayjs().format(dateType);
  } else if (type === "thisMonth") {
    from = dayjs().startOf("month").format(dateType);
    to = dayjs().endOf("month").format(dateType);
  }
  return { from, to };
};

/**
 * Convert today at 00:00 to unix timestamp
 * @returns time stamp after format
 */
export const convertToTimeStamp = () => {
  const toTimestamp = (strDate: string) => {
    const datum: number = Date.parse(strDate);
    return datum;
  };
  const date = new Date();
  const time = formatDate(date, "YYYY-MM-DD");
  const lastTime = `${time} 00:00`;
  return toTimestamp(lastTime);
};

/**
 * Find date excluding weekends with calculation formula: start date plus number of day
 * @param startDate
 * @param numDay
 * @returns
 */
export function calcInWeek(startDate, numDay: number) {
  const startDateCopied = new Date(startDate.getTime());
  let endDate: Date;
  const noOfDaysToAdd = numDay;
  let count = 0;
  while (count < noOfDaysToAdd) {
    endDate = new Date(startDateCopied.setDate(startDateCopied.getDate() + 1));
    if (endDate.getDay() != 0 && endDate.getDay() != 6) {
      count++;
    }
  }
  return endDate;
}

/**
 * Add days to current date
 * @param day
 * @param format
 */
export const addDayAndFormat = (day: number, format = "MMM DD, YYYY"): string => {
  const unixTime = getUnixTime(addDays(day));
  let date = new Date(unixTime);
  date = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return formatDate(date, format);
};

/**
 * calc day into YYYY-MM-DD
 * @param day
 */
export const convertToYMD = (day: string) => {
  const dateObj = new Date(day);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const desireDay = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${desireDay}`;
};

/**
 * page is dashboard fixture instance
 * @param page
 */
export const getDateRange = async page => {
  const dateRangePickerFromValue = await page.getByRole("textbox").first().inputValue();
  const dateRangePickerToValue = await page.getByRole("textbox").nth(1).inputValue();
  return { dateRangePickerFromValue, dateRangePickerToValue };
};

/**
 * Add start-day and end-day for date range picker
 * @param startDate
 * @param endDate
 */
export const getDateRangePickerDays = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffInMs = Math.abs(end.getTime() - start.getTime());
  const days = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
  return days;
};

/**
 * calc specify day from current day
 * @param day
 */
export const getDayFromCurrentDay = (day: number) => {
  const today = new Date();
  const desireDay = new Date(today);
  desireDay.setDate(today.getDate() - day);
  return String(desireDay);
};

/**
 * get week to date range
 * @param formatDate format of date
 */
export function getWeekToDateRange(formatDate) {
  const now = dayjs();
  const startOfWeek = now.day(1).startOf("day");
  const endOfWeek = now.day(7).endOf("day");
  const startDateString = startOfWeek.format(formatDate);
  const endDateString = endOfWeek.format(formatDate);
  return [startDateString, endDateString];
}

/**
 * get week to date range
 * @param formatDate format of date
 */
export function getMonthToDateRange(formatDate) {
  const now = dayjs();
  const startOfMonth = now.date(1).startOf("day");
  const endOfMonth = now.endOf("day");
  const startDateString = startOfMonth.format(formatDate);
  const endDateString = endOfMonth.format(formatDate);
  return [startDateString, endDateString];
}

/**
 * get week to date range
 * @param formatDate format of date
 */
export function getLastMonthDateRange(formatDate) {
  const now = dayjs();
  const startOfLastMonth = now.subtract(1, "month").startOf("month");
  const endOfLastMonth = now.subtract(1, "month").endOf("month");

  const startDateString = startOfLastMonth.format(formatDate);
  const endDateString = endOfLastMonth.format(formatDate);

  return [startDateString, endDateString];
}

// Return current date with type yyyy-mm-dd
export const currentDate = new Date().toJSON().slice(0, 10);

// Return current date with type mm/dd/yy
export const currentDateFormat = new Date().toLocaleDateString("en-US", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

// Return current date with type E.g. "Dec 1, 2023, 12:23 PM"
export function formatDateUS(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

/***
 * Convert date. From: yyyy/mm/dd to: mm date, yyyy. Ex: 2021/09/01 -> Sep 01, 2021
 * @param storefrontName
 * @returns string fomatted date
 */
export function convertDateFormat(date: string) {
  const dateObject = new Date(date);
  // Lấy các thành phần thời gian
  const monthAbbreviation = dateObject.toLocaleString("default", { month: "short" });
  const day = dateObject.getDate();
  const year = dateObject.getFullYear();
  // Định dạng lại chuỗi theo yêu cầu
  const formattedString = `${monthAbbreviation} ${day}, ${year}`;
  return formattedString;
}

/**
 * Asynchronously formats the given date into a string with a long month name and zero-padded day.
 * @param {Date} date - The date to be formatted.
 * @returns {Promise<string>} - The formatted date string.
 */
export function formatDateEta(date: Date): string {
  return `${date.toLocaleDateString(undefined, { month: "long" })} ${date
    .toLocaleDateString(undefined, { day: "numeric" })
    .padStart(2, "0")}`;
}
