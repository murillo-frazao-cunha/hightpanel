import { Script } from './Script';

const scripts = new Map<string, Script>();

export function registerScript(script: Script) {
    if (scripts.has(script.name)) {
        throw new Error(`Script já registrado: ${script.name}`);
    }
    scripts.set(script.name, script);
}

export function getScript(name: string): Script | undefined {
    return scripts.get(name);
}

export function listScripts(): Script[] {
    return Array.from(scripts.values()).sort((a, b) => a.name.localeCompare(b.name));
}

