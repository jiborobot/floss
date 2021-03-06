import * as path from 'path';
import { spawn } from 'child_process';

let electron: string;

try
{
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    electron = require('electron') as unknown as string;
}
catch (err)
{
    // silence is golden
}

interface FlossOptions {
    path: string,
    debug?: boolean,
    electron?: string,
    reporter?: string,
    reporterOptions?: any,
    require?: string,
    args?: string[]
}

/**
 * API to launch the Floss application.
 * @module floss
 * @param {Object|String} options The options map or path.
 * @param {String} [options.path] Path to the JS file to run, can be a glob.
 * @param {Boolean} [options.debug] `true` opens in headful mode.
 * @param {String} [options.electron] Path to custom electron version. If undefined
 *        will use environment variable `ELECTRON_PATH` or electron
 *        installed alongside.
 * @param {String} [options.require] Additional module to require.
 * @param {String} [options.reporter=spec] Mocha reporter (non-debug mode only)
 * @param {String|Object} [options.reporterOptions] Additional options for the reporter
 *        useful for specifying an output file if using the 'xunit' reporter.
 *        Options can be a querystring format, e.g., `"foo=2&bar=something"`
 * @param {String[]} [options.args] Additional Electron arguments, can be useful
 *        for things like disable autoplay gestures, e.g.,
 *        `["--autoplay-policy=no-user-gesture-required"]`
 * @param {Function} done Called when completed. Passes error if failed.
 */
function floss(options: string | FlossOptions): Promise<void>
{
    if (typeof options === 'string')
    {
        options = { path: options };
    }

    const opts: FlossOptions = Object.assign({
        path: '',
        debug: false,
        quiet: false,
        args: [],
        electron: process.env.ELECTRON_PATH || electron
    }, options);

    if (!opts.path)
    {
        throw new Error('No path specified for Floss.');
    }
    else if (typeof opts.path !== 'string')
    {
        throw new Error('Path type is not a string');
    }

    if (!opts.electron)
    {
        throw new Error('Unable to find Electron. Install \'electron\' alongside Floss.');
    }

    const app = path.join(__dirname, 'main');
    const args = JSON.stringify(opts);

    // copy the environment and remove things that would prevent Floss from running properly
    const envCopy = Object.assign({}, process.env);

    delete envCopy.ELECTRON_RUN_AS_NODE;
    delete envCopy.ELECTRON_NO_ATTACH_CONSOLE;

    return new Promise((resolve, reject) =>
    {
        let execPath = opts.electron as string;
        // In the case where floss is running in windows with the cmdline option --electron electron
        // options.electron will just be "electron" at this point.
        // Due to limitations with how nodejs spawns windows processes we need to add .cmd to the end of the command
        // https://github.com/nodejs/node/issues/3675
        const isWindows = (/^win/).test(process.platform);

        if (isWindows && !path.extname(execPath))
        {
            execPath += '.cmd';
        }
        const childProcess = spawn(
            execPath, [app, args, ...opts.args as string[]], {
                stdio: 'pipe',
                env: envCopy
            }
        );

        childProcess.stdout.on('data', (data) =>
        {
            process.stdout.write(data);
        });
        childProcess.on('close', (code) =>
        {
            if (code !== 0)
            {
                reject(new Error('Mocha tests failed.'));
            }
            else
            {
                resolve();
            }
        });
    });
}

export { floss };
export type { FlossOptions };
