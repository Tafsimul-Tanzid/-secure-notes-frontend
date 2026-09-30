'use client';

import { useRef, useState } from 'react';
import { api, formatDate } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { usePagedList } from '@/lib/usePagedList';
import Pager from '@/components/Pager';

export default function NotesPage() {
  const { user } = useAuth();
  const toast = useToast();
  // admins get everyone's notes from this endpoint, but can only edit/delete their own
  const notes = usePagedList('/api/notes');
  const [editing, setEditing] = useState(null); // null = closed, {} = new note, note = editing it
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);
  const isAdmin = user.role === 'admin';

  function openForm(note) {
    setEditing(note);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  }

  async function save(e) {
    e.preventDefault();
    const { title, content } = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    try {
      if (editing._id) {
        await api('PUT', `/api/notes/${editing._id}`, { title, content });
        await notes.reload();
      } else {
        await api('POST', '/api/notes', { title, content });
        if (notes.page === 1) await notes.reload();
        else notes.setPage(1);
      }
      toast(editing._id ? 'Note updated' : 'Note created', 'success');
      setEditing(null);
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(note) {
    if (!confirm(`Delete "${note.title}"?`)) return;
    try {
      await api('DELETE', `/api/notes/${note._id}`);
      await notes.reload();
      toast('Note deleted', 'success');
    } catch (err) {
      toast(err.message);
    }
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>{isAdmin ? 'All notes' : 'My notes'}</h1>
          <p className="muted">
            {isAdmin ? "You can see everyone's notes, but only edit your own." : 'Only you can see these.'}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openForm({})}>
          + New note
        </button>
      </div>

      {editing && (
        // key resets the inputs when switching between notes
        <form key={editing._id || 'new'} ref={formRef} className="card editor" onSubmit={save}>
          <h2>{editing._id ? 'Edit note' : 'New note'}</h2>
          <label>
            Title <input name="title" defaultValue={editing.title} maxLength={200} required autoFocus />
          </label>
          <label>
            Content <textarea name="content" rows={5} maxLength={20000} defaultValue={editing.content} />
          </label>
          <div className="actions">
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={busy}>
              Save note
            </button>
          </div>
        </form>
      )}

      {notes.loading ? (
        <p className="loading">Loading notes...</p>
      ) : (
        <div className="note-grid">
          {notes.items.length === 0 && (
            <div className="empty">No notes yet. Click &quot;New note&quot; to write your first one.</div>
          )}
          {notes.items.map((note) => {
            // for admins the API includes the owner's name and email
            const owner = typeof note.userId === 'object' ? note.userId : null;
            const mine = (owner ? owner._id : note.userId) === user._id;
            const edited = note.updatedAt !== note.createdAt ? ' · edited' : '';
            return (
              <article key={note._id} className="card note">
                <h3>{note.title}</h3>
                <p className="note-body">{note.content || 'No content'}</p>
                <div className="note-meta">
                  {owner && !mine ? `By ${owner.name} · ` : ''}
                  {formatDate(note.createdAt)}
                  {edited}
                </div>
                {mine && (
                  <div className="note-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openForm(note)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(note)}>
                      Delete
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Pager pagination={notes.pagination} onChange={notes.setPage} />
    </section>
  );
}
