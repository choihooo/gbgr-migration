function twoSome(nums, target) {
  const map = new Map();

  for (let i = 0; i < nums.length; i++) {
    const need = nums[i] - target;

    if (map.has(need)) return [map.get(need), i];

    map.set(nums[i], i);
  }

  return [];
}
