import React, { useState } from 'react';
import { Mail, CheckCircle, Clock, Trash2, User, Phone } from 'lucide-react';
import { ContactMessage } from '../../types';
import { formatDate } from '../../lib/format';
import { db, COLLECTIONS, updateDoc, deleteDoc, doc } from '../../lib/firebase';

interface MessagesManagerProps {
  messages: ContactMessage[];
}

export const MessagesManager: React.FC<MessagesManagerProps> = ({ messages }) => {
  const [filter, setFilter] = useState<'all' | 'new' | 'completed'>('all');
  const [deleteConfirmMsg, setDeleteConfirmMsg] = useState<ContactMessage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateStatus = async (id: string, status: ContactMessage['status']) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.MESSAGES, id), { status });
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmMsg) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, COLLECTIONS.MESSAGES, deleteConfirmMsg.id));
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmMsg(null);
    }
  };

  const filtered = messages.filter((m) => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111114] p-5 rounded-2xl border border-zinc-800">
        <div>
          <h3 className="font-sans text-xl sm:text-2xl font-bold text-zinc-100 uppercase tracking-wider">
            Özel Proje & İletişim Talepleri ({messages.length})
          </h3>
          <p className="text-xs text-zinc-400 font-light mt-0.5">
            Müşterilerden ve mimari ofislerden gelen özel tasarım lamba talepleri.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded text-xs font-semibold ${
              filter === 'all' ? 'bg-[#d4af37] text-black' : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setFilter('new')}
            className={`px-3 py-1.5 rounded text-xs font-semibold ${
              filter === 'new' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            Yeni
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded text-xs font-semibold ${
              filter === 'completed' ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            Yanıtlananlar
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {filtered.map((msg) => (
          <div
            key={msg.id}
            className="p-5 rounded-2xl bg-[#111114] border border-zinc-800 space-y-3 text-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                  msg.status === 'new'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {msg.status === 'new' ? 'Yeni Talep' : 'Yanıtlandı'}
                </span>
                <span className="font-semibold text-zinc-200 text-sm">{msg.name}</span>
                {msg.projectType && (
                  <span className="text-[11px] text-[#c5a880] bg-zinc-900 px-2 py-0.5 rounded">
                    {msg.projectType}
                  </span>
                )}
              </div>
              <span className="text-zinc-500 text-[11px]">{formatDate(msg.createdAt)}</span>
            </div>

            <div className="flex flex-wrap gap-4 text-zinc-400">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#c5a880]" /> {msg.email}
              </span>
              {msg.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#c5a880]" /> {msg.phone}
                </span>
              )}
            </div>

            {msg.subject && (
              <p className="font-medium text-zinc-200">{msg.subject}</p>
            )}

            <p className="text-zinc-300 bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-850 whitespace-pre-line leading-relaxed">
              {msg.message}
            </p>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleUpdateStatus(msg.id, msg.status === 'new' ? 'completed' : 'new')}
                className="text-xs text-[#c5a880] hover:text-[#d4af37] underline font-medium"
              >
                {msg.status === 'new' ? 'Yanıtlandı Olarak İşaretle' : 'Yeni Durumuna Al'}
              </button>

              <button
                onClick={() => setDeleteConfirmMsg(msg)}
                className="text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 p-2 rounded-lg transition-colors"
                title="Mesajı Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-[#111114] border border-dashed border-zinc-800 text-zinc-500">
            Kayıtlı mesaj bulunamadı.
          </div>
        )}
      </div>

      {/* Delete Message Confirmation Modal */}
      {deleteConfirmMsg && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-sans text-lg font-bold text-zinc-100">Mesajı Silmek İstiyor Musunuz?</h4>
              <p className="text-xs text-zinc-400 mt-1">
                <span className="text-zinc-200 font-semibold">{deleteConfirmMsg.name}</span> tarafından gönderilen mesaj silinecektir.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmMsg(null)}
                className="flex-1 py-2.5 bg-zinc-850 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 rounded-xl transition-all border border-zinc-700 disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
