// API Config
var express = require("express");
var app = express();
app.listen(3000, () => {
 console.log("Server running on port 3000");
});

const cors = require('cors');
app.use(cors());

// My Stuff
const pdf = require('pdf-parse');
const axios = require("axios");
let output;

// The API
app.get("/url", (req, res, next) => {
    function processExam(url) {
    //const url = "https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/67c1d65441573664321a854f_24-25_BA%20Core%20Exam.pdf"
    function digitize(rawText) {
        let examName;
        let data = [[0, "Text", "A.", "B.", "C.", "D.", "Answer", "Why"]];

        let begin, d, temp;

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

        examName = between("EXAM", "THE");
                while (examName.charAt(0) == " ") {
                    examName = examName.slice(1);
                }
                while (examName.charAt(examName.length-1) == " ") {
                    examName = examName.substring(0, examName.length-1);
                }
                examName=examName.replaceAll("  ", " ")
        data[0][0]= examName;
        console.log(examName);

        for (let i = 1; i <= 100; i++) {
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

            data[i].push(rawText.substring(begin, begin + 2));
            data[i].push(betweenS(" ","SOURCE", begin+2));

            scrub(data[i]);
        }

        // console.log(data);
        return data;    
    }

    axios.get(url, { responseType: 'arraybuffer' })
    .then(response => {
        const dataBuffer = Buffer.from(response.data, "binary");
        return pdf(dataBuffer);
    })
    .then(data => {
        try {
            output = (digitize(data.text));
            res.json(output);
        } catch (err) {
            console.error(err);
        }
    })
    .catch(err => {
        console.error(err);
    });

}
    
    const url = req.query.link;
    if (url == "awake") {
        console.log("site loaded (awake recived)")
        res.json("Hello wolrd!");
    } else {
        try {
            processExam(url);
        } catch (error) {
            res.json("error");
        }
    }
});
