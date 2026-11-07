const API_BASE_URL = "http://127.0.0.1:8000";

const CATEGORY_ICONS = {
    "📱 Electronics": "📱",
    "🔑 Keys": "🔑",
    "👜 Bag": "👜",
    "🐶 Pet": "🐶",
    "📄 Documents": "📄",
    "💍 Jewelry": "💍",
    "👕 Clothing": "👕",
    "🚲 Bike": "🚲",
    "📦 Other": "📦"
};


// =========================================================
// CURRENT USER SESSION
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


// =========================================================
// LOGOUT
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
    const logoutLinks =
        document.querySelectorAll(
            '.auth-btns a[href="index.html"]'
        );

    logoutLinks.forEach(function (logoutLink) {
        logoutLink.addEventListener(
            "click",
            function (event) {
                event.preventDefault();

                sessionStorage.removeItem("of_session");
                localStorage.removeItem("of_session");

                window.location.replace("index.html");
            }
        );
    });
});


// =========================================================
// HTML ESCAPING
// =========================================================

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =========================================================
// LIVE CARD PREVIEW
// =========================================================

function updatePreview(type) {
    const nameField =
        document.getElementById(type + "Name");

    if (!nameField) {
        return;
    }

    const categoryField =
        document.getElementById(type + "Category");

    const locationField =
        document.getElementById(type + "Location");

    const dateField =
        document.getElementById(type + "Date");

    const descriptionField =
        document.getElementById(type + "Desc");

    const previewElement =
        document.getElementById(
            type === "lost"
                ? "previewLost"
                : "previewFound"
        );

    if (
        !categoryField ||
        !locationField ||
        !dateField ||
        !descriptionField ||
        !previewElement
    ) {
        return;
    }

    const name =
        nameField.value.trim() ||
        (
            type === "lost"
                ? "Your lost item"
                : "Your found item"
        );

    const category =
        categoryField.value || "📦 Other";

    const location =
        locationField.value.trim() ||
        "Location…";

    const itemDate =
        dateField.value || "—";

    const description =
        descriptionField.value.trim() ||
        "Add a description so people can recognize it.";

    const categoryIcon =
        CATEGORY_ICONS[category] ||
        category.split(" ")[0] ||
        "📦";

    previewElement.innerHTML = `
        <div class="pin"></div>

        <div class="stamp">
            ${escapeHtml(type)}
        </div>

        <div class="tag-icon">
            ${escapeHtml(categoryIcon)}
        </div>

        <h3>
            ${escapeHtml(name)}
        </h3>

        <div
            class="preview-media-container"
            id="${type}PreviewMedia"
        ></div>

        <div class="tag-meta">
            <span>
                📍 ${escapeHtml(location)}
            </span>

            <span>
                📅 ${escapeHtml(itemDate)}
            </span>
        </div>

        <div class="tag-desc">
            ${escapeHtml(description)}
        </div>

        <div class="perforation">
            <span class="ticket-id">
                #PREVIEW
            </span>

            <button
                class="claim-btn"
                type="button"
            >
                ${
                    type === "lost"
                        ? "I found this"
                        : "This is mine"
                }
            </button>
        </div>
    `;

    displaySelectedMediaPreview(type);
}


// =========================================================
// MEDIA SELECTION
// =========================================================

function handleMediaSelection(type) {
    const mediaInput =
        document.getElementById(type + "Media");

    const uploadBox =
        document.getElementById(type + "UploadBox");

    if (!mediaInput || !uploadBox) {
        return;
    }

    const selectedFile =
        mediaInput.files?.[0];

    hideFormMessage(type);

    if (!selectedFile) {
        uploadBox.textContent =
            "📷 Drop a photo here or click to upload";

        updatePreview(type);
        return;
    }

    const validationError =
        validateMedia(selectedFile);

    if (validationError) {
        mediaInput.value = "";

        uploadBox.textContent =
            "📷 Drop a photo here or click to upload";

        showFormMessage(
            type,
            validationError
        );

        updatePreview(type);
        return;
    }

    uploadBox.textContent =
        "📎 " + selectedFile.name;

    updatePreview(type);
}


