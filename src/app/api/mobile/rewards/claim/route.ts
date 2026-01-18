import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request);

    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { rewardId, selectedOption, deliveryInfo } = body;

    if (!rewardId) {
      return NextResponse.json(
        { error: 'ID do prêmio é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar prêmio
    const { data: reward, error: rewardError } = await supabaseAdmin
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .eq('is_active', true)
      .single();

    if (rewardError || !reward) {
      return NextResponse.json(
        { error: 'Prêmio não encontrado ou indisponível' },
        { status: 404 }
      );
    }

    // Verificar estoque
    if (reward.quantity_available !== null && reward.quantity_available <= 0) {
      return NextResponse.json(
        { error: 'Prêmio esgotado' },
        { status: 400 }
      );
    }

    // Verificar saldo do usuário
    const { data: coins } = await supabaseAdmin
      .from('user_coins')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    const userBalance = coins?.balance || 0;

    if (userBalance < reward.coins_required) {
      return NextResponse.json(
        { error: `Saldo insuficiente. Você precisa de ${reward.coins_required} corações.` },
        { status: 400 }
      );
    }

    // Validar opção selecionada (se prêmio tiver opções)
    if (reward.available_options && reward.available_options.length > 0) {
      if (!selectedOption) {
        return NextResponse.json(
          { error: 'Selecione uma opção para o prêmio' },
          { status: 400 }
        );
      }
      if (!reward.available_options.includes(selectedOption)) {
        return NextResponse.json(
          { error: 'Opção inválida' },
          { status: 400 }
        );
      }
    }

    // Validar informações de entrega para prêmios físicos
    if (reward.type === 'physical') {
      if (!deliveryInfo?.name || !deliveryInfo?.address || !deliveryInfo?.city ||
          !deliveryInfo?.state || !deliveryInfo?.zipCode || !deliveryInfo?.phone) {
        return NextResponse.json(
          { error: 'Informações de entrega incompletas' },
          { status: 400 }
        );
      }
    }

    // Validar PIX para prêmios em dinheiro
    if (reward.type === 'money') {
      if (!deliveryInfo?.pixKey || !deliveryInfo?.pixKeyType) {
        return NextResponse.json(
          { error: 'Chave PIX é obrigatória para prêmios em dinheiro' },
          { status: 400 }
        );
      }
    }

    // Criar resgate
    const { data: claim, error: claimError } = await supabaseAdmin
      .from('reward_claims')
      .insert({
        user_id: user.id,
        reward_id: rewardId,
        coins_spent: reward.coins_required,
        status: 'pending',
        selected_option: selectedOption || null,
        delivery_info: deliveryInfo || null,
      })
      .select()
      .single();

    if (claimError) {
      console.error('Erro ao criar resgate:', claimError);
      return NextResponse.json(
        { error: 'Erro ao processar resgate' },
        { status: 500 }
      );
    }

    // Debitar corações
    const { error: updateError } = await supabaseAdmin
      .from('user_coins')
      .update({
        balance: userBalance - reward.coins_required,
      })
      .eq('user_id', user.id);

    if (updateError) {
      // Reverter resgate em caso de erro
      await supabaseAdmin
        .from('reward_claims')
        .delete()
        .eq('id', claim.id);

      console.error('Erro ao debitar corações:', updateError);
      return NextResponse.json(
        { error: 'Erro ao processar pagamento' },
        { status: 500 }
      );
    }

    // Decrementar estoque (se aplicável)
    if (reward.quantity_available !== null) {
      await supabaseAdmin
        .from('rewards')
        .update({
          quantity_available: reward.quantity_available - 1,
        })
        .eq('id', rewardId);
    }

    // Registrar transação de corações
    await supabaseAdmin
      .from('coin_transactions')
      .insert({
        user_id: user.id,
        amount: -reward.coins_required,
        type: 'redemption',
        description: `Resgate: ${reward.name}`,
        reference_id: claim.id,
        reference_type: 'reward_claim',
      });

    return NextResponse.json({
      success: true,
      message: 'Resgate realizado com sucesso!',
      claim: {
        id: claim.id,
        status: claim.status,
        coins_spent: reward.coins_required,
        new_balance: userBalance - reward.coins_required,
      },
    });
  } catch (err) {
    console.error('Erro no resgate:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
