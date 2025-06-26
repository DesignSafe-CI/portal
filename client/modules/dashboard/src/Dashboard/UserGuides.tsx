import React from 'react';
import styles from './Dashboard.module.css';

const videos = [
  {
    url: 'https://www.youtube.com/watch?v=w0lhfz03QIk',
    id: 'w0lhfz03QIk',
    title: 'Checking Allocation Balance',
  },
  {
    url: 'https://www.youtube.com/watch?v=_wDIKMwqej8',
    id: '_wDIKMwqej8',
    title: 'Adding users to allocation',
  },
  {
    url: 'https://www.youtube.com/watch?v=X4mb6PJ9GD0',
    id: 'X4mb6PJ9GD0',
    title: 'Opening a help ticket',
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
        {videos.slice(0, 2).map((video) => (
          <div key={video.id} className={styles.videoCard}>
            <a href={video.url} target="_blank" rel="noopener noreferrer">
              <img
                src={`https://img.youtube.com/vi/${video.id}/0.jpg`}
                alt={video.title}
                className={styles.videoThumbnail}
              />
            </a>
            <a
              href={video.url}
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

      <div className={styles.videoCardSingle}>
        <a
          href={videos[2].url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={`https://img.youtube.com/vi/${videos[2].id}/0.jpg`}
            alt={videos[2].title}
            className={styles.videoThumbnail}
          />
        </a>
        <a
          href={videos[2].url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.videoTitle}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/4/42/YouTube_icon_%282013-2017%29.png"
            alt="YouTube"
            className={styles.youtubeIcon}
          />
          {videos[2].title}
        </a>
      </div>
    </div>
  );
};

export default UserGuides;
