import say = require('say');

export class VoiceAssistant {
    private silent: boolean;
    private suppress: boolean = false;

    constructor(silent: boolean = false) {
        this.silent = silent;
    }

    speak(message: string) {
        if (this.silent || this.suppress) {
            return;
        }

        try {
            say.speak('INSTAPACK: ' + message, 'Samantha', 1.3, err => { });
            this.suppress = true;
        } catch (error) {
            
        }
    }

    rewind(){
        this.suppress = false;
    }
}
