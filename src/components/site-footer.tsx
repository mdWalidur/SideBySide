import Link from "next/link";

export function SiteFooter() {
  return <footer className="site-footer"><div className="footer-main"><Link className="brand" href="/"><span className="brand-symbol">s<span>/</span>s</span><span className="brand-name">sidebyside<span className="brand-period">.</span></span></Link><p>Shop thoughtfully.<br />Choose with confidence.</p><span className="footer-mark">A BETTER KIND OF BUYING GUIDE · HELSINKI / ONLINE</span></div><div className="footer-bottom"><span>Fictional demo catalog · No live product, review, or retailer data</span><span>© SIDEBYSIDE 2026</span></div></footer>;
}
