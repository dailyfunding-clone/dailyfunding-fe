const CARD_COUNT = 6;

const ProductListSkeleton = () => (
  <>
    <div className="inv-filters" aria-hidden="true">
      <div className="chips">
        <span className="skeleton skeleton-chip" />
        <span className="skeleton skeleton-chip" />
        <span className="skeleton skeleton-chip" />
      </div>
    </div>
    <div className="card-grid" aria-busy="true" aria-label="상품 목록을 불러오는 중이에요">
      {Array.from({ length: CARD_COUNT }, (_, i) => (
        <div key={i} className="card product-card">
          <div className="product-card-badges">
            <span className="skeleton skeleton-badge" />
            <span className="skeleton skeleton-badge" />
          </div>
          <span className="skeleton skeleton-title" />
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-progress" />
          <span className="skeleton skeleton-line" />
        </div>
      ))}
    </div>
  </>
);

export default ProductListSkeleton;
