import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { orderConfirmationTemplate } from '@/lib/email/templates';

interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  notes: string;
}

interface CustomerInfo {
  fullName: string;
  email: string;
  whatsapp: string;
  address: string;
  notes: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const customerInfoRaw = formData.get('customerInfo') as string;
    const itemsRaw = formData.get('items') as string;
    const paymentMethod = formData.get('paymentMethod') as 'cash' | 'transfer';
    const restaurantId = formData.get('restaurantId') as string;
    const subtotal = parseFloat(formData.get('subtotal') as string || '0');
    const deliveryFee = parseFloat(formData.get('deliveryFee') as string || '0');
    const total = parseFloat(formData.get('total') as string || '0');
    const receiptFile = formData.get('receipt') as File | null;

    if (!customerInfoRaw || !itemsRaw || !restaurantId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const customerInfo: CustomerInfo = JSON.parse(customerInfoRaw);
    const items: OrderItem[] = JSON.parse(itemsRaw);

    if (!customerInfo.fullName || !customerInfo.whatsapp || !customerInfo.address) {
      return NextResponse.json(
        { error: 'Missing customer information' },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create order (order_number is SERIAL, auto-incremented by DB)
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurantId,
        customer_name: customerInfo.fullName,
        customer_email: customerInfo.email || null,
        customer_phone: customerInfo.whatsapp,
        delivery_address: customerInfo.address,
        delivery_notes: customerInfo.notes || null,
        payment_method: paymentMethod,
        payment_status: 'pending' as const,
        order_status: 'pending' as const,
        subtotal,
        delivery_fee: deliveryFee,
        total,
      })
      .select('id, order_number')
      .single();

    if (orderError || !orderData) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    const orderId = orderData.id;
    const orderNumber = orderData.order_number;

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: orderId,
      menu_item_id: item.menuItemId || null,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes || null,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
    }

    // Handle receipt upload for transfer payments
    let receiptUrl = null;
    if (paymentMethod === 'transfer' && receiptFile) {
      const fileName = `${orderId}-${Date.now()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile);

      if (!uploadError && uploadData) {
        const { data } = supabase.storage
          .from('receipts')
          .getPublicUrl(uploadData.path);
        receiptUrl = data.publicUrl;

        await supabase
          .from('orders')
          .update({
            transfer_receipt_url: receiptUrl,
            payment_status: 'uploaded' as const,
          })
          .eq('id', orderId);
      }
    }

    // Track analytics event
    await supabase.from('analytics_events').insert({
      restaurant_id: restaurantId,
      event_type: 'visit' as const,
      metadata: { type: 'order', order_id: orderId, payment_method: paymentMethod },
    });

    // Capture customer email if provided
    if (customerInfo.email) {
      await supabase.from('customer_emails').insert({
        restaurant_id: restaurantId,
        email: customerInfo.email,
        name: customerInfo.fullName,
        registered_via: 'manual' as const,
      }).then(() => {});  // Ignore duplicate errors
    }

    // Fetch restaurant info for email and response
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('name, slug, transfer_alias, transfer_holder, whatsapp_number')
      .eq('id', restaurantId)
      .single();

    // Send order confirmation email if customer provided email and Resend is configured
    if (customerInfo.email && process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const restaurantName = restaurant?.name || 'El restaurante';
        const restaurantSlug = restaurant?.slug || '';

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: customerInfo.email,
          subject: `¡Pedido #${orderNumber} recibido en ${restaurantName}! ✅`,
          html: orderConfirmationTemplate({
            customerName: customerInfo.fullName,
            restaurantName,
            restaurantSlug,
            orderNumber,
            items: items.map((i) => ({
              name: i.name,
              quantity: i.quantity,
              price: i.price,
              notes: i.notes || undefined,
            })),
            subtotal,
            deliveryFee,
            total,
            paymentMethod,
            deliveryAddress: customerInfo.address,
            transferAlias: restaurant?.transfer_alias ?? null,
            transferHolder: restaurant?.transfer_holder ?? null,
          }),
        });
      } catch (emailErr) {
        console.error('Error sending order confirmation email:', emailErr);
        // Don't fail the order if email fails
      }
    }

    return NextResponse.json(
      { success: true, orderId, orderNumber, receiptUrl, whatsappNumber: restaurant?.whatsapp_number },
      { status: 201 }
    );
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
