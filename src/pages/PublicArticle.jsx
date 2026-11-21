import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { publications } from "../api/publications";
import BrandMark from "../components/BrandMark";
import ArticleContent from "../components/ArticleContent";
import { useData, Loading, ErrorBox } from "../components/UI";

export default function PublicArticle() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useData(
    () => publications.article(slug),
    [slug],
  );
  useEffect(() => {
    const original = document.title;
    if (data) document.title = `${data.title} · ISAT University`;
    return () => {
      document.title = original;
    };
  }, [data]);
  return (
    <div className="public-article-page">
      <header className="public-article-header">
        <Link to="/" className="brand">
          <BrandMark />
          <span>vanguard</span>
        </Link>
        <span>ISAT University · Campus stories</span>
      </header>
      <main>
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="public-article-error">
            <h1>Article unavailable</h1>
            <p>This article may not be published or may have been withdrawn.</p>
            <ErrorBox error={error} retry={reload} />
          </div>
        ) : (
          <ArticleContent article={data} />
        )}
      </main>
    </div>
  );
}
