import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingBag, Plus, Minus, Trash2, X, Star, ArrowRight, Heart } from "lucide-react";
import { products, categories } from "./data.js";

const money = (amount) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0
  }).format(amount);

function ProductCard({ product, onAdd, isFavorite, onFavorite }) {
  return (
    <article className="product-card">
      <div className={`product-art ${product.color}`}>
        <button
          className={`favorite-button ${isFavorite ? "is-favorite" : ""}`}
          onClick={() => onFavorite(product.id)}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
        </button>
        <span className="product-emoji" role="img" aria-label={product.name}>{product.emoji}</span>
        <span className="product-badge">Popular</span>
      </div>
      <div className="product-info">
        <p className="product-category">{product.category}</p>
        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="rating"><Star size={14} fill="currentColor" /> {product.rating}</div>
        <div className="product-bottom">
          <div className="price">
            <strong>{money(product.price)}</strong>
            <del>{money(product.oldPrice)}</del>
          </div>
          <button className="add-button" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to cart`}>
            <Plus size={19} />
          </button>
        </div>
      </div>
    </article>
  );
}

function CartDrawer({ open, onClose, cart, onChangeQuantity, onRemove, subtotal }) {
  if (!open) return null;
  const delivery = subtotal > 0 && subtotal < 5000 ? 250 : 0;
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="cart-drawer" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-heading">
          <div>
            <p className="eyebrow">YOUR SELECTION</p>
            <h2>Your cart <span>({cart.reduce((sum, item) => sum + item.quantity, 0)})</span></h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close cart"><X /></button>
        </div>

        {cart.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-icon"><ShoppingBag size={30} /></div>
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added anything yet.</p>
            <button className="primary-button" onClick={onClose}>Explore products</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map(({ product, quantity }) => (
                <div className="cart-item" key={product.id}>
                  <div className={`cart-item-art ${product.color}`}>{product.emoji}</div>
                  <div className="cart-item-main">
                    <h3>{product.name}</h3>
                    <strong>{money(product.price)}</strong>
                    <div className="quantity-control">
                      <button onClick={() => onChangeQuantity(product.id, quantity - 1)} aria-label="Decrease quantity"><Minus size={14} /></button>
                      <span>{quantity}</span>
                      <button onClick={() => onChangeQuantity(product.id, quantity + 1)} aria-label="Increase quantity"><Plus size={14} /></button>
                    </div>
                  </div>
                  <button className="remove-button" onClick={() => onRemove(product.id)} aria-label="Remove item"><Trash2 size={17} /></button>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
              <div><span>Delivery</span><strong>{delivery === 0 ? "Free" : money(delivery)}</strong></div>
              <div className="total-row"><span>Total</span><strong>{money(subtotal + delivery)}</strong></div>
              <p className="checkout-note">Demo checkout — no payment will be taken.</p>
              <button className="primary-button checkout-button" onClick={() => window.alert("Checkout demo! Connect a backend and payment provider to accept real orders.")}>
                Continue to checkout <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default function App() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("shopease-cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [favorites, setFavorites] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    localStorage.setItem("shopease-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const visibleProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesCategory = activeCategory === "All" || product.category === activeCategory;
      const matchesSearch = `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase().trim());
      return matchesCategory && matchesSearch;
    });
    if (sortBy === "price-low") result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") result = [...result].sort((a, b) => b.price - a.price);
    if (sortBy === "rating") result = [...result].sort((a, b) => b.rating - a.rating);
    return result;
  }, [activeCategory, search, sortBy]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { product, quantity: 1 }];
    });
    setToast(`${product.name} added to cart`);
  }

  function changeQuantity(productId, quantity) {
    if (quantity < 1) {
      setCart((current) => current.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((current) =>
      current.map((item) => item.product.id === productId ? { ...item, quantity } : item)
    );
  }

  function toggleFavorite(productId) {
    setFavorites((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  }

  return (
    <div className="app-shell">
      <div className="announcement">A little something for your everyday life — free delivery over Rs. 5,000</div>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="ShopEase home"><span className="brand-mark">s</span> shopease<span className="brand-dot">.</span></a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a className="active" href="#products">Shop</a>
          <a href="#why-us">Why ShopEase</a>
          <a href="#footer">Contact</a>
        </nav>
        <div className="header-actions">
          <label className="header-search">
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." aria-label="Search products" />
          </label>
          <button className="cart-button" onClick={() => setCartOpen(true)} aria-label={`Open cart with ${cartCount} items`}>
            <ShoppingBag size={20} /><span className="cart-label">Cart</span><span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-kicker"><span className="kicker-line" /> THOUGHTFULLY PICKED FOR YOU</span>
            <h1>Good things.<br /><em>Everyday.</em></h1>
            <p>Discover useful little upgrades for your home, your style, and everything in between.</p>
            <a href="#products" className="primary-button hero-button">Explore the collection <ArrowRight size={18} /></a>
            <div className="hero-trust"><span className="trust-avatars">✦ ✦ ✦</span><span>Loved by everyday explorers</span></div>
          </div>
          <div className="hero-visual">
            <div className="hero-circle"></div>
            <div className="hero-product hero-product-one">🎧</div>
            <div className="hero-product hero-product-two">👟</div>
            <div className="hero-product hero-product-three">🎒</div>
            <div className="hero-sticker">FIND YOUR<br />NEW FAVOURITE</div>
            <div className="hero-caption"><span>01 / THE EVERYDAY EDIT</span><span>Made for living</span></div>
          </div>
        </section>

        <section className="benefits" id="why-us">
          <div><span className="benefit-icon">↗</span><div><strong>Thoughtful picks</strong><p>Useful things, chosen well</p></div></div>
          <div><span className="benefit-icon">♡</span><div><strong>Made for everyday</strong><p>Style meets function</p></div></div>
          <div><span className="benefit-icon">⌁</span><div><strong>Easy shopping</strong><p>A smoother way to shop</p></div></div>
        </section>

        <section className="products-section" id="products">
          <div className="section-heading">
            <div><p className="eyebrow">THE COLLECTION</p><h2>Find your <em>thing.</em></h2><p className="section-subtitle">A few good things to make your everyday better.</p></div>
            <label className="sort-control">Sort by
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
            </label>
          </div>
          <div className="filter-row">
            <div className="category-filters" aria-label="Filter by category">
              {categories.map((category) => (
                <button key={category} className={activeCategory === category ? "category-chip selected" : "category-chip"} onClick={() => setActiveCategory(category)}>{category}</button>
              ))}
            </div>
            <span className="results-count">{visibleProducts.length} products</span>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="product-grid">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} isFavorite={favorites.includes(product.id)} onFavorite={toggleFavorite} />
              ))}
            </div>
          ) : (
            <div className="no-results"><span>⌕</span><h3>No products found</h3><p>Try another search or category.</p><button className="secondary-button" onClick={() => { setSearch(""); setActiveCategory("All"); }}>Clear filters</button></div>
          )}
        </section>

        <section className="newsletter">
          <div><p className="eyebrow">A NOTE FROM US</p><h2>Good finds, <em>occasionally.</em></h2><p>Our newsletter is a little inspiration for your everyday.</p></div>
          <form onSubmit={(event) => { event.preventDefault(); window.alert("Thanks for subscribing! This is a frontend demo."); }}>
            <input type="email" required placeholder="Your email address" aria-label="Your email address" />
            <button type="submit">Count me in <ArrowRight size={17} /></button>
          </form>
        </section>
      </main>

      <footer id="footer"><a className="brand" href="#home"><span className="brand-mark">s</span> shopease<span className="brand-dot">.</span></a><p>Everyday essentials, picked with care.</p><span>© 2026 ShopEase · React portfolio project</span></footer>

      {toast && <div className="toast" role="status">✓ {toast}</div>}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} onChangeQuantity={changeQuantity} onRemove={(id) => setCart((current) => current.filter((item) => item.product.id !== id))} subtotal={subtotal} />
    </div>
  );
}
