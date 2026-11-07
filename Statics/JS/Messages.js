let messageConversations = [];


// =========================================================
// LOAD RECEIVED AND SENT MESSAGES
// =========================================================

async function loadMessageConversations() {
    const currentUser = getCurrentUser();

    const conversationList =
        document.getElementById("convoList");

    if (!currentUser || !conversationList) {
        return;
    }

    showMessagePageAlert("");

    conversationList.innerHTML = `
        <p class="message-loading">
            Loading conversations...
        </p>
    `;

    try {
        const [
            inboxResponse,
            sentResponse
        ] = await Promise.all([
            fetch(
                `http://127.0.0.1:8000/messages/inbox/${currentUser.user_id}`
            ),

            fetch(
                `http://127.0.0.1:8000/messages/sent/${currentUser.user_id}`
            )
        ]);

        const inboxData =
            await inboxResponse.json();

        const sentData =
            await sentResponse.json();

        if (!inboxResponse.ok) {
            throw new Error(
                getMessagesPageError(inboxData)
            );
        }

        if (!sentResponse.ok) {
            throw new Error(
                getMessagesPageError(sentData)
            );
        }

        const inboxMessages =
            Array.isArray(inboxData.messages)
                ? inboxData.messages
                : [];

        const sentMessages =
            Array.isArray(sentData.messages)
                ? sentData.messages
                : [];

        messageConversations =
            groupMessagesIntoConversations(
                inboxMessages,
                sentMessages,
                currentUser
            );

        renderInbox();

    } catch (error) {
        conversationList.innerHTML = "";

        showMessagePageAlert(
            error.message ||
            "Could not load conversations."
        );
    }
}


// =========================================================
// GROUP MESSAGES INTO CONVERSATIONS
// =========================================================

function groupMessagesIntoConversations(
    inboxMessages,
    sentMessages,
    currentUser
) {
    const conversationMap =
        new Map();

    inboxMessages.forEach(function (message) {
        const sender =
            message.sender || {};

        const key =
            `${message.post_id}-${sender.user_id}`;

        addConversationMessage(
            conversationMap,
            key,
            {
                postId: message.post_id,
                postName:
                    message.post_name ||
                    "Item",

                postStatus:
                    message.post_status ||
                    "post",

                otherUserId:
                    sender.user_id,

                otherUserName:
                    sender.name ||
                    "User",

                body: message.body,
                createdAt:
                    message.created_at,

                isRead:
                    message.is_read,

                direction: "received"
            }
        );
    });


    sentMessages.forEach(function (message) {
        const receiver =
            message.receiver || {};

        const key =
            `${message.post_id}-${receiver.user_id}`;

        addConversationMessage(
            conversationMap,
            key,
            {
                postId: message.post_id,
                postName:
                    message.post_name ||
                    "Item",

                postStatus:
                    message.post_status ||
                    "post",

                otherUserId:
                    receiver.user_id,

                otherUserName:
                    receiver.name ||
                    "User",

                body: message.body,
                createdAt:
                    message.created_at,

                isRead:
                    message.is_read,

                direction: "sent"
            }
        );
    });


    return Array.from(
        conversationMap.values()
    ).sort(function (first, second) {
        return (
            new Date(second.lastCreatedAt) -
            new Date(first.lastCreatedAt)
        );
    });
}


function addConversationMessage(
    conversationMap,
    key,
    message
) {
    const existing =
        conversationMap.get(key);

    if (
        !existing ||
        new Date(message.createdAt) >
        new Date(existing.lastCreatedAt)
    ) {
        conversationMap.set(
            key,
            {
                ...message,
                unread:
                    message.direction ===
                        "received" &&
                    message.isRead === false
            }
        );
    }
}


// =========================================================
// RENDER CONVERSATION LIST
// =========================================================

function renderInbox() {
    const list =
        document.getElementById("convoList");

    if (!list) {
        return;
    }

    if (!messageConversations.length) {
        list.innerHTML = `
            <p class="empty-message-list">
                No conversations yet. Message someone
                from a post on the board.
            </p>
        `;

        return;
    }

    list.innerHTML = "";

    messageConversations.forEach(
        function (conversation) {
            const row =
                document.createElement("div");

            row.className = "convo-row";

            row.tabIndex = 0;
            row.setAttribute("role", "button");

            const icon =
                document.createElement("div");

            icon.className = "convo-icon";
            icon.textContent =
                conversation.postStatus === "lost"
                    ? "🔴"
                    : "🟢";


            const info =
                document.createElement("div");

            info.className = "convo-info";


            const top =
                document.createElement("div");

            top.className = "top";


            const heading =
                document.createElement("h4");

            heading.textContent =
                conversation.postName;


            const time =
                document.createElement("span");

            time.className = "time";

            time.textContent =
                formatConversationTime(
                    conversation.lastCreatedAt
                );


            const preview =
                document.createElement("p");

            preview.textContent =
                conversation.direction === "sent"
                    ? `You: ${conversation.body}`
                    : `${
                        conversation.otherUserName
                    }: ${conversation.body}`;


            top.append(heading, time);
            info.append(top, preview);

            row.append(icon, info);

            if (conversation.unread) {
                const unreadDot =
                    document.createElement("div");

                unreadDot.className =
                    "unread-dot";

                row.appendChild(unreadDot);
            }


            const openConversation =
                function () {
                    openBackendConversation(
                        conversation.postId,
                        conversation.otherUserId,
                        conversation.postName,
                        conversation.postStatus
                    );
                };


            row.addEventListener(
                "click",
                openConversation
            );

            row.addEventListener(
                "keydown",
                function (event) {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();
                        openConversation();
                    }
                }
            );

            list.appendChild(row);
        }
    );
}


// =========================================================
// PAGE HELPERS
// =========================================================

function showMessagePageAlert(message) {
    const alertBox =
        document.getElementById(
            "messagePageAlert"
        );

    if (!alertBox) {
        return;
    }

    alertBox.textContent = message;
    alertBox.hidden = !message;
}


function getMessagesPageError(data) {
    if (typeof data?.detail === "string") {
        return data.detail;
    }

    return "Could not load messages.";
}


function formatConversationTime(dateValue) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const now = new Date();

    const sameDay =
        date.toDateString() ===
        now.toDateString();

    return new Intl.DateTimeFormat(
        "en",
        sameDay
            ? {
                hour: "numeric",
                minute: "2-digit"
            }
            : {
                month: "short",
                day: "numeric"
            }
    ).format(date);
}


// =========================================================
// INITIALIZATION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {
        loadMessageConversations();
    }
);