export const truncateString = (
  string: string = "",
  length: number = 20
): string => {
  return string.length > length + 3
    ? string.substring(0, length) + "..."
    : string;
};

export const keepBetween = (min: number, max: number, value: number) => {
  return Math.max(min, Math.min(max, value));
};

export const getPositionFromAngleAndDistance = (
  angle: number,
  distance: number
): [number, number] => {
  const radians = (angle / 180) * Math.PI;
  return [Math.cos(radians) * distance, Math.sin(radians) * distance];
};

export const getAngleFromPosition = (x: number, y: number): number => {
  return (Math.atan2(y, x) * 180) / Math.PI;
};

export const keepCircleInsideCircle = (
  parentR: number,
  parentPosition: [number, number],
  childR: number,
  childPosition: [number, number],
  isParent: boolean = false
): [number, number] => {
  const distance = Math.sqrt(
    Math.pow(parentPosition[0] - childPosition[0], 2) +
      Math.pow(parentPosition[1] - childPosition[1], 2)
  );
  const angle = getAngleFromPosition(
    childPosition[0] - parentPosition[0],
    childPosition[1] - parentPosition[1]
  );
  // leave space for labels
  const padding = Math.min(
    angle < -20 && angle > -100 && isParent ? 13 : 3,
    parentR * 0.2
  );
  if (distance > parentR - childR - padding) {
    const diff = getPositionFromAngleAndDistance(
      angle,
      parentR - childR - padding
    );
    return [parentPosition[0] + diff[0], parentPosition[1] + diff[1]];
  }
  return childPosition;
};
