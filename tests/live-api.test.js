import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('live adapter uses session cookies, persisted reads, metadata, and compact feeds', async () => {
  const calls = [];
  const events = [];
  let state = false;
  const user = { id: 10, display_name: 'Campus operator', role: 'administrator', total_points: 10, level: 1, next_level_points: 100 };
  const issue = () => ({ id: 4, ticket_number: 'VGD-EXISTING', category: 2, severity: 'high', status: 'pending', reporter: { id: 10, display_name: 'Campus operator' }, created_at: '2026-11-21T01:00:00Z', comment_count: 7, is_read: state, budget: '1200.00', ai_estimated_budget: null });
  const pages = rows => ({ count: rows.length, next: null, previous: null, results: rows });
  const context = vm.createContext({
    URL, URLSearchParams, FormData, Event,
    document: { cookie: '' },
    window: { dispatchEvent: e => events.push(e.type) },
    fetch: async (url, options) => {
      calls.push({ url, ...options });
      const path = new URL(url).pathname;
      let data, status = 200;
      if (path === '/api/auth/csrf/') data = { csrfToken: 'bootstrap-token' };
      else if (path === '/api/auth/login/') data = { csrfToken: 'rotated-token' };
      else if (path === '/api/me/') data = user;
      else if (path === '/api/categories/') data = pages([{ id:2, name:'Building', active:true }]);
      else if (path === '/api/reward-settings/') data = pages([]);
      else if (path === '/api/levels/') data = pages([{ number:1, minimum_points:0 }, { number:2, minimum_points:100 }]);
      else if (path === '/api/configuration/') data = { statuses:['pending','verified','ongoing','completed'], severities:['low','medium','high','critical'], buildings:['Library'], transitions: {pending:['verified']} };
      else if (path === '/api/issues/') data = pages([issue()]);
      else if (path === '/api/issues/4/read/') { state = JSON.parse(options.body).read; data = { is_read:state }; }
      else if (path === '/api/issues/4/') data = issue();
      else if (/\/(comments|attachments|history)\/$/.test(path)) data = pages([]);
      else if (path === '/api/forbidden/') { status = 403; data = { code:'permission_denied', errors:{detail:'Administrator required.'} }; }
      else if (path === '/api/expired/') { status = 401; data = {code:'session_expired', errors:{detail:'Authentication credentials were not provided.'}}; }
      else throw new Error(`Unexpected request ${path}`);
      return { status, ok: status < 400, json: async () => data };
    },
  });
  const load = async file => new vm.SourceTextModule(await readFile(new URL(`../src/api/${file}`, import.meta.url), 'utf8'), {
    context, identifier:file, initializeImportMeta: meta => { meta.env = { VITE_MOCK_MODE:'false', VITE_API_BASE_URL:'http://localhost:8000/api' }; },
  });
  const client = await load('client.js');
  await client.link(() => { throw new Error('Unexpected dependency'); });
  const mock = new vm.SyntheticModule(['mock'], function() { this.setExport('mock', {}); }, {context});
  const adapter = await load('index.js');
  await adapter.link(specifier => specifier === './client' ? client : mock);
  await adapter.evaluate();
  const api = adapter.namespace.api;
  assert.equal(adapter.namespace.MOCK_MODE, false);
  const profile = await api.login({ email:'admin', password:'example-only' });
  assert.equal(profile.role, 'admin');
  assert.ok(calls.every(c => c.credentials === 'include'));
  const login = calls.find(c => c.url.endsWith('/auth/login/'));
  assert.equal(login.headers['X-CSRFToken'], 'bootstrap-token');
  calls.length = 0;
  const feed = await api.issues();
  assert.equal(calls.length, 1);
  assert.equal(feed[0].commentCount, 7);
  assert.equal(feed[0].reporterBudget, 1200);
  assert.equal(feed[0].aiEstimatedBudget, null);
  await api.read(4, true);
  assert.equal(calls.at(-1).headers['X-CSRFToken'], 'rotated-token');
  assert.equal((await api.issues())[0].readBy[0], 10);
  await api.read(4, false);
  assert.equal((await api.issues())[0].readBy.length, 0);
  calls.length = 0;
  await api.issue(4);
  assert.equal(calls.length, 4); // Related collections are fetched only on detail.
  await assert.rejects(client.namespace.request('/forbidden/'), e => e.status === 403);
  assert.equal(events.length, 0);
  await assert.rejects(client.namespace.request('/expired/'), e => e.status === 401);
  assert.deepEqual(events, ['session-expired']);
});
