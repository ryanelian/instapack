import say = require('say');

export class VoiceAssistant {
    private silent: boolean;
    private suppress = false;

    constructor(silent = false) {
        this.silent = silent;
    }

    speak(message: string): void {
        if (this.silent || this.suppress) {
            return;
        }

        try {
            say.speak(message, 'Samantha', 1.3, () => {
                // do nothing
            });
            this.suppress = true;
        } catch (error) {
            // do nothing
        }
    }

    rewind(): void {
        this.suppress = false;
    }
}
