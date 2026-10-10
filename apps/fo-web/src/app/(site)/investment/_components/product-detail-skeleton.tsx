const ProductDetailSkeleton = () => (
  <main className="container" aria-busy="true" aria-label="상품 정보를 불러오는 중이에요">
    <div className="inv-detail-head">
      <div className="product-card-badges">
        <span className="skeleton skeleton-badge" />
        <span className="skeleton skeleton-badge" />
      </div>
      <span className="skeleton skeleton-title" />
    </div>
    <section className="card detail-summary">
      <span className="skeleton skeleton-line" />
      <span className="skeleton skeleton-progress" />
      <span className="skeleton skeleton-line" />
      <span className="skeleton skeleton-line" />
      <span className="skeleton skeleton-line" />
    </section>
  </main>
);

export default ProductDetailSkeleton;
