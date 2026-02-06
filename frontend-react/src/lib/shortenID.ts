export const shortenID = (id: string, chars = 4): string => {
  if (id.length <= chars * 2) {
    return id;
  }
  return `${id.slice(0, chars)}...${id.slice(-chars)}`;
};
