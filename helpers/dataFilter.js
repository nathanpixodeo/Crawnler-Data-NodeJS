const request = require('request');
const arrRemove = ["(Lichngaytot.com)", "Lichngaytot.com"];

const searchAndRemoveString = (str) => {
	if (str) {
		var replaceString = str;
		var regex;
		for (var i = 0; i < arrRemove.length; i++) {
			regex = new RegExp(arrRemove[i].replace(/([-[\]{}()*+?.\\^$|#,])/g, '\\$1'), "g");
			replaceString = replaceString.replace(regex, '');
		}
		return replaceString.trim();
	} else {
		return "";
	}
}

module.exports = searchAndRemoveString