var trackingList = [];
const currentDayId = undefined;
let currentTile = undefined;
let currentTileId = undefined;
let currentTrackingId = undefined;
let currentTracking = undefined;

const grid = document.getElementById('tileGrid');
const viewOptions = document.getElementsByName('viewOption');
const mainLabelHeader = document.getElementById('tracking-main-label');

const defaultTracking = new YearTrack("No trackings defined", 2025);

mainLabelHeader.innerText = '2025';

const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
];

const daysInMonth = [
    31, 28, 31, 30, 31, 30, 
    31, 31, 30, 31, 30, 31
];

document.addEventListener('keydown', (ev) => {
    if (ev.key == "ArrowRight") {
        nextTile();
    }
    else if (ev.key == "ArrowLeft") {
        previousTile();
    }
});


document.getElementById('tileGrid').addEventListener('click', (ev) => {
    onTileClick(ev.target);
});

function onTileClick(tile) {
    currentTile = tile;
    cleanActiveTiles();
    currentTile.classList.add('tile-selected');
    const dayId = currentTile.getAttribute('data-dayid');
    const dayValue = currentTracking.getValueAt(dayId);
    showLeftBar(dayValue, currentTracking.getDayString(dayId));
}

function cleanActiveTiles() {
    [...document.querySelectorAll('.tile-selected')].forEach(x => x.classList.remove('tile-selected'));
}

function nextTile() {
    if (currentTile != undefined)
    {
        try
        {
            const tile = document.getElementsByClassName('tile')[Number(currentTile.getAttribute('data-dayid'))];
            onTileClick(tile);
        }
        catch
        {
            console.log("error nextTile");
        }
    }
}

function previousTile() {
    if (currentTile != undefined)
    {
        try
        {
            const tile = document.getElementsByClassName('tile')[Number(currentTile.getAttribute('data-dayid') - 2)];
            onTileClick(tile);
        }
        catch
        {
            console.log("error previousTile");
        }
    }
}

function generateAllDays() {
    grid.innerHTML = '';
    grid.classList.remove('tile-grid-month');
    grid.classList.add('tile-grid');
    for (let i = 1; i <= 365; i++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.setAttribute("data-dayid", i);
        tile.innerText = i.toString();
        grid.appendChild(tile);
        evaluateDay(tile);
    }
}

function generateMonthly() {
    grid.innerHTML = '';
    grid.classList.remove('tile-grid');
    grid.classList.add('tile-grid-month');
    let dayCounter = 1;

    months.forEach((month, index) => {
        const monthLabel = document.createElement('div');
        monthLabel.className = 'month-label';
        monthLabel.textContent = month;
        grid.appendChild(monthLabel);

        for (let day = 1; day <= daysInMonth[index]; day++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.setAttribute("data-dayid", dayCounter);
            tile.innerText = day.toString();
            grid.appendChild(tile);
            evaluateDay(tile);
            dayCounter++;
        }
    });
}

function evaluateDay(tile) {
    const evaluation = currentTracking.evaluateDay(tile.getAttribute('data-dayid'));
    const tileStatusMap = {
        [ConditionResult.Unknown]: 'tile-unknown',
        [ConditionResult.Fullfilled]: 'tile-fullfilled',
        [ConditionResult.NonFullfilled]: 'tile-unfullfilled',
        [ConditionResult.Invalid]: 'tile-invalid'
    };
    const newClass = tileStatusMap[evaluation] || 'tile-unknown';
    tile.classList.remove('tile-fullfilled', 'tile-unfullfilled', 'tile-unknown', 'tile-invalid');
    tile.classList.add(newClass);
}

function updateView() {
    const selectedOption = Array.from(viewOptions).find(option => option.checked).value;
    if (selectedOption === 'all') {
        generateAllDays();
    } else {
        generateMonthly();
    }
    setMainView();
}

viewOptions.forEach(option => {
    option.addEventListener('change', updateView);
});


