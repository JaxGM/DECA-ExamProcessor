const pdf = require('pdf-parse');
const axios = require("axios");

const url = "https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/67c1d65441573664321a854f_24-25_BA%20Core%20Exam.pdf"

axios.get(url, { responseType: 'arraybuffer' })
  .then(response => {
    const dataBuffer = Buffer.from(response.data, "binary");
    return pdf(dataBuffer);
  })
  .then(data => {
    try {
        digitize(data.text);
    } catch (err) {
        console.error(err);
    }
  })
  .catch(err => {
    console.error(err);
  });

let examName;
let data = [[0, "Text", "A.", "B.", "C.", "D.", "Answer", "Why"]];

let begin, d, temp;

function digitize(rawText) {
    // console.log(rawText);
    rawText = rawText.replace(/(\r\n|\n|\r)/gm, " ");

    function between(startStr, endStr) {
        pos = rawText.indexOf(startStr) + startStr.length;
        rawText.substring(pos, rawText.indexOf(endStr, pos));
        return rawText.substring(pos, rawText.indexOf(endStr, pos));
    }
    function betweenS(startStr, endStr, start) {
        pos = rawText.indexOf(startStr, start) + startStr.length;
        rawText.substring(pos, rawText.indexOf(endStr, pos));
        return rawText.substring(pos, rawText.indexOf(endStr, pos));
    }
    function scrub(array) {
        for (let x = 1; x < array.length; x++) {
            temp = array[x];
            while (temp.charAt(0) == " ") {
                temp = temp.slice(1);
            }
            while (temp.charAt(temp.length-1) == " ") {
                temp = temp.substring(0, temp.length-1);
            }
            array[x]=temp.replaceAll("  ", " ")
        }
    }

    examName = between("EXAM", "THE")
    console.log(examName);

    for (let i = 1; i <= 25; i++) {
        begin = rawText.indexOf(" "+i+". ")

        if ((rawText.indexOf(" "+(i+1)+". ", begin)) > rawText.indexOf("Test ", begin)) {
            d = betweenS(" D.", "Test ", begin);
        }
        else {
            d = betweenS(" D.",(i+1)+".", begin);
        }

        data[i] = [i, between(" "+i+". ", " A.", begin), betweenS(" A.", " B.", begin), betweenS(" B.", " C.", begin), betweenS(" C.", " D.", begin), d];

        
        begin = rawText.indexOf("EXAM—KEY")
        begin = rawText.indexOf(" "+i+".", begin)
        begin = rawText.indexOf(".", begin) + 1

        data[i].push(rawText.substring(begin, begin + 3));
        data[i].push(betweenS(" ","SOURCE", begin+2));

        scrub(data[i]);
    }

    // console.log(data);

    //pass out data
    
}
