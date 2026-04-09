import { useState, useEffect, useCallback, useRef } from 'react';
import { AppData, UserEdits, Invoice } from '../types';
import { INITIAL_DATA } from '../constants';
import { loadHubData, saveHubData, checkBackendHealth } from '../lib/api';

const UE_KEY = 'tas_hub_ue';

const DEFAULT_USER_EDITS: UserEdits = {
  completedActions: [],
  deletedActions: [],
  customActions: [],
  deletedProjects: [],
  customProjects: [],
  projectOverrides: {},
  actionOverrides: {},
  invoiceOverrides: {},
  deletedInvoices: [],
  customInvoices: [],
  deletedUpcoming: [],
  customUpcoming: [],
  notesForClaude: '',
};

export function useAppData() {
  const [userEdits, setUserEditsState] = useState<UserEdits>(() => {
    try {
      const saved = localStorage.getItem(UE_KEY);
      return saved ? { ...DEFAULT_USER_EDITS, ...JSON.parse(saved) } : DEFAULT_USER_EDITS;
    } catch {
      return DEFAULT_USER_EDITS;
    }
  });

  // Backend sync state
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'offline'>('idle');
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check backend on mount and load from Firebase if available
  useEffect(() => {
    (async () => {
      const healthy = await checkBackendHealth();
      setBackendAvailable(healthy);

      if (healthy) {
        const hubData = await loadHubData();
        if (hubData?.userEdits) {
          // Firebase has newer data — merge with localStorage
          const fbEdits = hubData.userEdits as UserEdits;
          const localEdits = (() => {
            try {
              const saved = localStorage.getItem(UE_KEY);
              return saved ? JSON.parse(saved) : null;
            } catch {
              return null;
            }
          })();

          // Use whichever was edited more recently
          const fbDate = (fbEdits as any).lastManualEdit || '2000-01-01';
          const localDate = localEdits?.lastManualEdit || '2000-01-01';

          if (fbDate >= localDate) {
            setUserEditsState({ ...DEFAULT_USER_EDITS, ...fbEdits });
            localStorage.setItem(UE_KEY, JSON.stringify({ ...DEFAULT_USER_EDITS, ...fbEdits }));
          }
        }
      }
    })();
  }, []);

  const saveUserEdits = useCallback((edits: UserEdits) => {
    const updatedEdits = {
      ...edits,
      lastManualEdit: new Date().toISOString().slice(0, 10),
    };
    setUserEditsState(updatedEdits);
    localStorage.setItem(UE_KEY, JSON.stringify(updatedEdits));

    // Debounced save to Firebase (2s after last change)
    if (syncTimer.current) clearTimeout(syncTimer.current);
    setSyncStatus('syncing');
    syncTimer.current = setTimeout(async () => {
      if (backendAvailable) {
        const saved = await saveHubData({ userEdits: updatedEdits });
        setSyncStatus(saved ? 'saved' : 'offline');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('offline');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    }, 2000);
  }, [backendAvailable]);

  // Merged data for display
  const [mergedData, setMergedData] = useState<AppData>(INITIAL_DATA);

  useEffect(() => {
    const merged: AppData = JSON.parse(JSON.stringify(INITIAL_DATA));

    // Merge Projects
    merged.projects = [
      ...INITIAL_DATA.projects
        .filter(p => !userEdits.deletedProjects.includes(p.name))
        .map(p => ({
          ...p,
          ...(userEdits.projectOverrides[p.name] || {}),
        })),
      ...userEdits.customProjects,
    ];

    // Merge Actions
    merged.weeklyActions = [
      ...INITIAL_DATA.weeklyActions
        .map((a, i) => ({
          ...a,
          ...(userEdits.actionOverrides[i] || {}),
          id: i.toString(),
        }))
        .filter((_, i) => !userEdits.deletedActions.includes(i)),
      ...userEdits.customActions,
    ];

    // Merge Invoices
    const getInvoiceStatus = (inv: Invoice) =>
      userEdits.invoiceOverrides[inv.num]?.status || inv.status;

    const allInvoices = [
      ...INITIAL_DATA.invoices.outstanding,
      ...INITIAL_DATA.invoices.paid,
      ...userEdits.customInvoices,
    ].filter(inv => !userEdits.deletedInvoices.includes(inv.num));

    merged.invoices.outstanding = allInvoices.filter(inv => getInvoiceStatus(inv) === 'outstanding');
    merged.invoices.paid = allInvoices.filter(inv => getInvoiceStatus(inv) === 'paid');

    // Recalculate totals
    const fmt = (val: number) => `$${val.toLocaleString('en-US')}`;
    const parse = (str: string) => Number(str.replace(/[^0-9.-]+/g, ''));

    const outstanding = merged.invoices.outstanding.reduce((s, i) => s + parse(i.amount), 0);
    const paid = merged.invoices.paid.reduce((s, i) => s + parse(i.amount), 0);
    const unmatched = merged.invoices.unmatched.reduce((s, i) => s + parse(i.amount), 0);

    merged.invoices.totals = {
      outstanding: fmt(outstanding),
      paidConfirmed: fmt(paid),
      unmatchedReceipts: fmt(unmatched),
      totalInvoiced2026: fmt(outstanding + paid),
    };

    merged.stats.outstanding = fmt(outstanding);
    merged.stats.received = fmt(paid);

    // Merge Upcoming
    merged.upcoming = [
      ...INITIAL_DATA.upcoming.filter((_, i) => !userEdits.deletedUpcoming.includes(i)),
      ...userEdits.customUpcoming.map(u => u.text),
    ];

    setMergedData(merged);
  }, [userEdits]);

  return {
    data: mergedData,
    userEdits,
    setUserEdits: saveUserEdits,
    resetEdits: () => saveUserEdits(DEFAULT_USER_EDITS),
    backendAvailable,
    syncStatus,
  };
}
