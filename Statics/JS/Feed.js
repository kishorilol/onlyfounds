const API_BASE_URL = "http://127.0.0.1:8000";


const CATEGORIES = [
    "Electronics",
    "Keys",
    "Bag",
    "Pet",
    "Documents",
    "Jewelry",
    "Clothing",
    "Bike",
    "Other"
];


const CATEGORY_ICONS = {
    Electronics: "📱",
    Keys: "🔑",
    Bag: "👜",
    Pet: "🐶",
    Documents: "📄",
    Jewelry: "💍",
    Clothing: "👕",
    Bike: "🚲",
    Other: "📦"
};


let POSTS = [];

let activeStatus = "all";
let activeCats = new Set();
let searchTerm = "";
let locationTerm = "";
let dateFilter = "all";
let sortOrder = "newest";


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


const currentUser = getCurrentUser();


if (!currentUser || !currentUser.user_id) {
    window.location.replace("index.html");
}


function initializeCurrentUser() {
    const currentUserName =
        document.getElementById("currentUserName");

    if (currentUserName && currentUser) {
        currentUserName.textContent =
            currentUser.name || "User";
    }
}


const logoutButton =
    document.getElementById("logoutButton");


logoutButton?.addEventListener(
    "click",
    function () {
        sessionStorage.removeItem("of_session");
        localStorage.removeItem("of_session");

        window.location.replace("index.html");
    }
);


// =========================================================
// SECURITY
// =========================================================

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {
    return escapeHtml(value)
        .replaceAll("`", "&#096;");
}


// =========================================================
// DISPLAY HELPERS
// =========================================================

function showFeedMessage(message) {
    const messageBox =
        document.getElementById("feedMessage");

    if (!messageBox) {
        return;
    }

    messageBox.textContent = message;
    messageBox.hidden = false;
}


function hideFeedMessage() {
    const messageBox =
        document.getElementById("feedMessage");

    if (!messageBox) {
        return;
    }

    messageBox.textContent = "";
    messageBox.hidden = true;
}


function getCategoryIcon(category) {
    if (!category) {
        return "📦";
    }

    const cleanCategory = String(category)
        .replace(
            /^[^\p{L}\p{N}]+/u,
            ""
        )
        .trim();

    return CATEGORY_ICONS[cleanCategory] || "📦";
}


function formatDate(dateValue) {
    if (!dateValue) {
        return "Date not provided";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return String(dateValue);
    }

    return new Intl.DateTimeFormat(
        "en",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    ).format(date);
}


function daysAgo(dateValue) {
    if (!dateValue) {
        return Number.POSITIVE_INFINITY;
    }

    const itemDate = new Date(dateValue);
    const currentDate = new Date();

    itemDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    const difference =
        currentDate.getTime() - itemDate.getTime();

    return Math.floor(
        difference / (1000 * 60 * 60 * 24)
    );
}


// =========================================================
// STATISTICS
// =========================================================

async function loadHomepageStatistics() {
    const lostElement =
        document.getElementById("lostPostCount");

    const foundElement =
        document.getElementById("foundPostCount");

    const reunitedElement =
        document.getElementById("reunitedPostCount");

    try {
        const response = await fetch(
            `${API_BASE_URL}/posts/stats`
        );

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(
                responseData.detail ||
                "Could not retrieve statistics"
            );
        }

        const statistics =
            responseData.statistics;

        if (lostElement) {
            lostElement.textContent =
                Number(
                    statistics.lost_posts || 0
                ).toLocaleString();
        }

        if (foundElement) {
            foundElement.textContent =
                Number(
                    statistics.found_posts || 0
                ).toLocaleString();
        }

        if (reunitedElement) {
            reunitedElement.textContent =
                Number(
                    statistics.reunited_items || 0
                ).toLocaleString();
        }

    } catch (error) {
        console.error(
            "Could not load statistics:",
            error
        );

        /*
         * If /posts/stats is unavailable, calculate
         * visible counts from the loaded feed.
         */
        updateStatisticsFromPosts();
    }
}


