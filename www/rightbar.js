const rightBar = document.getElementById('rightBar');
const rightBarTrackingsMenu = document.getElementById('right-bar-trackings-menu');
const rightBarEditTrackingsMenu = document.getElementById('right-bar-edit-tracking-form');
const rightBarAddNewTrackingBtn = document.getElementById('tracking-item-add-new');
const rightBarLoginToAddTrackingsBtn = document.getElementById('tracking-item-login-hint');
const rightBarCurrentMenuTitle = document.getElementById('right-bar-current-menu-title')
const hamburgerMenu = document.getElementById('hamburgerMenu');

rightBarAddNewTrackingBtn.addEventListener('click', (ev) => {
    showNewTrackingsMenu();
});

rightBarLoginToAddTrackingsBtn.addEventListener('click', () => {
    onLoginInit();
});

hamburgerMenu.addEventListener('click', () => {
    showRightBar();
});

function showTrackingsMenu() {
    rightBarCurrentMenuTitle.innerText = "Trackings";
    rightBarTrackingsMenu.style.display = 'initial';
    rightBarEditTrackingsMenu.style.display = 'none';
}

function showNewTrackingsMenu() {
    rightBarCurrentMenuTitle.innerText = "New Tracking";
    rightBarTrackingsMenu.style.display = 'none';
    rightBarEditTrackingsMenu.style.display = 'initial';

    submitButton.style.display = 'initial';
    submitEditButton.style.display = 'none';

    clearForm();
}

function showEditTrackingsMenu() {
    rightBarCurrentMenuTitle.innerText = "Edit Tracking";
    rightBarTrackingsMenu.style.display = 'none';
    rightBarEditTrackingsMenu.style.display = 'initial';

    submitButton.style.display = 'none';
    submitEditButton.style.display = 'initial';

    fillFormWithTrackingData(currentTracking);
}

function showRightBar() {
    rightBar.classList.toggle('active');
    if (rightBar.classList.contains('active'))
    {
        hideAllRightTabs();
        showTrackingsMenu();
    }
}

function expandTrackingItem(item) {
    item.classList.add('tracking-item-selected');
    item.querySelector('.tracking-item-is-selected').innerText = '✅';
    item.querySelector('.tracking-item-details').classList.remove('tracking-item-details-hidden');
    item.querySelector('.tracking-item-details').classList.add('tracking-item-details-shown');
    
    item.querySelector('.tracking-item-select-btn').style.display = 'none';
    item.querySelector('.tracking-item-edit-btn').style.display = 'initial';
    item.querySelector('.tracking-item-remove-btn').style.display = 'initial';
}

function collapseTrackingItem(item) {
    item.classList.remove('tracking-item-selected');
    item.querySelector('.tracking-item-is-selected').innerText = '';
    item.querySelector('.tracking-item-details').classList.add('tracking-item-details-hidden');
    item.querySelector('.tracking-item-details').classList.remove('tracking-item-details-shown');
    
    item.querySelector('.tracking-item-select-btn').style.display = 'initial';
    item.querySelector('.tracking-item-edit-btn').style.display = 'none';
    item.querySelector('.tracking-item-remove-btn').style.display = 'none';
}

function collapseAllItems() {
    [...document.getElementsByClassName('tracking-item')].forEach(x =>{
        collapseTrackingItem(x);
    });
}

rightBarTrackingsMenu.addEventListener('click', (ev) => {
    if (ev.target.classList.contains('tracking-item-edit-btn'))
    {
        showEditTrackingsMenu();
    }
    if (ev.target.classList.contains('tracking-item-remove-btn'))
    {
        const answer = confirm("Are you sure you want to delete this item?\nIt will be deleted permanently.")
        if (answer){
            removeTracking(currentTracking.id);
        }
    }
});

rightBarTrackingsMenu.addEventListener('click', (ev) => {
    if (ev.target.classList.contains('tracking-item-select-btn'))
    {
        const selectedItem = ev.target.closest('.tracking-item');
        selectTracking(selectedItem.dataset.trackingid);
    }
});
