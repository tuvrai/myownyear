const leftBar = document.getElementById('leftBar');
const leftBarDateInfo = document.getElementById('left-bar-date-info');
const leftBarInput = document.getElementById('left-bar-input');
const leftBarCloseButton = document.getElementById('left-bar-close-button');
const leftBarSubmitButton = document.getElementById('left-bar-submit-button');

leftBarSubmitButton.addEventListener('click', (ev)=> {
    onValueSubmit();
});

leftBarCloseButton.addEventListener('click', () => {
    closeLeftBar();
});

function onValueSubmit() {
    currentTracking.updateDay(currentTile.getAttribute('data-dayid'), "", leftBarInput.value);
    evaluateDay(currentTile);
    closeLeftBar();
    saveCurrentTrackingNew();
}

function closeLeftBar() {
    leftBar.classList.remove('active');
    cleanActiveTiles();
}

function showLeftBar(value, dayString) {
    leftBar.classList.add('active');
    showValueInLeftBar(value);
    leftBarDateInfo.innerText = dayString;
    leftBarInput.focus();
}

function showValueInLeftBar(value) {
    if (value == undefined || value == null)
    {
        leftBarInput.value = '';
    }
    else
    {
        leftBarInput.value = value;
    }
}

leftBar.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && leftBar.classList.contains('active'))
    {
        onValueSubmit();
    }
});