// voice.js - Reusable VoiceInput Component logic mimicking VoiceInput.jsx in a Vanilla environment
document.addEventListener('DOMContentLoaded', () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const synth = window.speechSynthesis;

    window.VoiceInputSystem = {
        speak: function(text) {
            if (!synth) return;
            // Clean out the opposite language from the string if we want pure speech, 
            // but for simple intents, the browser speech synthesis will attempt reading it.
            synth.cancel();
            const isTelugu = localStorage.getItem('agroLang') === 'te';
            const lang = isTelugu ? 'te-IN' : 'en-US';
            
            // Basic stripping to sound natural
            let speechText = text;
            if (isTelugu && text.includes('.')) {
                speechText = text.split('.')[1] || text;
            } else if (!isTelugu && text.includes('.')) {
                speechText = text.split('.')[0] || text;
            }

            const utterance = new SpeechSynthesisUtterance(speechText);
            utterance.lang = lang;
            
            // Add visual 🔊 feedback element globally via toast if needed, but speaking implies the system is processing.
            synth.speak(utterance);
        }
    };

    if (!SpeechRecognition) {
        console.warn("Speech Recognition not supported in this browser. Voice features disabled.");
        document.querySelectorAll('[data-voice="true"]').forEach(el => {
            el.placeholder = "Voice not supported. Type manually.";
        });
        return;
    }

    // Auto-mount on any inputs flagged for voice
    document.querySelectorAll('[data-voice="true"]').forEach(inputEl => {
        // Wrap input safely without breaking attributes
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = inputEl.style.display === 'block' ? 'block' : 'inline-block';
        wrapper.style.width = inputEl.style.width || '100%';
        wrapper.style.maxWidth = '100%';
        
        // Inherit flex properties to prevent layout breaking
        if(inputEl.style.flex) {
            wrapper.style.flex = inputEl.style.flex;
        }

        inputEl.parentNode.insertBefore(wrapper, inputEl);
        wrapper.appendChild(inputEl);
        inputEl.style.width = '100%';
        inputEl.style.paddingRight = '45px'; // make room for mic

        const micBtn = document.createElement('button');
        micBtn.innerHTML = '🎤';
        micBtn.style.position = 'absolute';
        micBtn.style.right = '5px';
        micBtn.style.top = '50%';
        micBtn.style.transform = 'translateY(-50%)';
        micBtn.style.background = '#e8f5e9';
        micBtn.style.border = '1px solid #2e7d32';
        micBtn.style.borderRadius = '50%';
        micBtn.style.width = '35px';
        micBtn.style.height = '35px';
        micBtn.style.fontSize = '1.1rem';
        micBtn.style.cursor = 'pointer';
        micBtn.style.zIndex = '10';
        micBtn.style.transition = '0.3s';
        micBtn.title = window.t ? window.t("click_to_speak") : "Click to speak";

        micBtn.addEventListener('mouseenter', () => micBtn.style.background = '#c8e6c9');
        micBtn.addEventListener('mouseleave', () => micBtn.style.background = '#e8f5e9');

        wrapper.appendChild(micBtn);

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        let isRecording = false;

        micBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (isRecording) {
                recognition.stop();
                return;
            }
            
            // Set dynamic language from custom Translation system (Fallback to en-US)
            const savedLang = localStorage.getItem('agroLang');
            recognition.lang = savedLang === 'te' ? 'te-IN' : 'en-US';
            
            try {
                // Ensure permission explicitly checks readiness if needed, though recognition.start handles it
                recognition.start();
            } catch(err) {
                console.log("Error:", err);
                inputEl.placeholder = "Mic in use or error.";
                stopUI();
            }
        });

        recognition.onstart = () => {
            isRecording = true;
            micBtn.style.background = '#ffebee';
            micBtn.style.borderColor = '#d32f2f';
            micBtn.innerHTML = '🔴';
            if(inputEl.placeholder) inputEl.setAttribute('data-original-placeholder', inputEl.placeholder);
            inputEl.placeholder = "Listening...";
            console.log("Voice recognition started.");
        };

        recognition.onresult = (event) => {
            // Check if results exist to prevent "No result returned" bugs
            if (!event.results || !event.results[0] || !event.results[0][0]) return;

            const transcript = event.results[0][0].transcript;
            console.log("Voice result:", transcript);
            
            inputEl.value = transcript; 
            
            // Dispatch standard DOM events so validation/search listens natively
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));

            // If processing explicitly delegated
            if (inputEl.dataset.processCallback && typeof window[inputEl.dataset.processCallback] === 'function') {
                window[inputEl.dataset.processCallback]();
            }
        };

        recognition.onerror = (e) => {
            console.log("Error:", e.error);
            isRecording = false;
            
            if (e.error === 'not-allowed') {
                inputEl.placeholder = "Mic denied. Type manually.";
                micBtn.style.display = 'none'; // Hide if permanently denied to force manual
            } else if (e.error === 'no-speech') {
                inputEl.placeholder = "No speech detected. Try again.";
            } else if (e.error === 'network') {
                inputEl.placeholder = "Network error. Try again.";
            } else {
                inputEl.placeholder = "Error: " + e.error;
            }
            stopUI();
        };

        recognition.onend = () => {
            console.log("Voice recognition ended.");
            stopUI();
        };

        function stopUI() {
            isRecording = false;
            micBtn.innerHTML = '🎤';
            micBtn.style.background = '#e8f5e9';
            micBtn.style.borderColor = '#2e7d32';
            
            setTimeout(() => {
                const orig = inputEl.getAttribute('data-original-placeholder');
                // Only revert if we haven't set a specific error message recently, or just revert after 3 seconds
                if(orig && inputEl.placeholder.includes("Listening")) {
                    inputEl.placeholder = orig;
                }
            }, 100);
        }
    });
});
