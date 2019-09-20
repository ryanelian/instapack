"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const say = require("say");
class VoiceAssistant {
    constructor(silent = false) {
        this.suppress = false;
        this.silent = silent;
    }
    speak(message) {
        if (this.silent || this.suppress) {
            return;
        }
        try {
            say.speak('INSTAPACK: ' + message, 'Samantha', 1.3, err => { });
            this.suppress = true;
        }
        catch (error) {
        }
    }
    rewind() {
        this.suppress = false;
    }
}
exports.VoiceAssistant = VoiceAssistant;
