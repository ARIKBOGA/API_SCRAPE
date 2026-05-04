package utils.leetcode;

public class FirstOccurance {

    public static int findFirstOccurrence(String haystack, String needle) {

        for (int i = 0; i <= haystack.length() - needle.length(); i++) {
            if (haystack.substring(i, i + needle.length()).equals(needle)) {
                return i;
            }
        }
        return -1;

    }

    /**
     * You are given a string s and an array of strings words. All the strings of
     * words are of the same length.
     * 
     * A concatenated string is a string that exactly contains all the strings of
     * any permutation of words concatenated.
     * 
     * For example, if words = ["ab","cd","ef"], then "abcdef", "abefcd", "cdabef",
     * "cdefab", "efabcd", and "efcdab" are all concatenated strings. "acdbef" is
     * not a concatenated string because it is not the concatenation of any
     * permutation of words.
     * Return an array of the starting indices of all the concatenated substrings in
     * s. You can return the answer in any order.
     * 
     * @param String s
     * @param String[] words
     */


    public static void main(String[] args) {

        String haystack = "aaa";
        String needle = "a";
        System.out.println(findFirstOccurrence(haystack, needle));
    }

}