const validators = require('./validators');
const {NonTransientErrorsByKey} = require('./consts');


const RequestParserByKey = {
	visaKey: {
		fullName:  (v) => ({fullName: v}),
		creditCardNumber: v => {
		 return {number: validators.sanitizeCreditCardNumber(v)}
		},
		expirationDate: v => ({expiration: v}),
		cvv: v => ({cvv: v}),
		amount: v => ({totalAmount: v}),
	},
	mastercardKey: {
		fullName:  (v) => {
			v = validators.sanitizeFullName(v);
			const [fname, ...lname] = v.split(' ');
			
			return{
				first_name: fname,
				last_name: lname.join(' '),
			}
		},
		creditCardNumber: v => {
		 return {card_number: validators.sanitizeCreditCardNumber(v)}
		},
		expirationDate: v => {
			let[_, month, year] = validators.parseExpirationDate(v)
			return {expiration: month + '-' + year};
		},
		cvv: v => ({cvv: v}),
		amount: v => ({charge_amount: v}),
	}
};


const ResponseParserByKey = () => ({
	visaKey: (res, statusCode) => {
		const {chargeResult, resultReason} = res;
		if (statusCode === 200){
			return {statusCode, retry: false};	
		}

		// if the status code is not 200 but chargeResult is 'success'
		// this is undefined behavior. I assume in this case we have to retry
		if (chargeResult === 'Success')
		{
			return {statusCode: 400, retry: true};	
		}
		if (chargeResult === 'Failure'){
			if (NonTransientErrorsByKey.visaKey[resultReason]){
				return {statusCode, retry: false, reason: resultReason};	
			}
			else {
				return {statusCode, retry: true, reason: resultReason};		
			}
		}
		return {statusCode, retry: true, reason: resultReason};
	},
	mastercardKey:(res) => {
		let {statusCode, respData} = res;
		if (statusCode === 200){
			return {statusCode, retry: false};	
		}
		respData = JSON.parse(respData);
		if (statusCode === 400){
		
			if(NonTransientErrorsByKey.mastercardKey[respData.decline_reason]){
				return {statusCode, retry: false, reason: respData.decline_reason};
			}
			else {
				return {statusCode, retry: true, reason: respData.decline_reason};
			}	
		}
		else {

			return {statusCode, retry: true, reason: respData.decline_reason}; // in this case, let's just try again 
		}
	}
});


module.exports = {
	RequestParserByKey,
	ResponseParserByKey,
}