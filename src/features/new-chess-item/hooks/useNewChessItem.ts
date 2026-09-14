import { useEffect, useState } from 'react';
import { fetchApi } from '@/shared/api/apiClient';
import type { ChessInventory } from '@/features/chess/model/types';
import type {
  ChessItemFormFields,
  ChessItemFormErrors,
} from '../types';
import {
  createChessItem,
  getInventoryTypeByName,
} from '../api/create-chess-item';

const INITIAL_FIELDS: ChessItemFormFields = {
  nombre: '',
  cantidad_total: '1',
  piezas_totales: '32',
  observacion: '',
};

export const validateChessItemForm = (
  fields: ChessItemFormFields,
): ChessItemFormErrors => {
  const errors: ChessItemFormErrors = {};

  if (!fields.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio';
  } else if (fields.nombre.trim().length < 2) {
    errors.nombre = 'El nombre debe tener al menos 2 caracteres';
  }

  const cantidad = Number(fields.cantidad_total);

  if (
    fields.cantidad_total === '' ||
    !Number.isInteger(cantidad) ||
    cantidad < 1
  ) {
    errors.cantidad_total =
      'La cantidad debe ser un número entero mayor o igual a 1';
  }

  const piezas = Number(fields.piezas_totales);

  if (
    fields.piezas_totales === '' ||
    !Number.isInteger(piezas) ||
    piezas < 1
  ) {
    errors.piezas_totales =
      'Las piezas deben ser un número entero mayor o igual a 1';
  }

  return errors;
};

/**
 * Extrae la observación real quitando el prefijo
 * [PIEZAS:32] que guardamos en la base de datos.
 */
const extractObservation = (
  observacion?: string | null,
): string => {
  if (!observacion) {
    return '';
  }

  return observacion
    .replace(/^\[PIEZAS:\d+\]\s*/, '')
    .trim();
};

export const useNewChessItem = (
  onSuccess: () => void,
  editingItem: ChessInventory | null = null,
) => {
  const [fields, setFields] =
    useState<ChessItemFormFields>(INITIAL_FIELDS);

  const [errors, setErrors] =
    useState<ChessItemFormErrors>({});

  const [loading, setLoading] = useState(false);

  /*
   * Cuando se abre el modal para editar,
   * cargamos los datos del artículo seleccionado.
   */
  useEffect(() => {
    if (editingItem) {
      setFields({
        nombre: editingItem.nombre,
        cantidad_total: String(editingItem.cantidad_total),
        piezas_totales: String(editingItem.piezas_totales),
        observacion: extractObservation(
          editingItem.observacion,
        ),
      });

      setErrors({});
    } else {
      setFields(INITIAL_FIELDS);
      setErrors({});
    }
  }, [editingItem]);

  const handleChange = (
    field: keyof ChessItemFormFields,
    value: string,
  ) => {
    setFields((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      general: undefined,
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    const validationErrors =
      validateChessItemForm(fields);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const piezas = Number(fields.piezas_totales);

      /*
       * MODO EDICIÓN
       */
      if (editingItem) {
        await fetchApi(`/chess/items/${editingItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            nombre: fields.nombre.trim(),
            cantidad_total: Number(fields.cantidad_total),
            piezas_totales: piezas,
            observacion:
              fields.observacion.trim() || null,
          }),
        });

        reset();
        onSuccess();
        return;
      }

      /*
       * MODO CREACIÓN
       */
      const {
        id: tipo_inventario_id,
      } = await getInventoryTypeByName('ajedrez');

      const serializedObservacion =
        `[PIEZAS:${String(piezas)}] ${
          fields.observacion || ''
        }`.trim();

      await createChessItem({
        tipo_inventario_id,
        nombre: fields.nombre.trim(),
        cantidad_total: Number(fields.cantidad_total),
        observacion:
          serializedObservacion || undefined,
      });

      reset();
      onSuccess();
    } catch (error) {
      console.error(
        editingItem
          ? 'Error al actualizar artículo de ajedrez:'
          : 'Error al crear artículo de ajedrez:',
        error,
      );

      setErrors({
        general: editingItem
          ? 'No se pudo actualizar el artículo de ajedrez. Intenta de nuevo.'
          : 'No se pudo crear el artículo de ajedrez. Intenta de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFields(INITIAL_FIELDS);
    setErrors({});
  };

  return {
    fields,
    errors,
    loading,
    handleChange,
    handleSubmit,
    reset,
  };
};