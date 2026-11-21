import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

test("JSX components render without a global React binding", async () => {
  const server = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: "custom",
  });
  try {
    const { AppProvider } = await server.ssrLoadModule("/src/context.jsx");
    const html = renderToString(
      createElement(AppProvider, null, "Runtime check"),
    );
    assert.equal(html, "Runtime check");

    const result = await server.transformRequest("/src/pages/Feed.jsx");
    assert.ok(result.code.includes("jsx-dev-runtime"));
    assert.doesNotMatch(result.code, /React\.createElement/);
  } finally {
    await server.close();
  }
});

test("components also work when a running server uses classic JSX", async () => {
  const server = await createServer({
    configFile: false,
    esbuild: { jsx: "transform" },
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: "custom",
  });
  try {
    const { AppProvider } = await server.ssrLoadModule("/src/context.jsx");
    assert.equal(
      renderToString(createElement(AppProvider, null, "Classic runtime check")),
      "Classic runtime check",
    );

    const { Loading } = await server.ssrLoadModule("/src/components/UI.jsx");
    assert.match(
      renderToString(createElement(Loading)),
      /Loading campus updates/,
    );
  } finally {
    await server.close();
  }
});

test("article preview renders paragraphs and treats article text as plain text", async () => {
  const server = await createServer({
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: "custom",
  });
  try {
    const { default: ArticleContent } = await server.ssrLoadModule(
      "/src/components/ArticleContent.jsx",
    );
    const html = renderToString(
      createElement(ArticleContent, {
        article: {
          title: "Completed campus repair",
          summary: "An administrator-reviewed update.",
          body: "First paragraph.\n\n<script>alert('test')</script>",
          steps: "Remove damaged hinge.\nInstall and test replacement.",
          assets: [
            {
              key: "issue-image",
              type: "image",
              url: "/public/photo.png",
              caption: "Original damage",
            },
            {
              key: "attachment-1",
              type: "document",
              url: "/public/report.pdf",
              caption: "Completion report",
            },
          ],
        },
        preview: true,
      }),
    );
    assert.match(html, /PRIVATE DRAFT PREVIEW/);
    assert.match(html, /<p>First paragraph\.<\/p>/);
    assert.match(html, /&lt;script&gt;/);
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /<li>Remove damaged hinge\.<\/li>/);
    assert.match(html, /src="\/public\/photo.png"/);
    assert.match(html, /href="\/public\/report.pdf"/);
    assert.match(html, /Completion report/);
  } finally {
    await server.close();
  }
});