// =========================================================
// MEDIA PREVIEW
// =========================================================

function displaySelectedMediaPreview(type) {
    const mediaInput =
        document.getElementById(type + "Media");

    const previewContainer =
        document.getElementById(
            type + "PreviewMedia"
        );

    if (!mediaInput || !previewContainer) {
        return;
    }

    const selectedFile =
        mediaInput.files?.[0];

    if (!selectedFile) {
        previewContainer.innerHTML = "";
        return;
    }

    const mediaUrl =
        URL.createObjectURL(selectedFile);

    if (selectedFile.type.startsWith("video/")) {
        const videoElement =
            document.createElement("video");

        videoElement.className =
            "post-form-media-preview";

        videoElement.src = mediaUrl;
        videoElement.controls = true;
        videoElement.preload = "metadata";

        videoElement.addEventListener(
            "loadedmetadata",
            function () {
                URL.revokeObjectURL(mediaUrl);
            }
        );

        previewContainer.replaceChildren(
            videoElement
        );

        return;
    }

    const imageElement =
        document.createElement("img");

    imageElement.className =
        "post-form-media-preview";

    imageElement.src = mediaUrl;
    imageElement.alt = "Selected item preview";

    imageElement.addEventListener(
        "load",
        function () {
            URL.revokeObjectURL(mediaUrl);
        }
    );

    imageElement.addEventListener(
        "error",
        function () {
            URL.revokeObjectURL(mediaUrl);

            previewContainer.textContent =
                "Image preview unavailable";
        }
    );

    previewContainer.replaceChildren(
        imageElement
    );
}


// =========================================================
// MEDIA VALIDATION
// =========================================================

function validateMedia(file) {
    const allowedFileTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "video/mp4",
        "video/webm",
        "video/quicktime"
    ];

    if (!file) {
        return "Please select a photo or video.";
    }

    if (!allowedFileTypes.includes(file.type)) {
        return (
            "Only JPG, PNG, WebP, MP4, WebM " +
            "and MOV files are allowed."
        );
    }

    const fileIsVideo =
        file.type.startsWith("video/");

    const maximumFileSize =
        fileIsVideo
            ? 50 * 1024 * 1024
            : 10 * 1024 * 1024;

    if (file.size > maximumFileSize) {
        return fileIsVideo
            ? "Video must not exceed 50 MB."
            : "Image must not exceed 10 MB.";
    }

    return null;
}


// =========================================================
// LOST REWARD CONVERSION
// =========================================================

function getLostReward() {
    const rewardField =
        document.getElementById("lostReward");

    const rewardText =
        rewardField?.value.trim() || "";

    if (!rewardText) {
        return "0";
    }

    /*
     * Accepts:
     * NPR 500
     * Rs. 500
     * 500
     * 500.50
     */
    const cleanedReward = rewardText
        .replace(/,/g, "")
        .replace(/[^\d.]/g, "");

    if (!cleanedReward) {
        return null;
    }

    /*
     * Prevent values containing multiple decimal points.
     */
    const decimalPoints =
        cleanedReward.match(/\./g)?.length || 0;

    if (decimalPoints > 1) {
        return null;
    }

    const rewardNumber =
        Number(cleanedReward);

    if (
        !Number.isFinite(rewardNumber) ||
        rewardNumber < 0
    ) {
        return null;
    }

    if (rewardNumber > 99999999.99) {
        return null;
    }

    return rewardNumber.toFixed(2);
}


// =========================================================
// FORM MESSAGE
// =========================================================

function getOrCreateFormMessage(type) {
    let messageBox =
        document.getElementById(
            type + "FormMessage"
        );

    if (messageBox) {
        return messageBox;
    }

    const form =
        document.getElementById(
            type === "lost"
                ? "form-lost"
                : "form-found"
        );

    const submitButton =
        document.getElementById(
            type + "SubmitButton"
        );

    if (!form || !submitButton) {
        return null;
    }

    messageBox =
        document.createElement("div");

    messageBox.id =
        type + "FormMessage";

    messageBox.className =
        "post-form-message";

    messageBox.hidden = true;

    form.insertBefore(
        messageBox,
        submitButton
    );

    return messageBox;
}


