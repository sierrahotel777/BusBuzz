import { useState, useEffect } from 'react';

function CountUp({ end, duration = 1.5 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const endNum = parseInt(end) || 0;
    if (start === endNum) return;

    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round((duration * 1000) / frameDuration);
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    let currentFrame = 0;
    const counter = setInterval(() => {
      currentFrame++;
      const progress = easeOutCubic(currentFrame / totalFrames);
      const currentCount = Math.round(endNum * progress);
      
      setCount(currentCount);

      if (currentFrame === totalFrames) {
        clearInterval(counter);
      }
    }, frameDuration);

    return () => clearInterval(counter);
  }, [end, duration]);

  return count;
}

export default CountUp;