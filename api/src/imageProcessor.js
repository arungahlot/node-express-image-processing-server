const {isMainThread, Worker} = require('worker_threads')
const {resolve} = require('path')
const pathToResizeWorker = resolve(__dirname, 'resizeWorker.js');
const pathToMonochromeWorker = resolve(__dirname, 'monochromeWorker.js');

function uploadPathResolver(filename) {
    return resolve(__dirname, '../uploads', filename)
}

module.exports = function imageProcessor(filename) {
    const sourcePath = uploadPathResolver(filename);
    const resizedDestination = uploadPathResolver(`resized-${filename}`);
    const monochromeDestination = uploadPathResolver(`monochrome-${filename}`);
    let resizeWorkerFinished = false
    let monochromeWorkerFinished = false
    return new Promise((resolve, reject) => {
        if (isMainThread) {
            try {
                const resizeWorker = new Worker(pathToResizeWorker, {
                    workerData: {
                        source: sourcePath,
                        destination: resizedDestination
                    }
                });
                const monochromeWorker = new Worker(pathToMonochromeWorker, {
                    workerData: {
                        source: sourcePath,
                        destination: monochromeDestination
                    }
                });
                resizeWorker.on('message', (message) => {
                    resizeWorkerFinished = true
                    if (monochromeWorkerFinished)
                        resolve('resizeWorker finished processing')
                })
                resizeWorker.on('error', (error) => reject(new Error(error.message)))
                resizeWorker.on('exit', (code) => {
                    if (code !== 0)
                        reject(new Error(`Exited with status code ${code}`))
                })
                monochromeWorker.on('message', message => {
                    monochromeWorkerFinished = true
                    if (resizeWorkerFinished)
                        resolve('monochromeWorker finished processing')
                })
                monochromeWorker.on('error', (error) => reject(new Error(error.message)))
                monochromeWorker.on('exit', (code) => {
                    if (code !== 0)
                        reject(new Error(`Exited with status code ${code}`))
                })
            } catch (e) {
                reject(e)
            }
        } else
            reject(new Error('not on main thread'))
    });
}