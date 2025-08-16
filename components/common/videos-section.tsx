import { getTranslations } from 'next-intl/server';

interface VideosSectionProps {
  locale: string;
}

export async function VideosSection({ locale }: VideosSectionProps) {
  const t = await getTranslations({ locale, namespace: 'Common' });

  const videos = [
    { src: '/videos/video1.mp4', titleKey: 'video1Title' },
    { src: '/videos/video2.mp4', titleKey: 'video2Title' },
    { src: '/videos/video3.mp4', titleKey: 'video3Title' },
  ];

  return (
    <div className="w-full px-2 sm:px-4">
      <div className="grid grid-cols-3 gap-2">
        {videos.map((video, index) => (
          <div key={index} className="rounded-lg overflow-hidden shadow-xl bg-black aspect-[9/16]">
            <video
              width="100%"
              preload="metadata"
              playsInline
              loop
              muted
              autoPlay
              className="w-full h-full object-cover"
              // poster={`/videos/poster${index + 1}.jpg`} // Optional: Add poster images
            >
              <source src={video.src} type="video/mp4" />
              {t('videoPlayerNotSupported')} {/* Fallback text */}
            </video>
            {/* Optional: Individual video titles removed as per request
            <div className="p-4">
              <h3 className="text-md font-semibold text-slate-700 dark:text-white">
                {t(video.titleKey)} 
              </h3>
            </div>
            */}
          </div>
        ))}
      </div>
    </div>
  );
} 