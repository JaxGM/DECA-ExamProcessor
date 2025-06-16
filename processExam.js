// API Config
var express = require("express");
var app = express();
app.listen(3000, () => {
	console.log("Server running on port 3000");
});

const cors = require("cors");
app.use(cors());

// My Stuff
const pdf = require("pdf-parse");
const axios = require("axios");
let output;

// The API
app.get("/url", (req, res, next) => {
	function processExam(url) {
		//const url = "https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/67c1d65441573664321a854f_24-25_BA%20Core%20Exam.pdf"
		function digitize(rawText) {
			let examName;
			let data = [
				[
					0,
					"Text",
					"A.",
					"B.",
					"C.",
					"D.",
					"Answer",
					"Why",
					"isSelected",
					"Selected Letter",
				],
			];

			let begin, d, temp;

			// console.log(rawText);
			rawText = rawText.replace(/(\r\n|\n|\r)/gm, " ~ ");
			// console.log(rawText);

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
			function betweenNumberAnd(endStr) {
				const endPos = rawText.indexOf(endStr);
				if (endPos === -1) return null;

				// Search backwards for the last number before endPos
				const textBefore = rawText.substring(0, endPos);

				// Regex to find the last number in textBefore
				const match = textBefore.match(/(\d+)(?![\s\S]*\d)/);
				if (!match) return null;

				const startPos = textBefore.lastIndexOf(match[0]);

				const contentStart = startPos + match[0].length;
				return rawText.substring(contentStart, endPos);
			}

			function scrub(array) {
				for (let x = 1; x < array.length; x++) {
					temp = array[x].replaceAll("~", " ");
					while (temp.charAt(0) == " ") {
						temp = temp.slice(1);
					}
					while (temp.charAt(temp.length - 1) == " ") {
						temp = temp.substring(0, temp.length - 1);
					}
					array[x] = temp.replaceAll("  ", " ");
				}
			}

			examName = ((betweenNumberAnd("EXAM—KEY") + " EXAM").replaceAll("~", " ")).replaceAll("  ", " ");
			while (examName.charAt(0) == " ") {
						examName = examName.slice(1);
			}
			console.log(examName);


			while (examName.charAt(0) == " ") {
				examName = examName.slice(1);
			}
			while (examName.charAt(examName.length - 1) == " ") {
				examName = examName.substring(0, examName.length - 1);
			}
			examName = examName.replaceAll("  ", " ");
			data[0][0] = examName;
			console.log(examName);

			for (let i = 1; i <= 100; i++) {
				begin = rawText.indexOf(" " + i + ". ");

				// If this is the last question on the page...
				if (
					rawText.indexOf(" " + (i + 1) + ". ", begin) >
					rawText.indexOf(examName, begin)
				) {
					d = betweenS(" D.", "~  ~", begin);
					console.log(i+" is the lest")
				} else {
					if (i != 100) {
						d = betweenS(" D.", i + 1 + ".", begin);
					} else {
						d = betweenS("D.", "~  ~", begin);
					}
				}

				if (betweenS("A.", "B.", begin).includes("C.")) { // Edge case for 2x2 answer choices
					data[i] = [
						i,
						between(" " + i + ". ", " A.", begin), // Samples question
						betweenS("A.", "C.", begin), // A
						betweenS("B.", "D.", begin), // B
						betweenS("C.", "B.", begin), // C
						d, // D
					];
				} else {
					data[i] = [
						i,
						between(" " + i + ". ", " A.", begin), // Samples question
						betweenS("A.", "B.", begin), // A
						betweenS("B.", "C.", begin), // B
						betweenS("C.", "D.", begin), // C
						d, // D
					];
				}


				begin = rawText.indexOf("EXAM—KEY");
				begin = rawText.indexOf(" " + i + ".", begin);
				begin = rawText.indexOf(".", begin) + 1;

				data[i].push(rawText.substring(begin, begin + 4));
				if(rawText.substring(begin, begin + 4)==""){
					throw new Error("This is a generic error message.");
				}

				data[i].push(betweenS(" ", "SOURCE", begin + 4));

				scrub(data[i]);

				data[i].push(false, "");
			}

			// console.log(data);
			return data;
		}

		axios
			.get(url, { responseType: "arraybuffer" })
			.then((response) => {
				const dataBuffer = Buffer.from(response.data, "binary");
				return pdf(dataBuffer);
			})
			.then((data) => {
				try {
					output = digitize(data.text);
					res.json(output);
				} catch (err) {
					console.error(err);
				}
			})
			.catch((err) => {
				res.json("error");
			});
	}

	const url = req.query.link;
	if (url == "awake") {
		console.log("site loaded (awake recived)");
		res.json("Hello wolrd!");
	} else {
		try {
			processExam(url);
		} catch (error) {
			res.json("error");
		}
	}
});
