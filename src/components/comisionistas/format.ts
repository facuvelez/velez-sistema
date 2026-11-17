export function formatoCosto(monto: number | null, nota: string | null): string {
  const partes: string[] = [];
  if (monto != null && !Number.isNaN(monto)) {
    partes.push(`$ ${monto.toLocaleString('es-AR', { maximumFractionDigits: 0 })} aprox.`);
  }
  if (nota) partes.push(nota);
  return partes.length ? partes.join(' · ') : 'Sin cargar';
}

/** Link de WhatsApp a un número argentino; null si no hay teléfono. */
export function linkWhatsApp(telefono: string | null | undefined, mensaje: string): string | null {
  if (!telefono) return null;
  let d = telefono.replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('0')) d = d.slice(1);
  if (!d.startsWith('54')) {
    // quitar el "15" de celulares escritos a la antigua (ej: 3571 15 123456)
    d = d.replace(/^(\d{2,4})15(\d{6,8})$/, '$1$2');
    d = `549${d}`;
  }
  return `https://wa.me/${d}?text=${encodeURIComponent(mensaje)}`;
}
