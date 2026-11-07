const MESSAGE_API_BASE_URL =
    "http://127.0.0.1:8000";

let activeConversation = null;


// =========================================================
// OPEN CONVERSATION
// =========================================================

async function openBackendConversation(
    postId,
    otherUserId,
    postName,
    postStatus
) {
    const currentUser = getCurrentUser();

    if (!currentUser || !currentUser.user_id) {
        window.location.replace("index.html");
        return;
    }

    activeConversation = {
        postId: Number(postId),
        otherUserId: Number(otherUserId),
        postName: postName,
        postStatus: postStatus
    };

    const chatOverlay =
        document.getElementById("chatOverlay");

    const chatPanel =
        document.getElementById("chatPanel");

    const chatWho =
        document.getElementById("chatWho");

    const chatSub =
        document.getElementById("chatSub");

    const chatInput =
        document.getElementById("chatInput");

    if (!chatOverlay || !chatPanel) {
        return;
    }

    chatPanel.dataset.postId =
        String(postId);

    chatPanel.dataset.otherUserId =
        String(otherUserId);

    chatPanel.dataset.status =
        postStatus || "";

    if (chatWho) {
        chatWho.textContent =
            postName || "Item";
    }

    if (chatSub) {
        chatSub.textContent =
            `re: ${postStatus || "item"} post #${postId}`;
    }

    chatOverlay.classList.add("open");

    await loadConversation();

    chatInput?.focus();
}


// Keep compatibility with Homepage Feed.js
function openChat(
    postId,
    postName,
    status,
    postOwnerId = null
) {
    const chatPanel =
        document.getElementById("chatPanel");

    const storedOwnerId =
        postOwnerId ||
        chatPanel?.dataset.postOwnerId;

    if (!storedOwnerId) {
        showChatError(
            "The post owner information is missing."
        );

        return;
    }

    openBackendConversation(
        postId,
        storedOwnerId,
        postName,
        status
    );
}


// =========================================================
// LOAD CONVERSATION
// =========================================================

