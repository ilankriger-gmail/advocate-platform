import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Easing,
} from 'react-native';
import { colors } from '../utils/theme';

interface LikeButtonProps {
  initialLiked: boolean;
  initialCount: number;
  onLike: (isLiked: boolean) => Promise<void>;
  compact?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  animation: Animated.Value;
}

export function LikeButton({
  initialLiked,
  initialCount,
  onLike,
  compact = false,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(1)).current;
  const particleIdRef = useRef(0);

  // Animação de bounce elástico
  const animateHeart = useCallback(() => {
    scaleAnim.setValue(1);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.4,
        duration: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim]);

  // Animação de ripple/glow
  const animateRipple = useCallback(() => {
    rippleAnim.setValue(0);
    Animated.timing(rippleAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [rippleAnim]);

  // Animação do contador
  const animateCount = useCallback(() => {
    countAnim.setValue(1.3);
    Animated.spring(countAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [countAnim]);

  // Criar partículas explosivas
  const createParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    const numParticles = 8;
    
    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * 360;
      const radian = (angle * Math.PI) / 180;
      const distance = 40 + Math.random() * 20;
      
      const animation = new Animated.Value(0);
      
      newParticles.push({
        id: particleIdRef.current++,
        x: Math.cos(radian) * distance,
        y: Math.sin(radian) * distance,
        animation,
      });

      // Animar partícula
      Animated.timing(animation, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
    
    setParticles(newParticles);
    
    // Limpar após animação
    setTimeout(() => {
      setParticles([]);
    }, 700);
  }, []);

  const handlePress = useCallback(async () => {
    const newLiked = !liked;
    
    // Optimistic update
    setLiked(newLiked);
    setCount(prev => newLiked ? prev + 1 : prev - 1);
    
    if (newLiked) {
      animateHeart();
      animateRipple();
      animateCount();
      createParticles();
    }

    try {
      await onLike(newLiked);
    } catch {
      // Rollback
      setLiked(!newLiked);
      setCount(prev => newLiked ? prev - 1 : prev + 1);
    }
  }, [liked, onLike, animateHeart, animateRipple, animateCount, createParticles]);

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2.5],
  });

  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.6, 0.3, 0],
  });

  return (
    <View style={styles.container}>
      {/* Ripple/Glow */}
      <Animated.View
        style={[
          styles.ripple,
          {
            transform: [{ scale: rippleScale }],
            opacity: rippleOpacity,
          },
        ]}
        pointerEvents="none"
      />

      {/* Partículas */}
      {particles.map(particle => {
        const translateX = particle.animation.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0, particle.x * 0.5, particle.x],
        });
        const translateY = particle.animation.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0, particle.y * 0.5, particle.y],
        });
        const scale = particle.animation.interpolate({
          inputRange: [0, 0.2, 1],
          outputRange: [0, 1, 0],
        });
        const opacity = particle.animation.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0, 1, 1, 0],
        });

        return (
          <Animated.Text
            key={particle.id}
            style={[
              styles.particle,
              {
                transform: [{ translateX }, { translateY }, { scale }],
                opacity,
              },
            ]}
          >
            ❤️
          </Animated.Text>
        );
      })}

      {/* Botão */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.button,
          liked ? styles.buttonLiked : styles.buttonUnliked,
        ]}
      >
        <Animated.Text
          style={[
            styles.heart,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {liked ? '❤️‍🔥' : '🤍'}
        </Animated.Text>
        
        {!compact && (
          <Text style={[styles.label, liked && styles.labelLiked]}>
            {liked ? 'Te Amo!' : 'Te Amo'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Contador */}
      {count > 0 && (
        <Animated.Text
          style={[
            styles.count,
            liked && styles.countLiked,
            { transform: [{ scale: countAnim }] },
          ]}
        >
          {count}
        </Animated.Text>
      )}
    </View>
  );
}

/**
 * Coração explodindo para double-tap em imagens
 */
export function ExplodingHeart({
  visible,
  onComplete,
}: {
  visible: boolean;
  onComplete?: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);

      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.delay(500),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.3,
            friction: 4,
            tension: 150,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: -0.1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0.05,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => onComplete?.());
    }
  }, [visible, scaleAnim, opacityAnim, rotateAnim, onComplete]);

  if (!visible) return null;

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <Animated.View
      style={[
        styles.explodingContainer,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }, { rotate }],
        },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.explodingHeart}>❤️‍🔥</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  ripple: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error.light,
    left: 10,
  },
  particle: {
    position: 'absolute',
    fontSize: 16,
    left: 20,
    top: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonLiked: {
    backgroundColor: colors.error.main,
  },
  buttonUnliked: {
    backgroundColor: colors.gray[100],
  },
  heart: {
    fontSize: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  labelLiked: {
    color: '#fff',
  },
  count: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[500],
  },
  countLiked: {
    color: colors.error.main,
  },
  explodingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  explodingHeart: {
    fontSize: 80,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
});
