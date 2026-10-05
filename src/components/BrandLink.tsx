import { Link, type LinkProps, useLocation } from 'react-router-dom';
import { useBrand } from '../config/brand';
export function useBrandPath() {
  const brand = useBrand();
  return (path: string) => { const [pathname, query = ''] = path.split('?'); const search = new URLSearchParams(query); search.set('brand', brand.id); return `${pathname}?${search}`; };
}
export function BrandLink({ to, ...props }: Omit<LinkProps, 'to'> & { to: string }) {
  const path = useBrandPath();
  return <Link to={path(to)} {...props} />;
}
export function Wordmark() {
  const brand = useBrand();
  const location = useLocation();
  return <BrandLink to="/" className="wordmark" aria-label={`${brand.name} home`}><span className="brand-symbol" aria-hidden="true"><span /><span /><span /></span>{brand.logo ? <img src={brand.logo} alt={brand.shortName} onError={event => { event.currentTarget.style.display = 'none'; event.currentTarget.nextElementSibling?.removeAttribute('hidden'); }} /> : null}<span hidden={!!brand.logo}>{brand.shortName}</span>{location.pathname !== '/builder' && <small>CUSTOM SYSTEMS</small>}</BrandLink>;
}
