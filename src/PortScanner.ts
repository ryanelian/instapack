import net from 'net';

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
