import React from 'react';

const HeroImage = () => {
  return (
    <div className='flex justify-center items-center'>
      <video
        src='/Videos/video.mp4'
        autoPlay
        loop
        muted
        playsInline
        className='w-full h-auto object-cover'
        alt='Hero Video'
      />
    </div>
  );
};

export default HeroImage;