async function fetchTrackings() {
    try {
      // Fetch the JSON data from the API
      const response = await fetch('/api/trackings');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the JSON response into a list of objects
      const trackings = await response.json();

      // Render the trackings to the DOM
      reloadTrackings(trackings);
      updateView();
    } catch (error) {
      console.error('Error fetching trackings:', error);
    }
  }

  // Function to render the trackings into a list
  function reloadTrackings(trackings) {
    trackings = trackings.sort((a,b) => Date.parse(a.date)-Date.parse(b.date));
    clearTrackingList();
    selectFirstTrackingOrDefault();
    trackings.forEach(t => {
        if (trackings.length != new Set(trackings.map(t => t.id)).size)
        {
            throw new Error("Many trackings with id "+t.id);
        }
        const tracking = new YearTrack(t.name, t.year);
        tracking.id = t.id;
        tracking.description = t.description;
        tracking.date = Date.parse(t.date);
        tracking.themeColor = t.themeColor;
        tracking.setConditionType(getConditionType(t.conditiontype));
        tracking.setExpectedValue(t.conditionvalue);
        tracking.conditionUnit = t.unit;
        tracking.isSelected = false;
        t.days.forEach(element => {
            tracking.updateDay(element.id, element.description, element.value);
        });

        trackingList.push(tracking);
    });
    createTrackings();
    selectFirstTrackingOrDefault();
    }

    function createTrackings() {
        trackingList.forEach(t => {
            addTrackingDomElement(createTrackingItem(t));
        });
    }

    function selectFirstTrackingOrDefault() {
        if (trackingList.length > 0)
        {
            selectTracking(trackingList[0].id);
        }
        else 
        {
            currentTracking = defaultTracking;
        }
    }


    function selectTracking(id) {
        currentTrackingId = id;
        currentTracking = trackingList.find(x => x.id == id);
        collapseAllItems();
        const selectedItem = findElementByClassAndAttribute('tracking-item', "data-trackingid",  id.toString())
        expandTrackingItem(selectedItem);
        updateView();
    }
    
    function removeTracking(id) {
        removeTrackingFromList(id);
        selectFirstTrackingOrDefault();
        updateView();
        removeTrackingAt(id);
    }

    function removeTrackingFromList(id) {
        const selectedItem = findElementByClassAndAttribute('tracking-item', "data-trackingid",  id.toString());
        selectedItem.remove();
        const indexOfElement = trackingList.findIndex(item => item.id === tracking.id);
        trackingList.splice(indexOfElement, 1);
    }

    function clearTrackingList() {
        document.querySelectorAll('.tracking-item').forEach(element => {
            element.remove();
        });
        trackingList = [];        
    }

    function setMainView() {
        document.getElementsByTagName('body')[0].style.backgroundColor = currentTracking.themeColor;
        mainLabelHeader.innerText = currentTracking.getMainLabel();
        mainLabelHeader.style.color = getTextColorForBackground(currentTracking.themeColor);
        document.querySelector('.controls').style.color = getTextColorForBackground(currentTracking.themeColor);
    }

    function getTextColorForBackground(hex) {
        // Remove the hash if it exists
        hex = hex.replace('#', '');
    
        // Convert hex to RGB
        let r = parseInt(hex.slice(0, 2), 16);
        let g = parseInt(hex.slice(2, 4), 16);
        let b = parseInt(hex.slice(4, 6), 16);
    
        // Calculate luminance using the formula: 
        // Luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B
        let luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    
        // Return black for light backgrounds and white for dark backgrounds
        return luminance > 128 ? '#000000' : '#ffffff';
    }

    function generateRandomHex4() {
        return Math.floor(Math.random() * 65535).toString(16).padStart(4, '0');
    }
    

    function findElementByClassAndAttribute(className, attributeName, value) {
        return document.querySelector(`.${className}[${attributeName}="${value}"]`);
    }

    function saveCurrentTracking() {
        var xhr = new XMLHttpRequest();
        var url = "/api/trackings/update/"+currentTracking.id.toString();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.status === 200) {
                console.log(xhr.responseText);
            }
            else {
                console.log("ERROR " + xhr.responseText);
            }
        };
        var data = currentTracking.exportToJson();
        xhr.send(data);
    }

    function saveCurrentTrackingNew() {
        var xhr = new XMLHttpRequest();
        var url = "/api/trackings/eupdate/"+currentTracking.id.toString();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.status === 200) {
                console.log(xhr.responseText);
            }
            else {
                console.log("ERROR " + xhr.responseText);
            }
        };
        var tracking = currentTracking.exportToJson();
        xhr.send(JSON.stringify({tracking: tracking, token: currentToken}));
    }
    
    function logoutSession() {
        var xhr = new XMLHttpRequest();
        var url = "/elogout/";
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.status === 200) {
                console.log(xhr.responseText);
            }
            else {
                console.log("ERROR " + xhr.responseText);
            }
        };
        xhr.send(JSON.stringify({token: currentToken}));
    }

    async function getCurrentUserTrackings()
    {
        try {
            // Send the request
            const response = await fetch('/api/etrackings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({token: currentToken}),
            });
    
            // Parse and handle the response
            const data = await response.json();
    
            if (response.ok) {
                console.log(data.trackings);
                reloadTrackings(data.trackings);
                updateView();
            } else {
                alert(`Trackings failed: ${data.error}`);
                console.error('Error:', data);
            }
        } catch (error) {
            alert('An error occurred while trying to get trackings.');
            console.error('Error:', error);
        }
    }

    function removeTrackingAt(id) {
        var xhr = new XMLHttpRequest();
        var url = "/api/trackings/eremove/"+ id.toString();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.status === 200) {
                console.log(xhr.responseText);
            }
            else {
                console.log("ERROR " + xhr.responseText);
            }
        };
        var data = JSON.stringify({remove: true, id: id, token: currentToken});
        xhr.send(data);
    }

    function hideAllRightTabs() {
        [...document.querySelectorAll('.right-bar-menu-tab')].forEach(x => {
            x.style.display = 'none';
        });
    }
reloadTrackings([]);
updateView();
toggleLoginLogoutButtons();

