import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const formData = await request.formData();
    const receiptFile = formData.get('receipt') as File;

    if (!receiptFile) {
      return NextResponse.json(
        { error: 'Receipt file is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Upload receipt to storage
    const fileName = `${orderId}-${Date.now()}-${receiptFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, receiptFile);

    if (uploadError) {
      console.error('Receipt upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload receipt' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data } = supabase.storage
      .from('receipts')
      .getPublicUrl(uploadData.path);

    const receiptUrl = data.publicUrl;

    // Update order with receipt URL and payment status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        transfer_receipt_url: receiptUrl,
        payment_status: 'uploaded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Order update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        receiptUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Receipt upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
