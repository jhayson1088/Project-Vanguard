import { request } from "./client";
const root = (id) => `/issues/${id}/publication/`;
export const publications = {
  draft: (id) => request(root(id)),
  sources: (id) => request(`${root(id)}sources/`),
  generate: (id) => request(`${root(id)}generate/`, { method: "POST" }),
  save: (id, body) => request(root(id), { method: "POST", body }),
  publish: (id, body) =>
    request(`${root(id)}publish/`, { method: "POST", body }),
  unpublish: (id) => request(`${root(id)}unpublish/`, { method: "POST" }),
  article: (slug) =>
    request(`/public/articles/${slug}/`, { skipSessionEvent: true }),
};
