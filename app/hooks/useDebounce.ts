import { useState, useEffect } from 'react';

/**
 * Hook customizado para "atrasar" a atualização de um valor.
 * Isso é útil para evitar chamadas de API excessivas em campos de busca.
 * @param value O valor a ser "atrasado" (ex: o texto de um input).
 * @param delay O tempo de atraso em milissegundos.
 * @returns O valor após o atraso ter passado.
 */
export function useDebounce<T>(value: T, delay: number): T {
    // Estado para armazenar o valor "atrasado"
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(
        () => {
            // Cria um temporizador que só vai atualizar o estado
            // após o tempo de 'delay' ter passado sem que o 'value' mude.
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);

            // Função de limpeza: Isso é crucial.
            // Ela cancela o temporizador anterior toda vez que o 'value' ou 'delay' mudam.
            // Isso garante que a atualização só aconteça quando o usuário parar de digitar.
            return () => {
                clearTimeout(handler);
            };
        },
        [value, delay] // O efeito só roda novamente se o valor ou o delay mudarem
    );

    return debouncedValue;
}
