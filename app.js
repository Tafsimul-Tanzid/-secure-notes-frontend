// Frontend for the Secure Notes API. Plain JS, no build step.
// Everything the user typed is rendered with textContent so it can't inject HTML.
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
let token = localStorage.getItem('token');
let me = null;

const splitList = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
const formData = (form) => Object.fromEntries(new FormData(form));
const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function toast(message, type = 'error') {
  const t = el('div', message);
  t.className = `toast toast-${type}`;
  $('#toasts').append(t);
  setTimeout(() => t.remove(), type === 'error' ? 6000 : 3000);
}

async function api(method, url, body) {
  let res;
  try {
    res = await fetch(window.API_URL + url, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // render's free plan sleeps when idle, the first request can take a while
    throw new Error(`Can't reach the API at ${window.API_URL}. If it was asleep, try again in a minute.`);
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({ error: `Unexpected response (${res.status})` }));
  if (!res.ok) {
    if (res.status === 401 && token) logout();
    throw new Error([data.error, ...(data.details || [])].join('\n'));
  }
  return data;
}

function el(tag, text, ...children) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  children.forEach((c) => c && node.append(c));
  return node;
}

function withClass(node, className) {
  node.className = className;
  return node;
}

function button(text, className, onClick) {
  const b = withClass(el('button', text), `btn ${className}`);
  b.type = 'button';
  b.addEventListener('click', async () => {
    b.disabled = true;
    try {
      await onClick();
    } catch (e) {
      toast(e.message);
    } finally {
      b.disabled = false;
    }
  });
  return b;
}

// disables the submit button while the request is running
function onSubmit(form, handler) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submit = form.querySelector('button:not([type="button"])');
    submit.disabled = true;
    try {
      await handler(form);
    } catch (err) {
      toast(err.message);
    } finally {
      submit.disabled = false;
    }
  });
}

// list with prev/next buttons for the paginated endpoints
function pagedList(container, pager, url, render, empty) {
  let page = 1;
  async function load(p = page) {
    const res = await api('GET', `${url}?page=${p}&limit=9`);
    const { totalPages, total } = res.pagination;
    if (p > 1 && p > totalPages) return load(totalPages || 1); // e.g. deleted the last item on a page
    page = p;
    container.replaceChildren(...(res.data.length ? res.data.map(render) : [empty()]));
    pager.replaceChildren();
    if (totalPages > 1) {
      pager.append(
        page > 1 ? button('← Prev', 'btn-ghost btn-sm', () => load(page - 1)) : '',
        el('span', `Page ${page} of ${totalPages} · ${total} total`),
        page < totalPages ? button('Next →', 'btn-ghost btn-sm', () => load(page + 1)) : ''
      );
    }
  }
  return { reload: () => load(), first: () => load(1) };
}

// ---- auth screen ----
$$('[data-auth-tab]').forEach((tab) =>
  tab.addEventListener('click', () => {
    $$('[data-auth-tab]').forEach((t) => t.classList.toggle('active', t === tab));
    $('#login-form').classList.toggle('hidden', tab.dataset.authTab !== 'login');
    $('#register-form').classList.toggle('hidden', tab.dataset.authTab !== 'register');
  })
);

onSubmit($('#login-form'), async (f) => {
  const { token: t } = await api('POST', '/api/auth/login', formData(f));
  f.reset();
  await startSession(t);
});

onSubmit($('#register-form'), async (f) => {
  const data = formData(f);
  const { token: t } = await api('POST', '/api/auth/register', { ...data, interests: splitList(data.interests) });
  f.reset();
  await startSession(t);
  toast('Account created', 'success');
});

// ---- navigation ----
function showView(name) {
  $$('[data-view]').forEach((link) => link.classList.toggle('active', link.dataset.view === name));
  $('#view-notes').classList.toggle('hidden', name !== 'notes');
  $('#view-users').classList.toggle('hidden', name !== 'users');
}
$$('[data-view]').forEach((link) => link.addEventListener('click', () => showView(link.dataset.view)));

// ---- notes ----
// admins get everyone's notes here, but can only edit/delete their own
const notes = pagedList(
  $('#notes'),
  $('#notes-pager'),
  '/api/notes',
  (n) => {
    const owner = n.userId && typeof n.userId === 'object' ? n.userId : null;
    const mine = (owner ? owner._id : n.userId) === me._id;
    const meta = owner && !mine ? `By ${owner.name} · ${formatDate(n.createdAt)}` : formatDate(n.createdAt);
    return withClass(el('article', null,
      el('h3', n.title),
      withClass(el('p', n.content || 'No content'), 'note-body'),
      withClass(el('div', n.updatedAt !== n.createdAt ? `${meta} · edited` : meta), 'note-meta'),
      mine ? withClass(el('div', null,
        button('Edit', 'btn-ghost btn-sm', async () => openNoteForm(n)),
        button('Delete', 'btn-danger btn-sm', async () => {
          if (!confirm(`Delete "${n.title}"?`)) return;
          await api('DELETE', `/api/notes/${n._id}`);
          await notes.reload();
          toast('Note deleted', 'success');
        })
      ), 'note-actions') : null
    ), 'card note');
  },
  () => withClass(el('div', 'No notes yet. Click "New note" to write your first one.'), 'empty')
);