function showFormMessage(
    type,
    message,
    success = false
) {
    const messageBox =
        getOrCreateFormMessage(type);

    if (!messageBox) {
        alert(message);
        return;
    }

    messageBox.textContent = message;
    messageBox.hidden = false;

    messageBox.classList.toggle(
        "success",
        success
    );

    messageBox.classList.toggle(
        "error",
        !success
    );

    messageBox.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


function hideFormMessage(type) {
    const messageBox =
        document.getElementById(
            type + "FormMessage"
        );

    if (!messageBox) {
        return;
    }

    messageBox.hidden = true;
    messageBox.textContent = "";

    messageBox.classList.remove(
        "success",
        "error"
    );
}


// =========================================================
// BACKEND ERROR MESSAGE
// =========================================================

function getApiErrorMessage(data) {
    if (!data) {
        return "The post could not be uploaded.";
    }

    if (typeof data.detail === "string") {
        return data.detail;
    }

    if (Array.isArray(data.detail)) {
        return data.detail
            .map(function (error) {
                const location =
                    Array.isArray(error.loc)
                        ? error.loc[
                            error.loc.length - 1
                        ]
                        : "";

                const message =
                    error.msg || "Invalid value";

                return location
                    ? `${location}: ${message}`
                    : message;
            })
            .join(". ");
    }

    if (typeof data.message === "string") {
        return data.message;
    }

    return "The post could not be uploaded.";
}


// =========================================================
// SUBMIT LOST OR FOUND POST
// =========================================================

async function submitPost(event, type) {
    event.preventDefault();

    hideFormMessage(type);

    if (!currentUser || !currentUser.user_id) {
        window.location.replace("index.html");
        return false;
    }

    const nameField =
        document.getElementById(type + "Name");

    const categoryField =
        document.getElementById(type + "Category");

    const locationField =
        document.getElementById(type + "Location");

    const dateField =
        document.getElementById(type + "Date");

    const descriptionField =
        document.getElementById(type + "Desc");

    const contactField =
        document.getElementById(type + "Contact");

    const mediaField =
        document.getElementById(type + "Media");

    const submitButton =
        document.getElementById(
            type + "SubmitButton"
        );

    const name =
        nameField?.value.trim() || "";

    const category =
        categoryField?.value || "";

    const location =
        locationField?.value.trim() || "";

    const itemDate =
        dateField?.value || "";

    const description =
        descriptionField?.value.trim() || "";

    const contact =
        contactField?.value.trim() || "";

    const selectedFile =
        mediaField?.files?.[0];


    if (!name) {
        showFormMessage(
            type,
            "Please enter the item name."
        );

        nameField?.focus();
        return false;
    }


    if (!category) {
        showFormMessage(
            type,
            "Please select a category."
        );

        categoryField?.focus();
        return false;
    }


    if (!location) {
        showFormMessage(
            type,
            "Please enter the location."
        );

        locationField?.focus();
        return false;
    }


    if (!itemDate) {
        showFormMessage(
            type,
            type === "lost"
                ? "Please select the date lost."
                : "Please select the date found."
        );

        dateField?.focus();
        return false;
    }


    const selectedDate =
        new Date(itemDate + "T00:00:00");

    const currentDate = new Date();

    currentDate.setHours(23, 59, 59, 999);

    if (selectedDate > currentDate) {
        showFormMessage(
            type,
            type === "lost"
                ? "Date lost cannot be in the future."
                : "Date found cannot be in the future."
        );

        dateField?.focus();
        return false;
    }


    const mediaError =
        validateMedia(selectedFile);

    if (mediaError) {
        showFormMessage(
            type,
            mediaError
        );

        return false;
    }


    let reward = "0.00";

    if (type === "lost") {
        reward = getLostReward();

        if (reward === null) {
            showFormMessage(
                type,
                "Reward must contain a valid zero or positive amount."
            );

            document
                .getElementById("lostReward")
                ?.focus();

            return false;
        }
    }

    /*
     * Found.html has no reward field.
     * The backend still requires a reward value,
     * so every found post sends 0.00.
     */
    if (type === "found") {
        reward = "0.00";
    }


    const formData =
        new FormData();

    formData.append(
        "user_id",
        String(currentUser.user_id)
    );

    formData.append(
        "name",
        name
    );

    formData.append(
        "category",
        category
    );

    formData.append(
        "location",
        location
    );

    formData.append(
        "item_date",
        itemDate
    );

    formData.append(
        "description",
        description
    );

    formData.append(
        "contact",
        contact
    );

    formData.append(
        "reward",
        reward
    );

    formData.append(
        "status",
        type
    );

    formData.append(
        "media",
        selectedFile
    );


    if (submitButton) {
        submitButton.disabled = true;

        submitButton.dataset.originalText =
            submitButton.textContent;

        submitButton.textContent =
            "Uploading post...";
    }


    try {
        const response = await fetch(
            `${API_BASE_URL}/posts/upload`,
            {
                method: "POST",
                body: formData
            }
        );

        let responseData = null;

        try {
            responseData =
                await response.json();
        } catch (error) {
            responseData = null;
        }

        if (!response.ok) {
            throw new Error(
                getApiErrorMessage(responseData)
            );
        }

        showFormMessage(
            type,
            type === "lost"
                ? "Lost item posted successfully."
                : "Found item posted successfully.",
            true
        );

        setTimeout(function () {
            window.location.href =
                "Homepage.html";
        }, 800);

    } catch (error) {
        if (error instanceof TypeError) {
            showFormMessage(
                type,
                "Cannot connect to the backend. Make sure FastAPI is running at http://127.0.0.1:8000."
            );
        } else {
            showFormMessage(
                type,
                error.message ||
                "The post could not be uploaded."
            );
        }

    } finally {
        if (submitButton) {
            submitButton.disabled = false;

            submitButton.textContent =
                submitButton.dataset.originalText ||
                (
                    type === "lost"
                        ? "Post to Lost board"
                        : "Post to Found board"
                );
        }
    }

    return false;
}


// =========================================================
// DRAG AND DROP SUPPORT
// =========================================================

function configureUploadBox(type) {
    const uploadBox =
        document.getElementById(
            type + "UploadBox"
        );

    const mediaInput =
        document.getElementById(
            type + "Media"
        );

    if (!uploadBox || !mediaInput) {
        return;
    }

    uploadBox.addEventListener(
        "dragover",
        function (event) {
            event.preventDefault();

            uploadBox.classList.add(
                "dragging"
            );
        }
    );

    uploadBox.addEventListener(
        "dragleave",
        function () {
            uploadBox.classList.remove(
                "dragging"
            );
        }
    );

    uploadBox.addEventListener(
        "drop",
        function (event) {
            event.preventDefault();

            uploadBox.classList.remove(
                "dragging"
            );

            const droppedFile =
                event.dataTransfer.files?.[0];

            if (!droppedFile) {
                return;
            }

            const transfer =
                new DataTransfer();

            transfer.items.add(droppedFile);

            mediaInput.files =
                transfer.files;

            handleMediaSelection(type);
        }
    );

    uploadBox.setAttribute(
        "role",
        "button"
    );

    uploadBox.setAttribute(
        "tabindex",
        "0"
    );

    uploadBox.addEventListener(
        "keydown",
        function (event) {
            if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                event.preventDefault();
                mediaInput.click();
            }
        }
    );
}


// =========================================================
// INITIALIZATION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {
        const today =
            new Date()
                .toISOString()
                .split("T")[0];

        const lostDate =
            document.getElementById("lostDate");

        const foundDate =
            document.getElementById("foundDate");

        if (lostDate) {
            lostDate.max = today;
        }

        if (foundDate) {
            foundDate.max = today;
        }

        configureUploadBox("lost");
        configureUploadBox("found");

        updatePreview("lost");
        updatePreview("found");
    }
);