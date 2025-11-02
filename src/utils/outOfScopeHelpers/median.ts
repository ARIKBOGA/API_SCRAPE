const nums1 = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 1000)).sort((a, b) => a - b);
const nums2 = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 1000)).sort((a, b) => a - b);


function findMedianSortedArrays(nums1: number[], nums2: number[]): number {
    const merged: number[] = [];
    let i = 0, j = 0;

    while (i < nums1.length && j < nums2.length) {
        if (nums1[i] < nums2[j]) {
            merged.push(nums1[i]);
            i++;
        } else {
            merged.push(nums2[j]);
            j++;
        }
    }

    if(i < nums1.length) {
        merged.push(...nums1.slice(i));
    }
    if(j < nums2.length) {
        merged.push(...nums2.slice(j));
    }

    const mid = Math.floor(merged.length / 2);
    if (merged.length % 2 === 0) {
        return (merged[mid - 1] + merged[mid]) / 2;
    } else {
        return merged[mid];
    }
};

function longestCommonPrefix(strs: string[]): string {

    if (strs.length === 0) return "";

    let prefix = strs[0];

    for (let i = 1; i < strs.length; i++) {
        while (strs[i].indexOf(prefix) !== 0) {
            prefix = prefix.substring(0, prefix.length - 1);
            if (prefix === "") return "";
        }
    }

    return prefix; 
    
};

console.log("Median is: ", findMedianSortedArrays(nums1, nums2));