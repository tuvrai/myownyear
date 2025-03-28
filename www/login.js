const loginViewBtn = document.getElementById('login-view-btn');
const trackingsViewBtn = document.getElementById('trackings-view-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginForm = document.getElementById('right-bar-login-form');
const loginMessageElement = document.querySelector("#message-login");

const registerForm = document.getElementById('right-bar-register-form');
const forgotPwdForm = document.getElementById('right-bar-forgot-pwd-form');
const title = document.getElementById('right-bar-current-menu-title');

const loginStatus = document.getElementById('login-status');

const register = document.getElementById('register-account-option-p');
const forgotPassword = document.getElementById('forgot-password-option-p');
const registerMessageElement = document.querySelector("#message-register");

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

document.getElementById('right-bar-register-submit-button').addEventListener('click', OnRegisterFormSubmitted);

document.getElementById('right-bar-login-submit-button').addEventListener('click', OnLoginFormSubmitted);

async function OnRegisterFormSubmitted(ev)
{
    setRegisterOkMessage("Processing registration...");
    if (ev)
    {
        ev.target.blur();
    }

    try {
        const errorMsg = await RegisterProcess(); 

        if (errorMsg) {
            setRegisterNokMessage(errorMsg);
        } else {
            setRegisterOkMessage("✅ Registration successful! Now you can log in.");
        }
    } catch (error) {
        setRegisterNokMessage("⚠ An unexpected error occurred. Please try again.");
        console.error(error);
    }
}

async function RegisterProcess()
{
    // Get form values
    const login = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const passwordRepeat = document.getElementById('register-password-repeat').value;

    // Validate input
    if (!login || !password || !passwordRepeat) {
        return 'Please fill in all fields!';
    }

    if (password !== passwordRepeat) {
        return 'Passwords do not match!';
    }

    // Create the request payload
    const payload = {
        email: login,
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

        if (!response.ok) {
            return 'Error: '+ data.error.toString();
        }
    } catch (error) {
        return 'Error: '+error.toString();
    }
}

async function OnLoginFormSubmitted()
{
    // Get form values
    const email = document.getElementById('login-login').value;
    const password = document.getElementById('login-password').value;

    // Validate input
    if (!email || !password) {
        setLoginNokMessage('Please fill in all fields!');
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
            setLoginNokMessage(`${data.error}`);
            console.error('Error:', data);
        }
    } catch (error) {
        setLoginNokMessage('An error occurred while trying to login.');
        console.error('Error:', error);
    }
}

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
            setLoginNokMessage(`Logout failed: ${data.error}`);
            console.error('Error:', data);
        }
    } catch (error) {
        setLoginNokMessage('An error occurred while trying to logout.');
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

function setMessage(element, text, type) {
    element.textContent = text;

    // Remove both classes first to reset state
    element.classList.remove("register-message-ok", "register-message-nok");

    // Add the correct class based on type
    if (type === "ok") {
        element.classList.add("register-message-ok");
    } else if (type === "nok") {
        element.classList.add("register-message-nok");
    }
}

// Wrapper functions for clarity
function setLoginOkMessage(text) {
    setMessage(loginMessageElement, text, "ok");
}

function setLoginNokMessage(text) {
    setMessage(loginMessageElement, text, "nok");
}

function setRegisterOkMessage(text) {
    setMessage(registerMessageElement, text, "ok");
}

function setRegisterNokMessage(text) {
    setMessage(registerMessageElement, text, "nok");
}

function cleanFormMessages() {
    [loginMessageElement, registerMessageElement].forEach(element => {
        element.textContent = "";
        element.classList.remove("register-message-ok", "register-message-nok");
    });
}




function validateUsername(username) {
    const errors = [];

    // Rule 1: Check length (3 to 30 characters)
    if (username.length < 3 || username.length > 30) {
        errors.push("Username must be between 3 and 30 characters.");
    }

    // Rule 2: Allow only letters, numbers, dots, underscores, and hyphens
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
        errors.push("Username can only contain letters, numbers, dots (.), underscores (_), and hyphens (-).");
    }

    // Rule 3: No leading or trailing special characters
    if (/^[._-]|[._-]$/.test(username)) {
        errors.push("Username cannot start or end with a dot (.), underscore (_), or hyphen (-).");
    }

    // Rule 4: No consecutive special characters (e.g., "..", "__", "--")
    if (/(\.\.|__|--)/.test(username)) {
        errors.push("Username cannot contain consecutive dots (..), underscores (__), or hyphens (--).");
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}