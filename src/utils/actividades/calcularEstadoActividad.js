export default function calcularEstadoActividad(
  actividad
) {

  if (
    actividad.actividadCompletada
  ) {
    return "COMPLETADA";
  }

  if (
    !actividad.tecnicosAsignados?.length
  ) {
    return "PENDIENTE";
  }

  if (
    !actividad.materialRecibido
  ) {
    return "PREPARACION";
  }

  if (
    !actividad.accesoConfirmado
  ) {
    return "ESPERANDO_CLIENTE";
  }

  if (
    !actividad.fechaProgramada
  ) {
    return "PROGRAMADA";
  }

  if (
    !actividad.horaProgramada
  ) {
    return "PROGRAMADA";
  }

  return "LISTA_PARA_EJECUTAR";
}