import React from "react";

export default function ArticleContent({ article, preview = false }) {
  const published = article.published_at;
  const assets = article.assets || [];
  const hero = assets.find((asset) => asset.type === "image");
  const steps = (article.steps || "")
    .split("\n")
    .map((step) => step.trim())
    .filter(Boolean);
  return (
    <article className="published-story">
      <div className="story-kicker">ISAT UNIVERSITY · CAMPUS CARE</div>
      {preview && (
        <span className="story-draft-label">PRIVATE DRAFT PREVIEW</span>
      )}
      <h1>{article.title || "Your article headline"}</h1>
      {article.summary && <p className="story-summary">{article.summary}</p>}
      <div className="story-byline">
        <span>ISAT University · Campus Facilities</span>
        {published && (
          <time dateTime={published}>
            {new Date(published).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "Asia/Manila",
            })}
          </time>
        )}
      </div>
      {hero && (
        <figure className="story-hero">
          <img
            src={hero.url}
            alt={hero.caption || "Completed issue documentation"}
          />
          {hero.caption && <figcaption>{hero.caption}</figcaption>}
        </figure>
      )}
      <div className="story-body">
        {(article.body || "Your article will appear here.")
          .split(/\n\s*\n/)
          .filter(Boolean)
          .map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
      </div>
      {steps.length > 0 && (
        <section className="story-steps">
          <h2>Steps to completion</h2>
          <ol>
            {steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </section>
      )}
      {assets.some((asset) => asset !== hero) && (
        <section className="story-documentation">
          <h2>Photos and supporting documents</h2>
          <div className="story-asset-grid">
            {assets
              .filter((asset) => asset !== hero)
              .map((asset) => (
                <figure key={asset.key}>
                  {asset.type === "image" ? (
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={asset.url}
                        alt={asset.caption || "Issue progress documentation"}
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <a
                      className="story-document-link"
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open supporting document ↗
                    </a>
                  )}
                  {asset.caption && <figcaption>{asset.caption}</figcaption>}
                </figure>
              ))}
          </div>
        </section>
      )}
      <footer className="story-footer">Caring for our campus, together.</footer>
    </article>
  );
}
