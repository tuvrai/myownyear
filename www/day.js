class CalendarDay {
    constructor(dayId, description = "", currentValue = undefined)
    {
      this.dayId = dayId; // Numeral ID of the calendar day
      this.description = description; // Description of the day
      this.currentValue = currentValue; // Condition value (e.g., weather, status)
    }

    updateDescription(newDescription) {
        this.description = newDescription;
      }
    
      updateCurrentValue(newConditionValue) {
        this.currentValue = newConditionValue;
      }
}