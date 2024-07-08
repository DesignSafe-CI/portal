import React from 'react';
import styles from './DescriptionList.module.css';

export const DIRECTION_CLASS_MAP = {
  vertical: 'is-vert',
  horizontal: 'is-horz',
} as const;
export const DEFAULT_DIRECTION = 'vertical';
export const DIRECTIONS = ['', ...Object.keys(DIRECTION_CLASS_MAP)] as const;

export const DENSITY_CLASS_MAP = {
  compact: 'is-narrow',
  default: 'is-wide',
} as const;
export const DEFAULT_DENSITY = 'default';
export const DENSITIES = ['', ...Object.keys(DENSITY_CLASS_MAP)] as const;

type Direction = keyof typeof DIRECTION_CLASS_MAP;
type Density = keyof typeof DENSITY_CLASS_MAP;

interface DescriptionListProps {
  className?: string;
  data: { [key: string]: undefined | string | string[] | JSX.Element };
  density?: Density;
  direction?: Direction;
}

export const DescriptionList: React.FC<DescriptionListProps> = ({
  className = '',
  data,
  density = DEFAULT_DENSITY,
  direction = DEFAULT_DIRECTION,
}) => {
  const modifierClasses = [
    DENSITY_CLASS_MAP[density],
    DIRECTION_CLASS_MAP[direction],
  ];
  const containerStyleNames = ['container', ...modifierClasses]
    .map((s) => styles[s])
    .join(' ');

  const shouldTruncateValues =
    (direction === 'vertical' && density === 'compact') ||
    (direction === 'horizontal' && density === 'default');
  const valueClassName = `${styles.value} ${
    shouldTruncateValues ? 'value-truncated' : ''
  }`;

  return (
    <dl className={`${className} ${containerStyleNames}`} data-testid="list">
      {Object.entries(data).map(
        ([key, value]) =>
          value && (
            <React.Fragment key={key}>
              <dt className={styles.key}>{key}</dt>
              {Array.isArray(value) ? (
                value.map((val) => (
                  <dd className={valueClassName} data-testid="value">
                    {val}
                  </dd>
                ))
              ) : (
                <dd className={valueClassName} data-testid="value">
                  {value}
                </dd>
              )}
            </React.Fragment>
          )
      )}
    </dl>
  );
};
