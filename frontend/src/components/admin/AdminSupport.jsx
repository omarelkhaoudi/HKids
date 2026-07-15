import {useCallback, useEffect, useState} from 'react';
import {adminAPI} from '../../api/admin';
import {Badge, Button} from '../ui';
import {MailIcon, SearchIcon} from '../Icons';
import {formatAdminDate} from './AdminMetricCard';
import { useLanguage } from '../../context/LanguageContext';

function AdminSupport() {
  const { t } = useLanguage();

  const STATUS_OPTIONS = [
    ['open', t('adminSupportOpen')],
    ['in_progress', t('adminSupportInProgress')],
    ['resolved', t('adminSupportResolved')],
    ['closed', t('adminSupportClosed')],
    ['all', t('adminSupportAllStatuses')],
  ];

  const PRIORITY_OPTIONS = [
    ['all', t('adminSupportAllPriorities')],
    ['urgent', t('adminSupportUrgent')],
    ['high', t('adminSupportHigh')],
    ['normal', t('adminSupportNormal')],
    ['low', t('adminSupportLow')],
  ];

  const CATEGORY_OPTIONS = [
    ['all', t('adminSupportAllCategories')],
    ['general', t('adminSupportGeneral')],
    ['billing', t('adminSupportBilling')],
    ['technical', t('adminSupportTechnical')],
    ['content', t('adminSupportContent')],
    ['bug', t('adminSupportBug')],
  ];

  const STATUS_LABELS = {
    open: t('adminSupportStatusOpen'),
    in_progress: t('adminSupportStatusInProgress'),
    resolved: t('adminSupportStatusResolved'),
    closed: t('adminSupportStatusClosed'),
  };

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    q: '',
    status: 'open',
    priority: 'all',
    category: 'all',
  });

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSupportTickets({...filters, limit: 100, offset: 0});
      setTickets(response.data?.items || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || t('adminSupportLoadError'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(loadTickets, 250);
    return () => clearTimeout(timer);
  }, [loadTickets]);

  const updateTicket = async (ticket, patch) => {
    try {
      await adminAPI.updateSupportTicket(ticket.id, patch);
      await loadTickets();
    } catch (err) {
      setError(err.response?.data?.error || t('adminSupportUpdateError'));
    }
  };

  const handleStatusChange = async (ticket, status) => {
    await updateTicket(ticket, {
      status,
      priority: ticket.priority,
      assign_to_self: status === 'in_progress',
    });
  };

  const handlePriorityChange = async (ticket, priority) => {
    await updateTicket(ticket, {
      status: ticket.status,
      priority,
      assign_to_self: false,
    });
  };

  const handleAdminNote = async (ticket) => {
    const adminNote = window.prompt(t('adminSupportAdminNote'), ticket.admin_note || '');
    if (adminNote === null) return;
    await updateTicket(ticket, {
      status: ticket.status,
      priority: ticket.priority,
      admin_note: adminNote,
      assign_to_self: false,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight">{t('adminSupportTitle')}</h1>
        <p className="text-foreground-muted font-medium mt-1">{t('adminSupportSubtitle')}</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 flex flex-col xl:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="w-5 h-5 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={filters.q}
            onChange={(event) => setFilters((current) => ({...current, q: event.target.value}))}
            placeholder={t('adminSupportSearchPlaceholder')}
            className="w-full bg-surface-secondary border border-border rounded-xl pl-10 pr-4 py-2 outline-none"
          />
        </div>
        {[
          ['status', STATUS_OPTIONS],
          ['priority', PRIORITY_OPTIONS],
          ['category', CATEGORY_OPTIONS],
        ].map(([key, options]) => (
          <select
            key={key}
            value={filters[key]}
            onChange={(event) => setFilters((current) => ({...current, [key]: event.target.value}))}
            className="bg-surface-secondary border border-border rounded-xl px-4 py-2 font-bold"
          >
            {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        ))}
      </div>

      {error && <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold">{error}</div>}

      <div className="grid gap-4">
        {loading ? (
          <div className="p-10 text-center text-foreground-muted">{t('adminLoading')}</div>
        ) : tickets.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-12 text-center">
            <MailIcon className="w-10 h-10 mx-auto text-surface-300 mb-3" />
            <p className="font-black">{t('adminSupportNoTickets')}</p>
          </div>
        ) : tickets.map((ticket) => (
          <div key={ticket.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant={ticket.priority === 'urgent' || ticket.priority === 'high' ? 'danger' : 'secondary'}>
                    {ticket.priority}
                  </Badge>
                  <Badge variant="soft">{ticket.category}</Badge>
                  <Badge variant={ticket.status === 'resolved' || ticket.status === 'closed' ? 'success' : 'primary'}>
                    {STATUS_LABELS[ticket.status] || ticket.status}
                  </Badge>
                </div>
                <h2 className="font-black text-lg">{ticket.subject}</h2>
                <p className="text-sm text-foreground-muted mt-2 whitespace-pre-wrap">{ticket.message}</p>
                {ticket.admin_note && (
                  <p className="text-xs text-foreground-secondary mt-3 p-3 rounded-xl bg-surface-secondary border border-border">
                    <span className="font-bold">{t('adminSupportAdminNoteLabel')}</span> {ticket.admin_note}
                  </p>
                )}
                <div className="text-xs text-surface-400 mt-3">
                  {t('adminSupportByParent').replace('{name}', ticket.requester_name || 'Parent')} · {formatAdminDate(ticket.created_at)}
                  {ticket.assigned_admin_name ? ' · ' + t('adminSupportAssignedTo').replace('{name}', ticket.assigned_admin_name) : ''}
                </div>
              </div>
              <div className="flex flex-col gap-2 min-w-[180px]">
                <select
                  value={ticket.status}
                  onChange={(event) => handleStatusChange(ticket, event.target.value)}
                  className="bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm font-bold"
                >
                  {STATUS_OPTIONS.filter(([value]) => value !== 'all').map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <select
                  value={ticket.priority}
                  onChange={(event) => handlePriorityChange(ticket, event.target.value)}
                  className="bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm font-bold"
                >
                  {PRIORITY_OPTIONS.filter(([value]) => value !== 'all').map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <Button variant="outline" onClick={() => handleAdminNote(ticket)}>{t('adminSupportAddNote')}</Button>
                {ticket.status === 'open' && (
                  <Button variant="primary" onClick={() => handleStatusChange(ticket, 'in_progress')}>
                    {t('adminSupportTakeOver')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminSupport;
