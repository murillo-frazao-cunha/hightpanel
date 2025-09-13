// Compartilhado entre backend e frontend
// Parser e aplicador de regras de variáveis de Core
// Regras suportadas: required | nullable | string | number | boolean | max:<n> | default:<valor> | regex:/pattern/flags

export interface CoreVariableSpec {
  name: string;
  description?: string;
  envVariable: string;
  rules?: string;
}

export interface ParsedRuleSpec {
  required: boolean;
  nullable: boolean;
  isString: boolean;
  isNumber: boolean;
  isBoolean: boolean;
  max?: number;
  defaultValue?: string;
  regex?: RegExp;
  raw: string;
}

export interface ApplyRulesResult {
  ok: boolean;
  env?: Record<string, any>;
  error?: string;
}

export function parseRules(rules: string | undefined): ParsedRuleSpec {
  const raw = rules || '';
  const tokens = raw.split('|').map(t => t.trim()).filter(Boolean);
  let required = false;
  let nullable = false;
  let isString = false;
  let isNumber = false;
  let isBoolean = false;
  let max: number | undefined;
  let defaultValue: string | undefined;
  let regex: RegExp | undefined;

  for (const token of tokens) {
    if (token === 'required') required = true;
    else if (token === 'nullable') nullable = true;
    else if (token === 'string') isString = true;
    else if (token === 'number') isNumber = true;
    else if (token === 'boolean') isBoolean = true;
    else if (token.startsWith('default:')) {
      defaultValue = token.substring('default:'.length);
    } else if (token.startsWith('max:')) {
      const n = parseInt(token.substring('max:'.length), 10);
      if (!isNaN(n)) max = n;
    } else if (token.startsWith('regex:')) {
      const patternRaw = token.substring('regex:'.length);
      let r: RegExp | undefined;
      if (patternRaw.startsWith('/')) {
        const lastSlash = patternRaw.lastIndexOf('/');
        if (lastSlash > 0) {
          const body = patternRaw.slice(1, lastSlash);
          const flags = patternRaw.slice(lastSlash + 1);
          try { r = new RegExp(body, flags); } catch { /* ignore */ }
        }
      }
      if (!r) {
        try { r = new RegExp(patternRaw); } catch { /* ignore */ }
      }
      if (r) regex = r;
    }
  }

  return { required, nullable, isString, isNumber, isBoolean, max, defaultValue, regex, raw };
}

/**
 * Aplica regras sobre um environment de acordo com as variáveis do Core.
 * @param variables Lista de variáveis do core.
 * @param environment Environment atual (pode ser parcial).
 * @param mode 'create' ou 'edit'. (atual, usado só para semântica futura)
 */
export function applyCoreVariableRules(variables: CoreVariableSpec[], environment: Record<string, any> | undefined, mode: 'create' | 'edit'): ApplyRulesResult {
  const finalEnv: Record<string, any> = { ...(environment || {}) };

  for (const variable of variables) {
    const spec = parseRules(variable.rules);
    const key = variable.envVariable;
    let value = finalEnv[key];

    // default se vazio
    if ((value === undefined || value === null || value === '') && spec.defaultValue !== undefined) {
      finalEnv[key] = spec.defaultValue;
      value = spec.defaultValue;
    }

    // required
    if (spec.required && (value === undefined || value === null || value === '')) {
      return { ok: false, error: `Variável '${variable.name}' (${key}) é obrigatória.` };
    }

    // nullable -> se continua vazio, normaliza para string vazia e pula
    if ((value === undefined || value === null || value === '') && spec.nullable) {
      if (value === undefined || value === null) finalEnv[key] = '';
      continue;
    }

    // boolean -> normaliza para 0 / 1
    if (spec.isBoolean) {
      if (value === undefined || value === null || value === '') {
        // vazio aqui só passa se não for required (já checado) -> deixa como está
        continue;
      }
      let b: number | undefined;
      if (typeof value === 'boolean') b = value ? 1 : 0;
      else if (typeof value === 'number') {
        if (value === 0 || value === 1) b = value;
      } else if (typeof value === 'string') {
        const lower = value.trim().toLowerCase();
        if (['1', 'true', 't', 'yes', 'y', 'on'].includes(lower)) b = 1;
        else if (['0', 'false', 'f', 'no', 'n', 'off'].includes(lower)) b = 0;
      }
      if (b === undefined) {
        return { ok: false, error: `Variável '${variable.name}' (${key}) deve ser boolean (0/1).` };
      }
      finalEnv[key] = b; // salva como número 0/1
      continue; // nada mais a aplicar
    }

    // number -> converte e aplica max como limite numérico se definido
    if (spec.isNumber) {
      if (value === undefined || value === null || value === '') {
        continue; // vazio permitido se não required já passou
      }
      let n: number | undefined;
      if (typeof value === 'number') n = value;
      else if (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))) n = Number(value);
      if (n === undefined) {
        return { ok: false, error: `Variável '${variable.name}' (${key}) deve ser numérica.` };
      }
      if (spec.max !== undefined && n > spec.max) {
        return { ok: false, error: `Variável '${variable.name}' (${key}) excede o máximo (${spec.max}).` };
      }
      finalEnv[key] = n;
      continue; // não aplica regex / string rules
    }

    // tipo string
    if (spec.isString && value !== undefined && value !== null && typeof value !== 'string') {
      return { ok: false, error: `Variável '${variable.name}' (${key}) deve ser string.` };
    }

    if (spec.max !== undefined && typeof value === 'string' && value.length > spec.max) {
      return { ok: false, error: `Variável '${variable.name}' excede o tamanho máximo (${spec.max}).` };
    }

    if (spec.regex && typeof value === 'string' && value !== '' && !spec.regex.test(value)) {
      return { ok: false, error: `Variável '${variable.name}' não atende ao padrão exigido.` };
    }
  }

  return { ok: true, env: finalEnv };
}

/**
 * Gera environment inicial apenas com defaults.
 */
export function buildDefaultEnvironment(variables: CoreVariableSpec[]): Record<string,string> {
  const env: Record<string,string> = {};
  for (const v of variables) {
    const spec = parseRules(v.rules);
    env[v.envVariable] = spec.defaultValue !== undefined ? spec.defaultValue : '';
  }
  return env;
}
