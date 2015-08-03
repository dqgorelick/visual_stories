var fs = require('fs');
var css = "";
// css += "-------------FONTS-------------\n"

fs.readdirSync('../css/fonts').forEach(function(name){
	css += "@font-face { \n\tfont-family: '" + name.slice(0,-4) +"';\n\tsrc: url('./fonts/"+name+"')\n}\n"
	console.log(name + " added");
})

// css += "-------------CSS-------------\n"
// fs.readdirSync('../fonts').forEach(function(name, it){
// 	css += "#loadfonts p:nth-child("+(it+1)+"){font-family: '"+name+"';}\n";
// })

css += "-------------Editor-------------\n"
css += "["
fs.readdirSync('../css/fonts').forEach(function(name){
	css += "'" + name.slice(0,-4)+"', ";
})
css +="]"

fs.writeFile('files.txt', css, function(err){
	if (!err) {
		console.log("saved!");
	}
})
