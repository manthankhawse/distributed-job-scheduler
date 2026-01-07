interface RuntimeConfig {
    image: string;
    extension: string;
    getCommand: (filePath: string, deps: string[]) => string[];
}

export const RUNTIMES: Record<string, RuntimeConfig> = {
    'python:3.9': {
        image: 'python:3.9-slim',
        extension: '.py',
        getCommand: (path, deps) => {
            const install = deps.length > 0 ? `pip install ${deps.join(' ')} &&` : '';
            return ['sh', '-c', `${install} python -u ${path}`];
        }
    },
    'node:18': {
        image: 'node:18-alpine',
        extension: '.js',
        getCommand: (path, deps) => {
            if (deps.length > 0) {
                const installCmd = `mkdir -p /tmp/deps && cd /tmp/deps && npm install --no-save ${deps.join(' ')}`;
                return ['sh', '-c', `${installCmd} && export NODE_PATH=/tmp/deps/node_modules && node ${path}`];
            }
            return ['sh', '-c', `node ${path}`];
        }
    },
    'bash': {
        image: 'alpine:3.14',
        extension: '.sh',
        getCommand: (path, _) => ['sh', path]
    }
};