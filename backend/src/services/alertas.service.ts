import { prisma } from '../config/prisma.js';
import { aAlertaDto } from './mapeadores.js';

export async function listarAlertas() {
  const alertas = await prisma.alertaVial.findMany({ orderBy: { fecha: 'desc' } });
  return alertas.map(aAlertaDto);
}
