import React, { useState } from 'react';
import { useAppData } from './hooks/useAppData';
import { PinGate, UserRole } from './components/PinGate';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Projects } from './components/Projects';
import { Invoices } from './components/Invoices';
import { NotesForClaude } from './components/NotesForClaude';
import { FieldForm } from './components/FieldForm';
import { EmailTemplates } from './components/EmailTemplates';
import { QuickUpdate } from './components/QuickUpdate';
import { GeminiChat } from './components/GeminiChat';
import { EditModal } from './components/EditModal';
import { Project, WeeklyAction, Invoice } from './types';
import { saveNotesForClaude } from './lib/api';

export default function App() {
  const { data, userEdits, setUserEdits, backendAvailable, syncStatus } = useAppData();
  const [role, setRole] = useState<UserRole | null>(() => sessionStorage.getItem('tas_role') as UserRole | null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isEditMode, setIsEditMode] = useState(false);

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    type: 'project' | 'action' | 'invoice' | 'upcoming';
    data: any;
    isCustom: boolean;
    index?: number;
  }>({
    isOpen: false,
    title: '',
    type: 'project',
    data: null,
    isCustom: false
  });

  const handleUnlock = (userRole: UserRole) => {
    sessionStorage.setItem('tas_role', userRole);
    setRole(userRole);
    // Field tech starts on field form; admin starts on dashboard
    setActiveTab(userRole === 'field' ? 'field' : 'dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('tas_role');
    setRole(null);
  };

  const isAdmin = role === 'admin';

  const handleSync = async () => {
    const completed = userEdits.completedActions.map(id => data.weeklyActions.find(a => a.id === id)).filter(Boolean);
    const deleted = userEdits.deletedActions.map(id => data.weeklyActions.find(a => a.id === id)).filter(Boolean);

    const lines = [
      '=== TAS HUB — SYNC TO CLAUDE ===',
      `Date: ${new Date().toLocaleDateString('en-CA')}`,
      '',
      '📝 NOTES FROM TISH:',
      userEdits.notesForClaude || '(none)',
      '',
      `✓ COMPLETED ACTIONS (${completed.length}):`,
      ...completed.map(a => `  • [${a?.project}] ${a?.task}`),
      '',
      `✕ DELETED ACTIONS (${deleted.length}):`,
      ...deleted.map(a => `  • [${a?.project}] ${a?.task}`),
      '',
      '=== END SYNC ==='
    ];

    const syncText = lines.join('\n');
    navigator.clipboard.writeText(syncText);

    // Also save notes to Firebase for Claude's scheduled tasks
    if (backendAvailable && userEdits.notesForClaude) {
      await saveNotesForClaude(userEdits.notesForClaude);
    }

    alert('✓ Copied to clipboard! Paste into Claude.\n' + (backendAvailable ? '✓ Notes saved to backend.' : ''));
  };

  // Tab switching — field tech can only access dashboard, projects, field form
  const FIELD_TABS = ['dashboard', 'projects', 'field'];
  const handleTabChange = (tab: string) => {
    if (!isAdmin && !FIELD_TABS.includes(tab)) return;
    setActiveTab(tab);
  };

  // CRUD Handlers
  const toggleAction = (id: string | number) => {
    const completed = [...userEdits.completedActions];
    const idx = completed.indexOf(id);
    if (idx > -1) completed.splice(idx, 1);
    else completed.push(id);
    setUserEdits({ ...userEdits, completedActions: completed });
  };

  const deleteAction = (id: string | number, isCustom: boolean) => {
    if (!confirm('Remove this action item?')) return;
    if (isCustom) {
      setUserEdits({ ...userEdits, customActions: userEdits.customActions.filter(a => a.id !== id) });
    } else {
      setUserEdits({ ...userEdits, deletedActions: [...userEdits.deletedActions, id] });
    }
  };

  const addAction = (lane: 'now' | 'week' | 'watching') => {
    setModalConfig({
      isOpen: true,
      title: 'Add Action Item',
      type: 'action',
      isCustom: true,
      data: { lane, pri: 'm', project: '', task: '' }
    });
  };

  const saveModalChanges = () => {
    const { type, data: modalData, isCustom } = modalConfig;

    if (type === 'action') {
      if (isCustom) {
        const newAction = { ...modalData, id: `ca_${Date.now()}` };
        setUserEdits({ ...userEdits, customActions: [...userEdits.customActions, newAction] });
      }
    } else if (type === 'project') {
      if (isCustom) {
        const newProject = { ...modalData, id: `cp_${Date.now()}` };
        setUserEdits({ ...userEdits, customProjects: [...userEdits.customProjects, newProject] });
      } else {
        const overrides = { ...userEdits.projectOverrides };
        overrides[modalData.name] = modalData;
        setUserEdits({ ...userEdits, projectOverrides: overrides });
      }
    } else if (type === 'invoice') {
      if (isCustom) {
        const newInvoice = { ...modalData, id: `ci_${Date.now()}` };
        setUserEdits({ ...userEdits, customInvoices: [...userEdits.customInvoices, newInvoice] });
      } else {
        const overrides = { ...userEdits.invoiceOverrides };
        overrides[modalData.num] = modalData;
        setUserEdits({ ...userEdits, invoiceOverrides: overrides });
      }
    }

    setModalConfig({ ...modalConfig, isOpen: false });
  };

  if (!role) {
    return <PinGate onUnlock={handleUnlock} />;
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={handleTabChange}
      lastUpdated={data.lastUpdated}
      isEditMode={isEditMode}
      toggleEditMode={() => setIsEditMode(!isEditMode)}
      onSync={handleSync}
      onLogout={handleLogout}
      backendAvailable={backendAvailable}
      syncStatus={syncStatus}
      role={role}
    >
      {activeTab === 'dashboard' && (
        <Dashboard
          data={data}
          userEdits={userEdits}
          isEditMode={isEditMode}
          onToggleAction={toggleAction}
          onDeleteAction={deleteAction}
          onAddAction={addAction}
          onDeleteUpcoming={(i) => setUserEdits({ ...userEdits, deletedUpcoming: [...userEdits.deletedUpcoming, i] })}
          onAddUpcoming={() => {}}
          onNotesChange={(notes) => setUserEdits({ ...userEdits, notesForClaude: notes })}
          onSync={handleSync}
        />
      )}

      {activeTab === 'projects' && (
        <Projects
          data={data}
          userEdits={userEdits}
          isEditMode={isEditMode}
          onAddProject={() => setModalConfig({
            isOpen: true,
            title: 'Add Project',
            type: 'project',
            isCustom: true,
            data: { name: '', client: '', status: 'active', badge: 'fp', badgeLabel: 'Farm Plan', note: '', action: '', actionType: 'normal' }
          })}
          onEditProject={(i, isCustom) => setModalConfig({
            isOpen: true,
            title: 'Edit Project',
            type: 'project',
            isCustom,
            index: i,
            data: data.projects[i]
          })}
          onDeleteProject={(name) => setUserEdits({ ...userEdits, deletedProjects: [...userEdits.deletedProjects, name] })}
        />
      )}

      {activeTab === 'invoices' && (
        <Invoices
          data={data}
          userEdits={userEdits}
          isEditMode={isEditMode}
          onAddInvoice={() => setModalConfig({
            isOpen: true,
            title: 'Add Invoice',
            type: 'invoice',
            isCustom: true,
            data: { num: '', client: '', issued: new Date().toLocaleDateString('en-CA'), amount: '$0', status: 'outstanding' }
          })}
          onMarkPaid={(num) => {
            const overrides = { ...userEdits.invoiceOverrides };
            overrides[num] = { status: 'paid' };
            setUserEdits({ ...userEdits, invoiceOverrides: overrides });
          }}
          onDeleteInvoice={(num) => setUserEdits({ ...userEdits, deletedInvoices: [...userEdits.deletedInvoices, num] })}
        />
      )}

      {activeTab === 'notes' && (
        <NotesForClaude
          userEdits={userEdits}
          onNotesChange={(notes) => setUserEdits({ ...userEdits, notesForClaude: notes })}
          onSync={handleSync}
          onClear={() => setUserEdits({ ...userEdits, notesForClaude: '' })}
        />
      )}

      {activeTab === 'field' && <FieldForm />}
      {activeTab === 'email' && <EmailTemplates data={data} />}
      {activeTab === 'quick' && <QuickUpdate data={data} backendAvailable={backendAvailable} />}
      {activeTab === 'ai' && isAdmin && <GeminiChat backendAvailable={backendAvailable} />}

      <EditModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onSave={saveModalChanges}
      >
        {modalConfig.type === 'action' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project / Context</label>
              <input
                type="text"
                value={modalConfig.data?.project || ''}
                onChange={(e) => setModalConfig({ ...modalConfig, data: { ...modalConfig.data, project: e.target.value } })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Description</label>
              <textarea
                value={modalConfig.data?.task || ''}
                onChange={(e) => setModalConfig({ ...modalConfig, data: { ...modalConfig.data, task: e.target.value } })}
                className="w-full h-32 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none resize-none"
              />
            </div>
          </div>
        )}

        {modalConfig.type === 'project' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name</label>
              <input
                type="text"
                value={modalConfig.data?.name || ''}
                onChange={(e) => setModalConfig({ ...modalConfig, data: { ...modalConfig.data, name: e.target.value } })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</label>
              <input
                type="text"
                value={modalConfig.data?.client || ''}
                onChange={(e) => setModalConfig({ ...modalConfig, data: { ...modalConfig.data, client: e.target.value } })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Note</label>
              <textarea
                value={modalConfig.data?.note || ''}
                onChange={(e) => setModalConfig({ ...modalConfig, data: { ...modalConfig.data, note: e.target.value } })}
                className="w-full h-32 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none resize-none"
              />
            </div>
          </div>
        )}

        {modalConfig.type === 'invoice' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Number</label>
              <input
                type="text"
                value={modalConfig.data?.num || ''}
                onChange={(e) => setModalConfig({ ...modalConfig, data: { ...modalConfig.data, num: e.target.value } })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client / Project</label>
              <input
                type="text"
                value={modalConfig.data?.client || ''}
                onChange={(e) => setModalConfig({ ...modalConfig, data: { ...modalConfig.data, client: e.target.value } })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</label>
              <input
                type="text"
                value={modalConfig.data?.amount || ''}
                onChange={(e) => setModalConfig({ ...modalConfig, data: { ...modalConfig.data, amount: e.target.value } })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
              />
            </div>
          </div>
        )}
      </EditModal>
    </Layout>
  );
}
