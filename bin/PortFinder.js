"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const net = require("net");
const Shout_1 = require("./Shout");
function isPortAvailable(port) {
    return new Promise((ok, reject) => {
        let tester = net
            .createServer()
            .once('error', function (err) {
            ok(false);
        })
            .once('listening', function () {
            tester.once('close', function () {
                ok(true);
            }).close();
        })
            .listen({
            host: 'localhost',
            port: port,
            exclusive: true
        });
    });
}
exports.isPortAvailable = isPortAvailable;
function getAvailablePort(startFrom) {
    return __awaiter(this, void 0, void 0, function* () {
        let i = startFrom;
        while ((yield isPortAvailable(i)) === false) {
            i++;
            if (i > 49151) {
                throw new Error('Cannot find an open port!');
            }
        }
        return i;
    });
}
exports.getAvailablePort = getAvailablePort;
function setVariablesPorts(variables) {
    return __awaiter(this, void 0, void 0, function* () {
        let genPort1 = false;
        let genPort2 = false;
        if (variables.port1) {
            if ((yield isPortAvailable(variables.port1)) === false) {
                Shout_1.Shout.error('Configuration Error: Port 1 is not available. Randomizing Port 1...');
                genPort1 = true;
            }
        }
        else {
            genPort1 = true;
        }
        if (genPort1) {
            variables.port1 = yield getAvailablePort(22001);
        }
        if (variables.port2) {
            if ((yield isPortAvailable(variables.port2)) === false) {
                Shout_1.Shout.error('Configuration Error: Port 2 is not available. Randomizing Port 2...');
                genPort2 = true;
            }
        }
        else {
            genPort2 = true;
        }
        if (genPort2) {
            variables.port2 = yield getAvailablePort(variables.port1 + 1);
        }
    });
}
exports.setVariablesPorts = setVariablesPorts;
