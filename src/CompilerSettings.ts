import * as path from 'path';
import * as gutil from 'gulp-util';
import * as resolve from 'resolve';

export class CompilerSettings {

    projectFolder: string;

    input: string;

    output: string;

    concat: { [key: string]: string[] };

    get concatResolution(): { [key: string]: string[] } {
        let resolver: { [key: string]: string[] } = {};
        let resolverLength = 0;
        let resolveOption = { basedir: this.projectFolder };

        for (let concatResult in this.concat) {
            let resolverItems: string[] = [];

            let concatItems = this.concat[concatResult];
            for (let i in concatItems) {
                let concatModule = concatItems[i];
                let concatModulePath = resolve.sync(concatModule, resolveOption);
                resolverItems.push(concatModulePath);
            }

            resolverLength++;
            resolver[concatResult + '.js'] = resolverItems;
        }

        return resolver;
    }

    get npmFolder(): string {
        return path.join(this.projectFolder, 'node_modules');
    }

    get bowerFolder(): string {
        return path.join(this.projectFolder, 'bower_components');
    }

    get inputFolder(): string {
        return path.join(this.projectFolder, this.input);
    }

    get jsEntry(): string {
        return path.join(this.inputFolder, 'js', 'index.ts');
    }

    get cssEntry(): string {
        return path.join(this.inputFolder, 'css', 'site.scss');
    }

    get cssWatchGlob(): string {
        return path.join(this.inputFolder, 'css', '**', '*.scss');
    }

    get outputFolder(): string {
        return path.join(this.projectFolder, this.output);
    }

    get outputJsFolder(): string {
        return path.join(this.outputFolder, 'js');
    }

    get outputCssFolder(): string {
        return path.join(this.outputFolder, 'css');
    }

    static tryReadFromFile(): CompilerSettings {
        let settings = new CompilerSettings();

        settings.projectFolder = process.cwd();
        let json = path.join(settings.projectFolder, 'package.json');

        try {
            gutil.log('Reading settings from', gutil.colors.cyan(json + ':instapack'));
            let parse = require(json).instapack;
            settings.input = parse.input;
            settings.output = parse.output;
            settings.concat = parse.concat;
        } catch (error) {
            gutil.log('Failed to read settings. Using default settings.');
        }

        if (!settings.input) {
            settings.input = 'client';
        }

        if (!settings.output) {
            settings.output = 'wwwroot';
        }

        if (!settings.concat) {
            settings.concat = {};
        }

        gutil.log('Using output folder', gutil.colors.cyan(settings.outputFolder));
        return settings;
    }
}
