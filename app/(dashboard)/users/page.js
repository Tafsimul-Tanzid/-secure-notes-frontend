'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatDate, splitList } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { usePagedList } from '@/lib/usePagedList';
import Pager from '@/components/Pager';

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user.role === 'admin';

  // normal users don't get a link here, but send them back if they type the URL
  useEffect(() => {
    if (!isAdmin) router.replace('/notes');
  }, [isAdmin, router]);

  return isAdmin ? <UsersAdmin me={user} /> : null;
}

function UsersAdmin({ me }) {
  const toast = useToast();
  const users = usePagedList('/api/users', 10);
  const [editing, setEditing] = useState(null); // null = closed, {} = new user
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);

  function openForm(u) {
    setEditing(u);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  }

  async function save(e) {
    e.preventDefault();
    const { name, email, password, role, interests } = Object.fromEntries(new FormData(e.currentTarget));
    const body = { name, email, role, interests: splitList(interests) };
    if (password) body.password = password; // empty = keep the current one
    setBusy(true);
    try {
      if (editing._id) {
        await api('PUT', `/api/users/${editing._id}`, body);
        await users.reload();
      } else {
        await api('POST', '/api/users', body);
        if (users.page === 1) await users.reload();
        else users.setPage(1);
      }
      toast(editing._id ? 'User updated' : 'User created', 'success');
      setEditing(null);
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(u) {
    if (!confirm(`Delete ${u.email}? Their notes and posts will be deleted too.`)) return;
    try {
      await api('DELETE', `/api/users/${u._id}`);
      await users.reload();
      toast('User deleted', 'success');
    } catch (err) {
      toast(err.message);
    }
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <p className="muted">Create, edit and remove accounts.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openForm({})}>
          + Add user
        </button>
      </div>

      {editing && (
        <form key={editing._id || 'new'} ref={formRef} className="card editor" onSubmit={save}>
          <h2>{editing._id ? `Edit ${editing.name}` : 'Add user'}</h2>
          <div className="form-grid">
            <label>
              Name <input name="name" defaultValue={editing.name} required autoFocus />
            </label>
            <label>
              Email <input name="email" type="email" defaultValue={editing.email} required />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required={!editing._id}
              />
              <small className="muted">
                {editing._id ? 'Leave empty to keep the current password' : 'Required for new users'}
              </small>
            </label>
            <label>
              Role
              <select name="role" defaultValue={editing.role || 'user'}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="span-2">
              Interests
              <input name="interests" defaultValue={editing.interests?.join(', ')} placeholder="chess, reading, coding" />
            </label>
          </div>
          <div className="actions">
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={busy}>
              Save user
            </button>
          </div>
        </form>
      )}

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Interests</th>
              <th>Joined</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.loading && (
              <tr>
                <td colSpan={6} className="empty-row">Loading users...</td>
              </tr>
            )}
            {users.items.map((u) => {
              const isMe = u._id === me._id;
              return (
                <tr key={u._id}>
                  <td>
                    <strong>{u.name}</strong>
                    {isMe && <span className="muted"> (you)</span>}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={u.role === 'admin' ? 'badge badge-admin' : 'badge'}>{u.role}</span>
                  </td>
                  <td>
                    {u.interests.length ? (
                      u.interests.map((i) => (
                        <span key={i} className="chip">
                          {i}
                        </span>
                      ))
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td className="row-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openForm(u)}>
                      Edit
                    </button>
                    {/* the API won't let you delete yourself anyway */}
                    {!isMe && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(u)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pager pagination={users.pagination} onChange={users.setPage} />
    </section>
  );
}