function updateStatisticsFromPosts() {
    const lostElement =
        document.getElementById("lostPostCount");

    const foundElement =
        document.getElementById("foundPostCount");

    const reunitedElement =
        document.getElementById("reunitedPostCount");

    const lostCount = POSTS.filter(
        post =>
            post.status === "lost" &&
            post.resolved !== true
    ).length;

    const foundCount = POSTS.filter(
        post =>
            post.status === "found" &&
            post.resolved !== true
    ).length;

    const reunitedCount = POSTS.filter(
        post => post.resolved === true
    ).length;

    if (lostElement) {
        lostElement.textContent =
            lostCount.toLocaleString();
    }

    if (foundElement) {
        foundElement.textContent =
            foundCount.toLocaleString();
    }

    if (reunitedElement) {
        reunitedElement.textContent =
            reunitedCount.toLocaleString();
    }
}


// =========================================================
// FETCH POSTS
// =========================================================

async function loadPosts() {
    const board =
        document.getElementById("board");

    const resultCount =
        document.getElementById("resultCount");

    hideFeedMessage();

    if (board) {
        board.innerHTML = `
            <div class="empty-state">
                Loading posts...
            </div>
        `;
    }

    if (resultCount) {
        resultCount.textContent =
            "Loading posts...";
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/posts/feed?limit=100&offset=0`
        );

        let responseData = null;

        try {
            responseData = await response.json();
        } catch (error) {
            responseData = null;
        }

        if (!response.ok) {
            throw new Error(
                responseData?.detail ||
                "Could not retrieve posts"
            );
        }

        POSTS = Array.isArray(responseData.posts)
            ? responseData.posts
            : [];

        render();
        updateStatisticsFromPosts();

    } catch (error) {
        POSTS = [];

        if (board) {
            board.innerHTML = `
                <div class="empty-state">
                    Posts could not be loaded.
                </div>
            `;
        }

        if (resultCount) {
            resultCount.textContent =
                "0 posts";
        }

        if (error instanceof TypeError) {
            showFeedMessage(
                "Cannot connect to the backend. Make sure FastAPI is running at http://127.0.0.1:8000."
            );
        } else {
            showFeedMessage(error.message);
        }
    }
}


// =========================================================
// CATEGORY FILTERS
// =========================================================

function buildCategoryChips() {
    const wrapper =
        document.getElementById("categoryChips");

    if (!wrapper) {
        return;
    }

    wrapper.innerHTML = CATEGORIES.map(
        category => `
            <button
                class="chip"
                data-cat="${escapeAttribute(category)}"
                type="button"
            >
                ${CATEGORY_ICONS[category]}
                ${escapeHtml(category)}
            </button>
        `
    ).join("");

    wrapper
        .querySelectorAll(".chip")
        .forEach(function (chip) {
            chip.addEventListener(
                "click",
                function () {
                    const category =
                        chip.dataset.cat;

                    if (activeCats.has(category)) {
                        activeCats.delete(category);
                        chip.classList.remove("on");
                    } else {
                        activeCats.add(category);
                        chip.classList.add("on");
                    }

                    render();
                }
            );
        });
}


// =========================================================
// FILTER EVENT LISTENERS
// =========================================================

const statusToggleElement =
    document.getElementById("statusToggle");


statusToggleElement?.addEventListener(
    "click",
    function (event) {
        const button =
            event.target.closest("button");

        if (!button) {
            return;
        }

        activeStatus = button.dataset.s;

        statusToggleElement
            .querySelectorAll("button")
            .forEach(function (item) {
                item.classList.remove("on");
            });

        button.classList.add("on");

        render();
    }
);


const searchElement =
    document.getElementById("searchInput");


searchElement?.addEventListener(
    "input",
    function (event) {
        searchTerm = event.target.value
            .trim()
            .toLowerCase();

        render();
    }
);


const locationElement =
    document.getElementById("locationInput");


locationElement?.addEventListener(
    "input",
    function (event) {
        locationTerm = event.target.value
            .trim()
            .toLowerCase();

        render();
    }
);


const dateElement =
    document.getElementById("dateSelect");


dateElement?.addEventListener(
    "change",
    function (event) {
        dateFilter = event.target.value;
        render();
    }
);


const sortElement =
    document.getElementById("sortSelect");


sortElement?.addEventListener(
    "change",
    function (event) {
        sortOrder = event.target.value;
        render();
    }
);


const clearFiltersElement =
    document.getElementById("clearFilters");


clearFiltersElement?.addEventListener(
    "click",
    function () {
        activeStatus = "all";
        activeCats.clear();
        searchTerm = "";
        locationTerm = "";
        dateFilter = "all";
        sortOrder = "newest";

        if (searchElement) {
            searchElement.value = "";
        }

        if (locationElement) {
            locationElement.value = "";
        }

        if (dateElement) {
            dateElement.value = "all";
        }

        if (sortElement) {
            sortElement.value = "newest";
        }

        document
            .querySelectorAll(".chip")
            .forEach(function (chip) {
                chip.classList.remove("on");
            });

        document
            .querySelectorAll(
                "#statusToggle button"
            )
            .forEach(function (button) {
                button.classList.remove("on");
            });

        document
            .querySelector(
                '#statusToggle button[data-s="all"]'
            )
            ?.classList.add("on");

        render();
    }
);


function handlePostMediaError(imageElement) {
    console.error(
        "Could not load post image:",
        imageElement.src
    );

    const errorBox = document.createElement("div");

    errorBox.className = "post-media-error";
    errorBox.textContent = "📷 Image unavailable";

    imageElement.replaceWith(errorBox);
}


// =========================================================
// RENDER POSTS
// =========================================================

function render() {
    const board =
        document.getElementById("board");

    const resultCount =
        document.getElementById("resultCount");

    if (!board) {
        return;
    }

    let items = POSTS.filter(function (post) {
        const postStatus =
            String(post.status || "").toLowerCase();

        const postCategory =
            String(post.category || "");

        const postName =
            String(post.name || "").toLowerCase();

        const postDescription =
            String(
                post.description || ""
            ).toLowerCase();

        const postLocation =
            String(
                post.location || ""
            ).toLowerCase();

        if (
            activeStatus !== "all" &&
            postStatus !== activeStatus
        ) {
            return false;
        }

        if (
            activeCats.size > 0 &&
            !activeCats.has(postCategory)
        ) {
            return false;
        }

        if (
            searchTerm &&
            !postName.includes(searchTerm) &&
            !postDescription.includes(searchTerm) &&
            !postLocation.includes(searchTerm) &&
            !postCategory
                .toLowerCase()
                .includes(searchTerm)
        ) {
            return false;
        }

        if (
            locationTerm &&
            !postLocation.includes(locationTerm)
        ) {
            return false;
        }

        const postAge = daysAgo(
            post.created_at || post.item_date
        );

        if (
            dateFilter === "today" &&
            postAge > 0
        ) {
            return false;
        }

        if (
            dateFilter === "week" &&
            postAge > 7
        ) {
            return false;
        }

        if (
            dateFilter === "month" &&
            postAge > 30
        ) {
            return false;
        }

        return true;
    });


    items.sort(function (firstPost, secondPost) {
        const firstDate = new Date(
            firstPost.created_at ||
            firstPost.item_date ||
            0
        );

        const secondDate = new Date(
            secondPost.created_at ||
            secondPost.item_date ||
            0
        );

        if (sortOrder === "newest") {
            return secondDate - firstDate;
        }

        return firstDate - secondDate;
    });


    if (resultCount) {
        resultCount.textContent =
            `${items.length} post${items.length === 1 ? "" : "s"}`;
    }


    if (items.length === 0) {
        board.innerHTML = `
            <div class="empty-state">
                Nothing pinned here yet.
                <br>
                Try clearing a filter, or be the first to post.
            </div>
        `;

        return;
    }


    board.innerHTML = items.map(
        function (post, index) {
            const rotations = [
                -2,
                1.5,
                -1,
                2,
                0.5
            ];

            const rotation =
                rotations[index % rotations.length];

            const postId =
                Number(post.post_id);

            const postOwnerId =
                Number(post.user_id);

            const postStatus =
                String(post.status || "lost")
                    .toLowerCase();

            const postName =
                post.name || "Unnamed item";

            const postCategory =
                post.category || "Other";

            const postLocation =
                post.location ||
                "Location not provided";

            const postDate =
                post.item_date ||
                post.created_at;

            const postDescription =
                post.description ||
                "No description provided.";

            const mediaUrl = String(
                post.media_url || post.image || ""
            ).trim();

            const mediaType = String(
                post.media_type || ""
            ).toLowerCase();

            const isOwnPost =
                Number(currentUser.user_id) ===
                postOwnerId;

            let actionButton = "";

            if (post.resolved) {
                actionButton = `
                    <button
                        class="claim-btn"
                        type="button"
                        disabled
                    >
                        Reunited
                    </button>
                `;
            } else if (isOwnPost) {
                actionButton = `
                    <button
                        class="claim-btn"
                        type="button"
                        disabled
                    >
                        Your post
                    </button>
                `;
            } else {
                actionButton = `
                    <button
                        class="claim-btn"
                        type="button"
                        onclick="openBackendChat(
                            ${postId},
                            ${postOwnerId},
                            '${escapeAttribute(postName)}',
                            '${escapeAttribute(postStatus)}'
                        )"
                    >
                        ${
                            postStatus === "lost"
                                ? "I found this"
                                : "This is mine"
                        }
                    </button>
                `;
            }

            let mediaHtml = "";

            if (mediaUrl) {
                const isVideo =
                    mediaType.startsWith("video/") ||
                    /\.(mp4|webm|mov)(\?.*)?$/i.test(mediaUrl);

                if (isVideo) {
                    mediaHtml = `
                        <video
                            class="post-media"
                            controls
                            preload="metadata"
                        >
                            <source
                                src="${escapeAttribute(mediaUrl)}"
                                type="${escapeAttribute(
                                    mediaType || "video/mp4"
                                )}"
                            >

                            Your browser does not support video playback.
                        </video>
                    `;
                } else {
                    mediaHtml = `
                        <img
                            class="post-media"
                            src="${escapeAttribute(mediaUrl)}"
                            alt="${escapeAttribute(postName)}"
                            loading="lazy"
                            onerror="handlePostMediaError(this)"
                        >
                    `;
                }
            }

            return `
                <div
                    class="tag-card"
                    data-status="${escapeAttribute(postStatus)}"
                    style="--rot:${rotation}deg;"
                >
                    <div class="pin"></div>

                    <div class="stamp">
                        ${
                            post.resolved
                                ? "reunited"
                                : escapeHtml(postStatus)
                        }
                    </div>

                    <div class="tag-icon">
                        ${getCategoryIcon(postCategory)}
                    </div>

                    <h3>
                        ${escapeHtml(postName)}
                    </h3>

                    ${mediaHtml}

                    <div class="tag-meta">
                        <span>
                            📍 ${escapeHtml(postLocation)}
                        </span>

                        <span>
                            📅 ${escapeHtml(formatDate(postDate))}
                        </span>
                    </div>

                    <div class="tag-desc">
                        ${escapeHtml(postDescription)}
                    </div>

                    <div class="perforation">
                        <span class="ticket-id">
                            #${postId}
                        </span>

                        ${actionButton}
                    </div>
                </div>
            `;
        }
    ).join("");
}


// =========================================================
// CHAT BRIDGE
// =========================================================

function openBackendChat(
    postId,
    postOwnerId,
    postName,
    postStatus
) {
    if (
        typeof openChat !== "function"
    ) {
        alert(
            "The chat function is not available."
        );

        return;
    }

    openChat(
        String(postId),
        postName,
        postStatus
    );

    const chatPanel =
        document.getElementById("chatPanel");

    if (chatPanel) {
        chatPanel.dataset.postId =
            String(postId);

        chatPanel.dataset.postOwnerId =
            String(postOwnerId);
    }
}


// =========================================================
// UNREAD MESSAGE COUNT
// =========================================================

async function loadUnreadMessageCount() {
    const badge =
        document.getElementById(
            "unreadMessageCount"
        );

    if (!badge || !currentUser) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/messages/inbox/${currentUser.user_id}?unread_only=true`
        );

        const responseData =
            await response.json();

        if (!response.ok) {
            throw new Error(
                responseData.detail ||
                "Could not retrieve unread messages"
            );
        }

        const unreadCount = Number(
            responseData.total_messages || 0
        );

        badge.textContent =
            unreadCount > 99
                ? "99+"
                : String(unreadCount);

        badge.hidden = unreadCount === 0;

    } catch (error) {
        console.error(
            "Could not load unread messages:",
            error
        );

        badge.hidden = true;
    }
}


// =========================================================
// INITIALIZATION
// =========================================================

initializeCurrentUser();
buildCategoryChips();

loadPosts();
loadHomepageStatistics();
loadUnreadMessageCount();