function openNoteForm(note) {
  const f = $('#note-form');
  f.reset();
  f.id.value = note ? note._id : '';
  f.title.value = note ? note.title : '';
  f.content.value = note ? note.content : '';
  $('#note-form-title').textContent = note ? 'Edit note' : 'New note';
  f.classList.remove('hidden');
  f.scrollIntoView({ behavior: 'smooth', block: 'center' });
  f.title.focus();
}
const closeNoteForm = () => $('#note-form').classList.add('hidden');

$('#note-new').addEventListener('click', () => openNoteForm(null));
$('#note-cancel').addEventListener('click', closeNoteForm);
onSubmit($('#note-form'), async (f) => {
  const { id, title, content } = formData(f);
  await api(id ? 'PUT' : 'POST', id ? `/api/notes/${id}` : '/api/notes', { title, content });
  closeNoteForm();
  await (id ? notes.reload() : notes.first());
  toast(id ? 'Note updated' : 'Note created', 'success');
});

// ---- users (admin) ----
const users = pagedList(
  $('#users'),
  $('#users-pager'),
  '/api/users',
  (u) => {
    const isMe = u._id === me._id;
    const interests = el('td');
    if (u.interests.length) u.interests.forEach((i) => interests.append(withClass(el('span', i), 'chip')));
    else interests.append(withClass(el('span', '-'), 'muted'));
    return el('tr', null,
      el('td', null, el('strong', u.name), isMe ? withClass(el('span', ' (you)'), 'muted') : null),
      el('td', u.email),
      el('td', null, withClass(el('span', u.role), u.role === 'admin' ? 'badge badge-admin' : 'badge')),
      interests,
      el('td', formatDate(u.createdAt)),
      withClass(el('td', null,
        button('Edit', 'btn-ghost btn-sm', async () => openUserForm(u)),
        // the API blocks deleting yourself anyway, so don't show the button
        isMe ? null : button('Delete', 'btn-danger btn-sm', async () => {
          if (!confirm(`Delete ${u.email}? Their notes and posts will be deleted too.`)) return;
          await api('DELETE', `/api/users/${u._id}`);
          await Promise.all([users.reload(), notes.reload()]);
          toast('User deleted', 'success');
        })
      ), 'row-actions')
    );
  },
  () => el('tr', null, Object.assign(withClass(el('td', 'No users.'), 'empty-row'), { colSpan: 6 }))
);

function openUserForm(user) {
  const f = $('#user-form');
  f.reset();
  f.id.value = user ? user._id : '';
  f.name.value = user ? user.name : '';
  f.email.value = user ? user.email : '';
  f.role.value = user ? user.role : 'user';
  f.interests.value = user ? user.interests.join(', ') : '';
  f.password.required = !user;
  $('#user-password-hint').textContent = user ? 'Leave empty to keep the current password' : 'Required for new users';
  $('#user-form-title').textContent = user ? `Edit ${user.name}` : 'Add user';
  f.classList.remove('hidden');
  f.scrollIntoView({ behavior: 'smooth', block: 'center' });
  f.name.focus();
}
const closeUserForm = () => $('#user-form').classList.add('hidden');

$('#user-new').addEventListener('click', () => openUserForm(null));
$('#user-cancel').addEventListener('click', closeUserForm);
onSubmit($('#user-form'), async (f) => {
  const { id, name, email, password, role, interests } = formData(f);
  const body = { name, email, role, interests: splitList(interests) };
  if (password) body.password = password;
  await api(id ? 'PUT' : 'POST', id ? `/api/users/${id}` : '/api/users', body);
  closeUserForm();
  await (id ? users.reload() : users.first());
  toast(id ? 'User updated' : 'User created', 'success');
});

// ---- session ----
// JWT is stateless so logout just throws the token away here.
// It stops working on the server once it expires anyway.
function logout() {
  token = null;
  me = null;
  localStorage.removeItem('token');
  closeNoteForm();
  closeUserForm();
  $('#app').classList.add('hidden');
  $('#auth').classList.remove('hidden');
}
$('#logout').addEventListener('click', logout);

async function startSession(t) {
  token = t;
  localStorage.setItem('token', t);
  me = await api('GET', '/api/auth/me');
  const isAdmin = me.role === 'admin';

  $('#me-avatar').textContent = me.name.trim().charAt(0).toUpperCase();
  $('#me-name').textContent = me.name;
  $('#me-role').textContent = me.role;
  $('#me-role').className = isAdmin ? 'badge badge-admin' : 'badge';
  $$('.admin-only').forEach((n) => n.classList.toggle('hidden', !isAdmin));
  $('#notes-title').textContent = isAdmin ? 'All notes' : 'My notes';
  $('#notes-subtitle').textContent = isAdmin
    ? 'You can see everyone\'s notes, but only edit your own.'
    : 'Only you can see these.';

  showView('notes');
  $('#auth').classList.add('hidden');
  $('#app').classList.remove('hidden');
  await Promise.all([notes.first(), isAdmin ? users.first() : null]);
}

if (token) startSession(token).catch(logout);
