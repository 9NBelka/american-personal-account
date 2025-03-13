import React from 'react';

export default function PlayListVideoSection({ videoUrl }) {
  return (
    <div className='video-section'>
      {videoUrl ? (
        <iframe src={videoUrl} title='Course Video' width='100%' height='500px' allowFullScreen />
      ) : (
        <p>Select a lesson to view</p>
      )}
    </div>
  );
}
