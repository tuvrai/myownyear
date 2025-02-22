class YearTrack {
  constructor(name, year) {
    this.id = 0;
    this.year = year;
    this.date = Date.now();
    this.yearDayCount = this.getYearDayCount();
    this.expecetedValue = undefined;
    this.conditionType = undefined;
    this.conditionMethod = undefined;
    if (this.isNameCorrect(name))
    {
      this.name = name;
    }
    else
    {
      throw new Error('year track name cannot be empty!');
    }
    this.description = '';
    this.conditionUnit = '';
    this.themeColor = "#ffffff";
    this.days = this.initializeDays();
  }

  setExpectedValue(val) {
    this.expecetedValue = val;
    this.setConditionMethod();
  }

  setConditionType(type) {
    this.conditionType = type;
    this.setConditionMethod();
  }

  setConditionMethod() {
    if (this.expecetedValue != undefined && this.conditionType != undefined) {
      this.conditionMethod = Condition.GetConditionMethod(this.conditionType, this.expecetedValue);
    }
  }

  getDayString(dayId) {
    if (dayId >= 1 && dayId <= this.yearDayCount)
    {
       return this.getDayString(dayId);
    }
    return "INCORRECT DAY";
  }

   getDateFromDayOfYear(dayOfYear, year) {
    const date = new Date(year, 0, 1);
    return this.addDays(date, dayOfYear - 1);
  }

   addDays(date, days) {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate;
}
 formatDateToString(date) {
  const options = {
    weekday: 'long', // Full day name (e.g., "Thursday")
    day: '2-digit',  // Two-digit day (e.g., "25")
    month: 'long',   // Full month name (e.g., "December")
    year: 'numeric'  // Full year (e.g., "2025")
  };

  return new Intl.DateTimeFormat('en-US', options).format(date);
}

  getDayString(dayOfYear) {
    const date = this.getDateFromDayOfYear(dayOfYear, this.year);
    return this.formatDateToString(date);
  }

  evaluateDay(dayId) {
    const dayNumber = Number(dayId);
    if (!isNaN(dayNumber) && dayNumber >= 1 && dayNumber <= this.yearDayCount)
    {
       const day = this.days[dayId - 1];
       if (day == undefined || IsUndefined(day.currentValue) || day.currentValue.toString().length == 0)
       {
          return ConditionResult.Unknown;
       }
       return this.conditionMethod(day.currentValue);
    }
  }

  initializeDays() {
    const days = [];
    for (let i = 1; i <= this.yearDayCount; i++) {
      days.push(new CalendarDay(i));
    }
    return days;
  }

  getDay(dayId) {
    return this.days[dayId - 1];
  }

  updateDay(dayId, description, conditionValue) {
    const day = this.getDay(dayId);
    if (day) {
      day.updateDescription(description);
      day.updateCurrentValue(conditionValue);
    }
  }

  getValueAt(dayId) {
    return this.getDay(dayId).currentValue;
  }

  // Get all data for the year
  getAllDays() {
    return this.days;
  }

  getYearDayCount() {
    if (this.leapYear(this.year))
    {
      return 366;
    }
    return 365;
  }

  leapYear(year) {
    return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
  }

  isNameCorrect(name) {
    return name != null && name != undefined && name != "";
  }

  getMainLabel() {
    return `${this.name} ${this.year}`;
  }

  exportToJson() {
    const exportObj = {
      id: this.id,
      name: this.name,
      date: new Date(this.date).toISOString(),
      description: this.description,
      conditiontype: this.conditionType.description.toLowerCase(),
      conditionvalue: this.expecetedValue,
      unit: this.conditionUnit,
      themeColor: this.themeColor,
      year: this.year,
      days: [...this.days.filter(x => !IsUndefined(x.currentValue)).map(x => ({
        id: x.dayId,
        value: x.currentValue
      }))]
    }
    return JSON.stringify(exportObj);
  }
}