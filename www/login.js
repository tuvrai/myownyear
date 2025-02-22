const loginViewBtn = document.getElementById('login-view-btn');
const trackingsViewBtn = document.getElementById('trackings-view-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginForm = document.getElementById('right-bar-login-form');
const registerForm = document.getElementById('right-bar-register-form');
const forgotPwdForm = document.getElementById('right-bar-forgot-pwd-form');
const title = document.getElementById('right-bar-current-menu-title');

const loginStatus = document.getElementById('login-status');

const register = document.getElementById('register-account-option-p');
const forgotPassword = document.getElementById('forgot-password-option-p');

let currentToken = undefined;
let currentUser = undefined;

loginViewBtn.addEventListener('click', (ev) => {
    onLoginInit();
});

trackingsViewBtn.addEventListener('click', (ev) => {
    hideAllRightTabs();
    showTrackingsMenu();
});

function onLoginInit() {
    hideAllRightTabs();
    loginForm.style.display = 'block';
    title.innerText = 'Login';
}

function onLogout()
{
    currentToken = undefined;
    currentUser = undefined;
    clearTrackingList();
    selectFirstTrackingOrDefault();
    hideAllRightTabs();
    showTrackingsMenu();
    toggleLoginLogoutButtons();
    loginStatus.innerText = 'Logged off';

    document.cookie = `currenttoken=; max-age=0`;
}

function onLogin()
{
    hideAllRightTabs();
    showTrackingsMenu();
    toggleLoginLogoutButtons();
}

register.addEventListener('click', () => {
    hideAllRightTabs();
    title.innerText = 'Register';
    registerForm.style.display = 'block';
});

document.getElementById('right-bar-register-submit-button').addEventListener('click', async () => {
    // Get form values
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const passwordRepeat = document.getElementById('register-password-repeat').value;

    // Validate input
    if (!email || !password || !passwordRepeat) {
        alert('Please fill in all fields!');
        return;
    }

    if (password !== passwordRepeat) {
        alert('Passwords do not match!');
        return;
    }

    // Create the request payload
    const payload = {
        email: email,
        password: password,
    };

    try {
        // Send the request
        const response = await fetch('/eregister', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        // Parse and handle the response
        const data = await response.json();

        if (response.ok) {
            console.log('User registered:', data);
        } else {
            console.error('Error:', data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

document.getElementById('right-bar-login-submit-button').addEventListener('click', async () => {
    // Get form values
    const email = document.getElementById('login-login').value;
    const password = document.getElementById('login-password').value;

    // Validate input
    if (!email || !password) {
        alert('Please fill in all fields!');
        return;
    }

    document.getElementById('login-login').value = '';
    document.getElementById('login-password').value = '';

    // Create the request payload
    const payload = {
        email: email,
        password: password,
    };

    try {
        // Send the request
        const response = await fetch('/elogin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        // Parse and handle the response
        const data = await response.json();

        if (response.ok) {
            currentToken = data.token;
            document.cookie = `currenttoken=${currentToken}; max-age=${60 * 60 * 24 * 7}`;
            await getCurrentUserTrackings();
        } else {
            alert(`Login failed: ${data.error}`);
            console.error('Error:', data);
        }
    } catch (error) {
        alert('An error occurred while trying to login.');
        console.error('Error:', error);
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        // Send the request
        const response = await fetch('/elogout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({token: currentToken}),
        });
        
        // Parse and handle the response
        const data = await response.json();
        console.log(data);
        if (response.ok) {
            onLogout();
            updateView();
        } else {
            alert(`Logout failed: ${data.error}`);
            console.error('Error:', data);
        }
    } catch (error) {
        alert('An error occurred while trying to logout.');
        console.error('Error:', error);
    }
});

function toggleLoginLogoutButtons()
{
    if (!currentUser) {
        loginViewBtn.style.display = 'initial';
        logoutBtn.style.display = 'none';
        rightBarAddNewTrackingBtn.style.display = 'none';
        rightBarLoginToAddTrackingsBtn.style.display = 'block';
    } else {
        loginViewBtn.style.display = 'none';
        logoutBtn.style.display = 'initial';
        rightBarAddNewTrackingBtn.style.display = 'block';
        rightBarLoginToAddTrackingsBtn.style.display = 'none';
    }
}