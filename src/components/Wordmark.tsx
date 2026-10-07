import { Link } from "react-router-dom";
import { productConfig } from "../config/product";

export function Wordmark() {
  return (
    <Link to="/" className="wordmark" aria-label={`${productConfig.name} home`}>
      <span className="brand-symbol" aria-hidden="true"><span /><span /><span /></span>
      <span>{productConfig.name}</span>
    </Link>
  );
}
