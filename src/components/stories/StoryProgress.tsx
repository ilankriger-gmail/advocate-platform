'use client';

interface StoryProgressProps {
  totalStories: number;
  currentIndex: number;
  progress: number; // 0-100
}

export function StoryProgress({ totalStories, currentIndex, progress }: StoryProgressProps) {
  return (
    <div className="flex gap-1 w-full px-2">
      {Array.from({ length: totalStories }).map((_, index) => (
        <div
          key={index}
          className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-white rounded-full transition-all duration-100"
            style={{
              width:
                index < currentIndex
                  ? '100%'
                  : index === currentIndex
                  ? `${progress}%`
                  : '0%',
            }}
          />
        </div>
      ))}
    </div>
  );
}
