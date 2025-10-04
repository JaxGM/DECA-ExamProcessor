// My Stuff
const pdf = require("pdf-parse");
const axios = require("axios");
let output;
let debugData = false; //This prints a full readout of the test/answers/etc. in array/CSV form.

let local = "https://cdn.prod.website-files.com/614e10e1200f163424ddb67c/616dbb5fb5bad031e90b6e63_HS_Business_Administration_Core_Sample_Exam_20.pdf"

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
					console.log(i+" is the last question on this page.")
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

			if (debugData){
					console.log(data);
				}
				
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








console.log(processExam(local))