// =========================================================
// MOBILE NAVIGATION
// =========================================================

function toggleNav() {
    const nav = document.querySelector("nav");

    if (nav) {
        nav.classList.toggle("open");
    }
}


// =========================================================
// SESSION
// =========================================================

function getCurrentUser() {
    try {
        const storedSession =
            sessionStorage.getItem("of_session") ||
            localStorage.getItem("of_session");

        if (!storedSession) {
            return null;
        }

        return JSON.parse(storedSession);

    } catch (error) {
        sessionStorage.removeItem("of_session");
        localStorage.removeItem("of_session");

        return null;
    }
}


function clearCurrentUser() {
    sessionStorage.removeItem("of_session");
    localStorage.removeItem("of_session");
}


// =========================================================
// PROTECTED PAGE CHECK
// =========================================================

function isProtectedPage() {
    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    const protectedPages = [
        "homepage.html",
        "lost.html",
        "found.html",
        "messages.html",
        "account.html"
    ];

    return protectedPages.includes(currentPage);
}


function protectCurrentPage() {
    const currentUser = getCurrentUser();

    if (
        isProtectedPage() &&
        (!currentUser || !currentUser.user_id)
    ) {
        window.location.replace("index.html");
        return null;
    }

    return currentUser;
}


// =========================================================
// USER NAME AND LOGOUT
// =========================================================

function updateHeaderAuth() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        return;
    }

    const authContainer =
        document.querySelector(".auth-btns");

    if (!authContainer) {
        return;
    }

    /*
     * Replace the existing Manage account and Logout
     * elements without changing the surrounding header.
     */
    authContainer.innerHTML = `
        <span
            id="currentUserName"
            class="post-btn current-user-name"
            title="${escapeSharedHtml(
                currentUser.email || ""
            )}"
        >
            ${escapeSharedHtml(
                currentUser.name || "User"
            )}
        </span>

        <button
            id="logoutButton"
            class="post-btn"
            type="button"
        >
            Logout
        </button>
    `;

    const logoutButton =
        document.getElementById("logoutButton");

    logoutButton?.addEventListener(
        "click",
        function () {
            clearCurrentUser();
            window.location.replace("index.html");
        }
    );
}


// =========================================================
// UNREAD MESSAGE BADGE
// =========================================================

async function updateUnreadBadge() {
    const currentUser = getCurrentUser();

    const badges =
        document.querySelectorAll(
            "#unreadMessageCount, .message-count"
        );

    if (
        !currentUser ||
        !currentUser.user_id ||
        badges.length === 0
    ) {
        return;
    }

    try {
        const response = await fetch(
            `http://127.0.0.1:8000/messages/inbox/${currentUser.user_id}?unread_only=true`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail ||
                "Could not load unread messages"
            );
        }

        const unreadCount =
            Number(data.total_messages || 0);

        badges.forEach(function (badge) {
            badge.textContent =
                unreadCount > 99
                    ? "99+"
                    : String(unreadCount);

            badge.hidden = unreadCount === 0;
        });

    } catch (error) {
        console.error(
            "Unread-message count error:",
            error
        );

        badges.forEach(function (badge) {
            badge.hidden = true;
        });
    }
}


// =========================================================
// SHARED HTML ESCAPING
// =========================================================

function escapeSharedHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =========================================================
// PAGE INITIALIZATION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {
        const currentUser =
            protectCurrentPage();

        /*
         * Stop initialization if a protected page is
         * redirecting to index.html.
         */
        if (isProtectedPage() && !currentUser) {
            return;
        }

        updateHeaderAuth();
        updateUnreadBadge();
    }
);