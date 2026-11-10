import { SALAS, type Seccion } from './salas.config';

const tieneContenido = (s: Seccion) =>
    !!(s.texto && s.texto.trim()) || !!(s.lista && s.lista.length) || !!s.imagen;

/**
 * Todas las secciones de la investigación de una sala, en orden de lectura:
 * marco teórico, pregunta, hipótesis, materiales, procedimiento, resultados y
 * conclusión. Las que están vacías no se muestran.
 */
export function seccionesInvestigacion(i: number): Seccion[] {
    const inv = SALAS[i].investigacion;
    return [
        ...(inv.marcoTeorico ?? []),
        { titulo: 'La pregunta', texto: inv.pregunta },
        { titulo: 'Hipótesis', texto: inv.hipotesis },
        { titulo: 'Materiales', lista: inv.materiales },
        { titulo: 'Procedimiento', lista: inv.procedimiento, numerada: true },
        { titulo: 'Resultados', texto: inv.resultados },
        { titulo: 'Conclusión', texto: inv.conclusion }
    ].filter(tieneContenido);
}

const largo = (g: Seccion[]) =>
    g.reduce((n, s) => n + (s.texto?.length ?? 0) + (s.lista ?? []).join(' ').length + 40, 0);

/**
 * Reparte las secciones en los paneles de las paredes (hasta 6, tres por muro). Pregunta + hipótesis y
 * resultados + conclusión van juntos; si sobran grupos, se unen los vecinos más
 * cortos hasta que queden 6.
 */
export function panelesInvestigacion(i: number): Seccion[][] {
    const secciones = seccionesInvestigacion(i);
    const juntos: Record<string, string> = { 'Hipótesis': 'La pregunta', 'Conclusión': 'Resultados' };
    const grupos: Seccion[][] = [];
    for (const s of secciones) {
        const prev = grupos[grupos.length - 1];
        if (prev && juntos[s.titulo] && prev[prev.length - 1].titulo === juntos[s.titulo]) prev.push(s);
        else grupos.push([s]);
    }
    while (grupos.length > 6) {
        let mejor = 0;
        for (let k = 1; k < grupos.length - 1; k++) {
            if (largo(grupos[k]) + largo(grupos[k + 1]) < largo(grupos[mejor]) + largo(grupos[mejor + 1])) mejor = k;
        }
        grupos.splice(mejor, 2, [...grupos[mejor], ...grupos[mejor + 1]]);
    }
    return grupos;
}

const esc = (s: string) => s.replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);

/** Ruta pública de una imagen (archivo dentro de app/public/) */
export function rutaPublica(ruta: string): string {
    return /^https?:\/\//i.test(ruta) ? ruta : `${import.meta.env.BASE_URL}${ruta.replace(/^\/+/, '')}`;
}

/** HTML de la investigación completa (ventana grande y diario) */
export function investigacionHtml(i: number): string {
    return seccionesInvestigacion(i).map(s => {
        const parrafos = (s.texto ?? '').split(/\n+/).filter(p => p.trim()).map(p => `<p>${esc(p)}</p>`).join('');
        const items = (s.lista ?? []).map(x => `<li>${esc(x)}</li>`).join('');
        const lista = items ? (s.numerada ? `<ol>${items}</ol>` : `<ul>${items}</ul>`) : '';
        const img = s.imagen ? `<img class="sala-inv-img" src="${esc(rutaPublica(s.imagen))}" alt="${esc(s.titulo)}" loading="lazy">` : '';
        return `<section><h3>${esc(s.titulo)}</h3>${img}${parrafos}${lista}</section>`;
    }).join('');
}
