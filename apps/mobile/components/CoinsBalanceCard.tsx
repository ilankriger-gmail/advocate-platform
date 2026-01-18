import { View, Text } from 'react-native';

interface CoinsBalanceCardProps {
  balance: number;
  variant?: 'pink' | 'purple';
}

export default function CoinsBalanceCard({ balance, variant = 'pink' }: CoinsBalanceCardProps) {
  const gradientClass = variant === 'pink'
    ? 'bg-gradient-to-br from-pink-500 via-rose-500 to-red-500'
    : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500';

  return (
    <View className={`relative overflow-hidden ${gradientClass} rounded-2xl shadow-lg`}>
      {/* Background pattern overlay */}
      <View className="absolute inset-0 opacity-20">
        <View className="absolute top-2 right-2 w-20 h-20 rounded-full bg-white/10" />
        <View className="absolute bottom-2 left-2 w-16 h-16 rounded-full bg-white/10" />
      </View>

      <View className="relative p-5">
        <View className="flex-row items-center justify-between">
          {/* Texto */}
          <View className="flex-1">
            <Text className="text-white/80 text-xs font-medium uppercase tracking-wide mb-1">
              Seus corações
            </Text>
            <View className="flex-row items-baseline gap-2">
              <Text className="text-white text-4xl font-black">{balance}</Text>
              <Text className="text-white/80 text-base font-medium">corações</Text>
            </View>
            <Text className="text-white/60 text-xs mt-2">
              Complete desafios para ganhar mais!
            </Text>
          </View>

          {/* Ícone animado */}
          <View className="relative">
            <View className="absolute inset-0 bg-white/20 rounded-full" />
            <View className="w-16 h-16 bg-white/10 rounded-full items-center justify-center">
              <Text className="text-4xl">❤️‍🔥</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
