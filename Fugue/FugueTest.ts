import FugueList from "./FugueList";
import { randomString, StringTotalOrder } from "./utils";

const test1 = new FugueList(new StringTotalOrder(randomString(5)));
const test2 = new FugueList(new StringTotalOrder(randomString(5)));

const word1 = "SHADOW WIZARD MONEY GANG";
const word2 = "BALLING";

// Randomly insert words into the list from different simulated users
async function simulateUser(list: FugueList<string>, word: string) {
    for (let i = 0; i < word.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 150));
        list.insert(i, word.charAt(i));
        console.log(list.observe());
        console.log(list.state);
    }
}

Promise.all([
    simulateUser(test1, word1), //
    simulateUser(test2, word2),
])
    .then(() => console.log(`Done:\t${test1.observe()}\n\t${test2.observe()}`))
    .catch(console.error);
