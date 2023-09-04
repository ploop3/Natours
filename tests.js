// const months = ['aba', 'bbb', 'bab'];
// const months = ['abc', 'abx', 'axx', 'abx', 'abc'];

function solution(inputArray) {
  inputArray.sort();
  for (let i = 1; i < inputArray.length; i++) {
    let str1 = inputArray[i - 1];
    let str2 = inputArray[i];
    console.log(`Comparing ${str1} and ${str2}`);
    let count = 0;
    for (let j = 0; j < str1.length; j++) {
      console.log(str1.charAt(j));
      console.log(str2.charAt(j));
      if (str1.charAt(j) != str2.charAt(j)) {
        count++;
      }
    }
    console.log(`Differences: ${count}`);
    console.log('----------');
    if (count != 1) return false;
  }

  return true;
}

const compare = () => {
  const str1 = 'abc';
  const str2 = 'abx';

  let count = 0;
  for (let i = 0; i < str1.length; i++) {
    console.log(str1.charAt(i));
    console.log(str2.charAt(i));
    if (str1.charAt(i) != str2.charAt(i)) {
      count++;
    }
    console.log('---------', count);
  }
  console.log(`The strings ${str1} and ${str2} have ${count} different chars`);
};

// compare();
const months = ['abc', 'abx', 'axx', 'abx', 'abc'];
console.log(months.sort());
console.log(solution(months));
