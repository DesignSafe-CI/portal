import React from 'react';
import styles from '../Dashboard/Dashboard.module.css';

const videos = [
  {
    id: '1yWRGAdR3XU',
    title: 'Overview Of The Dashboard',
  },
  {
    id: 'BSCMzvb80-M',
    title: 'How To Mark Favorite Apps'
  },
  {
    id: '_wDIKMwqej8',
    title: 'Adding Users To Allocation',
  },
  {
    id: 'X4mb6PJ9GD0',
    title: 'Opening A Help Ticket',
  },
];

const UserGuides = () => {
  return (
    <div className={styles.userGuidesWrapper}>
      <div className={styles.headingRow}>
        <h3 className={styles.userGuidesHeading}>User Guides & Tutorials</h3>
        <a
          href="https://www.youtube.com/playlist?list=PLTP5tdFMXQ36acgNifo23ubaH5a6FSnVF"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.moreVideosLink}
        >
          More Videos →
        </a>
      </div>

      <div className={styles.videoGrid}>
        {videos.map((video) => (
          <div key={video.id} className={styles.videoCard}>
            <a
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={`https://img.youtube.com/vi/${video.id}/0.jpg`}
                alt={video.title}
                className={styles.videoThumbnail}
              />
            </a>
            <a
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.videoTitle}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/42/YouTube_icon_%282013-2017%29.png"
                alt="YouTube"
                className={styles.youtubeIcon}
              />
              {video.title}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserGuides;
