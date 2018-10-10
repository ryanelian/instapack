import * as net from 'net';
import { IVariables } from './variables-factory/IVariables';
import { Shout } from './Shout';

/**
 * Check if a port number is available
 * @param port 
 */
export function isPortAvailable(port: number) {
    return new Promise<boolean>((ok, reject) => {
        let tester = net
            .createServer()
            .once('error', function (err) {
                // console.log(`Port ${port} is not available!`);
                ok(false);
            })
            .once('listening', function () {
                // console.log(`Port ${port} is available!`);
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

/**
 * Get any open port, ranging from input port number
 * @param startFrom 
 */
export async function getAvailablePort(startFrom: number) {
    let i = startFrom;
    while (await isPortAvailable(i) === false) {
        i++;
        if (i > 49151) {
            //  49152 up to 65535 are reserved for Ephemeral ports
            throw new Error('Cannot find an open port!');
        }
    }

    return i;
}

export async function setVariablesPorts(variables: IVariables) {
    let genPort1 = false;
    let genPort2 = false;

    if (variables.port1) {
        if (await isPortAvailable(variables.port1) === false) {
            Shout.error('Configuration Error: Port 1 is not available. Randomizing Port 1...');
            genPort1 = true;
        }
    } else {
        genPort1 = true;
    }

    if (genPort1) {
        variables.port1 = await getAvailablePort(22001);
    }

    if (variables.port2) {
        if (await isPortAvailable(variables.port2) === false) {
            Shout.error('Configuration Error: Port 2 is not available. Randomizing Port 2...');
            genPort2 = true;
        }
    } else {
        genPort2 = true;
    }

    if (genPort2) {
        variables.port2 = await getAvailablePort(variables.port1 + 1);
    }
}
