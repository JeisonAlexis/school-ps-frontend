import { useState } from 'react';

import {
  ChessAlert,
  ChessStats,
  ChessTabs,
  useChessStats,
} from '@/features/chess';

import { useChessInventory } from '@/features/load-chess-inventory/hooks';
import { useChessLoans } from '@/features/load-chess-loans/hooks';

import { ChessInventorySection } from '@/features/load-chess-inventory/components';
import { ChessLoansSection } from '@/features/load-chess-loans/components';

import { NewChessItemModal } from '@/features/new-chess-item';
import { NewChessLoanModal } from '@/features/new-chess-loan/components';
import { ReturnChessLoanModal } from '@/features/return-chess-loan/components';
import { ResolveChessLoanModal } from '@/features/resolve-chess-loan/components';

import type {
  ChessInventory,
  ChessLoan,
} from '@/features/chess/model/types';

import { fetchApi } from '@/shared/api/apiClient';

import '@/pages/sport/SportPage.css';
import '@/pages/ajedrez/ChessPage.css';

export const ChessPage = () => {
  const {
    inventory,
    refetch: refetchInventory,
  } = useChessInventory();

  const {
    loans,
    refetch: refetchLoans,
  } = useChessLoans();

  const [activeTab, setActiveTab] =
    useState<'inventory' | 'loans'>('inventory');

  const [selectedItem, setSelectedItem] =
    useState<ChessInventory | null>(null);

  // Modal de nuevo artículo
  const [isNewItemOpen, setIsNewItemOpen] =
    useState(false);

  // Modal de edición
  const [isEditItemOpen, setIsEditItemOpen] =
    useState(false);

  const [editingItem, setEditingItem] =
    useState<ChessInventory | null>(null);

  // Modal de nuevo préstamo
  const [isNewLoanOpen, setIsNewLoanOpen] =
    useState(false);

  // Modal de devolución
  const [isReturnLoanOpen, setIsReturnLoanOpen] =
    useState(false);

  // Modal de resolver novedad
  const [isResolveLoanOpen, setIsResolveLoanOpen] =
    useState(false);

  const [selectedLoan, setSelectedLoan] =
    useState<ChessLoan | null>(null);

  const stats = useChessStats(inventory);

  /*
   * =========================
   * PRÉSTAMOS
   * =========================
   */

  const handleReturnLoan = (loan: ChessLoan) => {
    setSelectedLoan(loan);
    setIsReturnLoanOpen(true);
  };

  const handleResolveLoan = (loan: ChessLoan) => {
    setSelectedLoan(loan);
    setIsResolveLoanOpen(true);
  };

  const handleReturnSuccess = () => {
    void refetchLoans();
    void refetchInventory();
  };

  const handleNewLoanSuccess = () => {
    void refetchLoans();
    void refetchInventory();
  };

  /*
   * =========================
   * EDITAR ARTÍCULO
   * =========================
   */

  const handleEditItem = (item: ChessInventory) => {
    setEditingItem(item);
    setIsEditItemOpen(true);
  };

  const handleEditSuccess = () => {
    setSelectedItem(null);
    setEditingItem(null);
    setIsEditItemOpen(false);

    void refetchInventory();
  };

  const handleEditClose = () => {
    setIsEditItemOpen(false);
    setEditingItem(null);
  };

  /*
   * =========================
   * ELIMINAR ARTÍCULO
   * =========================
   */

  const handleDeleteItem = async (
    item: ChessInventory,
  ) => {
    const confirmed = window.confirm(
      `¿Está seguro de eliminar el artículo "${item.nombre}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await fetchApi(`/chess/items/${item.id}`, {
        method: 'DELETE',
      });

      setSelectedItem(null);

      await refetchInventory();
    } catch (error) {
      console.error(
        'Error al eliminar artículo de ajedrez:',
        error,
      );

      window.alert(
        'No se pudo eliminar el artículo. Puede que tenga préstamos registrados.',
      );
    }
  };

  /*
   * =========================
   * RENDER
   * =========================
   */

  return (
    <div className="sport-page">
      <header className="sport-header">
        <h1>Módulo de Ajedrez</h1>

        <p>
          Gestión de tableros y material de ajedrez
        </p>
      </header>

      <ChessAlert />

      <ChessStats stats={stats} />

      <ChessTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="sport-content">
        {activeTab === 'inventory' && (
          <ChessInventorySection
            inventory={inventory}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            onNewItem={() => {
              setIsNewItemOpen(true);
            }}
            onNewLoan={() => {
              setIsNewLoanOpen(true);
            }}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
          />
        )}

        {activeTab === 'loans' && (
          <ChessLoansSection
            loans={loans}
            onReturnLoan={handleReturnLoan}
            onResolveLoan={handleResolveLoan}
          />
        )}
      </div>

      {/* =========================
          NUEVO ARTÍCULO
         ========================= */}

      <NewChessItemModal
        isOpen={isNewItemOpen}
        onClose={() => {
          setIsNewItemOpen(false);
        }}
        onSuccess={() => {
          void refetchInventory();
        }}
      />

      {/* =========================
          EDITAR ARTÍCULO
         ========================= */}

      <NewChessItemModal
        isOpen={isEditItemOpen}
        editingItem={editingItem}
        onClose={handleEditClose}
        onSuccess={handleEditSuccess}
      />

      {/* =========================
          NUEVO PRÉSTAMO
         ========================= */}

      <NewChessLoanModal
        isOpen={isNewLoanOpen}
        item={selectedItem}
        onClose={() => {
          setIsNewLoanOpen(false);
          setSelectedItem(null);
        }}
        onSuccess={handleNewLoanSuccess}
      />

      {/* =========================
          DEVOLVER PRÉSTAMO
         ========================= */}

      <ReturnChessLoanModal
        isOpen={isReturnLoanOpen}
        loan={selectedLoan}
        onClose={() => {
          setIsReturnLoanOpen(false);
          setSelectedLoan(null);
        }}
        onSuccess={handleReturnSuccess}
      />

      {/* =========================
          RESOLVER NOVEDAD
         ========================= */}

      <ResolveChessLoanModal
        isOpen={isResolveLoanOpen}
        loan={selectedLoan}
        onClose={() => {
          setIsResolveLoanOpen(false);
          setSelectedLoan(null);
        }}
        onSuccess={handleReturnSuccess}
      />
    </div>
  );
};