import { Product } from '../types';

function escapeXml(unsafe: string | number | undefined | null): string {
  if (unsafe === undefined || unsafe === null) return '';
  const str = String(unsafe);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cleanDescription(text: string): string {
  if (!text) return 'LUMEN Atelier d\'Art özel tasarım el yapımı heykelsi lüks aydınlatma armatürü.';
  // Strip any HTML tags
  const stripped = text.replace(/<[^>]*>?/gm, '').trim();
  return stripped.length > 0 ? stripped : 'LUMEN Atelier d\'Art özel tasarım heykelsi aydınlatma armatürü.';
}

export function generateGoogleMerchantXml(products: Product[], baseUrl: string): string {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const storeTitle = "LUMEN Atelier d'Art - Özel Tasarım Heykelsi Aydınlatma";
  const storeDescription = "El yapımı masif pirinç, İtalyan mermeri ve üfleme cam lüks masa lambaları, heykelsi abajurlar ve mimari aydınlatma koleksiyonu.";

  const itemsXml = products.map((product) => {
    const id = escapeXml(product.id || product.slug);
    const title = escapeXml(product.name);
    const description = escapeXml(cleanDescription(product.description || product.shortDescription || ''));
    const slug = product.slug || product.id;
    const link = escapeXml(`${cleanBaseUrl}/urun/${slug}`);
    
    // Main image
    const mainImage = (product.images && product.images.length > 0)
      ? product.images[0]
      : 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1000&q=80';
    const imageLink = escapeXml(mainImage.startsWith('http') ? mainImage : `${cleanBaseUrl}${mainImage}`);

    // Additional images (up to 10)
    const additionalImagesXml = (product.images || [])
      .slice(1, 11)
      .map(img => {
        const fullImgUrl = img.startsWith('http') ? img : `${cleanBaseUrl}${img}`;
        return `      <g:additional_image_link>${escapeXml(fullImgUrl)}</g:additional_image_link>`;
      })
      .join('\n');

    // Availability
    let availability = 'in_stock';
    if (product.stockStatus === 'out_of_stock' || (typeof product.stockQuantity === 'number' && product.stockQuantity <= 0)) {
      availability = 'out_of_stock';
    } else if (product.stockStatus === 'preorder') {
      availability = 'preorder';
    }

    // Pricing
    const currentPrice = Number(product.price) || 0;
    const comparePrice = Number(product.compareAtPrice) || 0;

    let priceTag = `<g:price>${currentPrice.toFixed(2)} TRY</g:price>`;
    let salePriceTag = '';

    if (comparePrice > currentPrice) {
      priceTag = `<g:price>${comparePrice.toFixed(2)} TRY</g:price>`;
      salePriceTag = `\n      <g:sale_price>${currentPrice.toFixed(2)} TRY</g:sale_price>`;
    }

    const categoryName = escapeXml(product.categoryName || 'Masa Lambaları');
    const material = escapeXml(product.material || 'Masif Pirinç, Üfleme Cam, Mermer');

    return `    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
${additionalImagesXml ? additionalImagesXml + '\n' : ''}      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      ${priceTag}${salePriceTag}
      <g:brand>LUMEN Atelier</g:brand>
      <g:product_type>Ev ve Bahçe &gt; Aydınlatma &gt; ${categoryName}</g:product_type>
      <g:google_product_category>654</g:google_product_category>
      <g:identifier_exists>no</g:identifier_exists>
      <g:material>${material}</g:material>
      <g:shipping>
        <g:country>TR</g:country>
        <g:service>Hızlı ve Güvenli Teslimat</g:service>
        <g:price>0.00 TRY</g:price>
      </g:shipping>
      <g:custom_label_0>El Yapımı Lüks Tasarım</g:custom_label_0>
      <g:custom_label_1>${categoryName}</g:custom_label_1>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(storeTitle)}</title>
    <link>${escapeXml(cleanBaseUrl)}</link>
    <description>${escapeXml(storeDescription)}</description>
${itemsXml}
  </channel>
</rss>`;
}
