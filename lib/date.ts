// 判断日程是否没有冲突, 无冲突返回 true
// 需要自行保证日程合法, 是合法的 24 小时制时间且开始时间小于结束
// true [['19:30', '20:00'], ['09:00', '10:01'], ['10:01', '10:30']]
// false [['19:30', '20:00'], ['09:00', '10:01'], ['10:00', '10:30']]
export const isValidSchedule = (inputs: [string, string][]): boolean => {
  if (inputs.length < 2) {
    return true;
  }
  inputs.sort((a, b) => a[1].localeCompare(b[1]));
  let end = inputs[0][1];
  for (let i = 1; i < inputs.length; i++) {
    const [s, e] = inputs[i];
    if (s.localeCompare(end) < 0) {
      return false;
    }
    end = e;
  }
  return true;
};
