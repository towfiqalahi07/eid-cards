const nameInput = document.getElementById("nameInput");
const noteInput = document.getElementById("noteInput");

const svgContainer = document.getElementById("svgContainer");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const templateThumbnailsContainer = document.getElementById("templateThumbnails");
let currentSVG = "";
let currentTextColor = "#333333";
const templates = [
    { path: "templates/template1.svg", color: "#3f3b3a" },
    { path: "templates/template2.svg", color: "#ffb400" },
    { path: "templates/template3.svg", color: "#ffffff" },
    { path: "templates/template4.svg", color: "#ffffff" },
    { path: "templates/template5.svg", color: "#3f3b3a" },
];
let currentTemplateIndex = 0;
// --- Initial Load ---
changeTemplate(currentTemplateIndex);
updateThumbnailSelection();
updateArrowVisibility();
// --- Event Listeners ---
nameInput.addEventListener("input", () => {
    const note = document.getElementById("noteInput").value;
    updateSVGText(nameInput.value, note);
});
document.getElementById("noteInput").addEventListener("input", () => {
    const name = nameInput.value;
    updateSVGText(name, document.getElementById("noteInput").value);
});
prevButton.addEventListener("click", showPreviousTemplate);
nextButton.addEventListener("click", showNextTemplate);
document.addEventListener('DOMContentLoaded', function () {
    populateTemplateThumbnails();
    document.getElementById('downloadCardButton').addEventListener('click', downloadCard);
    document.getElementById('shareCardButton').addEventListener('click', shareCard);
    document.getElementById("downloadQRCodeButton").addEventListener("click", () => {
        const nameInput = document.getElementById("nameInput").value.trim();
        const noteInput = document.getElementById("noteInput").value.trim();
        const templateId = currentTemplateIndex + 1;
        if (!nameInput) {
            alert("Please enter your name before generating the QR code.");
            return;
        }
        let shareUrl = `${window.location.origin}${window.location.pathname}?name=${encodeURIComponent(nameInput)}&id=${templateId}`;
        if (noteInput) {
            shareUrl += `&note=${encodeURIComponent(noteInput)}`;
        }
     
        const qr = new QRious({
            value: shareUrl,
            size: 250, 
        });
       
        const link = document.createElement("a");
        link.href = qr.toDataURL(); 
        link.download = "eid-card-qr-code.png"; 
        link.click(); 
    });
    const thumbnails = document.querySelectorAll('.template-thumbnail');
    thumbnails.forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', function () {
            selectThumbnail(this, index);
        });
    });
});
// ---------------------
// --- Functions ---
function populateTemplateThumbnails() {
    templateThumbnailsContainer.innerHTML = ""; 
    templates.forEach((template, index) => {
        const thumbnail = document.createElement("img");
        thumbnail.src = template.path;
        thumbnail.dataset.templatePath = template.path;
        thumbnail.dataset.templateColor = template.color;
        thumbnail.className = "template-thumbnail w-24 h-24 rounded-xl cursor-pointer hover:scale-105 hover:shadow-md transition transform object-cover border-2 border-gray-300";
        
        thumbnail.addEventListener("click", () => {
            selectThumbnail(thumbnail, index);
        });
        templateThumbnailsContainer.appendChild(thumbnail);
    });
}
function changeTemplate(templateIndex) {
    if (templateIndex < 0 || templateIndex >= templates.length) {
        console.warn("Invalid template index:", templateIndex);
        return;
    }
    currentTemplateIndex = templateIndex;
    const { path: templatePath, color: textColor } = templates[templateIndex];
    fetch(templatePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(svgContent => {
            currentSVG = svgContent;
            currentTextColor = textColor;
            updateSVGText(nameInput.value, document.getElementById("noteInput").value);
            updateThumbnailSelection();
        })
        .catch(error => {
            console.error('Error fetching template:', templatePath, error);
            svgContainer.innerHTML = `<p class="text-red-500 text-center p-4">Error loading template: ${templatePath.split('/').pop()}.</p>`;
        });
}
function selectThumbnail(imgElement, templateIndex) {
    changeTemplate(templateIndex);
}
function showPreviousTemplate() {
    currentTemplateIndex = (currentTemplateIndex - 1 + templates.length) % templates.length; // Wrap 
    changeTemplate(currentTemplateIndex);
}
function showNextTemplate() {
    currentTemplateIndex = (currentTemplateIndex + 1) % templates.length; // Wrap
    changeTemplate(currentTemplateIndex);
}
function getTemplateColor(index) {
    const templates = {
        0: "#3f3b3a",
        1: "#ffb400",
        2: "#ffffff",
        3: "#ffffff",
    };
    return templates[index] || "#333333";
}
function updateThumbnailSelection() {
    const thumbnails = templateThumbnailsContainer.querySelectorAll('.template-thumbnail');
    thumbnails.forEach((thumb, index) => {
        if (index === currentTemplateIndex) {
            thumb.classList.add('selected');
        } else {
            thumb.classList.remove('selected');
        }
    });
    const selectedThumb = thumbnails[currentTemplateIndex];
    if (selectedThumb) {
        selectedThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}
function updateArrowVisibility() {
    if (templates.length <= 1) {
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
    } else {
        prevButton.style.display = 'flex';
        nextButton.style.display = 'flex';
    }
}
function updateSVGText(name, note, textColor = currentTextColor) {
    if (!currentSVG) return;
    try {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(currentSVG, "image/svg+xml");
        const svgElement = svgDoc.querySelector("svg");
        if (!svgElement || svgDoc.getElementsByTagName('parsererror').length > 0) {
            console.error('Error parsing SVG content.');
            svgContainer.innerHTML = '<p class="text-red-500 text-center p-4">Error parsing SVG.</p>';
            return;
        }
        let width, height;
        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
            const viewBoxValues = viewBox.split(/\s+|,/).map(Number);
            if (viewBoxValues.length !== 4 || viewBoxValues.some(isNaN)) {
                console.error('Invalid viewBox attribute:', viewBox);
                width = parseInt(svgElement.getAttribute('width')) || 500;
                height = parseInt(svgElement.getAttribute('height')) || 800;
            } else {
                width = viewBoxValues[2];
                height = viewBoxValues[3];
            }
        } else {
            width = parseInt(svgElement.getAttribute('width'));
            height = parseInt(svgElement.getAttribute('height'));
        }
        if (isNaN(width) || isNaN(height)) {
            console.error("Could not determine SVG width or height. Using defaults.");
            width = 500;
            height = 800;
        }
        const existingTexts = svgElement.querySelectorAll('.custom-text');
        existingTexts.forEach(text => text.remove());

        // Override text color to white for template 5
        if (currentTemplateIndex === 4) {
            textColor = "#ffffff";
        }

        // Override text color to #461e4c for template 4
        if (currentTemplateIndex === 3) {
            textColor = "#461e4c";
        }

        let nameYPosition = height - (height * 0.05);
        if (name && name.trim() !== "") {
            const nameFontSize = height * 0.035; // Reduced font size
            const nameElement = svgDoc.createElementNS("http://www.w3.org/2000/svg", "text");
            nameElement.setAttribute("x", width / 2);
            nameElement.setAttribute("y", nameYPosition.toFixed(2));
            nameElement.setAttribute("text-anchor", "middle");
            nameElement.setAttribute("font-family", "hind-siliguri-light"); // Reverted font
            nameElement.setAttribute("font-size", nameFontSize.toFixed(2));
            nameElement.setAttribute("fill", textColor);
            nameElement.setAttribute("font-weight", "500");
            nameElement.textContent = name;
            nameElement.classList.add('custom-text');
            svgElement.appendChild(nameElement);
        }
        if (note && note.trim() !== "") {
            const noteFontSize = height * 0.0435; // Further reduced from 0.04
            const noteLines = note.split("\n");
            const noteYStart = nameYPosition - (noteLines.length * noteFontSize * 1.2) - (height * 0.05); // Shift upward
            noteLines.forEach((textLine, index) => {
                const noteElement = svgDoc.createElementNS("http://www.w3.org/2000/svg", "text");
                const lineYPosition = noteYStart + index * noteFontSize * 1.2; // Line spacing
                noteElement.setAttribute("x", width / 2);
                noteElement.setAttribute("y", lineYPosition.toFixed(2));
                noteElement.setAttribute("text-anchor", "middle");
                noteElement.setAttribute("font-family", "nill-jannati-matra-unicode");
                noteElement.setAttribute("font-size", noteFontSize.toFixed(2));
                noteElement.setAttribute("fill", textColor);
                noteElement.setAttribute("font-weight", "500");
                noteElement.textContent = textLine;
                noteElement.classList.add('custom-text');
                svgElement.appendChild(noteElement);
            });
        }
        const styleElement = svgDoc.createElementNS("http://www.w3.org/2000/svg", "style");
        styleElement.textContent = `
            @font-face {
                font-family: 'hind-siliguri-light';
                src: url('assets/HindSiliguri-Light.woff2') format('woff2'),
                     url('assets/HindSiliguri-Light.woff') format('woff');
            }
            @font-face {
                font-family: 'nill-jannati-matra-unicode';
                src: url('assets/NillJannatiMatraUnicode.woff2') format('woff2'),
                     url('assets/NillJannatiMatraUnicode.woff') format('woff');
            }
        `;
        svgElement.insertBefore(styleElement, svgElement.firstChild);
        svgElement.removeAttribute('width');
        svgElement.removeAttribute('height');
        const serializer = new XMLSerializer();
        const updatedSVGString = serializer.serializeToString(svgDoc.documentElement);
        svgContainer.innerHTML = updatedSVGString;
    } catch (error) {
        console.error("Error processing SVG:", error);
        svgContainer.innerHTML = '<p class="text-red-500 text-center p-4">Error processing SVG.</p>';
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get("name");
    const templateId = urlParams.get("id");
    const templates = {
        1: { path: "templates/template1.svg", color: "#3f3b3a" },
        2: { path: "templates/template2.svg", color: "#ffb400" },
        3: { path: "templates/template3.svg", color: "#ffffff" },
        4: { path: "templates/template4.svg", color: "#ffffff" },
        5: { path: "templates/template5.svg", color: "#ffffff" },
    };
    const editorContainer = document.querySelector(".main-container");
    const receiverContainer = document.createElement("div");
    receiverContainer.id = "receiverContainer";
    receiverContainer.className = "hidden flex justify-center items-center bg-gray-100 border border-gray-200 rounded-xl shadow-lg overflow-hidden w-full max-w-md m-auto p-0";
    document.body.appendChild(receiverContainer);
    if (name && templateId && templates[templateId]) {
        editorContainer.style.display = "none";
        receiverContainer.style.display = "flex";
        const { path: templatePath, color: textColor } = templates[templateId];
        const note = urlParams.get("note");
        fetch(templatePath)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.text();
            })
            .then(svgContent => {
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
                const svgElement = svgDoc.querySelector("svg");
                if (!svgElement || svgDoc.getElementsByTagName("parsererror").length > 0) {
                    receiverContainer.innerHTML = '<p class="text-red-500 text-center p-4">Error loading template.</p>';
                    return;
                }
                const viewBox = svgElement.getAttribute("viewBox");
                let width = 500, height = 800;
                if (viewBox) {
                    const [, , viewBoxWidth, viewBoxHeight] = viewBox.split(/\s+|,/).map(Number);
                    if (viewBoxWidth && viewBoxHeight) {
                        width = viewBoxWidth;
                        height = viewBoxHeight;
                    }
                }
                let nameYPosition = height - (height * 0.05);
                if (name && name.trim() !== "") {
                    const nameFontSize = height * 0.035; // Reduced font size
                    const nameElement = svgDoc.createElementNS("http://www.w3.org/2000/svg", "text");
                    nameElement.setAttribute("x", width / 2);
                    nameElement.setAttribute("y", nameYPosition.toFixed(2));
                    nameElement.setAttribute("text-anchor", "middle");
                    nameElement.setAttribute("font-family", "hind-siliguri-light"); // Updated font
                    nameElement.setAttribute("font-size", nameFontSize.toFixed(2));
                    nameElement.setAttribute("fill", textColor);
                    nameElement.setAttribute("font-weight", "500");
                    nameElement.textContent = name;
                    svgElement.appendChild(nameElement);
                }
                if (note && note.trim() !== "") {
                    const noteFontSize = height * 0.0435; // Further reduced from 0.04
                    const noteLines = note.split("\n");
                    const noteYStart = nameYPosition - (noteLines.length * noteFontSize * 1.2) - (height * 0.05); // Shift upward
                    noteLines.forEach((textLine, index) => {
                        const noteElement = svgDoc.createElementNS("http://www.w3.org/2000/svg", "text");
                        const lineYPosition = noteYStart + index * noteFontSize * 1.2;
                        noteElement.setAttribute("x", width / 2);
                        noteElement.setAttribute("y", lineYPosition.toFixed(2));
                        noteElement.setAttribute("text-anchor", "middle");
                        noteElement.setAttribute("font-family", "nill-jannati-matra-unicode");
                        noteElement.setAttribute("font-size", noteFontSize.toFixed(2));
                        noteElement.setAttribute("fill", textColor);
                        noteElement.setAttribute("font-weight", "500");
                        noteElement.textContent = textLine;
                        svgElement.appendChild(noteElement);
                    });
                }
                svgElement.setAttribute("width", `${width}px`);
                svgElement.setAttribute("height", `${height}px`);
                receiverContainer.innerHTML = "";
                receiverContainer.appendChild(svgElement);
            })
            .catch(error => {
                console.error("Error fetching template:", error);
                receiverContainer.innerHTML = '<p class="text-red-500 text-center p-4">Error loading template.</p>';
            });
    } else {
        receiverContainer.innerHTML = '<p class="text-gray-500 text-center p-4">Invalid or missing parameters.</p>';
    }
});
function shareCard() {
    const nameInput = document.getElementById("nameInput").value.trim();
    const noteInput = document.getElementById("noteInput").value.trim();
    const templateId = currentTemplateIndex + 1;
    if (!nameInput) {
        alert("Please enter your name before sharing.");
        return;
    }
    let shareUrl = `${window.location.origin}${window.location.pathname}?name=${encodeURIComponent(nameInput)}&id=${templateId}`;
    if (noteInput) {
        shareUrl += `&note=${encodeURIComponent(noteInput)}`;
    }
    navigator.clipboard.writeText(shareUrl)
        .then(() => alert("Shareable link copied to clipboard:\n" + shareUrl))
        .catch(err => alert("Failed to copy the shareable link. Please try again."));
}
async function downloadCard() {
    const svgElement = svgContainer.querySelector("svg");
    if (!svgElement) {
        console.error("SVG element not found in svgContainer.");
        return;
    }
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgElement);

    // Fetch and embed all required fonts
    const fonts = [
        { name: 'suhrid-bornobilas', url: 'assets/FN Suhrid Bornobilas Unicode.woff2' },
        { name: 'nill-jannati-matra-unicode', url: 'assets/NillJannatiMatraUnicode.woff2' },
        { name: 'atma-medium', url: 'assets/Atma-Medium.woff2' },
        { name: 'hind-siliguri-light', url: 'assets/HindSiliguri-Light.woff2' }
    ];

    const fontFaceRules = await Promise.all(
        fonts.map(async (font) => {
            try {
                const response = await fetch(font.url);
                const buffer = await response.arrayBuffer();
                const base64Font = btoa(String.fromCharCode(...new Uint8Array(buffer)));
                return `
                    @font-face {
                        font-family: '${font.name}';
                        src: url('data:font/woff2;base64,${base64Font}') format('woff2');
                    }
                `;
            } catch (error) {
                console.error(`Error loading font ${font.name}:`, error);
                return '';
            }
        })
    );

    const styleTagContent = fontFaceRules.join('\n');
    svgString = svgString.replace(
        '</style>',
        `${styleTagContent}</style>`
    );

    // Ensure the font-family is explicitly applied to text elements
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const textElements = svgDoc.querySelectorAll("text");
    textElements.forEach((textElement) => {
        const fontFamily = textElement.getAttribute("font-family");
        if (!fontFamily || fontFamily === "suhrid-bornobilas") {
            textElement.setAttribute("font-family", "suhrid-bornobilas");
        }
    });
    svgString = new XMLSerializer().serializeToString(svgDoc);

    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const viewBox = svgElement.getAttribute("viewBox");
        if (viewBox) {
            const [x, y, width, height] = viewBox.split(/\s+|,/).map(Number);
            canvas.width = width * 1.5;
            canvas.height = height * 1.5;
        } else {
            canvas.width = 2000;
            canvas.height = 3200;
        }
        context.drawImage(img, 0, 0, canvas.width, canvas.height);

        const name = nameInput.value.trim();
        const templateId = currentTemplateIndex + 1;
        const timestamp = Date.now();
        const filename = name
            ? `eid-card-${name}-${templateId}-${timestamp}.png`
            : `eid-card-${templateId}-${timestamp}.png`;
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };
    img.onerror = () => {
        console.error("Error loading SVG as an image.");
        alert("Sorry, there was an error generating the image.");
    };
    img.src = url;
}

