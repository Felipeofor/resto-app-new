/* ============================================================
   RestoQR — Email Templates
   Mobile-first, table-based layout, fully inline CSS
   Compatible with Gmail, Outlook, Apple Mail, Yahoo
   ============================================================ */

const BRAND_COLOR = '#7c3aed'
const BRAND_DARK  = '#5b21b6'
const BRAND_LIGHT = '#ede9fe'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://resto-virid.vercel.app'

/* ── Shared layout wrapper ──────────────────────────────── */
function baseLayout(content: string, footer?: string): string {
  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>RestoQR</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width:600px){
      .container{width:100%!important;border-radius:0!important;}
      .hero-pad{padding:28px 20px!important;}
      .body-pad{padding:28px 20px!important;}
      .btn{display:block!important;width:100%!important;text-align:center!important;}
      .hide-mobile{display:none!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<!-- Preheader (hidden) -->
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f3f4f6;">
  &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
  <tr><td align="center">

    <!-- Outer container -->
    <table role="presentation" class="container" cellpadding="0" cellspacing="0"
      style="width:100%;max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      ${content}

      <!-- Footer -->
      <tr>
        <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          ${footer || `
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
            Powered by
            <a href="${siteUrl}" style="color:${BRAND_COLOR};text-decoration:none;font-weight:600;">RestoQR</a>
            &mdash; Menú digital para restaurantes
          </p>`}
        </td>
      </tr>

    </table>
    <!-- / Outer container -->

  </td></tr>
</table>
</body>
</html>`
}

/* ── Hero header shared ────────────────────────────────── */
function heroHeader(emoji: string, title: string, subtitle?: string): string {
  return `
  <tr>
    <td class="hero-pad"
      style="background:linear-gradient(135deg,${BRAND_COLOR} 0%,#4f46e5 100%);padding:40px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;line-height:1;">${emoji}</div>
      <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.3px;line-height:1.2;">
        ${title}
      </h1>
      ${subtitle ? `<p style="margin:8px 0 0;color:rgba(255,255,255,0.82);font-size:15px;line-height:1.5;">${subtitle}</p>` : ''}
    </td>
  </tr>`
}

/* ── CTA button ────────────────────────────────────────── */
function ctaButton(text: string, url: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 0;">
    <tr>
      <td style="border-radius:10px;background:linear-gradient(135deg,${BRAND_COLOR},#4f46e5);">
        <a href="${url}" class="btn"
          style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.1px;">
          ${text} &rarr;
        </a>
      </td>
    </tr>
  </table>`
}

/* ── Info row ──────────────────────────────────────────── */
function infoRow(icon: string, label: string, value: string): string {
  return `
  <tr>
    <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:28px;font-size:18px;vertical-align:top;padding-top:2px;">${icon}</td>
          <td style="vertical-align:top;">
            <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:1px;">${label}</span>
            <span style="font-size:14px;color:#111827;font-weight:500;">${value}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

/* ============================================================
   TEMPLATE 1: Welcome email (customer registers on menu)
   ============================================================ */
export function welcomeEmailTemplate({
  customerName,
  restaurantName,
  restaurantSlug,
  discountText,
}: {
  customerName?: string
  restaurantName: string
  restaurantSlug: string
  discountText?: string | null
}): string {
  const menuUrl = `${siteUrl}/menu/${restaurantSlug}`
  const greeting = customerName ? `Hola, <strong>${customerName}</strong>` : 'Hola'

  const content = `
  ${heroHeader('🍽️', `¡Bienvenido a ${restaurantName}!`, 'Tu acceso al menú digital está listo')}

  <!-- Body -->
  <tr>
    <td class="body-pad" style="padding:36px 32px;">

      <p style="margin:0 0 16px;font-size:16px;color:#111827;line-height:1.7;">${greeting},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
        Gracias por registrarte en el menú digital de <strong>${restaurantName}</strong>.
        Ya podés explorar toda nuestra carta, ver fotos de los platos y hacer tu pedido directo desde el celular.
      </p>

      ${discountText ? `
      <!-- Promo box -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:${BRAND_LIGHT};border-radius:12px;margin:0 0 24px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;font-size:14px;color:${BRAND_DARK};font-weight:700;">🎉 Promoción especial</p>
            <p style="margin:6px 0 0;font-size:14px;color:#5b21b6;line-height:1.5;">${discountText}</p>
          </td>
        </tr>
      </table>` : ''}

      <!-- Feature list -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        ${featureItem('📋', 'Menú completo', 'Todos los platos con fotos, descripciones y precios')}
        ${featureItem('🛒', 'Pedidos online', 'Hacé tu pedido y elegí el método de pago')}
        ${featureItem('🔔', 'Novedades', 'Te avisamos de promociones y platos especiales')}
      </table>

      ${ctaButton('Ver el menú ahora', menuUrl)}

      <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
        ¡Esperamos verte pronto!<br/>
        <strong style="color:#374151;">El equipo de ${restaurantName}</strong>
      </p>
    </td>
  </tr>`

  const footer = `
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
      Recibiste este email porque te registraste en el menú de <strong>${restaurantName}</strong>.<br/>
      Powered by <a href="${siteUrl}" style="color:${BRAND_COLOR};text-decoration:none;font-weight:600;">RestoQR</a>
    </p>`

  return baseLayout(content, footer)
}

function featureItem(emoji: string, title: string, desc: string): string {
  return `
  <tr>
    <td style="padding:8px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:36px;vertical-align:top;padding-top:2px;font-size:20px;">${emoji}</td>
          <td style="vertical-align:top;">
            <p style="margin:0;font-size:14px;font-weight:700;color:#111827;">${title}</p>
            <p style="margin:2px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">${desc}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

/* ============================================================
   TEMPLATE 2: Restaurant owner welcome (new account created)
   ============================================================ */
export function restaurantOwnerWelcomeTemplate({
  ownerName,
  restaurantName,
  dashboardUrl,
}: {
  ownerName?: string
  restaurantName?: string
  dashboardUrl?: string
}): string {
  const url = dashboardUrl || `${siteUrl}/dashboard`
  const greeting = ownerName ? `Hola, <strong>${ownerName}</strong>` : 'Hola'

  const content = `
  ${heroHeader('🚀', '¡Tu cuenta está lista!', 'Bienvenido a RestoQR — el menú digital que impulsa tu negocio')}

  <tr>
    <td class="body-pad" style="padding:36px 32px;">
      <p style="margin:0 0 16px;font-size:16px;color:#111827;line-height:1.7;">${greeting},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
        ${restaurantName ? `Tu restaurante <strong>${restaurantName}</strong> ya tiene su menú digital en RestoQR.` : 'Ya tenés tu cuenta de RestoQR creada.'}
        En minutos podés cargar tu carta, configurar tus categorías y empezar a recibir pedidos online.
      </p>

      <!-- Steps -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:#f9fafb;border-radius:12px;margin-bottom:28px;">
        <tr>
          <td style="padding:20px;">
            <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">
              Primeros pasos
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${stepItem('1', 'Configurá tu perfil', 'Subí tu logo, foto de portada y describí tu propuesta.')}
              ${stepItem('2', 'Cargá tu menú', 'Creá categorías y agregá platos con fotos y precios.')}
              ${stepItem('3', 'Compartí tu QR', 'Generá tu QR y ponélo en mesas, redes o delivery.')}
              ${stepItem('4', 'Recibí pedidos', 'Gestioná pedidos y capturá los emails de tus clientes.')}
            </table>
          </td>
        </tr>
      </table>

      ${ctaButton('Ir al panel de control', url)}

      <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
        ¿Tenés dudas? Estamos para ayudarte.<br/>
        <strong style="color:#374151;">El equipo de RestoQR</strong>
      </p>
    </td>
  </tr>`

  return baseLayout(content)
}

function stepItem(num: string, title: string, desc: string): string {
  return `
  <tr>
    <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:32px;vertical-align:top;padding-top:2px;">
            <div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,${BRAND_COLOR},#4f46e5);display:inline-block;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#ffffff;">${num}</div>
          </td>
          <td style="vertical-align:top;padding-left:4px;">
            <p style="margin:0;font-size:14px;font-weight:700;color:#111827;">${title}</p>
            <p style="margin:2px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">${desc}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

/* ============================================================
   TEMPLATE 3: Password reset (restaurant owner)
   ============================================================ */
export function passwordResetTemplate({
  ownerName,
  resetUrl,
}: {
  ownerName?: string
  resetUrl: string
}): string {
  const greeting = ownerName ? `Hola, <strong>${ownerName}</strong>` : 'Hola'

  const content = `
  ${heroHeader('🔐', 'Recuperá tu contraseña', 'Recibimos una solicitud para resetear tu acceso')}

  <tr>
    <td class="body-pad" style="padding:36px 32px;">
      <p style="margin:0 0 16px;font-size:16px;color:#111827;line-height:1.7;">${greeting},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
        Recibimos una solicitud para restablecer la contraseña de tu cuenta en RestoQR.
        Hacé clic en el botón de abajo para crear una nueva contraseña.
      </p>

      ${ctaButton('Crear nueva contraseña', resetUrl)}

      <!-- Warning box -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:#fef3c7;border-radius:12px;margin-top:24px;border:1px solid #fde68a;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;font-size:13px;color:#92400e;font-weight:700;">⚠️ Importante</p>
            <p style="margin:6px 0 0;font-size:13px;color:#78350f;line-height:1.5;">
              Este enlace es válido por <strong>60 minutos</strong> y solo puede usarse una vez.
              Si no solicitaste este cambio, ignorá este email — tu contraseña actual seguirá funcionando.
            </p>
          </td>
        </tr>
      </table>

      <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
        Por seguridad, nunca compartas este enlace con nadie.<br/>
        <strong style="color:#374151;">El equipo de RestoQR</strong>
      </p>
    </td>
  </tr>`

  const footer = `
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
      Si no solicitaste restablecer tu contraseña, ignorá este email.<br/>
      Powered by <a href="${siteUrl}" style="color:${BRAND_COLOR};text-decoration:none;font-weight:600;">RestoQR</a>
    </p>`

  return baseLayout(content, footer)
}

/* ============================================================
   TEMPLATE 4: Order confirmation (customer placed an order)
   ============================================================ */
export function orderConfirmationTemplate({
  customerName,
  restaurantName,
  restaurantSlug,
  orderNumber,
  items,
  subtotal,
  deliveryFee,
  total,
  paymentMethod,
  deliveryAddress,
  transferAlias,
  transferHolder,
}: {
  customerName: string
  restaurantName: string
  restaurantSlug: string
  orderNumber: string | number
  items: Array<{ name: string; quantity: number; price: number; notes?: string }>
  subtotal: number
  deliveryFee: number
  total: number
  paymentMethod: 'cash' | 'transfer'
  deliveryAddress: string
  transferAlias?: string | null
  transferHolder?: string | null
}): string {
  const menuUrl = `${siteUrl}/menu/${restaurantSlug}`
  const fmt = (n: number) => `$${n.toLocaleString('es-AR')}`

  const itemRows = items.map((item) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;">
            <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">
              ${item.quantity}× ${item.name}
            </p>
            ${item.notes ? `<p style="margin:2px 0 0;font-size:12px;color:#9ca3af;font-style:italic;">${item.notes}</p>` : ''}
          </td>
          <td style="vertical-align:top;text-align:right;white-space:nowrap;">
            <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">
              ${fmt(item.price * item.quantity)}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`).join('')

  const paymentBox = paymentMethod === 'transfer' ? `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background:#fef3c7;border-radius:12px;margin:0 0 24px;border:1px solid #fde68a;">
    <tr>
      <td style="padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:14px;color:#92400e;font-weight:700;">💳 Datos para la transferencia</p>
        ${transferAlias ? `<p style="margin:0 0 4px;font-size:13px;color:#78350f;"><strong>Alias:</strong> ${transferAlias}</p>` : ''}
        ${transferHolder ? `<p style="margin:0 0 4px;font-size:13px;color:#78350f;"><strong>Titular:</strong> ${transferHolder}</p>` : ''}
        <p style="margin:8px 0 0;font-size:13px;color:#92400e;font-weight:600;">Monto: ${fmt(total)}</p>
        <p style="margin:6px 0 0;font-size:12px;color:#a16207;">Una vez hecha la transferencia, enviá el comprobante desde el menú.</p>
      </td>
    </tr>
  </table>` : `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background:#d1fae5;border-radius:12px;margin:0 0 24px;border:1px solid #a7f3d0;">
    <tr>
      <td style="padding:14px 20px;">
        <p style="margin:0;font-size:14px;color:#065f46;font-weight:700;">💵 Pago en efectivo</p>
        <p style="margin:4px 0 0;font-size:13px;color:#047857;">Tené listo ${fmt(total)} al momento de la entrega.</p>
      </td>
    </tr>
  </table>`

  const content = `
  ${heroHeader('✅', '¡Pedido recibido!', `Pedido #${orderNumber} — ${restaurantName}`)}

  <tr>
    <td class="body-pad" style="padding:36px 32px;">

      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
        Hola <strong>${customerName}</strong>, tu pedido fue recibido y está siendo procesado.
        Te avisaremos cuando esté listo.
      </p>

      <!-- Order details box -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:#f9fafb;border-radius:12px;margin-bottom:24px;">
        <tr>
          <td style="padding:20px;">
            <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">
              Detalle del pedido
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${itemRows}
            </table>
            <!-- Totals -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
              ${deliveryFee > 0 ? `
              <tr>
                <td style="padding:4px 0;font-size:13px;color:#6b7280;">Subtotal</td>
                <td style="padding:4px 0;font-size:13px;color:#6b7280;text-align:right;">${fmt(subtotal)}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:13px;color:#6b7280;">Envío</td>
                <td style="padding:4px 0;font-size:13px;color:#6b7280;text-align:right;">${fmt(deliveryFee)}</td>
              </tr>` : ''}
              <tr>
                <td style="padding:10px 0 0;font-size:16px;font-weight:800;color:#111827;border-top:2px solid #e5e7eb;">Total</td>
                <td style="padding:10px 0 0;font-size:16px;font-weight:800;color:${BRAND_COLOR};text-align:right;border-top:2px solid #e5e7eb;">${fmt(total)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Delivery info -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:#f9fafb;border-radius:12px;margin-bottom:24px;">
        <tr>
          <td style="padding:20px;">
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">
              Información de entrega
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${infoRow('📍', 'Dirección', deliveryAddress)}
              ${infoRow('💳', 'Método de pago', paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia bancaria')}
              ${infoRow('🔖', 'Número de pedido', `#${orderNumber}`)}
            </table>
          </td>
        </tr>
      </table>

      <!-- Payment instructions -->
      ${paymentBox}

      ${ctaButton('Ver mi pedido', menuUrl)}

      <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
        ¿Tenés alguna duda? Podés contactarnos directamente.<br/>
        <strong style="color:#374151;">El equipo de ${restaurantName}</strong>
      </p>
    </td>
  </tr>`

  const footer = `
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
      Recibiste este email porque realizaste un pedido en <strong>${restaurantName}</strong>.<br/>
      Powered by <a href="${siteUrl}" style="color:${BRAND_COLOR};text-decoration:none;font-weight:600;">RestoQR</a>
    </p>`

  return baseLayout(content, footer)
}