async function loadConversation() {
    const currentUser = getCurrentUser();

    const thread =
        document.getElementById("chatThread");

    if (
        !currentUser ||
        !activeConversation ||
        !thread
    ) {
        return;
    }

    hideChatError();

    thread.innerHTML = `
        <p class="message-loading">
            Loading conversation...
        </p>
    `;

    const query = new URLSearchParams({
        post_id: String(
            activeConversation.postId
        ),

        first_user_id: String(
            currentUser.user_id
        ),

        second_user_id: String(
            activeConversation.otherUserId
        )
    });

    try {
        const response = await fetch(
            `${MESSAGE_API_BASE_URL}/messages/conversation?${query}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                getMessageApiError(data)
            );
        }

        renderBackendThread(
            data.messages || []
        );

        await markVisibleMessagesAsRead(
            data.messages || []
        );

    } catch (error) {
        thread.innerHTML = "";

        showChatError(
            error.message ||
            "Could not load the conversation."
        );
    }
}


// =========================================================
// RENDER CONVERSATION
// =========================================================

function renderBackendThread(messages) {
    const currentUser = getCurrentUser();

    const thread =
        document.getElementById("chatThread");

    if (!thread || !currentUser) {
        return;
    }

    if (!messages.length) {
        thread.innerHTML = `
            <p class="empty-chat-message">
                No messages yet. Send the first message.
            </p>
        `;

        return;
    }

    thread.innerHTML = "";

    messages.forEach(function (message) {
        const bubble =
            document.createElement("div");

        const isCurrentUser =
            Number(message.sender_id) ===
            Number(currentUser.user_id);

        bubble.className =
            `bubble ${isCurrentUser ? "you" : "them"}`;

        const messageText =
            document.createElement("div");

        messageText.textContent =
            message.body;

        bubble.appendChild(messageText);

        if (message.created_at) {
            const messageTime =
                document.createElement("small");

            messageTime.className =
                "message-time";

            messageTime.textContent =
                formatMessageTime(
                    message.created_at
                );

            bubble.appendChild(messageTime);
        }

        thread.appendChild(bubble);
    });

    thread.scrollTop =
        thread.scrollHeight;
}


// =========================================================
// SEND MESSAGE
// =========================================================

async function sendMessage() {
    const currentUser = getCurrentUser();

    const input =
        document.getElementById("chatInput");

    const sendButton =
        document.getElementById(
            "chatSendButton"
        );

    const body =
        input?.value.trim() || "";

    if (
        !currentUser ||
        !activeConversation ||
        !body
    ) {
        return;
    }

    hideChatError();

    if (sendButton) {
        sendButton.disabled = true;
    }

    if (input) {
        input.disabled = true;
    }

    try {
        const response = await fetch(
            `${MESSAGE_API_BASE_URL}/messages/send`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    post_id:
                        activeConversation.postId,

                    sender_id:
                        Number(currentUser.user_id),

                    receiver_id:
                        activeConversation.otherUserId,

                    body: body
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                getMessageApiError(data)
            );
        }

        input.value = "";

        await loadConversation();

        if (
            typeof loadMessageConversations ===
            "function"
        ) {
            await loadMessageConversations();
        }

        if (
            typeof updateUnreadBadge ===
            "function"
        ) {
            await updateUnreadBadge();
        }

    } catch (error) {
        showChatError(
            error.message ||
            "The message could not be sent."
        );

    } finally {
        if (sendButton) {
            sendButton.disabled = false;
        }

        if (input) {
            input.disabled = false;
            input.focus();
        }
    }
}


// =========================================================
// MARK MESSAGES AS READ
// =========================================================

async function markVisibleMessagesAsRead(messages) {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        return;
    }

    const unreadMessages = messages.filter(
        function (message) {
            return (
                Number(message.receiver_id) ===
                    Number(currentUser.user_id) &&
                message.is_read === false
            );
        }
    );

    await Promise.all(
        unreadMessages.map(
            async function (message) {
                try {
                    await fetch(
                        `${MESSAGE_API_BASE_URL}/messages/${message.message_id}/read?user_id=${currentUser.user_id}`,
                        {
                            method: "PATCH"
                        }
                    );
                } catch (error) {
                    console.error(
                        "Could not mark message as read:",
                        error
                    );
                }
            }
        )
    );

    if (
        unreadMessages.length &&
        typeof updateUnreadBadge === "function"
    ) {
        await updateUnreadBadge();
    }
}


// =========================================================
// CLOSE CHAT
// =========================================================

function closeChat() {
    const overlay =
        document.getElementById("chatOverlay");

    if (overlay) {
        overlay.classList.remove("open");
    }

    activeConversation = null;
}


document
    .getElementById("chatOverlay")
    ?.addEventListener(
        "click",
        function (event) {
            if (event.target === event.currentTarget) {
                closeChat();
            }
        }
    );


document.addEventListener(
    "keydown",
    function (event) {
        if (event.key === "Escape") {
            closeChat();
        }
    }
);


// =========================================================
// CHAT HELPERS
// =========================================================

function showChatError(message) {
    const errorBox =
        document.getElementById("chatError");

    if (!errorBox) {
        return;
    }

    errorBox.textContent = message;
    errorBox.hidden = false;
}


function hideChatError() {
    const errorBox =
        document.getElementById("chatError");

    if (!errorBox) {
        return;
    }

    errorBox.textContent = "";
    errorBox.hidden = true;
}


function getMessageApiError(data) {
    if (typeof data?.detail === "string") {
        return data.detail;
    }

    if (Array.isArray(data?.detail)) {
        return data.detail
            .map(function (error) {
                return error.msg ||
                    "Invalid message data";
            })
            .join(". ");
    }

    return "The message request failed.";
}


function formatMessageTime(dateValue) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "en",
        {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    ).format(date);
}