/* Mermaid Configuration */
const mermaidConfig = {
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    logLevel: 'error',
};

/* DOM Elements */
const diagramForm = document.getElementById('diagram-form');
const messageInput = document.getElementById('messageInput');
const diagramTypeSelect = document.getElementById('diagramType');
const sendBtn = document.getElementById('sendBtn');
const resetBtn = document.getElementById('resetBtn');
const loadingSpinner = document.getElementById('loading-spinner');
const errorElement = document.getElementById('error');
const diagramContainer = document.getElementById('diagram-output');
const diagramContent = diagramContainer.querySelector('.diagram-content');
const suggestBtn = document.getElementById('suggest-btn');
const summarizeBtn = document.getElementById('summarize-btn');
const userGuideBtn = document.querySelector('#userguideBtn');

/* Global Variables */
let currentScale = 1;
const SCALE_STEP = 0.1;
const MIN_SCALE = 0.5;
const MAX_SCALE = 2;

let session;
let mermaidInitialized = false;
let mermaidSyntax = '';

/* Diagram Type Configurations */
const DIAGRAM_TYPES = {
    flowchart: {
        prompt: `For flowcharts, use the following syntax:
        flowchart TD or LR for direction
        Use --> for connections
        Use [] for rectangular nodes
        Use () for round nodes
        Example: A[Start] --> B[Process] --> C[End]`,
    },
    sequence: {
        prompt: `For sequence diagrams, use the following syntax:
        sequenceDiagram
        participant A
        participant B
        A->>B: Message
        B-->>A: Response`,
    },
    classType: {
        prompt: `For class diagrams, use the following syntax:
        classDiagram
        Class01 <|-- Class02
        Class03 *-- Class04
        Class05 o-- Class06`,
    },
    state: {
        prompt: `For state diagrams, use the following syntax:
        stateDiagram-v2
        [*] --> State1
        State1 --> State2
        State2 --> [*]`,
    },
    er: {
        prompt: `For ER diagrams, use the following syntax:
        erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains`,
    }
};

/* AI Configuration */
const getSystemPrompt = (diagramType) => {
    const basePrompt = `You are a diagram generation assistant specializing in ${diagramType} diagrams. Your role is to convert user descriptions into valid Mermaid diagram syntax. You should:
    1. Interpret the user's natural language description
    2. Generate appropriate Mermaid syntax for the requested diagram type
    3. Only output the raw Mermaid syntax without any markdown formatting or code blocks
    4. Keep the diagrams clear and readable
    
    ${DIAGRAM_TYPES[diagramType].prompt}
    
    Do not include any explanatory text, markdown formatting, or code block markers - output only the raw Mermaid syntax.`;

    return basePrompt;
};

const AI_PARAMS = {
    temperature: 0.7,
    topK: 5,
    getSystemPrompt: getSystemPrompt
};

/* Zoom Controls */
function createZoomControls() {
    const zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls';
    zoomControls.innerHTML = `
        <button class="zoom-btn zoom-in" title="Zoom In">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
        </button>

        <span class="zoom-level">100%</span>
        <button class="zoom-btn zoom-out" title="Zoom Out">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
        </button>
        <button class="zoom-btn zoom-reset" title="Reset Zoom">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12h18"></path>
                <path d="M12 3v18"></path>
                <path d="M16 8l-4 4-4-4"></path>
            </svg>
        </button>
    `;
    return zoomControls;
}

