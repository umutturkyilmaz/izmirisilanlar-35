import { useEffect } from 'react';

const SITE = 'https://izmirisilanlari35.com';
const DEFAULT_TITLE = "İzmir İş İlanları 35 - İzmir'de İş Ara, İlan Ver | Güvenilir İstihdam Platformu";
const DEFAULT_DESC =
  'İzmir ve Türkiye genelinde güncel iş ilanları. Adaylar için ücretsiz iş arama ve başvuru, işverenler için doğrulanmış hesap ile ilan.';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(href: string) {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

function setJsonLd(id: string, data: object | null) {
  const sid = `jsonld-${id}`;
  let el = document.getElementById(sid);
  if (!data) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.id = sid;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

type Props = {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  jsonLd?: object | null;
  jsonLdId?: string;
};

/** Sayfa bazlı title / meta / canonical (SPA) */
export default function DocumentHead({
  title,
  description,
  path = '/',
  image,
  jsonLd,
  jsonLdId = 'page',
}: Props) {
  useEffect(() => {
    const fullTitle = title ? `${title} | İzmir İş İlanları 35` : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESC;
    const url = `${SITE}${path.startsWith('/') ? path : `/${path}`}`;
    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    setCanonical(url);
    if (image) {
      setMeta('property', 'og:image', image);
      setMeta('name', 'twitter:image', image);
    }
    setJsonLd(jsonLdId, jsonLd || null);
    return () => {
      document.title = DEFAULT_TITLE;
      setJsonLd(jsonLdId, null);
    };
  }, [title, description, path, image, jsonLd, jsonLdId]);

  return null;
}
