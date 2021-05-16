const Cache = {}

const incReasoneCounter = (merchantId, reason) => {
	if(!Cache[merchantId])
	{
		Cache[merchantId] = {}
	}

	if(!Cache[merchantId][reason]){
		Cache[merchantId][reason] = {counter: 0};
	}
	Cache[merchantId][reason].counter += 1;
}	

const getReasonCountersForId = (merchantId) =>{
	if(!Cache[merchantId]){
		return [];
	}
	let result = [];
	Object.keys(Cache[merchantId]).forEach(reason => {
		let counter = Cache[merchantId][reason].counter;
		result.push({reason, counter});
	})
	return result;	
}

module.exports =  {
	incReasoneCounter,
	getReasonCountersForId,
}