const test = require('node:test');
const assert = require('node:assert/strict');
const t = require('../utils/textoNotificacion');

const solicitudBase = {
  id: 7,
  cama: '12',
  tipoRequerimiento: 'traslado',
  tipoTraslado: 'con_camilla',
  prioridad: 'media',
  servicio: { nombre: 'Medicina Quirúrgica 3', piso: '3' }
};

test('cama y piso se muestran como pide el hospital', () => {
  assert.equal(t.textoUbicacion(solicitudBase), 'Cama 12, piso 3');
});

test('cama: acepta texto libre sin duplicar la palabra', () => {
  assert.equal(t.textoCama('12'), 'Cama 12');
  assert.equal(t.textoCama('cama 4B'), 'Cama 4B');
  assert.equal(t.textoCama('  '), '');
  assert.equal(t.textoCama(null), '');
});

test('piso: ignora "N/A" y no duplica la palabra', () => {
  assert.equal(t.textoPiso('3'), 'Piso 3');
  assert.equal(t.textoPiso('Piso 2'), 'Piso 2');
  assert.equal(t.textoPiso('N/A'), '');
  assert.equal(t.textoPiso(null), '');
});

test('ubicación con solo cama o solo piso', () => {
  assert.equal(t.textoUbicacion({ cama: '5', servicio: { piso: 'N/A' } }), 'Cama 5');
  assert.equal(t.textoUbicacion({ cama: '', servicio: { piso: '2' } }), 'Piso 2');
  assert.equal(t.textoUbicacion({}), '');
});

test('nueva solicitud: título y cuerpo', () => {
  const n = t.notificacionNuevaSolicitud(solicitudBase);
  assert.equal(n.titulo, 'Solicitud de auxiliar');
  assert.equal(n.cuerpo, 'Cama 12, piso 3\nMedicina Quirúrgica 3 · Traslado con camilla');
  assert.equal(n.urgente, false);
});

test('nueva solicitud urgente', () => {
  const n = t.notificacionNuevaSolicitud({ ...solicitudBase, prioridad: 'urgente' });
  assert.equal(n.titulo, 'URGENTE: Solicitud de auxiliar');
  assert.equal(n.urgente, true);
  assert.equal(t.notificacionNuevaSolicitud({ ...solicitudBase, prioridadInmediato: true }).urgente, true);
});

test('nueva solicitud sin cama ni piso sigue siendo legible', () => {
  const n = t.notificacionNuevaSolicitud({
    tipoRequerimiento: 'gescas',
    destinoGescas: 'Urgencias',
    servicio: { nombre: 'GESCAS', piso: 'N/A' }
  });
  assert.equal(n.cuerpo, 'GESCAS · GESCAS a Urgencias');
});

test('nueva solicitud programada incluye la hora de Chile', () => {
  const n = t.notificacionNuevaSolicitud({ ...solicitudBase, fechaProgramada: '2026-11-17T14:50:00.000Z' });
  assert.match(n.cuerpo, /Programada: 17\/11 10:50$/);
});

test('precauciones aparecen en el detalle', () => {
  const n = t.notificacionNuevaSolicitud({ ...solicitudBase, precaucionesEstandar: true, tipoPrecaucion: 'contacto' });
  assert.match(n.cuerpo, /Precaución: contacto/);
});

test('la descripción libre nunca va a la pantalla de bloqueo', () => {
  const n = t.notificacionNuevaSolicitud({ ...solicitudBase, descripcion: 'Paciente Juan Pérez RUT 1-9' });
  assert.ok(!n.cuerpo.includes('Juan'));
  assert.ok(!n.titulo.includes('Juan'));
});

test('avisos para quien pidió el auxiliar', () => {
  const tomada = t.notificacionSolicitudTomada(solicitudBase, 'Ana Rojas');
  assert.equal(tomada.titulo, 'Auxiliar en camino');
  assert.equal(tomada.cuerpo, 'Ana Rojas tomó la solicitud\nCama 12, piso 3 · Traslado con camilla');

  const completada = t.notificacionSolicitudCompletada(solicitudBase, 'Ana Rojas');
  assert.equal(completada.titulo, 'Solicitud completada');
  assert.match(completada.cuerpo, /Realizada por Ana Rojas$/);
});

test('comentario: recorta textos largos', () => {
  const n = t.notificacionComentario(solicitudBase, 'Luis', 'x'.repeat(200));
  assert.equal(n.titulo, 'Comentario · Cama 12, piso 3');
  assert.ok(n.cuerpo.length < 110);
  assert.ok(n.cuerpo.endsWith('…'));
});
