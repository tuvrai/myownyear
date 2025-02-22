const ConditionType = Object.freeze({
    Equals:   Symbol("equals"),
    BiggerOrEqual:  Symbol("biggerorequal"),
    SmallerOrEqual: Symbol("smallerorequal"),
    Bigger: Symbol("bigger"),
    Smaller: Symbol("smaller"),
    Contains: Symbol("contains")
});

function getConditionType(conditionType) {
    const lowerCaseMap = Object.keys(ConditionType).reduce((map, key) => {
        map[key.toLowerCase()] = ConditionType[key];
        return map;
    }, {});

    return lowerCaseMap[conditionType.toLowerCase()];
}

const ConditionResult = Object.freeze({
    Fullfilled: Symbol("Fullfilled"),
    NonFullfilled: Symbol("NonFullfilled"),
    Unknown: Symbol("Unknown"),
    Invalid: Symbol("Invalid")
});

class Condition {
    static GetConditionMethod(condtionType, expecetedValue) {
        if (condtionType == ConditionType.Equals) {
            return Equals(expecetedValue);
        }
        if (condtionType == ConditionType.BiggerOrEqual) {
            return BiggerOrEqual(expecetedValue);
        }
        if (condtionType == ConditionType.SmallerOrEqual) {
            return SmallerOrEqual(expecetedValue);
        }
        if (condtionType == ConditionType.Bigger) {
            return Bigger(expecetedValue);
        }
        if (condtionType == ConditionType.Smaller) {
            return Smaller(expecetedValue);
        }
        if (condtionType == ConditionType.Contains) {
            return Contains(expecetedValue);
        }
        return undefined;
    }

    static GetConditionString(conditionType) {
        switch (conditionType) {
            case ConditionType.Equals:
                return "Equals";
            case ConditionType.BiggerOrEqual:
                return "Bigger or equal to";
            case ConditionType.SmallerOrEqual:
                return "Smaller or equal to";
            case ConditionType.Bigger:
                return "Bigger than";
            case ConditionType.Smaller:
                return "Smaller than";
            case ConditionType.Contains:
                return "Contains";
            default:
                return "[Unknown condition]";
        }
    }
}

function IsUndefined(value) {
    return value == null || value == undefined;
}

function Equals(expectedValue) {
    return function(actualValue) {
        if (IsUndefined(actualValue))
        {
            return ConditionResult.Unknown;
        }
        const num1 = parseFloat(expectedValue);
        const num2 = parseFloat(actualValue);

        const isNum1 = !isNaN(num1) && expectedValue.toString().trim() !== ""; // Check if value1 is a valid number
        const isNum2 = !isNaN(num2) && actualValue.toString().trim() !== ""; // Check if value2 is a valid number

        if (isNum1 && isNum2) {
            return num1 == num2 ? ConditionResult.Fullfilled : ConditionResult.NonFullfilled;
        } else {
            // Otherwise, compare lexicographically as strings
            if (expectedValue < actualValue) return ConditionResult.NonFullfilled;
            if (expectedValue > actualValue) return ConditionResult.NonFullfilled;
            return ConditionResult.Fullfilled;
        }
    };
}

function BiggerOrEqual(expectedValue) {
    return function(actualValue) {
        if (IsUndefined(actualValue))
        {
            return ConditionResult.Unknown;
        }
        const num1 = parseFloat(expectedValue);
        const num2 = parseFloat(actualValue);
        
        if (isNaN(num1) || isNaN(num2))
        {
            return ConditionResult.Invalid;
        }
        else
        {
            return num2 >= num1 ? ConditionResult.Fullfilled : ConditionResult.NonFullfilled;
        }
    };
}

function SmallerOrEqual(expectedValue) {
    return function(actualValue) {
        if (IsUndefined(actualValue))
        {
            return ConditionResult.Unknown;
        }
        const num1 = parseFloat(expectedValue);
        const num2 = parseFloat(actualValue);
        
        if (isNaN(num1) || isNaN(num2))
        {
            return ConditionResult.Invalid;
        }
        else
        {
            return num2 <= num1 ? ConditionResult.Fullfilled : ConditionResult.NonFullfilled;
        }
    };
}

function Bigger(expectedValue) {
    return function(actualValue) {
        if (IsUndefined(actualValue))
        {
            return ConditionResult.Unknown;
        }
        const num1 = parseFloat(expectedValue);
        const num2 = parseFloat(actualValue);
        
        if (isNaN(num1) || isNaN(num2))
        {
            return ConditionResult.Invalid;
        }
        else
        {
            return num2 > num1 ? ConditionResult.Fullfilled : ConditionResult.NonFullfilled;
        }
    };
}

function Smaller(expectedValue) {
    return function(actualValue) {
        if (IsUndefined(actualValue))
        {
            return ConditionResult.Unknown;
        }
        const num1 = parseFloat(expectedValue);
        const num2 = parseFloat(actualValue);
        
        if (isNaN(num1) || isNaN(num2))
        {
            return ConditionResult.Invalid;
        }
        else
        {
            return num2 < num1 ? ConditionResult.Fullfilled : ConditionResult.NonFullfilled;
        }
    };
}

function Contains(expectedValue) {
    return function(actualValue) {
        return actualValue.toString().includes(expectedValue.toString()) ? ConditionResult.Fullfilled : ConditionResult.NonFullfilled;
    };

}