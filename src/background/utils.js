

export const deduplicateObjectArr = (arr, attribute) => {
  return arr.filter((item, index, self) => self.findIndex(t => t[attribute] === item[attribute]) === index)
}

