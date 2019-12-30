"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const url = require("url");
const upath = require("upath");
const fse = require("fs-extra");
const TypeScript = require("typescript");
const chalk = require("chalk");
const Shout_1 = require("../Shout");
const VoiceAssistant_1 = require("../VoiceAssistant");
const PrettyUnits_1 = require("../PrettyUnits");
const PathFinder_1 = require("../variables-factory/PathFinder");
class InstapackBuildPlugin {
    constructor(variables, languageTarget) {
        this.wormholes = new Set();
        this.variables = variables;
        this.finder = new PathFinder_1.PathFinder(variables);
        this.va = new VoiceAssistant_1.VoiceAssistant(variables.mute);
        this.languageTarget = languageTarget;
    }
    apply(compiler) {
        const t = TypeScript.ScriptTarget[this.languageTarget].toUpperCase();
        compiler.hooks.compile.tap('typescript-compile-start', () => {
            Shout_1.Shout.timed('Compiling', chalk.cyan('index.ts'), '>>', chalk.yellow(t), chalk.grey('in ' + this.finder.jsInputFolder + '/'));
        });
        if (this.variables.production) {
            compiler.hooks.compilation.tap('typescript-minify-notify', compilation => {
                return compilation.hooks.afterHash.tap('typescript-minify-notify', () => {
                    Shout_1.Shout.timed('TypeScript compilation finished! Minifying bundles...');
                });
            });
        }
        compiler.hooks.done.tapPromise('display-build-results', (stats) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const statsObject = stats.toJson(this.statsSerializeEssentialOption);
            const outputPublicPath = (_a = compiler.options.output) === null || _a === void 0 ? void 0 : _a.publicPath;
            this.displayBuildResults(statsObject, outputPublicPath);
            if (this.variables.serve) {
                if (outputPublicPath) {
                    yield this.putInjectionScripts(statsObject, outputPublicPath);
                }
                else {
                    Shout_1.Shout.error(new Error('instapack: Cannot create injection scripts due to undefined output.publicPath webpack option!'));
                }
            }
            if (statsObject.time) {
                const t = PrettyUnits_1.prettyMilliseconds(statsObject.time);
                Shout_1.Shout.timed('Finished JS build after', chalk.green(t));
            }
            else {
                Shout_1.Shout.timed('Finished JS build.');
            }
        }));
    }
    get statsSerializeEssentialOption() {
        return {
            assets: true,
            cached: false,
            cachedAssets: false,
            children: false,
            chunkModules: false,
            chunkOrigins: false,
            chunks: this.variables.serve,
            depth: false,
            entrypoints: false,
            env: false,
            errors: true,
            errorDetails: false,
            hash: false,
            modules: false,
            moduleTrace: true,
            publicPath: false,
            reasons: false,
            source: false,
            timings: true,
            version: false,
            warnings: true,
            usedExports: false,
            performance: false,
            providedExports: false
        };
    }
    displayBuildResults(stats, outputPublicPath) {
        const errors = stats.errors;
        if (errors.length) {
            const errorMessage = '\n' + errors.join('\n\n') + '\n';
            console.error(chalk.red(errorMessage));
            this.va.speak(`JAVA SCRIPT BUILD: ${errors.length} ERROR!`);
        }
        else {
            this.va.rewind();
        }
        const warnings = stats.warnings;
        if (warnings.length) {
            const warningMessage = '\n' + warnings.join('\n\n') + '\n';
            console.warn(chalk.yellow(warningMessage));
        }
        if (stats.assets) {
            for (const asset of stats.assets) {
                if (asset.emitted) {
                    const kb = PrettyUnits_1.prettyBytes(asset.size);
                    const where = 'in ' + (this.variables.serve ? outputPublicPath : this.finder.jsOutputFolder);
                    Shout_1.Shout.timed(chalk.blue(asset.name), chalk.magenta(kb), chalk.grey(where));
                }
            }
        }
    }
    putInjectionScripts(stats, outputPublicPath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!stats.chunks) {
                Shout_1.Shout.error(new Error('Cannot create injection scripts due to undefined stats chunk!'));
                return;
            }
            const tasks = [];
            for (const chunk of stats.chunks) {
                if (chunk.initial === false) {
                    continue;
                }
                for (const file of chunk.files) {
                    if (file.includes('.hot-update.js')) {
                        continue;
                    }
                    if (this.wormholes.has(file)) {
                        continue;
                    }
                    const task = this.putInjectionScript(file, outputPublicPath);
                    tasks.push(task);
                    this.wormholes.add(file);
                }
            }
            try {
                yield Promise.all(tasks);
            }
            catch (error) {
                Shout_1.Shout.error('creating injection scripts!', error);
            }
        });
    }
    putInjectionScript(fileName, outputPublicPath) {
        const physicalFilePath = upath.join(this.finder.jsOutputFolder, fileName);
        const hotUri = url.resolve(outputPublicPath, fileName);
        Shout_1.Shout.timed(`Inject <script> ${chalk.cyan(physicalFilePath)} --> ${chalk.cyan(hotUri)}`);
        const hotProxy = this.createInjectionScriptToHotReloadingScript(hotUri);
        return fse.outputFile(physicalFilePath, hotProxy);
    }
    createInjectionScriptToHotReloadingScript(uri) {
        return `// instapack Script Injection: automagically reference the real hot-reloading script
(function () {
    var body = document.getElementsByTagName('body')[0];

    var target = document.createElement('script');
    target.src = '${uri}';
    body.appendChild(target);
})();
`;
    }
}
exports.InstapackBuildPlugin = InstapackBuildPlugin;
