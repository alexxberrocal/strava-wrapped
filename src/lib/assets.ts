/** URL de un fichero de /public/data respetando la base del despliegue (raíz o subcarpeta). */
export function dataUrl(name: string): string {
  const base = (import.meta.env?.BASE_URL as string | undefined) ?? '/';
  return `${base.endsWith('/') ? base : base + '/'}data/${name}`;
}
