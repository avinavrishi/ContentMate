// State management
let currentStep = 1;
let videoOptions = {
    prompt: '',
    duration: 30,
    customizations: {
        stockMedia: false,
        aiMedia: false,
        aiAvatar: false,
        brandKit: false,
        bRoll: false,
        soundEffects: false,
        headings: false,
    }
};

// Modal management
function openVideoModal() {
    document.getElementById('videoModal').classList.remove('hidden');
}

function closeVideoModal() {
    document.getElementById('videoModal').classList.add('hidden');
    resetForm();
}

function resetForm() {
    currentStep = 1;
    videoOptions = {
        prompt: '',
        duration: 30,
        customizations: {
            stockMedia: false,
            aiMedia: false,
            aiAvatar: false,
            brandKit: false,
            bRoll: false,
            soundEffects: false,
            headings: false,
        }
    };
    showStep(1);
    document.getElementById('prompt').value = '';
    document.getElementById('duration').textContent = '30';
}

// Step navigation
function showStep(step) {
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('step3').classList.add('hidden');
    document.getElementById(`step${step}`).classList.remove('hidden');
    currentStep = step;
}

// Duration update
function updateDuration(value) {
    document.getElementById('duration').textContent = value;
    videoOptions.duration = parseInt(value);
}

// API calls
async function handlePromptSubmit() {
    const prompt = document.getElementById('prompt').value;
    if (!prompt) {
        alert('Please enter a prompt');
        return;
    }
    
    videoOptions.prompt = prompt;
    
    try {
        const response = await fetch('/api/video/analyze-prompt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to analyze prompt');
        }
        
        const suggestions = await response.json();
        populateStep2(suggestions);
        showStep(2);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to analyze prompt. Please try again.');
    }
}

function populateStep2(suggestions) {
    const step2 = document.getElementById('step2');
    step2.innerHTML = `
        <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Tone</h3>
            <div class="flex flex-wrap gap-2">
                ${suggestions.tone.map(tone => `
                    <button
                        onclick="selectTone('${tone}')"
                        class="px-4 py-2 rounded-full border border-gray-300 hover:border-indigo-600"
                        data-tone="${tone}"
                    >
                        ${tone}
                    </button>
                `).join('')}
            </div>
        </div>

        <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Purpose</h3>
            <div class="flex flex-wrap gap-2">
                ${suggestions.purpose.map(purpose => `
                    <button
                        onclick="selectPurpose('${purpose}')"
                        class="px-4 py-2 rounded-full border border-gray-300 hover:border-indigo-600"
                        data-purpose="${purpose}"
                    >
                        ${purpose}
                    </button>
                `).join('')}
            </div>
        </div>

        <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Audience</h3>
            <div class="flex flex-wrap gap-2">
                ${suggestions.audience.map(audience => `
                    <button
                        onclick="selectAudience('${audience}')"
                        class="px-4 py-2 rounded-full border border-gray-300 hover:border-indigo-600"
                        data-audience="${audience}"
                    >
                        ${audience}
                    </button>
                `).join('')}
            </div>
        </div>

        <div class="flex justify-between">
            <button
                onclick="showStep(1)"
                class="px-6 py-2 text-gray-600 hover:text-gray-800"
            >
                Back
            </button>
            <button
                onclick="showStep(3)"
                class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
                Next
            </button>
        </div>
    `;
}

// Selection handlers
function selectTone(tone) {
    videoOptions.tone = tone;
    document.querySelectorAll('[data-tone]').forEach(btn => {
        btn.classList.toggle('border-indigo-600', btn.dataset.tone === tone);
        btn.classList.toggle('bg-indigo-50', btn.dataset.tone === tone);
    });
}

function selectPurpose(purpose) {
    videoOptions.purpose = purpose;
    document.querySelectorAll('[data-purpose]').forEach(btn => {
        btn.classList.toggle('border-indigo-600', btn.dataset.purpose === purpose);
        btn.classList.toggle('bg-indigo-50', btn.dataset.purpose === purpose);
    });
}

function selectAudience(audience) {
    videoOptions.audience = audience;
    document.querySelectorAll('[data-audience]').forEach(btn => {
        btn.classList.toggle('border-indigo-600', btn.dataset.audience === audience);
        btn.classList.toggle('bg-indigo-50', btn.dataset.audience === audience);
    });
}

// Initialize sections
const sections = [
    {
        title: 'Video',
        icon: 'video-camera',
        gradient: 'from-blue-500 to-indigo-600',
        lightGradient: 'from-blue-50 to-indigo-50',
        options: [
            { title: 'Transform Idea to Video', description: 'Turn your prompt into a stunning video' },
            { title: 'Script to Video', description: 'Convert your script into engaging content' },
            { title: 'Blog to Video', description: 'Transform blog articles into videos' },
            { title: 'Presentation to Video', description: 'Convert presentations into videos' },
            { title: 'Product Listing to Video', description: 'Create product showcase videos' },
            { title: 'Polish Recording', description: 'Add subtitles and polish existing recordings' },
            { title: 'Start from Scratch', description: 'Create a video from scratch' }
        ]
    },
    {
        title: 'Audio',
        icon: 'musical-note',
        gradient: 'from-purple-500 to-pink-600',
        lightGradient: 'from-purple-50 to-pink-50',
        options: [
            { title: 'Transform Idea to Audio', description: 'Turn your prompt into audio content' },
            { title: 'Script to Audio', description: 'Convert your script into audio' },
            { title: 'Blog to Audio', description: 'Transform blog articles into audio' },
            { title: 'Start from Scratch', description: 'Create audio from scratch' }
        ]
    },
    {
        title: 'Design',
        icon: 'paint-brush',
        gradient: 'from-orange-500 to-red-600',
        lightGradient: 'from-orange-50 to-red-50',
        options: [
            { title: 'Create Thumbnail', description: 'Design eye-catching thumbnails' },
            { title: 'Social Posts', description: 'Create engaging social media posts' },
            { title: 'Presentations', description: 'Design beautiful presentations' },
            { title: 'Start from Scratch', description: 'Create a design from scratch' }
        ]
    }
];

function initializeSections() {
    const sectionsContainer = document.getElementById('sections');
    sectionsContainer.innerHTML = sections.map(section => `
        <div class="space-y-4">
            <div class="flex items-center space-x-2">
                <div class="p-1 rounded-md bg-gradient-to-r ${section.gradient}">
                    <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <use href="#icon-${section.icon}" />
                    </svg>
                </div>
                <h2 class="text-xl font-bold text-gray-900">${section.title}</h2>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                ${section.options.map(option => `
                    <button
                        onclick="handleOptionClick('${section.title}', '${option.title}')"
                        class="relative p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-left group overflow-hidden bg-gradient-to-br ${section.lightGradient}"
                    >
                        <div class="relative z-10">
                            <h3 class="text-base font-semibold bg-gradient-to-r ${section.gradient} bg-clip-text text-transparent group-hover:opacity-80 transition-opacity duration-200">
                                ${option.title}
                            </h3>
                            <p class="mt-2 text-sm text-gray-600">${option.description}</p>
                        </div>
                        <div class="absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-200"></div>
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function handleOptionClick(section, option) {
    if (section === 'Video' && option === 'Transform Idea to Video') {
        openVideoModal();
    } else {
        alert('This feature is coming soon!');
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeSections();
}); 