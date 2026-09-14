import { fetchApi } from '@shared/api/apiClient';
import type { ChessInventory } from '@/features/chess/model/types';

const PIEZAS_REGEX = /^\[PIEZAS:(\d+)\]\s*/;

function parsePiezasTotales(
  observacion: string | null,
): number {
  if (!observacion) {
    return 32;
  }

  const match = observacion.match(PIEZAS_REGEX);

  if (!match) {
    return 32;
  }

  const parsed = Number(match[1]);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : 32;
}

function cleanObservacion(
  observacion: string | null,
): string | null {
  if (!observacion) {
    return null;
  }

  const cleaned = observacion
    .replace(PIEZAS_REGEX, '')
    .trim();

  return cleaned || null;
}

export const getChessInventory = (
  page = 1,
  limit = 50,
) =>
  fetchApi<{
    statusCode: number;
    data: {
      items: ChessInventory[];
      current_page: number;
      page_size: number;
      total: number;
      total_pages: number;
      previous: boolean;
      next: boolean;
    };
    message: string;
    details: unknown;
  }>(
    `/chess/items?page=${String(page)}&limit=${String(limit)}`,
  ).then((res) => ({
    ...res.data,

    items: res.data.items.map((item) => ({
      ...item,

      piezas_totales: parsePiezasTotales(
        item.observacion,
      ),

      observacion: cleanObservacion(
        item.observacion,
      ),
    })),
  }));