function createDownloadButton() {
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'zoom-btn download-btn';
    downloadBtn.title = 'Download Diagram';
    downloadBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14"></path>
            <path d="M5 19h14"></path>
            <path d="M9 13l3 3 3-3"></path>
        </svg>`;
    downloadBtn.addEventListener('click', downloadDiagram);
    return downloadBtn;
}

function setupZoomControls() {
    const zoomControls = createZoomControls();
    diagramContainer.insertBefore(zoomControls, diagramContent);

    const downloadBtn = createDownloadButton();
    zoomControls.appendChild(downloadBtn);

    const zoomInBtn = zoomControls.querySelector('.zoom-in');
    const zoomOutBtn = zoomControls.querySelector('.zoom-out');
    const zoomResetBtn = zoomControls.querySelector('.zoom-reset');
    const zoomLevelDisplay = zoomControls.querySelector('.zoom-level');

    function updateZoom(newScale) {
        currentScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
        diagramContent.style.transform = `scale(${currentScale})`;
        zoomLevelDisplay.textContent = `${Math.round(currentScale * 100)}%`;

        zoomInBtn.disabled = currentScale >= MAX_SCALE;
        zoomOutBtn.disabled = currentScale <= MIN_SCALE;
    }

    zoomInBtn.addEventListener('click', () => updateZoom(currentScale + SCALE_STEP));
    zoomOutBtn.addEventListener('click', () => updateZoom(currentScale - SCALE_STEP));
    zoomResetBtn.addEventListener('click', () => updateZoom(1));

    diagramContent.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
            updateZoom(currentScale + delta);
        }
    });

    let touchDistance = 0;
    diagramContent.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            touchDistance = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
        }
    });

    diagramContent.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const newDistance = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            const delta = ((newDistance - touchDistance) / touchDistance) * SCALE_STEP;
            updateZoom(currentScale + delta);
            touchDistance = newDistance;
        }
    });
}

/* Download Functionality */
async function downloadDiagram() {
    const diagramElement = diagramContainer.querySelector('.diagram-content');
    if (!diagramElement) {
        showError('No diagram available to download.');
        return;
    }

    try {
        const svgElement = diagramElement.querySelector('svg');
        if (!svgElement) {
            showError('No SVG element found in the diagram.');
            return;
        }

        const svgString = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const { width, height } = svgElement.getBoundingClientRect();
        const scaleFactor = 4;
        canvas.width = width * scaleFactor;
        canvas.height = height * scaleFactor;

        const img = new Image();
        img.onload = () => {
            context.drawImage(img, 0, 0, canvas.width, canvas.height);

            const fileType = 'image/png';
            const dataUrl = canvas.toDataURL(fileType);

            const downloadLink = document.createElement('a');
            downloadLink.href = dataUrl;
            downloadLink.download = 'mermaid-diagram.png';
            downloadLink.click();

            URL.revokeObjectURL(svgUrl);
        };

        img.onerror = () => {
            showError('Failed to render SVG. Please try again.');
            URL.revokeObjectURL(svgUrl);
        };

        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

    } catch (e) {
        console.error('Error downloading diagram:', e);
        showError('Failed to download the diagram. Please try again later.');
    }
}

/* Mermaid Initialization and Rendering */
async function initializeMermaid() {
    if (!mermaidInitialized && window.mermaid) {
        try {
            window.mermaid.initialize(mermaidConfig);
            mermaidInitialized = true;
        } catch (e) {
            console.error('Mermaid initialization error:', e);
            throw new Error('Failed to initialize Mermaid');
        }
    }
}

function cleanMermaidSyntax(syntax) {
    return syntax
        .replace(/```mermaid\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^mermaid\n?/g, '')
        .trim();
}

async function renderDiagram(mermaidSyntax) {
    const diagramContainer = document.getElementById('diagram-output');
    const diagramContent = diagramContainer.querySelector('.diagram-content');
    const summarizeBtn = document.getElementById('summarize-btn');

    try {
        summarizeBtn.classList.add('hidden');
        diagramContainer.classList.add('hidden');

        await initializeMermaid();
        const diagramId = 'diagram-' + Date.now();

        const tempContainer = document.createElement('div');
        tempContainer.id = diagramId;
        tempContainer.style.display = 'none';
        document.body.appendChild(tempContainer);

        try {
            const { svg } = await window.mermaid.render(diagramId, mermaidSyntax);
            diagramContent.innerHTML = svg;

            const existingZoomControls = diagramContainer.querySelector('.zoom-controls');
            if (!existingZoomControls) {
                setupZoomControls();
            }

            currentScale = 1;
            diagramContent.style.transform = 'scale(1)';
            const zoomLevelDisplay = diagramContainer.querySelector('.zoom-level');
            if (zoomLevelDisplay) {
                zoomLevelDisplay.textContent = '100%';
            }

            diagramContainer.classList.remove('hidden');

            setTimeout(() => {
                summarizeBtn.classList.remove('hidden');
            }, 300);

        } finally {
            tempContainer.remove();
        }
    } catch (e) {
        console.error('Error rendering diagram:', e);
        showError('Failed to render diagram. Please check the syntax and try again.')
        throw e;
    }
}

