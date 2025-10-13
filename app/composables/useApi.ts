export function useAPI<T>(url: string, options?: any) {
    const { $api } = useNuxtApp();
    return $api<T>(url, options);
}
