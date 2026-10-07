import Image from "next/image";

export type NewsItem = {
  id: number;
  title: string;
  source: string;
  url: string;
  thumbnail_url: string;
  published_at: string;
};

const NewsCard = ({ item }: { item: NewsItem }) => (
  <a
    className="card news-card"
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
  >
    <div className="news-thumb">
      {item.thumbnail_url ? (
        <Image src={item.thumbnail_url} alt="" fill sizes="(max-width: 600px) 100vw, 320px" />
      ) : (
        "언론보도"
      )}
    </div>
    <h3>{item.title}</h3>
    <div className="news-meta">
      <span>{item.source}</span>
      <time>{new Date(item.published_at).toLocaleDateString("ko-KR")}</time>
    </div>
  </a>
);

export default NewsCard;