/* AI Prompt Execution */
async function runPrompt(query, params) {
    const diagramContainer = document.getElementById('diagram-output');
    const summarizeBtn = document.getElementById('summarize-btn');

    try {
        console.log('Generating Mermaid diagram');
        toggleLoading(true);

        diagramContainer.classList.add('hidden');
        summarizeBtn.classList.add('hidden');

        if (!session) {
            const diagramType = diagramTypeSelect.value;
            session = await window.ai.languageModel.create({
                ...params,
                systemPrompt: AI_PARAMS.getSystemPrompt(diagramType)
            });
        }

        mermaidSyntax = await session.prompt(query);
        mermaidSyntax = cleanMermaidSyntax(mermaidSyntax);
        console.log('Mermaid syntax generated:', mermaidSyntax);

        toggleLoading(false);

        await renderDiagram(mermaidSyntax);
        return mermaidSyntax;

    } catch (e) {
        console.error('Error generating diagram:', e);
        showError('Failed to generate diagram. Please check your input and try again.');
        await reset();
        throw e;
    } finally {
        toggleLoading(false);
    }
}

/* UI Helpers */
function toggleLoading(show) {
    loadingSpinner.classList.toggle('visible', show);
    loadingSpinner.classList.toggle('hidden', !show);
    sendBtn.disabled = show;
}

function showError(message) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 5000);
}

async function reset() {
    if (session) {
        await session.destroy();
    }
    session = null;
    diagramContent.innerHTML = '';
    diagramContainer.classList.add('hidden');
    errorElement.classList.add('hidden');
    currentScale = 1;

    const summarizeBtn = document.getElementById('summarize-btn');
    if (summarizeBtn) {
        summarizeBtn.classList.add('hidden');
    }

    const summaryOutput = document.getElementById('summary-output');
    if (summaryOutput) {
        summaryOutput.classList.add('hidden');
    }
}

async function userGuide() {
    const userGuideButton = document.getElementById('userguideBtn');
    if (userGuideButton) {
        window.location.href = 'user-guide.html';
    }
}

async function initDefaults() {
    if (!window.ai) {
        showError('Error: window.ai not supported in this browser');
        return;
    }

    try {
        const defaults = await window.ai.languageModel.capabilities();
        AI_PARAMS.temperature = defaults.temperature;
        AI_PARAMS.topK = defaults.topK;
        await initializeMermaid();
    } catch (e) {
        console.error('Error initializing:', e);
        showError('Failed to initialize. Please refresh the page.');
    }
}

/* Event Listeners */
messageInput.addEventListener('input', () => {
    if (sendBtn) {
        sendBtn.disabled = !messageInput.value.trim();
    }
});

diagramTypeSelect.addEventListener('change', async() => {
    if (session) {
        await reset();
    }
});

diagramForm.addEventListener('submit', async(e) => {
    e.preventDefault();
    const prompt = messageInput.value.trim();
    if (!prompt) return;

    try {
        const params = {
            temperature: AI_PARAMS.temperature,
            topK: AI_PARAMS.topK,
        };
        await runPrompt(prompt, params);
    } catch (e) {
        console.error('Error in generating diagram:', e);
    }
});

resetBtn.addEventListener('click', reset);

userGuideBtn.addEventListener('click', async() => {
    const userGuideButton = document.getElementById('userguideBtn');
    if (userGuideButton) {
        window.location.href = '/sidepanel/user-guide.html';
    }
});

suggestBtn.addEventListener('click', async() => {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) {
        showError('Message input element not found.');
        return;
    }

    const userInput = messageInput.value.trim();
    if (!userInput) {
        showError('Please enter a diagram description first.');
        return;
    }

    showSuggestionModal(userInput);
});

/* Suggestion Modal */
async function showSuggestionModal(userInput) {
    const modal = document.createElement('div');
    modal.className = 'suggestion-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Improving Your Diagram Description</h2>
            <div class="suggestions-container">
                <div class="loading-indicator">
                    <span>Generating improved description...</span>
                </div>
            </div>
            <div class="modal-actions">
                <button class="retry-btn" disabled>↻ Retry</button>
                <button class="copy-btn" disabled>📋 Copy</button>
                <button class="accept-btn" disabled>Accept</button>
                <button class="cancel-btn">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const suggestionsContainer = modal.querySelector('.suggestions-container');
    const retryBtn = modal.querySelector('.retry-btn');
    const copyBtn = modal.querySelector('.copy-btn');
    const acceptBtn = modal.querySelector('.accept-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');

    function formatText(text) {
        return text.trim()
            .split('\n')
            .map(line => line.trim())
            .join('\n');
    }

    async function generateSuggestion() {
        suggestionsContainer.innerHTML = `
            <div class="loading-indicator">
                <span>Generating improved description...</span>
            </div>
        `;
        retryBtn.disabled = true;
        copyBtn.disabled = true;
        acceptBtn.disabled = true;

        try {
            const result = await suggestImprovedDiagram(userInput);
            if (result) {
                const formattedText = formatText(result.enhancedDescription);
                suggestionsContainer.textContent = formattedText;

                retryBtn.disabled = false;
                copyBtn.disabled = false;
                acceptBtn.disabled = false;
            }
        } catch (error) {
            suggestionsContainer.innerHTML = 'Error: Failed to generate suggestion. Please try again.';
            retryBtn.disabled = false;
        }
    }

    await generateSuggestion();

    retryBtn.addEventListener('click', generateSuggestion);

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(suggestionsContainer.textContent)
            .then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✓ Copied!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text:', err);
            });
    });

    acceptBtn.addEventListener('click', () => {
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.value = suggestionsContainer.textContent;
        }
        document.body.removeChild(modal);
    });

    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

