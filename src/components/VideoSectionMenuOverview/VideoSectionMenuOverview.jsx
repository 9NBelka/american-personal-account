import { BsFillBookmarkCheckFill, BsFillStopwatchFill, BsGithub } from 'react-icons/bs';
import scss from './VideoSectionMenuOverview.module.scss';

export default function VideoSectionMenuOverview({
  courseTitle,
  totalLessons,
  description,
  totalDuration,
  courseGitHubRepLink,
}) {
  return (
    <div className={scss.overviewBlock}>
      <h1 className={scss.courseTitle}>{courseTitle}</h1>
      <div className={scss.overviewIconAndTextBlocks}>
        <div className={scss.overviewIconAndTextBlock}>
          <BsFillBookmarkCheckFill className={scss.iconClock} />

          <p>{totalLessons} lessons</p>
        </div>
        <div className={scss.overviewIconAndTextBlock}>
          <BsFillStopwatchFill className={scss.iconClock} />
          <p>{totalDuration}</p>
        </div>
      </div>
      <div className={scss.overviewDescription}>
        <p>{description}</p>
        <div className={scss.gitHubLinkBlock}>
          <a href={courseGitHubRepLink} target='_blank'>
            Download course materials <BsGithub className={scss.gitHubLinkIcon} />
          </a>
        </div>
      </div>
    </div>
  );
}
