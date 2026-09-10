import { Resend } from 'resend';

let resendClient: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY?.trim();
}

export interface OrderEmailData {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  total: number;
  subtotal: number;
  discountAmount?: number;
  paymentMethodDiscount?: number;
  shipping: number;
  paymentMethod: string;
  status: string;
  createdAt: number;
  items: Array<{
    title: string;
    productTitle?: string;
    quantity: number;
    price: number;
    selectedColor?: string;
    productImage?: string;
  }>;
  address: {
    fullName: string;
    addressDetail: string;
    city: string;
    district: string;
    phone: string;
    postalCode?: string;
    companyName?: string;
    taxOffice?: string;
    taxNumber?: string;
  };
  notes?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(amount || 0);
}

function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case 'iyzico':
      return 'Kredi / Banka Kartı (iyzico 3D Secure)';
    case 'bank_transfer':
      return 'Banka Havalesi / EFT';
    case 'cash_on_delivery':
      return 'Kapıda Ödeme';
    default:
      return method || 'Online Ödeme';
  }
}

function generateOrderHtml(order: OrderEmailData): string {
  const itemsRows = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding: 16px 12px; border-bottom: 1px solid #27272a; vertical-align: middle;">
          <div style="font-weight: 600; color: #f4f4f5; font-size: 14px;">${item.title || item.productTitle || 'Aydınlatma Armatürü'}</div>
          ${item.selectedColor ? `<div style="font-size: 12px; color: #a1a1aa; margin-top: 4px;">Renk/Materyal: ${item.selectedColor}</div>` : ''}
        </td>
        <td style="padding: 16px 12px; border-bottom: 1px solid #27272a; text-align: center; color: #d4d4d8; font-size: 14px; vertical-align: middle;">
          ${item.quantity} Adet
        </td>
        <td style="padding: 16px 12px; border-bottom: 1px solid #27272a; text-align: right; color: #f4f4f5; font-weight: 600; font-size: 14px; vertical-align: middle;">
          ${formatCurrency((item.price || 0) * (item.quantity || 1))}
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sipariş Onayı - LUMEN ATELIER</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e4e7;">
  <div style="max-width: 640px; margin: 0 auto; padding: 32px 16px;">
    
    <!-- HEADER -->
    <div style="text-align: center; padding: 36px 24px 28px 24px; background: linear-gradient(180deg, #09090b 0%, #121215 100%); border-radius: 16px 16px 0 0; border: 1px solid #27272a; border-bottom: none;">
      <!-- EXACT LOGO: LUMEN -->
      <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; text-align: center;">
        <tr>
          <td align="center">
            <div style="font-family: 'Cinzel', 'Playfair Display', 'Didot', 'Bodoni MT', 'Times New Roman', serif; font-size: 42px; font-weight: 700; color: #ffffff; letter-spacing: 0.32em; text-transform: uppercase; line-height: 1.1; margin: 0; padding-left: 0.32em;">
              LUMEN
            </div>
          </td>
        </tr>
      </table>

      <div style="display: inline-block; margin-top: 24px; padding: 6px 18px; border-radius: 9999px; background-color: rgba(197, 160, 89, 0.12); border: 1px solid rgba(197, 160, 89, 0.3); color: #e5c278; font-size: 12px; font-weight: 600; letter-spacing: 0.05em;">
        Siparişiniz Başarıyla Alındı
      </div>
    </div>

    <!-- MAIN BODY -->
    <div style="background-color: #121215; padding: 32px 28px; border: 1px solid #27272a; border-top: none; border-bottom: none;">
      
      <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8; margin-top: 0;">
        Sayın <strong>${order.customerName || 'Değerli Müşterimiz'}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa;">
        LUMEN ATELIER atölyemizi tercih ettiğiniz için teşekkür ederiz. <strong>#${order.id}</strong> numaralı siparişiniz sistemimize kaydedilmiş olup, atölye ustalarımız tarafından özenle hazırlanmak üzere işleme alınmıştır.
      </p>

      <!-- ORDER SUMMARY INFO BOX -->
      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 18px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #71717a; padding: 4px 0;">Sipariş Numarası:</td>
            <td style="color: #f4f4f5; font-weight: 600; text-align: right; padding: 4px 0;">#${order.id}</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 4px 0;">Sipariş Tarihi:</td>
            <td style="color: #f4f4f5; text-align: right; padding: 4px 0;">${new Date(order.createdAt || Date.now()).toLocaleString('tr-TR')}</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 4px 0;">Ödeme Yöntemi:</td>
            <td style="color: #C5A059; font-weight: 600; text-align: right; padding: 4px 0;">${getPaymentMethodLabel(order.paymentMethod)}</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 4px 0;">Sipariş Durumu:</td>
            <td style="color: #10b981; font-weight: 600; text-align: right; padding: 4px 0;">${order.status === 'paid' ? 'Ödendi / Hazırlanıyor' : 'Onaylandı / İşlemde'}</td>
          </tr>
        </table>
      </div>

      <!-- PRODUCTS TABLE -->
      <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #C5A059; margin: 28px 0 12px 0;">
        Sipariş Detayı
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="border-bottom: 1px solid #3f3f46;">
            <th style="text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; color: #71717a; letter-spacing: 0.05em;">Ürün</th>
            <th style="text-align: center; padding: 8px 12px; font-size: 11px; text-transform: uppercase; color: #71717a; letter-spacing: 0.05em;">Adet</th>
            <th style="text-align: right; padding: 8px 12px; font-size: 11px; text-transform: uppercase; color: #71717a; letter-spacing: 0.05em;">Fiyat</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- FINANCIAL TOTALS -->
      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #a1a1aa; padding: 4px 0;">Ara Toplam:</td>
            <td style="color: #f4f4f5; text-align: right; padding: 4px 0;">${formatCurrency(order.subtotal || order.total)}</td>
          </tr>
          ${
            order.discountAmount
              ? `<tr>
            <td style="color: #10b981; padding: 4px 0;">Kupon İndirimi:</td>
            <td style="color: #10b981; text-align: right; padding: 4px 0;">-${formatCurrency(order.discountAmount)}</td>
          </tr>`
              : ''
          }
          ${
            order.paymentMethodDiscount
              ? `<tr>
            <td style="color: #10b981; padding: 4px 0;">Havale/EFT İndirimi:</td>
            <td style="color: #10b981; text-align: right; padding: 4px 0;">-${formatCurrency(order.paymentMethodDiscount)}</td>
          </tr>`
              : ''
          }
          <tr>
            <td style="color: #a1a1aa; padding: 4px 0;">Kargo ve Sigortalı Taşıma:</td>
            <td style="color: #10b981; text-align: right; padding: 4px 0;">${(order.shipping || 0) === 0 ? 'ÜCRETSİZ' : formatCurrency(order.shipping)}</td>
          </tr>
          <tr style="border-top: 1px solid #3f3f46;">
            <td style="color: #f4f4f5; font-weight: 700; font-size: 15px; padding: 12px 0 4px 0;">Genel Toplam:</td>
            <td style="color: #C5A059; font-weight: 700; font-size: 18px; text-align: right; padding: 12px 0 4px 0;">${formatCurrency(order.total)}</td>
          </tr>
        </table>
      </div>

      <!-- SHIPPING ADDRESS -->
      <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #C5A059; margin: 28px 0 12px 0;">
        Teslimat ve Kargo Bilgileri
      </h3>
      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 18px; font-size: 13px; line-height: 1.6; color: #d4d4d8;">
        <div><strong>Alıcı:</strong> ${order.address?.fullName || order.customerName}</div>
        <div><strong>Telefon:</strong> ${order.address?.phone || order.customerPhone || '-'}</div>
        <div style="margin-top: 6px;"><strong>Adres:</strong> ${order.address?.addressDetail || ''}, ${order.address?.district || ''} / ${order.address?.city || ''}</div>
        ${order.notes ? `<div style="margin-top: 8px; color: #a1a1aa;"><strong>Sipariş Notu:</strong> ${order.notes}</div>` : ''}
      </div>

      <!-- BANK TRANSFER INSTRUCTIONS (IF APPLICABLE) -->
      ${
        order.paymentMethod === 'bank_transfer'
          ? `
      <div style="background-color: rgba(197, 160, 89, 0.08); border: 1px solid rgba(197, 160, 89, 0.3); border-radius: 12px; padding: 18px; margin-top: 24px; font-size: 13px; line-height: 1.6;">
        <div style="color: #C5A059; font-weight: 700; font-size: 14px; margin-bottom: 8px;">Banka Havalesi / EFT Bilgilendirmesi</div>
        <div style="color: #d4d4d8;">Lütfen sipariş tutarını (${formatCurrency(order.total)}) açıklama kısmına <strong>${order.id}</strong> yazarak tarafımıza transfer ediniz. Dekontu dilerseniz WhatsApp müşteri hattımıza (<strong>0537 267 53 86</strong>) iletebilirsiniz.</div>
      </div>
      `
          : ''
      }

    </div>

    <!-- FOOTER -->
    <div style="text-align: center; padding: 28px 24px; background-color: #18181b; border-radius: 0 0 16px 16px; border: 1px solid #27272a; border-top: none; font-size: 12px; color: #71717a; line-height: 1.6;">
      <div style="color: #d4d4d8; font-weight: 600; margin-bottom: 6px;">LUMEN Destek Ekibi</div>
      <div>Showroom & Merkez: Yenimahalle Mah. Teyyareci Sadık Sok. No:50 A, 34142 Bakırköy / İstanbul</div>
      <div style="margin-top: 4px;">
        Telefon & WhatsApp: <a href="tel:05372675386" style="color: #C5A059; text-decoration: none;">0537 267 53 86</a> &bull; 
        E-Posta: <a href="mailto:hello@lumenlatelier.com" style="color: #C5A059; text-decoration: none;">hello@lumenlatelier.com</a>
      </div>
      <div style="margin-top: 16px; font-size: 11px; color: #52525b;">
        &copy; ${new Date().getFullYear()} LUMEN. Tüm Hakları Saklıdır.
      </div>
    </div>

  </div>
</body>
</html>
  `.trim();
}

/**
 * Sends order confirmation email via Resend
 * Returns silently on error or if Resend is not configured, logging warning.
 */
export async function sendOrderConfirmationEmail(order: OrderEmailData): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.log(`[Resend] RESEND_API_KEY ortam değişkeni ayarlı değil. Sipariş onay e-postası atlanıyor (Sipariş ID: ${order.id}).`);
      return { success: false, error: 'RESEND_API_KEY_NOT_CONFIGURED' };
    }

    const customerEmail = order.customerEmail?.trim();
    if (!customerEmail || !customerEmail.includes('@')) {
      console.warn(`[Resend] Geçersiz alıcı e-posta adresi: "${customerEmail}". Sipariş ID: ${order.id}`);
      return { success: false, error: 'INVALID_RECIPIENT_EMAIL' };
    }

    // Sender email address:
    // Domain lumenlatelier.com is verified on Resend.
    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'LUMEN <siparis@lumenlatelier.com>';
    const adminNotificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();

    const htmlContent = generateOrderHtml(order);

    console.log(`[Resend] Sipariş onay e-postası gönderiliyor: ${customerEmail} (Sipariş #${order.id})`);

    const emailPayload: any = {
      from: fromEmail,
      to: [customerEmail],
      subject: `Siparişiniz Alındı #${order.id} - LUMEN ATELIER`,
      html: htmlContent
    };

    if (adminNotificationEmail && adminNotificationEmail.includes('@')) {
      emailPayload.bcc = [adminNotificationEmail];
    }

    const result = await resend.emails.send(emailPayload);

    if (result.error) {
      console.error(`[Resend Error] E-posta gönderilemedi (${order.id}):`, result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`[Resend Success] Sipariş #${order.id} e-postası başarıyla iletildi. Resend ID: ${result.data?.id}`);
    return { success: true, id: result.data?.id };
  } catch (err: any) {
    console.error(`[Resend Exception] E-posta gönderiminde beklenmeyen hata (${order.id}):`, err?.message || err);
    return { success: false, error: err?.message || 'UNKNOWN_ERROR' };
  }
}
