const trackingName = document.getElementById('tracking-name');
const trackingDescription = document.getElementById('tracking-description');
const conditionType = document.getElementById('condition-type');
const conditionValue = document.getElementById('condition-value');
const conditionUnit = document.getElementById('condition-unit');
const themeColor = document.getElementById('theme-color');
const submitButton = document.getElementById('right-bar-add-new-tracking-submit-button');
const submitEditButton = document.getElementById('right-bar-edit-tracking-submit-button');
const cancelButtons = [...document.getElementsByClassName('right-bar-cancel-button')];

function clearForm() {
    trackingName.value = '';
    trackingDescription.value = '';
    conditionValue.value = '';
    conditionUnit.value = '';
    themeColor.value = '#fff';
    conditionType.value = ConditionType.Equals.description;
}

function fillFormWithTrackingData(tracking) {
    trackingName.value = tracking.name;
    trackingDescription.value = tracking.description;
    conditionType.value = tracking.conditionType.description;
    conditionValue.value = tracking.expecetedValue;
    conditionUnit.value = tracking.conditionUnit;
    themeColor.value = tracking.themeColor;
}

cancelButtons.forEach(c => {
    c.addEventListener('click', () => {
        hideAllRightTabs();
        showTrackingsMenu();
    });
});


function getFreeId() {
    let hex = "";
    do {
        hex = generateRandomHex4();
    } while (trackingList.some(x => x.id.toString() == hex))
    return hex;
}

submitButton.addEventListener('click', () => {
    showTrackingsMenu();
    const tracking = new YearTrack(trackingName.value, 2025);
    tracking.id = getFreeId();
    console.log(tracking.id);
    tracking.description = trackingDescription.value;
    tracking.themeColor = themeColor.value;
    tracking.setConditionType(getConditionType(conditionType.value));
    tracking.setExpectedValue(conditionValue.value);
    tracking.conditionUnit = conditionUnit.value;
    tracking.isSelected = false;

    trackingList.push(tracking);

    addTrackingDomElement(createTrackingItem(tracking));

    selectTracking(tracking.id);
    saveCurrentTrackingNew();
});

submitEditButton.addEventListener('click', () => {
    showTrackingsMenu();
    const tracking = currentTracking;
    const itemId = currentTracking.id;
    const index = trackingList.indexOf(currentTracking);
    tracking.name = trackingName.value;
    tracking.id = itemId;
    tracking.description = trackingDescription.value;
    tracking.themeColor = themeColor.value;
    tracking.setConditionType(getConditionType(conditionType.value));
    tracking.setExpectedValue(conditionValue.value);
    tracking.conditionUnit = conditionUnit.value;
    tracking.isSelected = false;

    trackingList[index] = tracking;

    const item = findElementByClassAndAttribute('tracking-item', "data-trackingid",  itemId);
    replaceTrackingDomElement(item, createTrackingItem(tracking));
    selectTracking(tracking.id);

    saveCurrentTrackingNew();
});

function replaceTrackingDomElement(oldElement, newElement) {
    const container = document.getElementById('right-bar-tracking-list');
    container.insertBefore(newElement, oldElement);
    oldElement.remove();
}

function addTrackingDomElement(element) {
    const container = document.getElementById('right-bar-tracking-list');
    container.appendChild(element);
}

function createTrackingItem(t) {
    const item = document.createElement('div');
    item.classList.add('tracking-item');
    item.setAttribute('data-trackingid', t.id);
    item.style.backgroundColor = t.themeColor;
    
    // Create and append the label section
    const label = document.createElement('div');
    label.classList.add('tracking-item-label');

    // Checkbox (isSelected)
    const isSelected = document.createElement('span');
    isSelected.classList.add('tracking-item-is-selected');
    isSelected.textContent = t.isSelected ? '✅' : '';
    label.appendChild(isSelected);

    // Title
    const title = document.createElement('span');
    title.classList.add('tracking-item-title');
    title.textContent = t.name;
    label.appendChild(title);

    // Select button
    const selectBtn = document.createElement('button');
    selectBtn.classList.add('tracking-item-btn', 'tracking-item-select-btn');
    selectBtn.type = 'button';
    selectBtn.textContent = '👆';
    label.appendChild(selectBtn);

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.classList.add('tracking-item-btn', 'tracking-item-edit-btn');
    editBtn.type = 'button';
    editBtn.textContent = '🛠️';
    label.appendChild(editBtn);

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.classList.add('tracking-item-btn', 'tracking-item-remove-btn');
    removeBtn.type = 'button';
    removeBtn.textContent = '❌';
    label.appendChild(removeBtn);

    item.appendChild(label);

    // Create and append the details section
    const details = document.createElement('div');
    details.classList.add('tracking-item-details');

    if (!t.isSelected) {
        details.classList.add('tracking-item-details-hidden');
    }

    // Description
    const description = document.createElement('div');
    description.classList.add('tracking-item-description');
    description.textContent = t.description;
    details.appendChild(description);

    // Condition
    const condition = document.createElement('div');
    condition.classList.add('tracking-item-condition');

    const dailyLabel = document.createElement('span');
    dailyLabel.classList.add('tracking-item-condition-daily-label');
    dailyLabel.textContent = 'Daily goal:';
    condition.appendChild(dailyLabel);

    const conditionType = document.createElement('span');
    conditionType.classList.add('tracking-item-condition-condition-type-text');
    conditionType.textContent = Condition.GetConditionString(t.conditionType);
    condition.appendChild(conditionType);

    const conditionValue = document.createElement('span');
    conditionValue.classList.add('tracking-item-condition-condition-value-text');
    conditionValue.textContent = t.expecetedValue;
    condition.appendChild(conditionValue);

    const conditionUnit = document.createElement('span');
    conditionUnit.classList.add('tracking-item-condition-condition-value-unit');
    conditionUnit.textContent = `[${t.conditionUnit}]`;
    condition.appendChild(conditionUnit);

    details.appendChild(condition);
    item.appendChild(details);

    return item;
}