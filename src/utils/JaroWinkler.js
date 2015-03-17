module.exports = {
	weight: 0.1,

	get: function(str1, str2){
		str1 = str1.toLowerCase();
		str2 = str2.toLowerCase();

		var jaroDist;
		if(str1 == str2)
			jaroDist = 1;
		else if(!str1.length || !str2.length)
			jaroDist = 0
		else{
			var matchWindow = Math.max(0, Math.floor(Math.max(str1.length, str2.length)/2-1)),
				str1Flags = new Array(str1.length),
				str2Flags = new Array(str2.length),
				matches = 0;
	  
			for(var i = 0; i < str1.length; i += 1){
				var start = i > matchWindow ? i - matchWindow : 0,
					end = i + matchWindow < str2.length ? i + matchWindow : str2.length - 1;

				for(var j = start; j < end + 1; j++){
					if(!str2Flags[j] && str2[j] == str1[i]){
						str1Flags[i] = str2Flags[j] = true;
						matches++;
						break;
					}
				}
			}

			if(!matches){
				jaroDist = 0;
			}
			else{
				var transpositions = 0,
					str2Offset = 0;

				for(var i = 0; i < str1Flags.length; i++){
					if(str1Flags[i]){
						for(var j = str2Offset; j < str2.length; j++){
							if(str2Flags[j]){
								str2Offset = j + 1
								break
							}
						}
						if(str1Flags[i] != str2Flags[j])
							transpositions += 1
					}
				}

				transpositions /= 2

				jaroDist = ((matches / str1.length) + (matches / str2.length) + ((matches - transpositions) / matches)) / 3
			}
		}

		// count the number of matching characters up to 4
		var matches = 0
		for(var i = 0; i < 4; i++) {
			if(str1[i]==str2[i])
				matches += 1
			else
				break
		}

		return jaroDist + (matches * this.weight * (1 - jaroDist));
	}
};