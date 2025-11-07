/* create a fınction that removes duplicates fron a sorted array,
   modify the input array by adding unique elements at start of the array in sorted order and fill the rest of the array with underscores,
   return the number of unique elements in the array

*/
function removeDuplicates(nums: number[]): number {
  let index = 1;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] !== nums[i - 1]) {
      nums[index] = nums[i];
      index++;
    }
  }
  return index;
}

const k = removeDuplicates([1, 1, 2, 3, 3, 3, 4, 4, 4, 5]); // 2, nums = [1,2,_]
console.log(k);