async function suggestImprovedDiagram(userInput) {
    try {
        console.log('Generating diagram improvement suggestions');

        const diagramRewriter = await window.ai.rewriter.create({
            context: 'Transform user-provided input into a precise, technical, concise description using professional terminology, capturing core concepts, essential structure, and key components while providing a clear, unambiguous high-level overview that omits unnecessary details and preserves critical technical information.'
        });

        const enhancedDescription = await diagramRewriter.rewrite(userInput);

        if (enhancedDescription) {
            return {
                originalDescription: userInput,
                enhancedDescription: enhancedDescription.trim()
            };
        }

        return null;
    } catch (e) {
        console.error('Error generating suggestions:', e);
        throw e;
    }
}

/* Summarization */
summarizeBtn.addEventListener('click', async() => {
    const diagramContent = document.querySelector('.diagram-content');
    const summarizeBtn = document.getElementById('summarize-btn');
    const summaryOutput = document.getElementById('summary-output');
    const summaryHeader = summaryOutput.querySelector('.summary-header');
    const summaryContent = summaryOutput.querySelector('.summary-content');

    if (!diagramContent || !summaryContent) {
        showError('Unable to find diagram or summary container.');
        return;
    }

    try {
        summarizeBtn.disabled = true;
        summarizeBtn.textContent = '✦ Summarizing...';

        if (!mermaidSyntax || mermaidSyntax.trim() === '') {
            throw new Error('No Mermaid syntax available for summarization');
        }

        const diagramSummarizer = await window.ai.summarizer.create({
            type: 'key-points',
            length: 'medium',
            context: 'You are an expert at analyzing and summarizing technical diagrams. Provide a clear, concise summary that explains the key components, relationships, and overall purpose of the diagram. Use professional language, highlight the most important elements, and make the summary accessible to a technical audience.'
        });

        const diagramSummary = await diagramSummarizer.summarize(mermaidSyntax);

        summaryContent.innerHTML = '';

        // Parse and format the summary for bold and bullet points
        const paragraphs = diagramSummary.split('\n').filter(p => p.trim() !== '');
        let ul = null; // Track unordered list

        paragraphs.forEach(paragraph => {
            if (paragraph.startsWith('*')) {
                if (!ul) {
                    ul = document.createElement('ul'); // Create a new unordered list
                    summaryContent.appendChild(ul);
                }

                const li = document.createElement('li');
                li.innerHTML = paragraph.slice(1).trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Apply bold formatting within list
                ul.appendChild(li);
            } else {
                if (ul) ul = null; // End the list if paragraph doesn't start with `*`

                const p = document.createElement('p');
                p.innerHTML = paragraph.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Apply bold formatting
                summaryContent.appendChild(p);
            }
        });

        const copyButton = document.createElement('button');
        copyButton.classList.add('copy-icon');
        copyButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        `;

        copyButton.addEventListener('click', () => {
            const textToCopy = paragraphs.join('\n');
            const tempTextArea = document.createElement('textarea');
            tempTextArea.value = textToCopy;
            document.body.appendChild(tempTextArea);
            tempTextArea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextArea);

            copyButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6 9 17l-5-5"></path>
                </svg>
            `;

            setTimeout(() => {
                copyButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1-2-2h9a2 2 0 0 1-2 2v1"></path>
                    </svg>
                `;
            }, 2000);
        });

        summaryHeader.appendChild(copyButton);

        summaryOutput.classList.remove('hidden');

        summarizeBtn.disabled = false;
        summarizeBtn.textContent = '✦ Summarize Diagram';

    } catch (error) {
        console.error('Diagram summarization error:', error);
        showError('Failed to generate diagram summary. Please try again.');

        summarizeBtn.disabled = false;
        summarizeBtn.textContent = '✦ Summarize Diagram';
    }
});


/* Initialization */
document.addEventListener('DOMContentLoaded', () => {
    initDefaults();
});