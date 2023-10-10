/**
 * @param {string} s
 * @return {number[]}
 */
var diStringMatch = function (s) {
    let max = s.length, min = 0;
    let ans = [];
    for (let i = 0; i <= s.length; i++) {
        if (s[i] == "I") {
            ans.push(min);
            min++;
        } else {
            ans.push(max);
            max--;
        }
    }
    return ans;
};

let s = "DDI"; // [0,4,1,3,2]


let result = diStringMatch(s);

console.log(result);